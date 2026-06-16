/**
 * Timer state machine — framework-agnostic. No React/DOM imports.
 *
 * Design notes:
 * - Elapsed time is derived from `performance.now()` timestamps, NOT by counting
 *   setInterval ticks. This keeps the clock accurate even when the tab is
 *   backgrounded/throttled or the phone is locked: we always recompute from real
 *   elapsed time on each `update()`.
 * - The engine owns no loop. A driver (the React layer, or a test) calls
 *   `update()` to advance state. This makes the engine deterministic and unit-
 *   testable with an injected clock.
 * - Phase transitions are emitted via `onTransition` so cues (beeps/flash) can
 *   react without polling.
 */

import type { Exercise, Routine, TimelinePhase } from './routine'
import { buildTimeline } from './routine'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

export interface TimerSnapshot {
  status: TimerStatus
  phaseIndex: number
  phase: TimelinePhase
  /** Whole seconds left in the current phase, rounded up for display. */
  phaseRemainingSeconds: number
  /** Milliseconds left in the current phase (precise). */
  phaseRemainingMs: number
  /** Whole seconds left in the whole workout, rounded up. */
  totalRemainingSeconds: number
  totalElapsedSeconds: number
  currentExercise: Exercise | null
  /** The next exercise the user will do, for "up next" display. */
  nextExercise: Exercise | null
  round: number
  isWork: boolean
}

export interface TransitionEvent {
  from: TimelinePhase
  to: TimelinePhase
  toIndex: number
}

type TransitionListener = (event: TransitionEvent) => void

const defaultNow = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

export class TimerEngine {
  private timeline!: TimelinePhase[]
  /** Cumulative duration (ms) before each phase, for total-elapsed math. */
  private offsetsMs!: number[]
  private totalMs!: number
  private readonly now: () => number

  private status: TimerStatus = 'idle'
  private phaseIndex = 0
  /** Elapsed ms in the current phase already "banked" (e.g. before a pause). */
  private bankedMs = 0
  /** Timestamp when the current running segment began; null when not running. */
  private segmentStart: number | null = null

  private transitionListeners = new Set<TransitionListener>()

  constructor(routine: Routine, opts: { now?: () => number } = {}) {
    this.now = opts.now ?? defaultNow
    this.setRoutine(routine)
  }

  /** Build the timeline + cumulative offsets for a routine. */
  private setRoutine(routine: Routine): void {
    this.timeline = buildTimeline(routine)
    this.offsetsMs = []
    let acc = 0
    for (const phase of this.timeline) {
      this.offsetsMs.push(acc)
      acc += phase.durationSeconds * 1000
    }
    this.totalMs = acc
  }

  /** Replace the routine and reset to idle. */
  load(routine: Routine): void {
    this.setRoutine(routine)
    this.reset()
  }

  onTransition(listener: TransitionListener): () => void {
    this.transitionListeners.add(listener)
    return () => this.transitionListeners.delete(listener)
  }

  start(): void {
    if (this.status === 'running') return
    if (this.status === 'idle' || this.status === 'done') {
      this.phaseIndex = 0
      this.bankedMs = 0
    }
    this.status = 'running'
    this.segmentStart = this.now()
  }

  pause(): void {
    if (this.status !== 'running') return
    this.bankedMs = this.phaseElapsedMs()
    this.segmentStart = null
    this.status = 'paused'
  }

  toggle(): void {
    if (this.status === 'running') this.pause()
    else this.start()
  }

  reset(): void {
    this.status = 'idle'
    this.phaseIndex = 0
    this.bankedMs = 0
    this.segmentStart = null
  }

  /** Live elapsed ms within the current phase. */
  private phaseElapsedMs(): number {
    if (this.status === 'running' && this.segmentStart !== null) {
      return this.bankedMs + (this.now() - this.segmentStart)
    }
    return this.bankedMs
  }

  /**
   * Advance the state machine to the current real time. Handles crossing one or
   * more phase boundaries (e.g. after a long background gap) and emits a
   * transition event per boundary crossed.
   */
  update(): void {
    if (this.status !== 'running') return

    let elapsed = this.phaseElapsedMs()
    let guard = 0
    while (this.status === 'running') {
      const phase = this.timeline[this.phaseIndex]
      const durationMs = phase.durationSeconds * 1000

      if (phase.kind === 'done') {
        this.status = 'done'
        this.segmentStart = null
        this.bankedMs = 0
        break
      }
      if (elapsed < durationMs) break

      // Carry the overflow into the next phase.
      const overflow = elapsed - durationMs
      const from = phase
      this.phaseIndex++
      const to = this.timeline[this.phaseIndex]
      this.bankedMs = 0
      this.segmentStart = this.now() - overflow
      elapsed = overflow

      this.emitTransition({ from, to, toIndex: this.phaseIndex })

      if (++guard > this.timeline.length + 1) break // safety against bad clocks
    }
  }

  getSnapshot(): TimerSnapshot {
    const phase = this.timeline[this.phaseIndex]
    const durationMs = phase.durationSeconds * 1000
    const elapsedMs = phase.kind === 'done' ? 0 : Math.min(this.phaseElapsedMs(), durationMs)
    const phaseRemainingMs = Math.max(0, durationMs - elapsedMs)

    const totalElapsedMs =
      phase.kind === 'done' ? this.totalMs : this.offsetsMs[this.phaseIndex] + elapsedMs
    const totalRemainingMs = Math.max(0, this.totalMs - totalElapsedMs)

    return {
      status: this.status,
      phaseIndex: this.phaseIndex,
      phase,
      phaseRemainingSeconds: Math.ceil(phaseRemainingMs / 1000),
      phaseRemainingMs,
      totalRemainingSeconds: Math.ceil(totalRemainingMs / 1000),
      totalElapsedSeconds: Math.floor(totalElapsedMs / 1000),
      currentExercise: phase.exercise,
      nextExercise: this.findNextExercise(),
      round: phase.round,
      isWork: phase.kind === 'work',
    }
  }

  private findNextExercise(): Exercise | null {
    for (let i = this.phaseIndex + 1; i < this.timeline.length; i++) {
      if (this.timeline[i].kind === 'work') return this.timeline[i].exercise
    }
    return null
  }

  private emitTransition(event: TransitionEvent): void {
    for (const listener of this.transitionListeners) listener(event)
  }
}
