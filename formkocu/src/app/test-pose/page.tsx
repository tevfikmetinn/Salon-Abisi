'use client'

import { useEffect, useRef, useState } from 'react'
import { MediaPipePoseDetector } from '@/core/pose-detection/MediaPipePoseDetector'
import { WebcamSource } from '@/core/frame-source/WebcamSource'
import { VideoFileSource } from '@/core/frame-source/VideoFileSource'
import { useI18n } from '@/lib/i18n/I18nProvider'
import type { PoseDetector } from '@/core/pose-detection/PoseDetector'
import type { FrameSource } from '@/core/frame-source/FrameSource'
import type { PoseLandmark } from '@/core/pose-detection/types'

const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
]

type Mode = 'webcam' | 'video'
type Status = 'idle' | 'initializing' | 'ready' | 'error'

export default function TestPosePage() {
  const { t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const sourceRef = useRef<FrameSource | null>(null)
  const rafRef = useRef<number>(0)
  const fpsCounterRef = useRef({ frames: 0, lastUpdate: 0 })

  const [mode, setMode] = useState<Mode>('webcam')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        setErrorMsg(null)
        setStatus('initializing')

        const detector =
          detectorRef.current ?? new MediaPipePoseDetector()
        if (!detector.isReady) {
          await detector.initialize()
        }
        if (cancelled) {
          detector.dispose()
          return
        }
        detectorRef.current = detector

        const video = videoRef.current
        if (!video) return

        let source: FrameSource
        if (mode === 'webcam') {
          source = new WebcamSource(video)
          await source.start()
        } else {
          if (!videoFile) {
            setStatus('idle')
            return
          }
          const fileSource = new VideoFileSource(video)
          await fileSource.load(videoFile)
          await fileSource.start()
          source = fileSource
        }

        if (cancelled) {
          source.stop()
          return
        }
        sourceRef.current = source

        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        setStatus('ready')
        renderLoop()
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setErrorMsg(msg)
        setStatus('error')
        console.error('[test-pose] init failed:', err)
      }
    }

    function renderLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current
      const detector = detectorRef.current

      if (!video || !canvas || !detector) return
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(renderLoop)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const now = performance.now()

      const frame = detector.detect(video, now)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const shouldMirror = mode === 'webcam'
      if (shouldMirror) {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)
      }

      const posePresent = frame.landmarks !== null
      if (frame.landmarks) {
        drawConnections(ctx, frame.landmarks, canvas.width, canvas.height)
        drawLandmarks(ctx, frame.landmarks, canvas.width, canvas.height)
      }

      if (shouldMirror) ctx.restore()

      setDetected(posePresent)

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
      if (sourceRef.current) {
        sourceRef.current.stop()
        sourceRef.current = null
      }
      if (detectorRef.current) {
        detectorRef.current.dispose()
        detectorRef.current = null
      }
    }
  }, [mode, videoFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      setMode('video')
    }
  }

  const handleSwitchToWebcam = () => {
    setVideoFile(null)
    setMode('webcam')
  }

  const statusLabels: Record<Status, string> = {
    idle: t.ui.testPose.statusIdle,
    initializing: t.ui.testPose.statusInit,
    ready: t.ui.testPose.statusReady,
    error: t.ui.testPose.statusError,
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto pr-16">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t.ui.testPose.title}
          </h1>
          <p className="text-neutral-400 mt-1">{t.ui.testPose.subtitle}</p>
        </header>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={handleSwitchToWebcam}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
              mode === 'webcam'
                ? 'bg-white text-neutral-950'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {t.ui.testPose.modeWebcam}
          </button>
          <label
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
              mode === 'video'
                ? 'bg-white text-neutral-950'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {t.ui.testPose.modeVideo}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {mode === 'video' && videoFile && (
            <span className="px-3 py-2 text-xs text-neutral-400 truncate max-w-xs">
              {videoFile.name}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <span className="px-3 py-1 rounded-full bg-neutral-800">
            {t.ui.testPose.status}:{' '}
            <strong
              className={
                status === 'ready'
                  ? 'text-green-400'
                  : status === 'error'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }
            >
              {statusLabels[status]}
            </strong>
          </span>
          {status === 'ready' && (
            <>
              <span className="px-3 py-1 rounded-full bg-neutral-800">
                {t.ui.testPose.fps}: <strong>{fps}</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-neutral-800">
                {t.ui.testPose.detected}:{' '}
                <strong
                  className={detected ? 'text-green-400' : 'text-neutral-400'}
                >
                  {detected ? t.ui.testPose.yes : t.ui.testPose.no}
                </strong>
              </span>
            </>
          )}
        </div>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-neutral-800 shadow-2xl">
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${
              mode === 'webcam' ? '-scale-x-100' : ''
            }`}
            playsInline
            muted
            loop={mode === 'video'}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {status === 'idle' && mode === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85">
              <div className="text-center text-neutral-400 px-6">
                {t.ui.testPose.videoUploadHint}
              </div>
            </div>
          )}

          {status === 'initializing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85">
              <div className="text-center">
                <div className="text-xl mb-2">
                  {t.ui.exercise.mediapipeLoading}
                </div>
                <div className="text-sm text-neutral-400">
                  {t.ui.exercise.mediapipeLoadingHint}
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6">
              <div className="text-center max-w-md">
                <div className="text-xl mb-2 text-red-400">Error</div>
                <div className="text-sm text-neutral-400 mb-4">{errorMsg}</div>
              </div>
            </div>
          )}
        </div>

        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-300 hover:text-white inline-flex items-center gap-2">
            <span>{t.ui.testPose.tipsTitle}</span>
            <span className="text-xs text-neutral-500">
              {t.ui.testPose.tipsClickHint}
            </span>
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-400 space-y-3">
            <div>{t.ui.testPose.tipsLighting}</div>
            <div>{t.ui.testPose.tipsDistance}</div>
            <div>{t.ui.testPose.tipsClothing}</div>
            <div>{t.ui.testPose.tipsBackground}</div>
            <div>{t.ui.testPose.tipsCameraHeight}</div>
            <div className="text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-800">
              {t.ui.testPose.tipsModel}
            </div>
          </div>
        </details>
      </div>
    </main>
  )
}

function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  w: number,
  h: number,
) {
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 3
  for (const [a, b] of POSE_CONNECTIONS) {
    const la = landmarks[a]
    const lb = landmarks[b]
    if (!la || !lb) continue
    if (la.visibility < 0.5 || lb.visibility < 0.5) continue
    ctx.beginPath()
    ctx.moveTo(la.x * w, la.y * h)
    ctx.lineTo(lb.x * w, lb.y * h)
    ctx.stroke()
  }
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  w: number,
  h: number,
) {
  ctx.fillStyle = '#3b82f6'
  for (const l of landmarks) {
    if (l.visibility < 0.5) continue
    ctx.beginPath()
    ctx.arc(l.x * w, l.y * h, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}
