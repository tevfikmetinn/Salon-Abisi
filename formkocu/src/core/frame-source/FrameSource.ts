/**
 * Kamera, video dosyası, gelecekte WebRTC stream gibi farklı frame kaynakları
 * için soyut interface.
 *
 * Pose detector bu interface'i bilmez — sadece HTMLVideoElement alır.
 * FrameSource'un işi: video element'i frame üretecek hale getirip yönetmek.
 */
export interface FrameSource {
  /**
   * Kaynağı başlat (kamera izni iste, dosya yükle, vb.).
   * Çağrı tamamlanınca video element frame üretmeye hazır olmalı.
   */
  start(): Promise<void>

  /**
   * Kaynağı durdur ve kaynakları (stream, object URL, vb.) serbest bırak.
   * Idempotent olmalı.
   */
  stop(): void

  /** Şu an aktif olarak frame üretiyor mu? */
  readonly isActive: boolean
}
