/**
 * Gradient mode: a compositor-only animated gradient that shifts and pulses with
 * the interval. React writes a few CSS custom properties on phase change only —
 * zero per-frame JS; the continuous motion is pure CSS @keyframes.
 */

import type { CSSProperties } from 'react'
import type { TimerSnapshot } from '../../engine/timer'
import type { PhaseKind } from '../../engine/routine'
import { PALETTES } from '../palettes'
import './GradientVisual.css'

/** Pulse period per phase, in seconds. Work = fast/energetic; rest = slow breathing. */
const PULSE_SECONDS: Record<PhaseKind, number> = {
  prepare: 6,
  work: 1.6,
  rest: 5,
  done: 3,
}

export function GradientVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const kind = snapshot.phase.kind
  const { gradA, gradB } = PALETTES[kind]
  const running = snapshot.status === 'running'

  const style = {
    '--grad-a': gradA,
    '--grad-b': gradB,
    '--pulse-seconds': `${PULSE_SECONDS[kind]}s`,
    '--pulse-play': running ? 'running' : 'paused',
  } as CSSProperties

  return (
    <div className={`gradient-visual gradient-visual--${kind}`} style={style}>
      <div className="gradient-visual__drift" />
      <div className="gradient-visual__pulse" />
    </div>
  )
}
