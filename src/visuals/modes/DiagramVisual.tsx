/**
 * Diagram mode: a large stick-figure for the current exercise, tinted by the
 * phase accent, with TimerDisplay floating over it. On rest/prepare it dims and
 * previews the upcoming exercise; on done it shows a checkmark.
 */

import type { CSSProperties } from 'react'
import type { TimerSnapshot } from '../../engine/timer'
import { PALETTES } from '../palettes'
import { DoneGlyph, diagramFor } from '../diagrams'
import { LottieFigure } from '../diagrams/LottieFigure'
import { animationFor } from '../../assets/animations/animations'
import './DiagramVisual.css'

export function DiagramVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const kind = snapshot.phase.kind
  const { base } = PALETTES[kind]

  // No current exercise during rest/prepare → preview the next one ("coming up").
  const ex = snapshot.currentExercise ?? snapshot.nextExercise
  // Prefer a real Lottie animation when one exists for this exercise; otherwise
  // fall back to the hand-coded SVG diagram.
  const animation = ex ? animationFor(ex.id) : undefined
  const Diagram = diagramFor(ex?.id)
  const isWork = kind === 'work'

  return (
    <div className={`diagram-visual diagram-visual--${kind}`} style={{ '--accent': base } as CSSProperties}>
      <div className={`diagram-visual__figure ${isWork ? '' : 'is-preview'} ${animation && kind !== 'done' ? 'has-animation' : ''}`}>
        {kind === 'done' ? <DoneGlyph /> : animation ? <LottieFigure key={animation.id} src={animation.url} /> : <Diagram />}
      </div>
    </div>
  )
}
