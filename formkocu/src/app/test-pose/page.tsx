'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

/**
 * MediaPipe Pose Landmarker iskelet bağlantı haritası.
 * 33 vücut noktası arasındaki anlamlı çizgileri tanımlar.
 * Referans: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  // Yüz
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Gövde
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Sol kol
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Sağ kol
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Sol bacak
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Sağ bacak
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
]

const MEDIAPIPE_VERSION = '0.10.35'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`

// Model seçimi: 'full' lite'tan daha hassas, heavy'den çok daha hafif.
// Karşılaştırma: lite (~3MB, ~15ms) / full (~6MB, ~25ms) / heavy (~26MB, ~50ms)
// Form analizinde joint pozisyon hassasiyeti kritik — full sweet spot.
// Docs: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task'

type Status = 'idle' | 'initializing' | 'ready' | 'error'

export default function TestPosePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const fpsCounterRef = useRef({ frames: 0, lastUpdate: 0 })

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        setStatus('initializing')

        // 1) MediaPipe Pose Landmarker hazırla
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        if (cancelled) return

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          // Threshold rasyoneli (MediaPipe önerileri + form analizi ihtiyacı):
          // - poseDetection (ilk tespit):  0.5 — yanlış pozitifleri eler
          // - posePresence (devamlılık):   0.5 — pose'un var olduğundan emin ol
          // - tracking (frame-arası):      0.3 — "sticky" tracking; kısa kapanmalarda kaybetme
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.3,
        })
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker

        // 2) Webcam stream'i al
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        // 3) Canvas boyutunu video'ya eşitle
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        setStatus('ready')
        renderLoop()
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
        setErrorMsg(msg)
        setStatus('error')
        console.error('[test-pose] init failed:', err)
      }
    }

    function renderLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current

      if (!video || !canvas || !landmarker) return
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(renderLoop)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const now = performance.now()

      const result = landmarker.detectForVideo(video, now)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Video CSS ile yatay flip ediliyor (selfie mantığı).
      // Canvas'ı da aynı şekilde flip et ki overlay video ile hizalı kalsın.
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)

      const hasPose = result.landmarks.length > 0
      if (hasPose) {
        const landmarks = result.landmarks[0]
        drawConnections(ctx, landmarks, canvas.width, canvas.height)
        drawLandmarks(ctx, landmarks, canvas.width, canvas.height)
      }
      ctx.restore()

      setDetected(hasPose)

      // FPS sayacı (saniyede bir güncellenir)
      fpsCounterRef.current.frames++
      if (now - fpsCounterRef.current.lastUpdate >= 1000) {
        setFps(fpsCounterRef.current.frames)
        fpsCounterRef.current.frames = 0
        fpsCounterRef.current.lastUpdate = now
      }

      rafRef.current = requestAnimationFrame(renderLoop)
    }

    init()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close()
        landmarkerRef.current = null
      }
    }
  }, [])

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Hello Pose
          </h1>
          <p className="text-neutral-400 mt-1">
            Hafta 1 kilometre taşı — webcam + MediaPipe canlı iskelet tespiti
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-neutral-800">
            Durum:{' '}
            <strong
              className={
                status === 'ready'
                  ? 'text-green-400'
                  : status === 'error'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }
            >
              {statusLabel(status)}
            </strong>
          </span>
          {status === 'ready' && (
            <>
              <span className="px-3 py-1 rounded-full bg-neutral-800">
                FPS: <strong>{fps}</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-800">
                Tespit:{' '}
                <strong className={detected ? 'text-green-400' : 'text-neutral-400'}>
                  {detected ? 'var' : 'yok'}
                </strong>
              </span>
            </>
          )}
        </div>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-neutral-800">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover -scale-x-100"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {status === 'initializing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85">
              <div className="text-center">
                <div className="text-xl mb-2">MediaPipe yükleniyor...</div>
                <div className="text-sm text-neutral-400">
                  İlk yüklemede WASM + model indirilir (~10 MB), 5-15 saniye sürebilir
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6">
              <div className="text-center max-w-md">
                <div className="text-xl mb-2 text-red-400">Hata</div>
                <div className="text-sm text-neutral-400 mb-4">{errorMsg}</div>
                <div className="text-xs text-neutral-500">
                  Olası sebepler: kamera izni reddedildi, kamera başka bir uygulama
                  tarafından kullanılıyor, veya tarayıcı desteklemiyor (Chrome/Firefox/Safari son sürüm gerekir).
                </div>
              </div>
            </div>
          )}
        </div>

        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-300 hover:text-white inline-flex items-center gap-2">
            <span>En iyi sonuç için ipuçları</span>
            <span className="text-xs text-neutral-500">(tıkla aç)</span>
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400 space-y-3">
            <div>
              <strong className="text-neutral-200">Aydınlatma:</strong> Yüzüne ve
              vücuduna eşit, yumuşak ışık. Lambayı yanına koy. Pencereye sırtın
              dönükse siluet olursun — tespit bozulur.
            </div>
            <div>
              <strong className="text-neutral-200">Mesafe:</strong> Kameradan 2-3
              metre. Baş üstünden ayak tabanına kadar tüm vücudun kareye sığsın.
            </div>
            <div>
              <strong className="text-neutral-200">Kıyafet:</strong> Hatları belli
              eden, çok bol olmayan giysiler. Bol pantolon ve geniş gömlek
              diz/kol açılarını yanıltır.
            </div>
            <div>
              <strong className="text-neutral-200">Arka plan:</strong> Sade ve
              hareketsiz. Arkanda yürüyen biri tespit edilen "ikinci kişi" olarak
              kafa karıştırabilir.
            </div>
            <div>
              <strong className="text-neutral-200">Kamera yüksekliği:</strong>
              Genelde kalça hizası ideal — tam vücut görsün yeter.
            </div>
            <div className="text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-800">
              Kullanılan model:{' '}
              <code className="text-neutral-400">pose_landmarker_full</code>{' '}
              (Google, Apache 2.0). 33 vücut noktası, ~25ms inference. GPU
              delegate kullanılır, yoksa otomatik CPU fallback.
            </div>
          </div>
        </details>

        <div className="mt-6 text-sm text-neutral-500">
          <p>
            <strong className="text-neutral-300">Doğrulama kriterleri (Hafta 1):</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>İskelet kameradaki vücudunu takip ediyor</li>
            <li>FPS ≥ 25 (modern donanımda 30+)</li>
            <li>Sayfa kapatılınca kamera ışığı sönüyor (cleanup çalışıyor)</li>
            <li>10 dakika açık tutulunca FPS düşmüyor (memory leak yok)</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

function statusLabel(s: Status): string {
  switch (s) {
    case 'idle':
      return 'beklemede'
    case 'initializing':
      return 'başlatılıyor'
    case 'ready':
      return 'hazır'
    case 'error':
      return 'hata'
  }
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
) {
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 3
  for (const [a, b] of POSE_CONNECTIONS) {
    const la = landmarks[a]
    const lb = landmarks[b]
    if (!la || !lb) continue
    if ((la.visibility ?? 0) < 0.5 || (lb.visibility ?? 0) < 0.5) continue
    ctx.beginPath()
    ctx.moveTo(la.x * w, la.y * h)
    ctx.lineTo(lb.x * w, lb.y * h)
    ctx.stroke()
  }
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
) {
  ctx.fillStyle = '#3b82f6'
  ctx.strokeStyle = '#1e3a8a'
  ctx.lineWidth = 1
  for (const l of landmarks) {
    if ((l.visibility ?? 0) < 0.5) continue
    ctx.beginPath()
    ctx.arc(l.x * w, l.y * h, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}
