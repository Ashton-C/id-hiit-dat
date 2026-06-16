/**
 * Procedural electronic demo-track generator. Renders a loopable, deterministic
 * (seeded) electronic loop into an AudioBuffer via OfflineAudioContext, so the
 * crossfade player is fully usable offline today with zero audio assets.
 *
 * Pure helpers (PRNG, scale/beat math, loop-crossfade window) are exported and
 * unit-tested; the rendering itself needs a real (or mocked) OfflineAudioContext.
 */

import type { SynthPreset, Track } from './tracks'

/** Deterministic PRNG (mulberry32). Same seed ⇒ same track every reload. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SECONDS_PER_BEAT = (bpm: number): number => 60 / bpm

/** Natural-minor scale semitone offsets. */
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10, 12]

/** Frequency of a scale degree above a root frequency (equal temperament). */
export function scaleFreq(rootHz: number, degree: number): number {
  const octave = Math.floor(degree / MINOR_STEPS.length)
  const step = MINOR_STEPS[((degree % MINOR_STEPS.length) + MINOR_STEPS.length) % MINOR_STEPS.length]
  return rootHz * Math.pow(2, (step + 12 * octave) / 12)
}

/** Start time (s) of every beat across `bars` bars of 4 beats. Pure. */
export function beatTimes(bars: number, secondsPerBeat: number): number[] {
  const out: number[] = []
  for (let i = 0; i < bars * 4; i++) out.push(i * secondsPerBeat)
  return out
}

/** Number of samples in the loop crossfade window. Pure. */
export function loopCrossfadeSamples(sampleRate: number, ms = 30): number {
  return Math.max(1, Math.round((ms / 1000) * sampleRate))
}

interface PresetConfig {
  rootHz: number
  oscType: OscillatorType
  arp: boolean
  hatGain: number
}

const PRESETS: Record<SynthPreset, PresetConfig> = {
  'deep-house': { rootHz: 110, oscType: 'sawtooth', arp: false, hatGain: 0.12 },
  synthwave: { rootHz: 98, oscType: 'sawtooth', arp: true, hatGain: 0.08 },
  techno: { rootHz: 130.81, oscType: 'square', arp: true, hatGain: 0.16 },
}

type OfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext

function offlineCtor(): OfflineCtor | undefined {
  return (
    globalThis.OfflineAudioContext ??
    (globalThis as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext
  )
}

/** Render a synth track to a seamless-looping AudioBuffer. */
export async function renderSynthTrack(
  track: Track,
  source: { kind: 'synth'; seed: number; preset: SynthPreset },
): Promise<AudioBuffer> {
  const Ctor = offlineCtor()
  if (!Ctor) throw new Error('OfflineAudioContext unavailable')

  const sampleRate = 44100
  const spb = SECONDS_PER_BEAT(track.bpm)
  // Render an integer number of bars closest to the desired duration.
  const bars = Math.max(1, Math.round(track.durationSeconds / (spb * 4)))
  const lengthSeconds = bars * 4 * spb
  const length = Math.round(lengthSeconds * sampleRate)

  const octx = new Ctor(2, length, sampleRate)
  const cfg = PRESETS[source.preset]
  const rng = mulberry32(source.seed)

  const out = octx.createGain()
  out.gain.value = 0.85
  out.connect(octx.destination)

  scheduleDrums(octx, out, bars, spb, cfg)
  scheduleBassAndPad(octx, out, bars, spb, cfg, rng)
  if (cfg.arp) scheduleArp(octx, out, bars, spb, cfg, rng)

  const rendered = await octx.startRendering()
  return makeSeamlessLoop(rendered)
}

function envGain(octx: OfflineAudioContext, t: number, attack: number, hold: number, release: number, peak: number): GainNode {
  const g = octx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.setValueAtTime(peak, t + attack + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release)
  return g
}

function scheduleDrums(
  octx: OfflineAudioContext,
  out: AudioNode,
  bars: number,
  spb: number,
  cfg: PresetConfig,
): void {
  const beats = beatTimes(bars, spb)
  // White-noise buffer reused for hats.
  const noise = octx.createBuffer(1, Math.round(0.05 * 44100), 44100)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  for (const t of beats) {
    // Kick: pitch-dropping sine, four-on-the-floor.
    const kick = octx.createOscillator()
    kick.type = 'sine'
    kick.frequency.setValueAtTime(120, t)
    kick.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    const kg = envGain(octx, t, 0.005, 0.02, 0.18, 0.9)
    kick.connect(kg).connect(out)
    kick.start(t)
    kick.stop(t + 0.3)

    // Hat: short noise burst on the off-beat.
    const ht = t + spb / 2
    const hat = octx.createBufferSource()
    hat.buffer = noise
    const hp = octx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    const hg = envGain(octx, ht, 0.002, 0.005, 0.04, cfg.hatGain)
    hat.connect(hp).connect(hg).connect(out)
    hat.start(ht)
    hat.stop(ht + 0.06)
  }
}

function scheduleBassAndPad(
  octx: OfflineAudioContext,
  out: AudioNode,
  bars: number,
  spb: number,
  cfg: PresetConfig,
  rng: () => number,
): void {
  // Bass: one note per beat, root-ish pattern from the scale + seed.
  const beats = beatTimes(bars, spb)
  for (let i = 0; i < beats.length; i++) {
    const t = beats[i]
    const degree = i % 4 === 0 ? 0 : Math.floor(rng() * 3) // root, with occasional movement
    const bass = octx.createOscillator()
    bass.type = cfg.oscType
    bass.frequency.value = scaleFreq(cfg.rootHz, degree) / 2 // an octave down
    const lp = octx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 600
    const bg = envGain(octx, t, 0.01, spb * 0.4, spb * 0.3, 0.5)
    bass.connect(lp).connect(bg).connect(out)
    bass.start(t)
    bass.stop(t + spb)
  }

  // Pad: a sustained detuned saw stack with a slow filter sweep over the whole loop.
  const total = bars * 4 * spb
  const lp = octx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(400, 0)
  lp.frequency.linearRampToValueAtTime(1600, total / 2)
  lp.frequency.linearRampToValueAtTime(400, total)
  const padGain = octx.createGain()
  padGain.gain.value = 0.12
  lp.connect(padGain).connect(out)
  for (const detune of [-6, 0, 7]) {
    const osc = octx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = scaleFreq(cfg.rootHz, 0)
    osc.detune.value = detune
    osc.connect(lp)
    osc.start(0)
    osc.stop(total)
  }
}

function scheduleArp(
  octx: OfflineAudioContext,
  out: AudioNode,
  bars: number,
  spb: number,
  cfg: PresetConfig,
  rng: () => number,
): void {
  const step = spb / 2 // eighth notes
  const total = bars * 4 * spb
  const pattern = [0, 2, 4, 2, 5, 4, 2, 0]
  let i = 0
  for (let t = 0; t < total; t += step, i++) {
    if (rng() < 0.15) continue // occasional rests for groove
    const degree = pattern[i % pattern.length] + 7 // up an octave-ish
    const arp = octx.createOscillator()
    arp.type = 'square'
    arp.frequency.value = scaleFreq(cfg.rootHz, degree)
    const ag = envGain(octx, t, 0.003, 0.02, 0.12, 0.14)
    arp.connect(ag).connect(out)
    arp.start(t)
    arp.stop(t + step)
  }
}

/**
 * Equal-power crossfade the tail of the buffer into its head so `loop=true` wraps
 * without a click. Returns a new, slightly shorter buffer.
 */
export function makeSeamlessLoop(buffer: AudioBuffer): AudioBuffer {
  const sr = buffer.sampleRate
  const xf = loopCrossfadeSamples(sr)
  if (buffer.length <= xf * 2) return buffer

  const newLength = buffer.length - xf
  const out = new AudioBuffer({
    length: newLength,
    sampleRate: sr,
    numberOfChannels: buffer.numberOfChannels,
  })

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch)
    const dst = out.getChannelData(ch)
    // Body: copy [0, newLength).
    for (let i = 0; i < newLength; i++) dst[i] = src[i]
    // Blend the original tail into the head over the crossfade window.
    for (let i = 0; i < xf; i++) {
      const p = i / (xf - 1)
      const fadeIn = Math.sin((p * Math.PI) / 2)
      const fadeOut = Math.cos((p * Math.PI) / 2)
      dst[i] = src[i] * fadeIn + src[newLength + i] * fadeOut
    }
  }
  return out
}
