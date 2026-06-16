/**
 * Single source of truth for phase → color, shared by all visual modes so the
 * minimal background, gradient stops, and diagram accent always agree.
 * `base` values are migrated verbatim from the original TimerScreen colors.
 */

import type { PhaseKind } from '../engine/routine'

export interface PhasePalette {
  /** Solid background for minimal mode + diagram accent (muted, dark-theme). */
  base: string
  /** Three vivid neon stops for the gradient mode's animated layers. */
  gradA: string
  gradB: string
  gradC: string
  /** Bright LED accent used for the moving scanline shimmer. */
  glow: string
}

export const PALETTES: Record<PhaseKind, PhasePalette> = {
  // Muted `base` keeps minimal/diagram calm; gradA/B/C + glow go full neon.
  prepare: { base: '#1f2430', gradA: '#3b1d8f', gradB: '#5b3fff', gradC: '#1e6bff', glow: '#8a7bff' }, // indigo → electric violet → blue
  work: { base: '#7a1f2b', gradA: '#ff1f6b', gradB: '#ff6a00', gradC: '#ff0048', glow: '#ffd24a' }, //    hot magenta → ember → red
  rest: { base: '#14463f', gradA: '#00e0ff', gradB: '#0aa', gradC: '#1e7aff', glow: '#7dfcff' }, //       cyan → teal → blue
  done: { base: '#1d4d2b', gradA: '#23e06b', gradB: '#9dff3c', gradC: '#00d49b', glow: '#caffaf' }, //    lime → emerald
}
