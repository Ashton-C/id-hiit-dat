/** Presentational timer readout: phase label, big countdown, exercise + up-next. */

import type { TimerSnapshot } from '../engine/timer'
import { formatTime } from '../utils/format'
import './TimerDisplay.css'

const PHASE_LABEL: Record<string, string> = {
  prepare: 'Get Ready',
  work: 'Work',
  rest: 'Rest',
  done: 'Done!',
}

export function TimerDisplay({ snapshot }: { snapshot: TimerSnapshot }) {
  const { phase, phaseRemainingSeconds, currentExercise, nextExercise } = snapshot
  const label = PHASE_LABEL[phase.kind] ?? phase.kind

  return (
    <div className="timer-display">
      <div className="timer-display__phase">{label}</div>

      <div className="timer-display__time" aria-live="off">
        {phase.kind === 'done' ? '✓' : formatTime(phaseRemainingSeconds)}
      </div>

      {currentExercise && (
        <div className="timer-display__exercise">{currentExercise.name}</div>
      )}

      {phase.kind !== 'done' && (
        <div className="timer-display__next">
          {nextExercise ? `Up next: ${nextExercise.name}` : 'Last one!'}
        </div>
      )}

      {phase.round > 0 && (
        <div className="timer-display__total">
          {formatTime(snapshot.totalRemainingSeconds)} left
        </div>
      )}
    </div>
  )
}
