/**
 * Single source of truth for phase → color, shared by all visual modes so the
 * minimal background, gradient stops, and diagram accent always agree.
 * `base` values are migrated verbatim from the original TimerScreen colors.
 */

import type { PhaseKind } from '../engine/routine'

export interface PhasePalette {
  /** Solid background for minimal mode + diagram accent. */
  base: string
  /** Two-stop gradient ends for gradient mode. */
  gradA: string
  gradB: string
}

export const PALETTES: Record<PhaseKind, PhasePalette> = {
  prepare: { base: '#1f2430', gradA: '#1f2430', gradB: '#2b3550' }, // neutral slate
  work: { base: '#7a1f2b', gradA: '#7a1f2b', gradB: '#c8402f' }, //    intense crimson → ember
  rest: { base: '#14463f', gradA: '#0f3b46', gradB: '#1e7a63' }, //    calm teal
  done: { base: '#1d4d2b', gradA: '#1d4d2b', gradB: '#3a8f4f' }, //    success green
}
