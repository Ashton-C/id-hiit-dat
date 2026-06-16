/**
 * React binding over the framework-agnostic TimerEngine.
 *
 * The engine owns no loop; this hook drives it with requestAnimationFrame while
 * running, re-reading the snapshot each frame so the countdown stays smooth. The
 * rAF loop is only alive while the timer is running, so an idle/paused/done timer
 * costs nothing.
 *
 * Routine changes never destroy an in-progress workout: a structurally-identical
 * routine (e.g. re-selecting the same preset, which clones a fresh object) is a
 * no-op, and an edit made while running/paused is deferred and applied on the next
 * reset rather than snapping the clock back to the start.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Routine } from '../engine/routine'
import {
  TimerEngine,
  type TimerSnapshot,
  type TransitionEvent,
} from '../engine/timer'

/** Stable identity for a routine's *timeline shape* (ignores object identity). */
function routineFingerprint(r: Routine): string {
  return [
    r.prepareSeconds,
    r.workSeconds,
    r.restSeconds,
    r.rounds,
    r.exercises.map((e) => e.id).join(','),
  ].join('|')
}

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

  // Fingerprint currently loaded into the engine.
  const appliedFp = useRef(routineFingerprint(routine))
  // A routine edited mid-workout, applied on the next reset.
  const pendingRoutine = useRef<Routine | null>(null)

  // Apply routine changes — but never reset a running/paused workout.
  useEffect(() => {
    const fp = routineFingerprint(routine)
    if (fp === appliedFp.current) return // structural no-op (identity churn)

    const status = engine.getSnapshot().status
    if (status === 'running' || status === 'paused') {
      pendingRoutine.current = routine // defer until reset
      return
    }
    engine.load(routine)
    appliedFp.current = fp
    pendingRoutine.current = null
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
    // Apply any routine edited mid-workout as part of the reset.
    const pending = pendingRoutine.current
    if (pending) {
      engine.load(pending) // load() resets internally
      appliedFp.current = routineFingerprint(pending)
      pendingRoutine.current = null
    } else {
      engine.reset()
    }
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
