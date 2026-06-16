/**
 * Full-screen decorative background, switched by visual mode. Renders behind the
 * timer/controls (z-index 0, pointer-events: none). Owns the mode-independent
 * phase-transition flash, driven off forward phase changes in the snapshot.
 */

import { useEffect, useRef, useState } from 'react'
import type { TimerSnapshot } from '../engine/timer'
import type { VisualMode } from '../state/settings'
import { MinimalVisual } from './modes/MinimalVisual'
import { GradientVisual } from './modes/GradientVisual'
import { DiagramVisual } from './modes/DiagramVisual'
import './VisualLayer.css'

interface VisualLayerProps {
  mode: VisualMode
  snapshot: TimerSnapshot
}

export function VisualLayer({ mode, snapshot }: VisualLayerProps) {
  const [flashKey, setFlashKey] = useState(0)
  const prevPhaseIndex = useRef(snapshot.phaseIndex)

  // Flash only on forward phase transitions while running (not on reset).
  useEffect(() => {
    if (snapshot.status === 'running' && snapshot.phaseIndex > prevPhaseIndex.current) {
      setFlashKey((k) => k + 1)
    }
    prevPhaseIndex.current = snapshot.phaseIndex
  }, [snapshot.phaseIndex, snapshot.status])

  return (
    <div className="visual-layer" aria-hidden="true">
      {mode === 'minimal' && <MinimalVisual snapshot={snapshot} />}
      {mode === 'gradient' && <GradientVisual snapshot={snapshot} />}
      {mode === 'diagram' && <DiagramVisual snapshot={snapshot} />}
      {flashKey > 0 && <div key={flashKey} className="visual-layer__flash" />}
    </div>
  )
}
