/**
 * Gradient mode: a bright, futuristic, LED-style animated background that shifts
 * and pulses with the interval. Compositor-only CSS animation — React writes a
 * few CSS custom properties on phase change only; zero per-frame JS. Layers:
 * a drifting neon gradient, a slow conic sweep, moving LED scanlines, a pulsing
 * glow at the phase tempo, and a center scrim that keeps the timer legible.
 */

import type { CSSProperties } from 'react'
import type { TimerSnapshot } from '../../engine/timer'
import type { PhaseKind } from '../../engine/routine'
import { PALETTES } from '../palettes'
import './GradientVisual.css'

/** Pulse period per phase, in seconds. Work = fast/energetic; rest = slow breathing. */
const PULSE_SECONDS: Record<PhaseKind, number> = {
  prepare: 4,
  work: 1.1,
  rest: 3.4,
  done: 2.2,
}

/** Drift speed per phase — work drives harder. */
const DRIFT_SECONDS: Record<PhaseKind, number> = {
  prepare: 11,
  work: 5,
  rest: 9,
  done: 7,
}

export function GradientVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const kind = snapshot.phase.kind
  const { gradA, gradB, gradC, glow } = PALETTES[kind]
  const running = snapshot.status === 'running'

  const style = {
    '--grad-a': gradA,
    '--grad-b': gradB,
    '--grad-c': gradC,
    '--glow': glow,
    '--pulse-seconds': `${PULSE_SECONDS[kind]}s`,
    '--drift-seconds': `${DRIFT_SECONDS[kind]}s`,
    '--play': running ? 'running' : 'paused',
  } as CSSProperties

  return (
    <div className={`gradient-visual gradient-visual--${kind}`} style={style}>
      <div className="gradient-visual__drift" />
      <div className="gradient-visual__sweep" />
      <div className="gradient-visual__led" />
      <div className="gradient-visual__pulse" />
      <div className="gradient-visual__scrim" />
    </div>
  )
}
