/**
 * Audio cues via the Web Audio API. Framework-agnostic (browser-only, no React).
 *
 * Tones are synthesized with an oscillator + gain envelope so we ship no audio
 * assets and have zero latency. The AudioContext is created lazily and must be
 * resumed from a user gesture (browser autoplay policy) — call `unlock()` from a
 * click/tap handler (e.g. the Start button).
 */

export type CueKind = 'countdown' | 'work' | 'rest' | 'done'

interface ToneSpec {
  frequency: number
  durationMs: number
  type: OscillatorType
}

const TONES: Record<CueKind, ToneSpec> = {
  // Short, neutral tick for the final-seconds countdown.
  countdown: { frequency: 660, durationMs: 120, type: 'sine' },
  // Bright, rising-feel tone entering a work interval.
  work: { frequency: 880, durationMs: 250, type: 'square' },
  // Lower, calmer tone entering rest.
  rest: { frequency: 440, durationMs: 250, type: 'sine' },
  // Triumphant longer tone at the end.
  done: { frequency: 988, durationMs: 600, type: 'triangle' },
}

export class CuePlayer {
  private ctx: AudioContext | null = null
  private muted = false

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (this.ctx === null) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
    }
    return this.ctx
  }

  /** Call from a user gesture so subsequent programmatic cues are allowed. */
  unlock(): void {
    const ctx = this.ensureContext()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  play(kind: CueKind): void {
    if (this.muted) return
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()

    const { frequency, durationMs, type } = TONES[kind]
    const now = ctx.currentTime
    const dur = durationMs / 1000

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency

    // Quick attack, smooth exponential release to avoid clicks.
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }
}
