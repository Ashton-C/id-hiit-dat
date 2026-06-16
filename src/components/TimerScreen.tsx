/**
 * Single-screen workout view. Binds the timer engine, routes phase events to
 * audio cues, drives the music mixer off the timer lifecycle, and composes the
 * visual background, controls, music bar, and settings. Cues and music share one
 * AudioBus so a single Start gesture unlocks both.
 */

import { useEffect, useRef, useState } from 'react'
import { CuePlayer } from '../engine/cues'
import { useSettings } from '../state/SettingsProvider'
import { useAudioBus } from '../state/useAudioBus'
import { useMusic } from '../state/useMusic'
import { useTimer } from '../state/useTimer'
import { TimerDisplay } from '../visuals/TimerDisplay'
import { VisualLayer } from '../visuals/VisualLayer'
import { Controls } from './Controls'
import { MusicBar } from './MusicBar'
import { SettingsPanel } from './SettingsPanel'
import './TimerScreen.css'

/** Seconds remaining at/under which we play countdown ticks. */
const COUNTDOWN_FROM = 3

export function TimerScreen() {
  const { settings } = useSettings()
  const { snapshot, toggle, reset, onTransition } = useTimer(settings.routine)

  const bus = useAudioBus()
  const cueRef = useRef<CuePlayer | null>(null)
  if (cueRef.current === null) cueRef.current = new CuePlayer(bus)
  const cue = cueRef.current

  const music = useMusic(bus, snapshot.status)

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
    // Satisfy autoplay policy for both cues and music from this user gesture.
    void bus?.unlock()
    cue.unlock()
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

      {settings.music.enabled && (
        <MusicBar
          snapshot={music.snapshot}
          volume={settings.music.volume}
          onPlayPause={music.playPause}
          onNext={music.next}
          onVolume={music.setVolume}
        />
      )}

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </main>
  )
}
