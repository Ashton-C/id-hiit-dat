/**
 * Single-screen workout view. Owns the engine binding and the "minimal" visual
 * mode (phase-colored background + transition flash), and routes phase events to
 * audio cues. Richer visual modes (gradient, exercise diagrams) and music plug in
 * here in later iterations.
 */

import { useEffect, useRef, useState } from 'react'
import type { Routine } from '../engine/routine'
import { CuePlayer } from '../engine/cues'
import { useTimer } from '../state/useTimer'
import { TimerDisplay } from '../visuals/TimerDisplay'
import { Controls } from './Controls'
import './TimerScreen.css'

/** Seconds remaining at/under which we play countdown ticks. */
const COUNTDOWN_FROM = 3

export function TimerScreen({ routine }: { routine: Routine }) {
  const { snapshot, toggle, reset, onTransition } = useTimer(routine)
  const cueRef = useRef<CuePlayer | null>(null)
  if (cueRef.current === null) cueRef.current = new CuePlayer()
  const cue = cueRef.current

  const [flashKey, setFlashKey] = useState(0)
  const lastBeepSecond = useRef<number | null>(null)

  // Cue + flash on every phase transition.
  useEffect(() => {
    return onTransition((event) => {
      const kind = event.to.kind
      if (kind === 'work') cue.play('work')
      else if (kind === 'rest') cue.play('rest')
      else if (kind === 'done') cue.play('done')
      setFlashKey((k) => k + 1)
      lastBeepSecond.current = null
    })
  }, [onTransition, cue])

  // Countdown ticks in the final seconds of an active phase.
  useEffect(() => {
    if (snapshot.status !== 'running') return
    if (snapshot.phase.kind === 'done') return
    const left = snapshot.phaseRemainingSeconds
    if (left > 0 && left <= COUNTDOWN_FROM && lastBeepSecond.current !== left) {
      lastBeepSecond.current = left
      cue.play('countdown')
    }
  }, [snapshot.status, snapshot.phase.kind, snapshot.phaseRemainingSeconds, cue])

  const handleToggle = () => {
    cue.unlock() // satisfy autoplay policy from this user gesture
    toggle()
  }

  return (
    <main className={`timer-screen timer-screen--${snapshot.phase.kind}`}>
      <div key={flashKey} className="timer-screen__flash" aria-hidden="true" />
      <div className="timer-screen__content">
        <TimerDisplay snapshot={snapshot} />
        <Controls status={snapshot.status} onToggle={handleToggle} onReset={reset} />
      </div>
    </main>
  )
}
