import type { PoseLandmark } from '@/core/pose-detection/types'

/**
 * Egzersize özel state — basit 2-state model.
 */
export type RepState = 'REST' | 'PEAK'

export type FrameSnapshot = {
  landmarks: PoseLandmark[]
  timestamp: number
  history: PoseLandmark[][]
  framesInCurrentState: number
}

export type StateTransition = {
  newState: RepState
  repCompleted: boolean
}

export type StateMachineUpdate = (
  currentState: RepState,
  snapshot: FrameSnapshot,
) => StateTransition

export type StateMachineConfig = {
  initialState: RepState
  update: StateMachineUpdate
}

export type Severity = 'green' | 'yellow' | 'red'

/**
 * Bir kural ihlali.
 * NOT: message metni yok — UI tarafında i18n'den `messageKey` ile lookup edilir.
 */
export type Violation = {
  ruleId: string
  severity: Severity
  /** i18n key — UI'da messages.rules[key] olarak lookup edilir. */
  messageKey: string
  value?: number
}

/**
 * Bir rep'in metrikleri — kural değerlendirmesinde kullanılır.
 */
export type RepMetrics = {
  startTime: number
  endTime: number
  durationMs: number
  minPrimaryAngle: number
  maxPrimaryAngle: number
  eccentricMs: number
  concentricMs: number
}

export type Rule = {
  id: string
  evaluateRep: (metrics: RepMetrics) => Violation | null
}

export type RepSummary = {
  repNumber: number
  metrics: RepMetrics
  violations: Violation[]
  isClean: boolean
}

export type CameraSetupConfig = {
  angle: 'side' | 'front' | 'three-quarter'
  distanceMeters: number
  cameraHeight: 'ground' | 'hip' | 'chest' | 'eye'
}

/**
 * Egzersiz plugin'i — sadece LOGIC ve referans bilgisi.
 * Tüm UI metinleri (displayName, description, instructions vs.) i18n'den gelir.
 */
export type ExerciseDefinition = {
  id: string
  cameraSetup: CameraSetupConfig
  stateMachine: StateMachineConfig
  rules: Rule[]
  computePrimaryAngle: (landmarks: PoseLandmark[]) => number | null
}
