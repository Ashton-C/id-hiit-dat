/** Minimal mode: a solid, phase-colored background that cross-fades on change. */

import type { CSSProperties } from 'react'
import type { TimerSnapshot } from '../../engine/timer'
import { PALETTES } from '../palettes'
import './MinimalVisual.css'

export function MinimalVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const { base } = PALETTES[snapshot.phase.kind]
  return <div className="minimal-visual" style={{ '--phase-bg': base } as CSSProperties} />
}
