/**
 * Routine model — framework-agnostic. No React/DOM imports so this can be
 * reused as-is in a future React Native port.
 *
 * A routine is expanded into a flat, ordered list of phases (the "timeline")
 * that the timer state machine steps through. Keeping the model declarative
 * (work/rest/rounds + an exercise list) while the timer consumes a flat
 * timeline keeps the engine simple and easy to test.
 */

export type PhaseKind = 'prepare' | 'work' | 'rest' | 'done'

/** A single exercise the user performs during a work phase. */
export interface Exercise {
  /** Stable id, used to look up diagrams/metadata later. */
  id: string
  name: string
}

/** Declarative definition of a workout. */
export interface Routine {
  id: string
  name: string
  /** Lead-in countdown before the first work phase, in seconds. */
  prepareSeconds: number
  /** Duration of each high-intensity work phase, in seconds. */
  workSeconds: number
  /** Duration of each rest phase, in seconds. */
  restSeconds: number
  /**
   * Ordered exercises. One work phase is generated per exercise per round,
   * cycling through this list. The list length need not equal `rounds`.
   */
  exercises: Exercise[]
  /** How many times to cycle through the full exercise list. */
  rounds: number
}

/** One concrete, scheduled segment of a workout. */
export interface TimelinePhase {
  kind: PhaseKind
  /** Duration in seconds. `done` is 0. */
  durationSeconds: number
  /** Exercise for `work` phases; null otherwise. */
  exercise: Exercise | null
  /** 1-based round number this phase belongs to (0 for prepare/done). */
  round: number
  /** 1-based index of this phase among all work phases (0 if not work). */
  workIndex: number
}

/**
 * Expand a declarative routine into the flat ordered timeline the timer runs.
 * Structure: prepare → [work, rest] per exercise per round (trailing rest is
 * dropped) → done.
 */
export function buildTimeline(routine: Routine): TimelinePhase[] {
  const phases: TimelinePhase[] = []

  if (routine.prepareSeconds > 0) {
    phases.push({
      kind: 'prepare',
      durationSeconds: routine.prepareSeconds,
      exercise: null,
      round: 0,
      workIndex: 0,
    })
  }

  let workIndex = 0
  for (let round = 1; round <= routine.rounds; round++) {
    for (const exercise of routine.exercises) {
      workIndex++
      phases.push({
        kind: 'work',
        durationSeconds: routine.workSeconds,
        exercise,
        round,
        workIndex,
      })
      // Skip zero-length rests entirely (e.g. rest=0) so they don't fire a
      // spurious rest cue + double transition.
      if (routine.restSeconds > 0) {
        phases.push({
          kind: 'rest',
          durationSeconds: routine.restSeconds,
          exercise: null,
          round,
          workIndex,
        })
      }
    }
  }

  // Drop the trailing rest — no point resting after the final work phase.
  if (phases.length && phases[phases.length - 1].kind === 'rest') {
    phases.pop()
  }

  phases.push({
    kind: 'done',
    durationSeconds: 0,
    exercise: null,
    round: 0,
    workIndex: 0,
  })

  return phases
}

/** Total active duration of a routine in seconds (excludes the `done` marker). */
export function totalSeconds(routine: Routine): number {
  return buildTimeline(routine)
    .filter((p) => p.kind !== 'done')
    .reduce((sum, p) => sum + p.durationSeconds, 0)
}

/**
 * PLACEHOLDER exercise sequence.
 * TODO(user): replace with the real exercises from the wife's 13-min video.
 * 18 work phases × 30s + 17 rests × 10s + 10s prepare ≈ 13 min total.
 */
const PLACEHOLDER_EXERCISES: Exercise[] = [
  { id: 'jumping-jacks', name: 'Jumping Jacks' },
  { id: 'squats', name: 'Squats' },
  { id: 'push-ups', name: 'Push-ups' },
  { id: 'high-knees', name: 'High Knees' },
  { id: 'lunges', name: 'Lunges' },
  { id: 'mountain-climbers', name: 'Mountain Climbers' },
  { id: 'plank', name: 'Plank' },
  { id: 'burpees', name: 'Burpees' },
  { id: 'glute-bridges', name: 'Glute Bridges' },
]

/**
 * Default routine: replicates the 13-minute, 30s-work / 10s-rest video.
 * 9 exercises × 2 rounds = 18 work phases.
 */
export const DEFAULT_ROUTINE: Routine = {
  id: 'default-13min',
  name: '13-Minute Classic',
  prepareSeconds: 10,
  workSeconds: 30,
  restSeconds: 10,
  exercises: PLACEHOLDER_EXERCISES,
  rounds: 2,
}
