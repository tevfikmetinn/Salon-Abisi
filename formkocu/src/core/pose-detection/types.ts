/**
 * Normalize edilmiş tek bir vücut noktası.
 * x, y: image space [0, 1] — sol-üst (0,0), sağ-alt (1,1)
 * z: kameraya göre relatif derinlik (gürültülü, mutlak değer için kullanma)
 * visibility: tespit güven skoru [0, 1]
 */
export type PoseLandmark = {
  x: number
  y: number
  z: number
  visibility: number
}

/**
 * Bir video frame'inin tespit sonucu.
 * landmarks null ise tespit edilemedi (kare içinde pose yok).
 * timestamp monoton artan ms (performance.now()).
 */
export type PoseFrame = {
  landmarks: PoseLandmark[] | null
  timestamp: number
}

/**
 * MediaPipe Pose Landmarker'ın 33 nokta indeks haritası.
 * Referans: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE_LANDMARK = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

export type LandmarkIndex = (typeof POSE_LANDMARK)[keyof typeof POSE_LANDMARK]
