import { describe, it, expect } from 'vitest'
import {
  defaultSettings,
  parseSettings,
  clampInt,
  PRESETS,
  CUSTOM_PRESET_ID,
} from './settings'

describe('clampInt', () => {
  it('rounds and clamps into range', () => {
    expect(clampInt(10.4, 0, 60, 5)).toBe(10)
    expect(clampInt(-5, 0, 60, 5)).toBe(0)
    expect(clampInt(999, 0, 60, 5)).toBe(60)
  })
  it('falls back for non-numbers', () => {
    expect(clampInt('nope', 0, 60, 30)).toBe(30)
    expect(clampInt(undefined, 0, 60, 30)).toBe(30)
    expect(clampInt(NaN, 0, 60, 30)).toBe(30)
  })
})

describe('parseSettings', () => {
  it('returns defaults for garbage input', () => {
    expect(parseSettings(null)).toEqual(defaultSettings())
    expect(parseSettings('hello')).toEqual(defaultSettings())
    expect(parseSettings(42)).toEqual(defaultSettings())
  })

  it('keeps valid fields and sanitizes out-of-range interval values', () => {
    const parsed = parseSettings({
      routine: {
        id: 'custom',
        name: 'Custom',
        prepareSeconds: -10,
        workSeconds: 9999,
        restSeconds: 12,
        rounds: 0,
        exercises: [{ id: 'x', name: 'X' }],
      },
      presetId: 'custom',
      visualMode: 'diagram',
      cuesMuted: true,
      music: { enabled: true, volume: 5, trackId: 't1' },
    })
    expect(parsed.routine.prepareSeconds).toBe(0) // clamped up from -10
    expect(parsed.routine.workSeconds).toBe(600) // clamped down from 9999
    expect(parsed.routine.restSeconds).toBe(12)
    expect(parsed.routine.rounds).toBe(1) // clamped up from 0
    expect(parsed.visualMode).toBe('diagram')
    expect(parsed.cuesMuted).toBe(true)
    expect(parsed.music.enabled).toBe(true)
    expect(parsed.music.volume).toBe(1) // clamped down from 5
    expect(parsed.music.trackId).toBe('t1')
  })

  it('rejects an invalid visualMode and empty exercise list', () => {
    const parsed = parseSettings({
      visualMode: 'hologram',
      routine: {
        id: 'r',
        name: 'R',
        prepareSeconds: 5,
        workSeconds: 30,
        restSeconds: 10,
        rounds: 2,
        exercises: [],
      },
    })
    expect(parsed.visualMode).toBe(defaultSettings().visualMode)
    expect(parsed.routine.exercises.length).toBeGreaterThan(0) // backfilled
  })
})

describe('PRESETS', () => {
  it('has unique ids that are not the custom sentinel', () => {
    const ids = PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).not.toContain(CUSTOM_PRESET_ID)
  })
  it('every preset routine has at least one exercise and >=1 round', () => {
    for (const p of PRESETS) {
      expect(p.routine.exercises.length).toBeGreaterThan(0)
      expect(p.routine.rounds).toBeGreaterThanOrEqual(1)
    }
  })
})
