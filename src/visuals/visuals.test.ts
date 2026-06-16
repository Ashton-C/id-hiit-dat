import { describe, it, expect } from 'vitest'
import { diagramFor } from './diagrams'
import { GenericExercise, Squats, Plank } from './diagrams/exercises'
import { phaseProgress } from '../utils/phaseProgress'
import type { TimerSnapshot } from '../engine/timer'

describe('diagramFor', () => {
  it('returns the matching component for known exercise ids', () => {
    expect(diagramFor('squats')).toBe(Squats)
    expect(diagramFor('plank')).toBe(Plank)
  })
  it('falls back to the generic figure for unknown or missing ids', () => {
    expect(diagramFor('does-not-exist')).toBe(GenericExercise)
    expect(diagramFor(undefined)).toBe(GenericExercise)
    expect(diagramFor('')).toBe(GenericExercise)
  })
})

describe('phaseProgress', () => {
  const snap = (durationSeconds: number, phaseRemainingMs: number): TimerSnapshot =>
    ({ phase: { durationSeconds }, phaseRemainingMs }) as TimerSnapshot

  it('is 0 at the start and 1 at the end of a phase', () => {
    expect(phaseProgress(snap(30, 30_000))).toBe(0)
    expect(phaseProgress(snap(30, 0))).toBe(1)
  })
  it('is 0.5 halfway through', () => {
    expect(phaseProgress(snap(30, 15_000))).toBeCloseTo(0.5)
  })
  it('clamps to [0,1] and treats zero-length phases as complete', () => {
    expect(phaseProgress(snap(30, -5000))).toBe(1)
    expect(phaseProgress(snap(30, 60_000))).toBe(0)
    expect(phaseProgress(snap(0, 0))).toBe(1)
  })
})
