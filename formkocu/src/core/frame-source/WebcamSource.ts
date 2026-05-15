import type { FrameSource } from './FrameSource'

export type WebcamConstraints = {
  width?: number
  height?: number
  /** 'user' = ön kamera (laptop default), 'environment' = arka kamera (telefon) */
  facingMode?: 'user' | 'environment'
}

/**
 * Webcam'i FrameSource olarak sarar.
 * Verilen HTMLVideoElement'e MediaStream bağlar.
 *
 * Kullanım:
 *   const source = new WebcamSource(videoEl)
 *   await source.start()
 *   // ... videoEl artık canlı stream gösteriyor
 *   source.stop()  // cleanup şart
 */
export class WebcamSource implements FrameSource {
  private stream: MediaStream | null = null
  private active = false

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly constraints: WebcamConstraints = {},
  ) {}

  get isActive(): boolean {
    return this.active
  }

  async start(): Promise<void> {
    if (this.active) return

    const mediaConstraints: MediaStreamConstraints = {
      video: {
        width: this.constraints.width ?? 1280,
        height: this.constraints.height ?? 720,
        facingMode: this.constraints.facingMode ?? 'user',
      },
      audio: false,
    }

    this.stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    this.video.srcObject = this.stream
    await this.video.play()
    this.active = true
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    this.video.srcObject = null
    this.active = false
  }
}
