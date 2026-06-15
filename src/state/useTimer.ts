/**
 * React binding over the framework-agnostic TimerEngine.
 *
 * The engine owns no loop; this hook drives it with requestAnimationFrame while
 * running, re-reading the snapshot each frame so the countdown stays smooth. The
 * rAF loop is only alive while the timer is running, so an idle/paused/done timer
 * costs nothing.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Routine } from '../engine/routine'
import {
  TimerEngine,
  type TimerSnapshot,
  type TransitionEvent,
} from '../engine/timer'

export interface UseTimer {
  snapshot: TimerSnapshot
  start: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  /** Subscribe to phase transitions (for cues). Returns an unsubscribe fn. */
  onTransition: (listener: (e: TransitionEvent) => void) => () => void
}

export function useTimer(routine: Routine): UseTimer {
  // The engine instance is stable across renders; created lazily once.
  const engineRef = useRef<TimerEngine | null>(null)
  if (engineRef.current === null) {
    engineRef.current = new TimerEngine(routine)
  }
  const engine = engineRef.current

  const [snapshot, setSnapshot] = useState<TimerSnapshot>(() =>
    engine.getSnapshot(),
  )

  // Reload the engine if the routine identity changes.
  useEffect(() => {
    engine.load(routine)
    setSnapshot(engine.getSnapshot())
  }, [engine, routine])

  const rafRef = useRef<number | null>(null)

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    engine.update()
    const snap = engine.getSnapshot()
    setSnapshot(snap)
    if (snap.status === 'running') {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = null
    }
  }, [engine])

  const startLoop = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const start = useCallback(() => {
    engine.start()
    setSnapshot(engine.getSnapshot())
    startLoop()
  }, [engine, startLoop])

  const pause = useCallback(() => {
    engine.pause()
    stopLoop()
    setSnapshot(engine.getSnapshot())
  }, [engine, stopLoop])

  const toggle = useCallback(() => {
    if (engine.getSnapshot().status === 'running') pause()
    else start()
  }, [engine, pause, start])

  const reset = useCallback(() => {
    engine.reset()
    stopLoop()
    setSnapshot(engine.getSnapshot())
  }, [engine, stopLoop])

  const onTransition = useCallback(
    (listener: (e: TransitionEvent) => void) => engine.onTransition(listener),
    [engine],
  )

  // Clean up the loop on unmount.
  useEffect(() => stopLoop, [stopLoop])

  return { snapshot, start, pause, toggle, reset, onTransition }
}
