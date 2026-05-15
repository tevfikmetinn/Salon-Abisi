import { POSE_LANDMARK, type PoseLandmark } from '@/core/pose-detection/types'
import { angleAtVertex } from '@/core/math/angles'
import type {
  ExerciseDefinition,
  FrameSnapshot,
  RepMetrics,
  RepState,
  Rule,
  StateTransition,
} from '@/core/exercise-engine/types'

const PEAK_ENTER_ANGLE = 90
const REST_EXIT_ANGLE = 150
const MIN_DWELL_FRAMES = 3

function computeActiveElbowAngle(landmarks: PoseLandmark[]): number | null {
  const ls = landmarks[POSE_LANDMARK.LEFT_SHOULDER]
  const le = landmarks[POSE_LANDMARK.LEFT_ELBOW]
  const lw = landmarks[POSE_LANDMARK.LEFT_WRIST]
  const rs = landmarks[POSE_LANDMARK.RIGHT_SHOULDER]
  const re = landmarks[POSE_LANDMARK.RIGHT_ELBOW]
  const rw = landmarks[POSE_LANDMARK.RIGHT_WRIST]

  let leftAngle: number | null = null
  let rightAngle: number | null = null

  if (ls.visibility > 0.5 && le.visibility > 0.5 && lw.visibility > 0.5) {
    leftAngle = angleAtVertex(ls, le, lw)
  }
  if (rs.visibility > 0.5 && re.visibility > 0.5 && rw.visibility > 0.5) {
    rightAngle = angleAtVertex(rs, re, rw)
  }

  if (leftAngle === null && rightAngle === null) return null
  if (leftAngle === null) return rightAngle
  if (rightAngle === null) return leftAngle
  return Math.min(leftAngle, rightAngle)
}

function curlUpdate(
  current: RepState,
  snapshot: FrameSnapshot,
): StateTransition {
  const angle = computeActiveElbowAngle(snapshot.landmarks)
  if (angle === null) return { newState: current, repCompleted: false }
  if (snapshot.framesInCurrentState < MIN_DWELL_FRAMES) {
    return { newState: current, repCompleted: false }
  }

  if (current === 'REST') {
    if (angle < PEAK_ENTER_ANGLE) {
      return { newState: 'PEAK', repCompleted: false }
    }
  } else {
    if (angle > REST_EXIT_ANGLE) {
      return { newState: 'REST', repCompleted: true }
    }
  }

  return { newState: current, repCompleted: false }
}

const romRule: Rule = {
  id: 'curl.rom',
  evaluateRep: (metrics: RepMetrics) => {
    const peak = metrics.minPrimaryAngle
    const rest = metrics.maxPrimaryAngle

    if (peak <= 60 && rest >= 160) return null

    if (peak > 70) {
      return {
        ruleId: 'curl.rom',
        severity: 'yellow',
        messageKey: 'curl.rom.peakTooHigh',
        value: peak,
      }
    }
    if (rest < 150) {
      return {
        ruleId: 'curl.rom',
        severity: 'yellow',
        messageKey: 'curl.rom.restTooLow',
        value: rest,
      }
    }
    return null
  },
}

export const curlDefinition: ExerciseDefinition = {
  id: 'curl',
  cameraSetup: {
    angle: 'three-quarter',
    distanceMeters: 1.5,
    cameraHeight: 'chest',
  },
  computePrimaryAngle: computeActiveElbowAngle,
  stateMachine: {
    initialState: 'REST',
    update: curlUpdate,
  },
  rules: [romRule],
}
