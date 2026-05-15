import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import type { PoseDetector } from './PoseDetector'
import type { PoseFrame, PoseLandmark } from './types'

const MEDIAPIPE_VERSION = '0.10.35'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`

// Model seçimi: 'full' lite'tan daha hassas, heavy'den çok daha hafif.
// Karşılaştırma: lite (~3MB, ~15ms) / full (~6MB, ~25ms) / heavy (~26MB, ~50ms)
// Form analizinde joint pozisyon hassasiyeti kritik — full sweet spot.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'

export type MediaPipePoseDetectorOptions = {
  /** Default: 'GPU' (otomatik CPU fallback) */
  delegate?: 'GPU' | 'CPU'
  /** Default: 1 — single user use case */
  numPoses?: number
  /** Default: 0.5 — ilk tespit eşiği */
  minPoseDetectionConfidence?: number
  /** Default: 0.5 — pose devamlılığı eşiği */
  minPosePresenceConfidence?: number
  /** Default: 0.3 — sticky tracking; kısa kapanmalarda kaybetme */
  minTrackingConfidence?: number
}

/**
 * MediaPipe Tasks Vision Pose Landmarker ile PoseDetector implementasyonu.
 * Tarayıcıda WASM ile çalışır (GPU varsa GPU, yoksa CPU).
 */
export class MediaPipePoseDetector implements PoseDetector {
  private landmarker: PoseLandmarker | null = null
  private readonly options: Required<MediaPipePoseDetectorOptions>

  constructor(options: MediaPipePoseDetectorOptions = {}) {
    this.options = {
      delegate: options.delegate ?? 'GPU',
      numPoses: options.numPoses ?? 1,
      minPoseDetectionConfidence: options.minPoseDetectionConfidence ?? 0.5,
      minPosePresenceConfidence: options.minPosePresenceConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.3,
    }
  }

  get isReady(): boolean {
    return this.landmarker !== null
  }

  async initialize(): Promise<void> {
    if (this.landmarker) return

    const vision = await FilesetResolver.forVisionTasks(WASM_URL)
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: this.options.delegate,
      },
      runningMode: 'VIDEO',
      numPoses: this.options.numPoses,
      minPoseDetectionConfidence: this.options.minPoseDetectionConfidence,
      minPosePresenceConfidence: this.options.minPosePresenceConfidence,
      minTrackingConfidence: this.options.minTrackingConfidence,
    })
  }

  detect(source: HTMLVideoElement, timestamp: number): PoseFrame {
    if (!this.landmarker) {
      return { landmarks: null, timestamp }
    }

    const result = this.landmarker.detectForVideo(source, timestamp)
    if (result.landmarks.length === 0) {
      return { landmarks: null, timestamp }
    }

    return {
      landmarks: result.landmarks[0].map(normalizeLandmark),
      timestamp,
    }
  }

  dispose(): void {
    this.landmarker?.close()
    this.landmarker = null
  }
}

function normalizeLandmark(l: NormalizedLandmark): PoseLandmark {
  return {
    x: l.x,
    y: l.y,
    z: l.z,
    visibility: l.visibility ?? 0,
  }
}
