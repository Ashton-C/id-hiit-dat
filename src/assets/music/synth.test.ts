import { describe, it, expect } from 'vitest'
import { mulberry32, scaleFreq, beatTimes, loopCrossfadeSamples } from './synth'

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })
  it('produces values in [0,1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('differs across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

describe('scaleFreq', () => {
  it('returns the root at degree 0 and an octave up at a full scale', () => {
    expect(scaleFreq(110, 0)).toBeCloseTo(110)
    expect(scaleFreq(110, 7)).toBeCloseTo(220) // 8-entry scale incl. octave
  })
})

describe('beatTimes', () => {
  it('lists every beat across the bars', () => {
    const t = beatTimes(2, 0.5) // 2 bars × 4 beats, 0.5s/beat
    expect(t).toHaveLength(8)
    expect(t[0]).toBe(0)
    expect(t[1]).toBe(0.5)
    expect(t[7]).toBe(3.5)
  })
})

describe('loopCrossfadeSamples', () => {
  it('scales with sample rate and is at least 1', () => {
    expect(loopCrossfadeSamples(44100, 30)).toBe(Math.round(0.03 * 44100))
    expect(loopCrossfadeSamples(1, 0)).toBe(1)
  })
})
