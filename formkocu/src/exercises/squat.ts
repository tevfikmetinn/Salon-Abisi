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

const PEAK_ENTER_ANGLE = 140
const REST_EXIT_ANGLE = 160
const MIN_DWELL_FRAMES = 3

function computeKneeAngle(landmarks: PoseLandmark[]): number | null {
  const leftHip = landmarks[POSE_LANDMARK.LEFT_HIP]
  const leftKnee = landmarks[POSE_LANDMARK.LEFT_KNEE]
  const leftAnkle = landmarks[POSE_LANDMARK.LEFT_ANKLE]
  const rightHip = landmarks[POSE_LANDMARK.RIGHT_HIP]
  const rightKnee = landmarks[POSE_LANDMARK.RIGHT_KNEE]
  const rightAnkle = landmarks[POSE_LANDMARK.RIGHT_ANKLE]

  const angles: number[] = []
  if (leftHip.visibility > 0.5 && leftKnee.visibility > 0.5 && leftAnkle.visibility > 0.5) {
    angles.push(angleAtVertex(leftHip, leftKnee, leftAnkle))
  }
  if (rightHip.visibility > 0.5 && rightKnee.visibility > 0.5 && rightAnkle.visibility > 0.5) {
    angles.push(angleAtVertex(rightHip, rightKnee, rightAnkle))
  }

  if (angles.length === 0) return null
  return angles.reduce((a, b) => a + b, 0) / angles.length
}

function squatUpdate(
  current: RepState,
  snapshot: FrameSnapshot,
): StateTransition {
  const angle = computeKneeAngle(snapshot.landmarks)
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

const depthRule: Rule = {
  id: 'squat.depth',
  evaluateRep: (metrics: RepMetrics) => {
    const min = metrics.minPrimaryAngle
    if (min <= 100) return null
    if (min <= 120) {
      return {
        ruleId: 'squat.depth',
        severity: 'yellow',
        messageKey: 'squat.depth.yellow',
        value: min,
      }
    }
    return {
      ruleId: 'squat.depth',
      severity: 'red',
      messageKey: 'squat.depth.red',
      value: min,
    }
  },
}

export const squatDefinition: ExerciseDefinition = {
  id: 'squat',
  cameraSetup: {
    angle: 'side',
    distanceMeters: 2,
    cameraHeight: 'hip',
  },
  computePrimaryAngle: computeKneeAngle,
  stateMachine: {
    initialState: 'REST',
    update: squatUpdate,
  },
  rules: [depthRule],
}
