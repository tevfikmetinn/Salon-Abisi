import type { FrameSource } from './FrameSource'

/**
 * Yüklenen video dosyasını FrameSource olarak sarar.
 *
 * Kullanım:
 *   const source = new VideoFileSource(videoEl)
 *   await source.load(file)   // önce dosya yükle
 *   await source.start()      // sonra başlat
 *   source.stop()             // cleanup
 */
export class VideoFileSource implements FrameSource {
  private objectUrl: string | null = null
  private active = false

  constructor(private readonly video: HTMLVideoElement) {}

  get isActive(): boolean {
    return this.active
  }

  /**
   * Dosyayı video element'e bağla ve metadata yüklenmesini bekle.
   * start() çağrısından önce mutlaka çağrılmalı.
   */
  async load(file: File): Promise<void> {
    // Önceki object URL'i serbest bırak
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }

    this.objectUrl = URL.createObjectURL(file)
    this.video.src = this.objectUrl

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('Video dosyası yüklenemedi veya format desteklenmiyor'))
      }
      const cleanup = () => {
        this.video.removeEventListener('loadedmetadata', onLoaded)
        this.video.removeEventListener('error', onError)
      }
      this.video.addEventListener('loadedmetadata', onLoaded)
      this.video.addEventListener('error', onError)
    })
  }

  async start(): Promise<void> {
    if (this.active) return
    if (!this.objectUrl) {
      throw new Error('VideoFileSource.start() çağrısından önce load(file) çağırılmalı')
    }
    await this.video.play()
    this.active = true
  }

  stop(): void {
    this.video.pause()
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
    this.video.removeAttribute('src')
    this.video.load()
    this.active = false
  }
}
