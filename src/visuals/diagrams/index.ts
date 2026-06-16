/** Registry mapping exercise id → diagram component, with a generic fallback. */

import type { ComponentType } from 'react'
import {
  Burpees,
  GenericExercise,
  GluteBridges,
  HighKnees,
  JumpingJacks,
  Lunges,
  MountainClimbers,
  PushUps,
  Plank,
  Squats,
} from './exercises'

export type DiagramComponent = ComponentType

const REGISTRY: Record<string, DiagramComponent> = {
  'jumping-jacks': JumpingJacks,
  squats: Squats,
  'push-ups': PushUps,
  'high-knees': HighKnees,
  lunges: Lunges,
  'mountain-climbers': MountainClimbers,
  plank: Plank,
  burpees: Burpees,
  'glute-bridges': GluteBridges,
}

/** Look up a diagram by exercise id, falling back to a generic figure. */
export function diagramFor(id: string | undefined): DiagramComponent {
  return (id && REGISTRY[id]) || GenericExercise
}

export { DoneGlyph } from './exercises'
