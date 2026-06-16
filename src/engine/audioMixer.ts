/**
 * Web Audio continuous-crossfade music mixer. Framework-agnostic (no React).
 *
 * Plays a playlist as one gap-free, DJ-style mix: the next track's start() and the
 * equal-power gain ramps are pre-booked on the audio clock `crossfadeSeconds` ahead
 * of each boundary, so a janky update() tick can never open a gap. The decision and
 * gain math are pure functions (tested in isolation); the class wires them to Web
 * Audio nodes via an injected AudioBus + loadBuffer, both mockable in tests.
 */

import type { AudioBus } from './audioContext'
import type { Track } from '../assets/music/tracks'

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

/** Equal-power crossfade gains at progress p∈[0,1]: out²+in²≈1 (constant power). */
export function equalPowerGains(p: number): { out: number; in: number } {
  const x = clamp01(p)
  return { out: Math.cos((x * Math.PI) / 2), in: Math.sin((x * Math.PI) / 2) }
}

/** Sampled equal-power curve for setValueCurveAtTime, built from equalPowerGains. Pure. */
export function equalPowerCurve(dir: 'in' | 'out', steps = 128): Float32Array {
  const a = new Float32Array(steps)
  for (let i = 0; i < steps; i++) {
    a[i] = equalPowerGains(i / (steps - 1))[dir]
  }
  return a
}

/** Next playlist index, wrapping if loop; null when the playlist ends. Pure. */
export function nextIndex(i: number, len: number, loop: boolean): number | null {
  if (len <= 0) return null
  if (i + 1 < len) return i + 1
  return loop ? 0 : null
}

export interface CrossfadePlan {
  startAt: number
  crossfade: number
}

/** Decide whether (and when) to start the next track. Pure. */
export function planCrossfade(args: {
  now: number
  currentEndTime: number
  crossfadeSeconds: number
  nextBufferReady: boolean
}): CrossfadePlan | null {
  const { now, currentEndTime, crossfadeSeconds, nextBufferReady } = args
  if (!nextBufferReady) return null
  const boundary = currentEndTime - crossfadeSeconds
  if (now < boundary) return null
  return { startAt: Math.max(now, boundary), crossfade: crossfadeSeconds }
}

export interface AudioMixerDeps {
  bus: AudioBus
  loadBuffer: (track: Track, ctx: BaseAudioContext) => Promise<AudioBuffer>
}

export interface AudioMixerOptions {
  playlist: Track[]
  crossfadeSeconds?: number
  skipCrossfadeSeconds?: number
  volume?: number
  loopPlaylist?: boolean
}

export type MixerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped'

export interface MixerSnapshot {
  state: MixerState
  currentTrackId: string | null
  nextTrackId: string | null
  volume: number
}

interface Voice {
  trackId: string
  source: AudioBufferSourceNode
  gain: GainNode
  endTime: number
}

type Listener = (s: MixerSnapshot) => void

export class AudioMixer {
  private readonly bus: AudioBus
  private readonly loadBuffer: AudioMixerDeps['loadBuffer']
  private readonly musicGain: GainNode

  private playlist: Track[]
  private crossfadeSeconds: number
  private skipCrossfadeSeconds: number
  private loopPlaylist: boolean
  private volume: number

  private state: MixerState = 'idle'
  private index = 0
  private active: Voice | null = null
  private incoming: Voice | null = null
  private buffers = new Map<string, AudioBuffer>()
  private loading = new Set<string>()
  /** Track ids that failed to load (e.g. file not present) — skipped thereafter. */
  private failed = new Set<string>()
  private listeners = new Set<Listener>()

  constructor(deps: AudioMixerDeps, opts: AudioMixerOptions) {
    this.bus = deps.bus
    this.loadBuffer = deps.loadBuffer
    this.playlist = opts.playlist
    this.crossfadeSeconds = opts.crossfadeSeconds ?? 6
    this.skipCrossfadeSeconds = opts.skipCrossfadeSeconds ?? 1.5
    this.loopPlaylist = opts.loopPlaylist ?? true
    this.volume = clamp01(opts.volume ?? 0.6)

    this.musicGain = this.bus.ctx.createGain()
    this.musicGain.gain.value = this.volume
    this.musicGain.connect(this.bus.master)
  }

  private get ctx(): BaseAudioContext {
    return this.bus.ctx
  }

  getSnapshot(): MixerSnapshot {
    return {
      state: this.state,
      currentTrackId: this.active?.trackId ?? null,
      nextTrackId: this.nextTrack()?.id ?? null,
      volume: this.volume,
    }
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    const snap = this.getSnapshot()
    for (const l of this.listeners) l(snap)
  }

  /** Next index whose track hasn't failed to load; null if none remain. */
  private nextPlayableIndex(from: number): number | null {
    let i = from
    for (let step = 0; step < this.playlist.length; step++) {
      const ni = nextIndex(i, this.playlist.length, this.loopPlaylist)
      if (ni === null) return null
      if (!this.failed.has(this.playlist[ni].id)) return ni
      i = ni
    }
    return null
  }

  private nextTrack(): Track | undefined {
    const ni = this.nextPlayableIndex(this.index)
    return ni === null ? undefined : this.playlist[ni]
  }

  private async ensureBuffer(track: Track): Promise<AudioBuffer> {
    const cached = this.buffers.get(track.id)
    if (cached) return cached
    this.loading.add(track.id)
    try {
      const buf = await this.loadBuffer(track, this.ctx)
      this.buffers.set(track.id, buf)
      return buf
    } finally {
      this.loading.delete(track.id)
    }
  }

  /** Preload the next track's buffer in the background (best-effort). */
  private preloadNext(): void {
    const next = this.nextTrack()
    if (next && !this.buffers.has(next.id) && !this.loading.has(next.id)) {
      void this.ensureBuffer(next)
        .then(() => this.emit())
        .catch(() => {
          // Missing/undecodable file — never retry it.
          this.failed.add(next.id)
          this.emit()
        })
    }
  }

  private makeVoice(track: Track, buffer: AudioBuffer, startAt: number, gainValue: number): Voice {
    const ctx = this.bus.ctx
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = ctx.createGain()
    // Set the intrinsic value (not a scheduled event) so a subsequent
    // setValueCurveAtTime at startAt can't collide with a setValueAtTime event.
    gain.gain.value = gainValue
    source.connect(gain).connect(this.musicGain)
    source.start(startAt)
    return { trackId: track.id, source, gain, endTime: startAt + track.durationSeconds }
  }

  /**
   * Start (or restart) playback at full gain, skipping any track whose file is
   * missing/undecodable. If nothing in the playlist loads, settle on 'stopped'.
   */
  private async startCurrent(): Promise<void> {
    if (this.playlist.length === 0) return
    // Resume the (possibly suspended) context so music started from the MusicBar
    // play button works even without going through the workout Start gesture.
    await this.bus.unlock()
    this.state = 'loading'
    this.emit()

    for (let attempt = 0; attempt < this.playlist.length; attempt++) {
      const track = this.playlist[this.index]
      if (track && !this.failed.has(track.id)) {
        try {
          const buffer = await this.ensureBuffer(track)
          const now = this.bus.ctx.currentTime
          this.active = this.makeVoice(track, buffer, now, 1)
          this.state = 'playing'
          this.preloadNext()
          this.emit()
          return
        } catch {
          this.failed.add(track.id)
        }
      }
      const ni = this.nextPlayableIndex(this.index)
      if (ni === null) break
      this.index = ni
    }

    // Nothing loadable.
    this.state = 'stopped'
    this.emit()
  }

  async play(): Promise<void> {
    // 'loading' means a start is already in flight — don't start a second voice.
    if (this.state === 'playing' || this.state === 'loading') return
    if (this.state === 'paused') {
      await this.resume()
      return
    }
    if (this.playlist.length === 0) return
    await this.startCurrent()
  }

  async resume(): Promise<void> {
    // Sources can't truly pause/resume; restart the current track.
    this.state = 'idle'
    await this.startCurrent()
  }

  private fadeOutVoice(voice: Voice | null, seconds: number): void {
    if (!voice) return
    const now = this.bus.ctx.currentTime
    const g = voice.gain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(0.0001, now + seconds)
    voice.source.stop(now + seconds + 0.05)
  }

  pause(): void {
    if (this.state !== 'playing') return
    this.fadeOutVoice(this.active, 0.15)
    this.fadeOutVoice(this.incoming, 0.15)
    this.active = null
    this.incoming = null
    this.state = 'paused'
    this.emit()
  }

  stop(): void {
    this.fadeOutVoice(this.active, 0.2)
    this.fadeOutVoice(this.incoming, 0.2)
    this.active = null
    this.incoming = null
    this.state = 'stopped'
    this.emit()
  }

  fadeOutAndStop(seconds = 3): void {
    if (!this.active && !this.incoming) {
      this.state = 'stopped'
      this.emit()
      return
    }
    this.fadeOutVoice(this.active, seconds)
    this.fadeOutVoice(this.incoming, seconds)
    this.active = null
    this.incoming = null
    this.state = 'stopped'
    this.emit()
  }

  setVolume(v: number): void {
    this.volume = clamp01(v)
    const now = this.bus.ctx.currentTime
    this.musicGain.gain.setTargetAtTime(this.volume, now, 0.05)
    this.emit()
  }

  setPlaylist(tracks: Track[]): void {
    this.playlist = tracks
    this.index = Math.min(this.index, Math.max(0, tracks.length - 1))
    this.failed.clear() // give a fresh playlist a clean slate
  }

  /** Crossfade from the active voice into the next playable track at `startAt`. */
  private beginCrossfade(startAt: number, crossfade: number): void {
    const ni = this.nextPlayableIndex(this.index)
    if (ni === null) return
    const nextT = this.playlist[ni]
    const buffer = this.buffers.get(nextT.id)
    if (!buffer || !this.active) return

    const incoming = this.makeVoice(nextT, buffer, startAt, 0.0001)
    // Equal-power ramps over [startAt, startAt + crossfade].
    incoming.gain.gain.setValueCurveAtTime(equalPowerCurve('in'), startAt, crossfade)
    const outgoing = this.active
    outgoing.gain.gain.cancelScheduledValues(startAt)
    outgoing.gain.gain.setValueCurveAtTime(equalPowerCurve('out'), startAt, crossfade)
    outgoing.source.stop(startAt + crossfade + 0.05)

    this.active = incoming
    // Track the still-fading outgoing voice so pause/stop/dispose fade it too;
    // self-clear once it ends so we never silence the new active voice by mistake.
    this.incoming = outgoing
    outgoing.source.onended = () => {
      if (this.incoming === outgoing) this.incoming = null
    }
    this.index = ni
    this.prune()
    this.preloadNext()
    this.emit()
  }

  /** Drop buffers no longer needed (keep current + next). */
  private prune(): void {
    const keep = new Set<string>()
    if (this.active) keep.add(this.active.trackId)
    const next = this.nextTrack()
    if (next) keep.add(next.id)
    for (const id of this.buffers.keys()) {
      if (!keep.has(id)) this.buffers.delete(id)
    }
  }

  /** Skip to the next playable track now with a faster crossfade. */
  async next(): Promise<void> {
    if (this.state !== 'playing' || !this.active) return
    const ni = this.nextPlayableIndex(this.index)
    if (ni === null) return
    try {
      await this.ensureBuffer(this.playlist[ni])
    } catch {
      this.failed.add(this.playlist[ni].id)
      return
    }
    const now = this.bus.ctx.currentTime
    this.beginCrossfade(now, this.skipCrossfadeSeconds)
  }

  /** Driver tick: evaluate whether it's time to pre-book the next crossfade. */
  update(): void {
    if (this.state !== 'playing' || !this.active) return
    const next = this.nextTrack()
    const plan = planCrossfade({
      now: this.bus.ctx.currentTime,
      currentEndTime: this.active.endTime,
      crossfadeSeconds: this.crossfadeSeconds,
      nextBufferReady: !!next && this.buffers.has(next.id),
    })
    if (plan) this.beginCrossfade(plan.startAt, plan.crossfade)
    else if (next && !this.buffers.has(next.id)) this.preloadNext()
  }

  dispose(): void {
    this.fadeOutVoice(this.active, 0.05)
    this.fadeOutVoice(this.incoming, 0.05)
    this.active = null
    this.incoming = null
    this.buffers.clear()
    this.listeners.clear()
    try {
      this.musicGain.disconnect()
    } catch {
      // already disconnected
    }
    this.state = 'stopped'
  }
}
