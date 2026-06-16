import { describe, it, expect } from 'vitest'
import {
  AudioMixer,
  clamp01,
  equalPowerCurve,
  equalPowerGains,
  nextIndex,
  planCrossfade,
} from './audioMixer'
import type { AudioBus } from './audioContext'
import type { Track } from '../assets/music/tracks'

// ---------- pure math ----------

describe('equalPowerGains', () => {
  it('keeps constant power across the fade', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      const { out, in: gin } = equalPowerGains(p)
      expect(out * out + gin * gin).toBeCloseTo(1, 5)
    }
  })
  it('has the right endpoints', () => {
    expect(equalPowerGains(0)).toMatchObject({ out: 1 })
    expect(equalPowerGains(1).in).toBeCloseTo(1)
  })
  it('clamps out-of-range progress', () => {
    expect(equalPowerGains(-1).out).toBeCloseTo(1)
    expect(equalPowerGains(2).in).toBeCloseTo(1)
  })
})

describe('equalPowerCurve', () => {
  it('produces a curve of the requested length with correct endpoints', () => {
    const cin = equalPowerCurve('in', 64)
    expect(cin).toHaveLength(64)
    expect(cin[0]).toBeCloseTo(0)
    expect(cin[63]).toBeCloseTo(1)
    const cout = equalPowerCurve('out', 64)
    expect(cout[0]).toBeCloseTo(1)
    expect(cout[63]).toBeCloseTo(0)
  })
})

describe('nextIndex', () => {
  it('advances, wraps when looping, and stops otherwise', () => {
    expect(nextIndex(0, 3, true)).toBe(1)
    expect(nextIndex(2, 3, true)).toBe(0)
    expect(nextIndex(2, 3, false)).toBeNull()
    expect(nextIndex(0, 0, true)).toBeNull()
  })
})

describe('planCrossfade', () => {
  const base = { currentEndTime: 30, crossfadeSeconds: 6, nextBufferReady: true }
  it('returns null when the next buffer is not ready', () => {
    expect(planCrossfade({ ...base, now: 25, nextBufferReady: false })).toBeNull()
  })
  it('returns null before the boundary', () => {
    expect(planCrossfade({ ...base, now: 10 })).toBeNull()
  })
  it('starts at the boundary once reached, never before now', () => {
    expect(planCrossfade({ ...base, now: 24 })).toEqual({ startAt: 24, crossfade: 6 })
    expect(planCrossfade({ ...base, now: 28 })).toEqual({ startAt: 28, crossfade: 6 })
  })
})

describe('clamp01', () => {
  it('clamps', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect(clamp01(0.3)).toBe(0.3)
  })
})

// ---------- mixer with a fake AudioBus ----------

interface RecordedSource {
  buffer: unknown
  loop: boolean
  started: number | null
  stopped: number | null
  connect: (n: unknown) => unknown
  start: (t: number) => void
  stop: (t: number) => void
}

function fakeParam() {
  const calls: string[] = []
  return {
    value: 1,
    calls,
    setValueAtTime(v: number) {
      this.value = v
      calls.push('setValueAtTime')
    },
    setValueCurveAtTime() {
      calls.push('curve')
    },
    setTargetAtTime(v: number) {
      this.value = v
      calls.push('target')
    },
    linearRampToValueAtTime(v: number) {
      this.value = v
      calls.push('linear')
    },
    cancelScheduledValues() {
      calls.push('cancel')
    },
  }
}

function createFakeBus() {
  const sources: RecordedSource[] = []
  const ctx = {
    currentTime: 0,
    createGain() {
      return { gain: fakeParam(), connect: (n: unknown) => n, disconnect() {} }
    },
    createBufferSource() {
      const s: RecordedSource = {
        buffer: null,
        loop: false,
        started: null,
        stopped: null,
        connect: (n: unknown) => n,
        start(t: number) {
          this.started = t
        },
        stop(t: number) {
          this.stopped = t
        },
      }
      sources.push(s)
      return s
    },
  }
  const bus = {
    ctx: ctx as unknown as AudioContext,
    master: { gain: fakeParam(), connect: () => {}, disconnect() {} } as unknown as GainNode,
    unlock: async () => {},
    suspend: async () => {},
  } as unknown as AudioBus
  return { bus, ctx, sources }
}

const track = (id: string): Track => ({
  id,
  title: id,
  artist: 'x',
  bpm: 120,
  durationSeconds: 30,
  loopable: true,
  license: 'demo-synth',
  source: { kind: 'synth', seed: 1, preset: 'techno' },
})

const stubBuffer = { duration: 30 } as unknown as AudioBuffer
const flush = () => new Promise((r) => setTimeout(r, 0))

describe('AudioMixer (fake bus)', () => {
  it('plays the first track and starts a source', async () => {
    const { bus, sources } = createFakeBus()
    const mixer = new AudioMixer({ bus, loadBuffer: async () => stubBuffer }, {
      playlist: [track('a'), track('b'), track('c')],
    })
    await mixer.play()
    await flush()
    expect(mixer.getSnapshot().state).toBe('playing')
    expect(mixer.getSnapshot().currentTrackId).toBe('a')
    expect(sources[0].started).toBe(0)
    expect(sources[0].loop).toBe(true)
  })

  it('does not crossfade before the boundary', async () => {
    const { bus, ctx } = createFakeBus()
    const mixer = new AudioMixer({ bus, loadBuffer: async () => stubBuffer }, {
      playlist: [track('a'), track('b')],
    })
    await mixer.play()
    await flush()
    ctx.currentTime = 10 // boundary is 30 - 6 = 24
    mixer.update()
    expect(mixer.getSnapshot().currentTrackId).toBe('a')
  })

  it('pre-books a crossfade into the next track at the boundary', async () => {
    const { bus, ctx, sources } = createFakeBus()
    const mixer = new AudioMixer({ bus, loadBuffer: async () => stubBuffer }, {
      playlist: [track('a'), track('b'), track('c')],
      crossfadeSeconds: 6,
    })
    await mixer.play()
    await flush() // let the next track preload
    ctx.currentTime = 25
    mixer.update()
    expect(mixer.getSnapshot().currentTrackId).toBe('b')
    // a second source (the incoming voice) was started at 25.
    expect(sources.length).toBeGreaterThanOrEqual(2)
    const incoming = sources[sources.length - 1]
    expect(incoming.started).toBe(25)
  })

  it('skips to the next track on next()', async () => {
    const { bus, ctx } = createFakeBus()
    const mixer = new AudioMixer({ bus, loadBuffer: async () => stubBuffer }, {
      playlist: [track('a'), track('b')],
    })
    await mixer.play()
    await flush()
    ctx.currentTime = 5
    await mixer.next()
    expect(mixer.getSnapshot().currentTrackId).toBe('b')
  })

  it('updates volume in the snapshot', async () => {
    const { bus } = createFakeBus()
    const mixer = new AudioMixer({ bus, loadBuffer: async () => stubBuffer }, {
      playlist: [track('a')],
      volume: 0.5,
    })
    expect(mixer.getSnapshot().volume).toBe(0.5)
    mixer.setVolume(0.9)
    expect(mixer.getSnapshot().volume).toBe(0.9)
    mixer.setVolume(5)
    expect(mixer.getSnapshot().volume).toBe(1)
  })

  it('pauses and stops', async () => {
    const { bus } = createFakeBus()
    const mixer = new AudioMixer({ bus, loadBuffer: async () => stubBuffer }, {
      playlist: [track('a'), track('b')],
    })
    await mixer.play()
    await flush()
    mixer.pause()
    expect(mixer.getSnapshot().state).toBe('paused')
  })
})
