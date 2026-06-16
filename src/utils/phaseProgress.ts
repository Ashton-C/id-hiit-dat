import type { TimerSnapshot } from '../engine/timer'

/** Fraction 0..1 of the current phase that has elapsed. */
export function phaseProgress(s: TimerSnapshot): number {
  const total = s.phase.durationSeconds * 1000
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, 1 - s.phaseRemainingMs / total))
}
