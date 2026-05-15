import type { PoseFrame } from './types'

/**
 * Pose detection için soyut interface.
 * Implementasyonlar: MediaPipePoseDetector (mevcut), gelecekte YOLOv11-pose vb.
 *
 * Adapter pattern — domain mantığı bu interface üzerinden çalışır,
 * altta yatan ML modeli değişse bile rule engine etkilenmez.
 */
export interface PoseDetector {
  /**
   * Async init: model indir, WASM hazırla.
   * Idempotent — birden çok çağrı no-op olmalı.
   */
  initialize(): Promise<void>

  /**
   * Bir video frame'inden pose tespit et.
   * @param source - HTML video element (canlı veya yüklü video)
   * @param timestamp - monoton artan ms (genelde performance.now())
   * @returns Tespit sonucu; landmarks null ise pose yok demek.
   *
   * NOT: Sync — MediaPipe detectForVideo() sync döner.
   */
  detect(source: HTMLVideoElement, timestamp: number): PoseFrame

  /**
   * Kaynakları (WASM, model, GPU buffer) serbest bırak.
   * dispose() sonrası detect() çağrılmamalı.
   */
  dispose(): void

  /** initialize() tamamlandı, detect()'e hazır mı? */
  readonly isReady: boolean
}
