import type { PoseFrame, PoseLandmark } from '@/core/pose-detection/types'
import type {
  ExerciseDefinition,
  FrameSnapshot,
  RepMetrics,
  RepState,
  RepSummary,
  Violation,
} from './types'

const DEFAULT_HISTORY_SIZE = 10

export type SessionTickResult = {
  state: RepState
  repCount: number
  repCompleted: boolean
  /** Son tamamlanmış rep'in özeti (bu frame'de rep tamamlandıysa). */
  lastRepSummary: RepSummary | null
  primaryAngle: number | null
}

/**
 * Bir egzersiz oturumu — pose stream'inden rep sayar ve kuralları değerlendirir.
 *
 * Bu sürüm KALİBRASYONSUZ — açı tabanlı state machine kullanır, kameraya
 * uzaklığından bağımsız çalışır. Sayfayı aç → hemen kullanmaya başla.
 */
export class ExerciseSession {
  private state: RepState
  private repCount = 0
  private frameHistory: PoseFrame[] = []
  private framesInCurrentState = 0
  private repSummaries: RepSummary[] = []

  // Rep tracking — PEAK durumundayken birikir, tamamlandığında metric'e çevrilir
  private repStartTime = 0
  private peakEnterTime = 0
  private peakExitTime = 0
  private currentRepMinAngle = Infinity
  private currentRepMaxAngle = -Infinity

  constructor(
    private readonly definition: ExerciseDefinition,
    private readonly historySize = DEFAULT_HISTORY_SIZE,
  ) {
    this.state = definition.stateMachine.initialState
  }

  get currentState(): RepState {
    return this.state
  }

  get reps(): number {
    return this.repCount
  }

  get summaries(): readonly RepSummary[] {
    return this.repSummaries
  }

  /**
   * Bir frame'i işle. Pose tespit edilemezse no-op.
   */
  tick(frame: PoseFrame): SessionTickResult {
    if (frame.landmarks === null) {
      return {
        state: this.state,
        repCount: this.repCount,
        repCompleted: false,
        lastRepSummary: null,
        primaryAngle: null,
      }
    }

    // Frame geçmişine ekle
    this.frameHistory.push(frame)
    if (this.frameHistory.length > this.historySize) {
      this.frameHistory.shift()
    }

    // Primary angle hesapla
    const primaryAngle = this.definition.computePrimaryAngle(frame.landmarks)
    if (primaryAngle === null) {
      // Açı hesaplanamadı (örn. landmark görünmüyor)
      return {
        state: this.state,
        repCount: this.repCount,
        repCompleted: false,
        lastRepSummary: null,
        primaryAngle: null,
      }
    }

    // Rep boyunca min/max tut
    this.currentRepMinAngle = Math.min(this.currentRepMinAngle, primaryAngle)
    this.currentRepMaxAngle = Math.max(this.currentRepMaxAngle, primaryAngle)

    // Snapshot oluştur
    const snapshot: FrameSnapshot = {
      landmarks: frame.landmarks,
      timestamp: frame.timestamp,
      history: this.frameHistory
        .map((f) => f.landmarks)
        .filter((l): l is PoseLandmark[] => l !== null),
      framesInCurrentState: this.framesInCurrentState,
    }

    // State machine
    const transition = this.definition.stateMachine.update(this.state, snapshot)
    this.framesInCurrentState++

    let lastRepSummary: RepSummary | null = null

    if (transition.newState !== this.state) {
      // State değişiyor
      if (this.state === 'REST' && transition.newState === 'PEAK') {
        // Rep başlıyor (REST → PEAK)
        this.repStartTime = frame.timestamp
        this.peakEnterTime = frame.timestamp
        this.currentRepMinAngle = primaryAngle
        this.currentRepMaxAngle = primaryAngle
      } else if (this.state === 'PEAK' && transition.newState === 'REST') {
        // Rep tamamlandı (PEAK → REST)
        this.peakExitTime = frame.timestamp
      }

      this.state = transition.newState
      this.framesInCurrentState = 0
    }

    if (transition.repCompleted) {
      this.repCount++

      const metrics: RepMetrics = {
        startTime: this.repStartTime,
        endTime: frame.timestamp,
        durationMs: frame.timestamp - this.repStartTime,
        minPrimaryAngle: this.currentRepMinAngle,
        maxPrimaryAngle: this.currentRepMaxAngle,
        eccentricMs: this.peakEnterTime - this.repStartTime,
        concentricMs: frame.timestamp - this.peakExitTime,
      }

      // Kuralları değerlendir
      const violations: Violation[] = []
      for (const rule of this.definition.rules) {
        const v = rule.evaluateRep(metrics)
        if (v !== null) violations.push(v)
      }

      const isClean = !violations.some((v) => v.severity === 'red')

      const summary: RepSummary = {
        repNumber: this.repCount,
        metrics,
        violations,
        isClean,
      }
      this.repSummaries.push(summary)
      lastRepSummary = summary
    }

    return {
      state: this.state,
      repCount: this.repCount,
      repCompleted: transition.repCompleted,
      lastRepSummary,
      primaryAngle,
    }
  }

  /** Oturumu sıfırla — yeni set için. */
  reset(): void {
    this.state = this.definition.stateMachine.initialState
    this.repCount = 0
    this.frameHistory = []
    this.framesInCurrentState = 0
    this.repSummaries = []
    this.repStartTime = 0
    this.peakEnterTime = 0
    this.peakExitTime = 0
    this.currentRepMinAngle = Infinity
    this.currentRepMaxAngle = -Infinity
  }
}
