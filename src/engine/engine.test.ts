import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ROUTINE,
  buildTimeline,
  totalSeconds,
  type Routine,
} from './routine'
import { TimerEngine, type TransitionEvent } from './timer'

/** Small routine for fast, readable timeline assertions. */
const TINY: Routine = {
  id: 'tiny',
  name: 'Tiny',
  prepareSeconds: 5,
  workSeconds: 20,
  restSeconds: 10,
  exercises: [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ],
  rounds: 2,
}

/** A controllable fake clock so update() is fully deterministic. */
function makeClock(start = 0) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms
    },
    set: (ms: number) => {
      t = ms
    },
  }
}

describe('buildTimeline', () => {
  it('expands prepare → work/rest per exercise per round → done, dropping trailing rest', () => {
    const tl = buildTimeline(TINY)
    expect(tl.map((p) => p.kind)).toEqual([
      'prepare',
      'work', 'rest', // round1 A
      'work', 'rest', // round1 B
      'work', 'rest', // round2 A
      'work', // round2 B (trailing rest dropped)
      'done',
    ])
  })

  it('assigns rounds and 1-based work indexes', () => {
    const work = buildTimeline(TINY).filter((p) => p.kind === 'work')
    expect(work.map((p) => p.workIndex)).toEqual([1, 2, 3, 4])
    expect(work.map((p) => p.round)).toEqual([1, 1, 2, 2])
    expect(work.map((p) => p.exercise?.id)).toEqual(['a', 'b', 'a', 'b'])
  })

  it('omits the prepare phase when prepareSeconds is 0', () => {
    const tl = buildTimeline({ ...TINY, prepareSeconds: 0 })
    expect(tl[0].kind).toBe('work')
  })

  it('totalSeconds sums active phases only', () => {
    // 5 prepare + 4×20 work + 3×10 rest = 115
    expect(totalSeconds(TINY)).toBe(115)
  })
})

describe('DEFAULT_ROUTINE', () => {
  it('is the ~13-minute classic (close to 800s)', () => {
    const secs = totalSeconds(DEFAULT_ROUTINE)
    // 10 prepare + 20×30 work + 19×10 rest = 800s.
    expect(secs).toBe(800)
    const work = buildTimeline(DEFAULT_ROUTINE).filter((p) => p.kind === 'work')
    expect(work).toHaveLength(20)
  })
})

describe('TimerEngine', () => {
  it('starts idle and reports the first phase', () => {
    const engine = new TimerEngine(TINY, { now: () => 0 })
    const snap = engine.getSnapshot()
    expect(snap.status).toBe('idle')
    expect(snap.phase.kind).toBe('prepare')
    expect(snap.phaseRemainingSeconds).toBe(5)
    expect(snap.nextExercise?.id).toBe('a')
  })

  it('counts down within a phase', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    engine.start()
    clock.advance(2000)
    engine.update()
    const snap = engine.getSnapshot()
    expect(snap.status).toBe('running')
    expect(snap.phaseRemainingMs).toBe(3000)
    expect(snap.phaseRemainingSeconds).toBe(3)
  })

  it('transitions to the next phase at the boundary and emits an event', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    const events: TransitionEvent[] = []
    engine.onTransition((e) => events.push(e))

    engine.start()
    clock.advance(5000) // finish prepare
    engine.update()

    expect(events).toHaveLength(1)
    expect(events[0].from.kind).toBe('prepare')
    expect(events[0].to.kind).toBe('work')
    const snap = engine.getSnapshot()
    expect(snap.phase.kind).toBe('work')
    expect(snap.isWork).toBe(true)
    expect(snap.currentExercise?.id).toBe('a')
  })

  it('carries overflow across multiple boundaries in one update (background gap)', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    const events: TransitionEvent[] = []
    engine.onTransition((e) => events.push(e))

    engine.start()
    // Jump 5(prepare)+20(workA)+10(restA) = 35s, landing 0s into work B.
    clock.advance(35_000)
    engine.update()

    expect(events.map((e) => e.to.kind)).toEqual(['work', 'rest', 'work'])
    const snap = engine.getSnapshot()
    expect(snap.phase.kind).toBe('work')
    expect(snap.currentExercise?.id).toBe('b')
    expect(snap.phaseRemainingSeconds).toBe(20)
  })

  it('pause banks elapsed time and resume continues from there', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    engine.start()
    clock.advance(3000)
    engine.update()
    engine.pause()

    // Time passes while paused — must NOT count.
    clock.advance(10_000)
    engine.update()
    expect(engine.getSnapshot().phaseRemainingMs).toBe(2000)
    expect(engine.getSnapshot().status).toBe('paused')

    engine.start() // resume
    clock.advance(1000)
    engine.update()
    // Banked 3s + 1s resumed = 4s into the 5s prepare → 1s left, still prepare.
    expect(engine.getSnapshot().phase.kind).toBe('prepare')
    expect(engine.getSnapshot().phaseRemainingMs).toBe(1000)

    // One more second hits the boundary and rolls into the first work phase.
    clock.advance(1000)
    engine.update()
    expect(engine.getSnapshot().phase.kind).toBe('work')
  })

  it('reaches done after the full timeline and stops the clock', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    engine.start()
    clock.advance(totalSeconds(TINY) * 1000)
    engine.update()
    const snap = engine.getSnapshot()
    expect(snap.status).toBe('done')
    expect(snap.phase.kind).toBe('done')
    expect(snap.totalRemainingSeconds).toBe(0)

    // Further time does nothing once done.
    clock.advance(5000)
    engine.update()
    expect(engine.getSnapshot().status).toBe('done')
  })

  it('reset returns to idle at the first phase', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    engine.start()
    clock.advance(8000)
    engine.update()
    engine.reset()
    const snap = engine.getSnapshot()
    expect(snap.status).toBe('idle')
    expect(snap.phaseIndex).toBe(0)
    expect(snap.phase.kind).toBe('prepare')
  })

  it('tracks total elapsed/remaining across the workout', () => {
    const clock = makeClock()
    const engine = new TimerEngine(TINY, { now: clock.now })
    engine.start()
    clock.advance(5000 + 20_000 + 5000) // prepare + workA + 5s into restA
    engine.update()
    const snap = engine.getSnapshot()
    expect(snap.totalElapsedSeconds).toBe(30)
    expect(snap.totalRemainingSeconds).toBe(totalSeconds(TINY) - 30)
  })
})
