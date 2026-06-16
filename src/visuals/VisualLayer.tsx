/**
 * Full-screen animated background, switched by visual mode. Renders behind the
 * timer/controls. Owns the phase-transition flash (driven off snapshot phase
 * changes) so the rest of the app doesn't need to.
 *
 * NOTE: 'gradient' and 'diagram' modes are added in their own phase; until then
 * they fall back to 'minimal' so the seam is live without dead UI.
 */

import { useEffect, useRef, useState } from 'react'
import type { TimerSnapshot } from '../engine/timer'
import type { VisualMode } from '../state/settings'
import './VisualLayer.css'

interface VisualLayerProps {
  mode: VisualMode
  snapshot: TimerSnapshot
}

export function VisualLayer({ mode, snapshot }: VisualLayerProps) {
  const phaseKind = snapshot.phase.kind
  const [flashKey, setFlashKey] = useState(0)
  const prevPhaseIndex = useRef(snapshot.phaseIndex)

  // Flash only on forward phase transitions while running (not on reset).
  useEffect(() => {
    if (snapshot.status === 'running' && snapshot.phaseIndex > prevPhaseIndex.current) {
      setFlashKey((k) => k + 1)
    }
    prevPhaseIndex.current = snapshot.phaseIndex
  }, [snapshot.phaseIndex, snapshot.status])

  // gradient/diagram modes are added in the visuals phase; until then every mode
  // renders the minimal phase-colored background (driven by the phase-* class).
  return (
    <div className={`visual-layer visual-layer--${mode} phase-${phaseKind}`} aria-hidden="true">
      <div key={flashKey} className="visual-layer__flash" />
    </div>
  )
}
