/**
 * Single-screen workout view. Binds the timer engine, routes phase events to
 * audio cues, and composes the visual background, controls, and settings.
 * Music plugs in here in its own phase (gated on settings.music.enabled).
 */

import { useEffect, useRef, useState } from 'react'
import { CuePlayer } from '../engine/cues'
import { useSettings } from '../state/SettingsProvider'
import { useTimer } from '../state/useTimer'
import { TimerDisplay } from '../visuals/TimerDisplay'
import { VisualLayer } from '../visuals/VisualLayer'
import { Controls } from './Controls'
import { SettingsPanel } from './SettingsPanel'
import './TimerScreen.css'

/** Seconds remaining at/under which we play countdown ticks. */
const COUNTDOWN_FROM = 3

export function TimerScreen() {
  const { settings } = useSettings()
  const { snapshot, toggle, reset, onTransition } = useTimer(settings.routine)

  const cueRef = useRef<CuePlayer | null>(null)
  if (cueRef.current === null) cueRef.current = new CuePlayer()
  const cue = cueRef.current

  const [settingsOpen, setSettingsOpen] = useState(false)
  const lastBeepSecond = useRef<number | null>(null)

  // Keep the cue player's mute state in sync with settings.
  useEffect(() => {
    cue.setMuted(settings.cuesMuted)
  }, [cue, settings.cuesMuted])

  // Audio cue on each phase transition.
  useEffect(() => {
    return onTransition((event) => {
      const kind = event.to.kind
      if (kind === 'work') cue.play('work')
      else if (kind === 'rest') cue.play('rest')
      else if (kind === 'done') cue.play('done')
      lastBeepSecond.current = null
    })
  }, [onTransition, cue])

  // Countdown ticks in the final seconds of an active phase.
  useEffect(() => {
    if (snapshot.status !== 'running' || snapshot.phase.kind === 'done') return
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
    <main className="timer-screen">
      <VisualLayer mode={settings.visualMode} snapshot={snapshot} />

      <button
        type="button"
        className="timer-screen__gear"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="timer-screen__content">
        <TimerDisplay snapshot={snapshot} />
        <Controls status={snapshot.status} onToggle={handleToggle} onReset={reset} />
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </main>
  )
}
