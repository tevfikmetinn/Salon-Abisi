import type { ExerciseDefinition } from '@/core/exercise-engine/types'
import { squatDefinition } from './squat'
import { pushupDefinition } from './pushup'
import { curlDefinition } from './curl'

/**
 * Egzersiz registry.
 * Yeni egzersiz eklemek: yeni plugin dosyası + bu listeye bir satır.
 */
export const EXERCISES: Record<string, ExerciseDefinition> = {
  squat: squatDefinition,
  pushup: pushupDefinition,
  curl: curlDefinition,
}

export function getExercise(id: string): ExerciseDefinition | null {
  return EXERCISES[id] ?? null
}

export function listExercises(): ExerciseDefinition[] {
  return Object.values(EXERCISES)
}
