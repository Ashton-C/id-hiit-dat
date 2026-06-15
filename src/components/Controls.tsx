/** Start/Pause + Reset controls. */

import type { TimerStatus } from '../engine/timer'
import './Controls.css'

interface ControlsProps {
  status: TimerStatus
  onToggle: () => void
  onReset: () => void
}

export function Controls({ status, onToggle, onReset }: ControlsProps) {
  const primaryLabel =
    status === 'running' ? 'Pause' : status === 'idle' ? 'Start' : status === 'done' ? 'Restart' : 'Resume'

  return (
    <div className="controls">
      <button
        type="button"
        className="controls__btn controls__btn--primary"
        onClick={onToggle}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        className="controls__btn controls__btn--secondary"
        onClick={onReset}
        disabled={status === 'idle'}
      >
        Reset
      </button>
    </div>
  )
}
