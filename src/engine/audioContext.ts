/**
 * Shared AudioBus: one AudioContext + master gain that both the cue player and
 * the music mixer route through. A single unlock() from the Start gesture
 * satisfies the autoplay policy for beeps and music together, and one context
 * avoids the per-context limits mobile browsers impose. Framework-agnostic.
 */

export interface AudioBus {
  readonly ctx: AudioContext
  /** Master node everything connects through; cues + music both route here. */
  readonly master: GainNode
  /** Resume the context — call from a user gesture. */
  unlock: () => Promise<void>
  /** Optionally release hardware on a long pause. */
  suspend: () => Promise<void>
}

type AudioContextCtor = typeof AudioContext

function resolveCtor(override?: AudioContextCtor): AudioContextCtor | undefined {
  if (override) return override
  if (typeof window === 'undefined') return undefined
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  )
}

/** Create a shared bus, or null if Web Audio is unavailable (e.g. SSR/old browser). */
export function createAudioBus(ctorOverride?: AudioContextCtor): AudioBus | null {
  const Ctor = resolveCtor(ctorOverride)
  if (!Ctor) return null
  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(ctx.destination)
  return {
    ctx,
    master,
    async unlock() {
      if (ctx.state === 'suspended') await ctx.resume()
    },
    async suspend() {
      if (ctx.state === 'running') await ctx.suspend()
    },
  }
}
