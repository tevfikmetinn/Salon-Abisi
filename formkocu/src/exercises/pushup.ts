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

const PEAK_ENTER_ANGLE = 120
const REST_EXIT_ANGLE = 150
const MIN_DWELL_FRAMES = 3

function computeElbowAngle(landmarks: PoseLandmark[]): number | null {
  const ls = landmarks[POSE_LANDMARK.LEFT_SHOULDER]
  const le = landmarks[POSE_LANDMARK.LEFT_ELBOW]
  const lw = landmarks[POSE_LANDMARK.LEFT_WRIST]
  const rs = landmarks[POSE_LANDMARK.RIGHT_SHOULDER]
  const re = landmarks[POSE_LANDMARK.RIGHT_ELBOW]
  const rw = landmarks[POSE_LANDMARK.RIGHT_WRIST]

  const angles: number[] = []
  if (ls.visibility > 0.5 && le.visibility > 0.5 && lw.visibility > 0.5) {
    angles.push(angleAtVertex(ls, le, lw))
  }
  if (rs.visibility > 0.5 && re.visibility > 0.5 && rw.visibility > 0.5) {
    angles.push(angleAtVertex(rs, re, rw))
  }

  if (angles.length === 0) return null
  return angles.reduce((a, b) => a + b, 0) / angles.length
}

function pushupUpdate(
  current: RepState,
  snapshot: FrameSnapshot,
): StateTransition {
  const angle = computeElbowAngle(snapshot.landmarks)
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
  id: 'pushup.depth',
  evaluateRep: (metrics: RepMetrics) => {
    const min = metrics.minPrimaryAngle
    if (min <= 95) return null
    if (min <= 110) {
      return {
        ruleId: 'pushup.depth',
        severity: 'yellow',
        messageKey: 'pushup.depth.yellow',
        value: min,
      }
    }
    return {
      ruleId: 'pushup.depth',
      severity: 'red',
      messageKey: 'pushup.depth.red',
      value: min,
    }
  },
}

export const pushupDefinition: ExerciseDefinition = {
  id: 'pushup',
  cameraSetup: {
    angle: 'side',
    distanceMeters: 2.5,
    cameraHeight: 'ground',
  },
  computePrimaryAngle: computeElbowAngle,
  stateMachine: {
    initialState: 'REST',
    update: pushupUpdate,
  },
  rules: [depthRule],
}
