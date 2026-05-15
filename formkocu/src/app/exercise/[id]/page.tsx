'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MediaPipePoseDetector } from '@/core/pose-detection/MediaPipePoseDetector'
import { WebcamSource } from '@/core/frame-source/WebcamSource'
import { ExerciseSession } from '@/core/exercise-engine/ExerciseSession'
import { getExercise } from '@/exercises'
import { useI18n } from '@/lib/i18n/I18nProvider'
import type { PoseDetector } from '@/core/pose-detection/PoseDetector'
import type { FrameSource } from '@/core/frame-source/FrameSource'
import type { PoseLandmark } from '@/core/pose-detection/types'
import type {
  ExerciseDefinition,
  RepSummary,
  Severity,
} from '@/core/exercise-engine/types'
import type { Messages } from '@/lib/i18n/messages'

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

type Status = 'initializing' | 'ready' | 'error'

export default function ExercisePage() {
  const params = useParams<{ id: string }>()
  const exercise = getExercise(params.id)
  const { t } = useI18n()

  if (!exercise) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold">{t.ui.exercise.notFound}</h1>
          <p className="text-neutral-400 mt-2">
            {t.ui.exercise.notFoundDesc(params.id)}
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-sm text-blue-400 hover:underline"
          >
            ← {t.ui.exercise.backHome}
          </Link>
        </div>
      </main>
    )
  }

  return <ExerciseAnalyzer exercise={exercise} t={t} />
}

function ExerciseAnalyzer({
  exercise,
  t,
}: {
  exercise: ExerciseDefinition
  t: Messages
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const sourceRef = useRef<FrameSource | null>(null)
  const sessionRef = useRef<ExerciseSession | null>(null)
  const rafRef = useRef<number>(0)

  const [status, setStatus] = useState<Status>('initializing')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [repCount, setRepCount] = useState(0)
  const [currentState, setCurrentState] = useState<'REST' | 'PEAK'>('REST')
  const [primaryAngle, setPrimaryAngle] = useState<number | null>(null)
  const [lastRep, setLastRep] = useState<RepSummary | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [allSummaries, setAllSummaries] = useState<RepSummary[]>([])
  const [poseDetected, setPoseDetected] = useState(false)

  const exInfo = t.exercises[exercise.id]

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        setStatus('initializing')

        const detector = new MediaPipePoseDetector()
        await detector.initialize()
        if (cancelled) {
          detector.dispose()
          return
        }
        detectorRef.current = detector

        const video = videoRef.current
        if (!video) return

        const source = new WebcamSource(video)
        await source.start()
        if (cancelled) {
          source.stop()
          return
        }
        sourceRef.current = source

        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        sessionRef.current = new ExerciseSession(exercise)
        setStatus('ready')
        renderLoop()
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setErrorMsg(msg)
        setStatus('error')
        console.error('[exercise] init failed:', err)
      }
    }

    function renderLoop() {
      const video = videoRef.current
      const canvas = canvasRef.current
      const detector = detectorRef.current
      const session = sessionRef.current

      if (!video || !canvas || !detector || !session) return
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(renderLoop)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const now = performance.now()

      const frame = detector.detect(video, now)
      const result = session.tick(frame)

      setRepCount((prev) => (prev !== result.repCount ? result.repCount : prev))
      setCurrentState((prev) => (prev !== result.state ? result.state : prev))
      setPrimaryAngle(result.primaryAngle)
      setPoseDetected(frame.landmarks !== null)
      if (result.lastRepSummary) {
        setLastRep(result.lastRepSummary)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)
      if (frame.landmarks) {
        drawConnections(ctx, frame.landmarks, canvas.width, canvas.height)
        drawLandmarks(ctx, frame.landmarks, canvas.width, canvas.height)
      }
      ctx.restore()

      rafRef.current = requestAnimationFrame(renderLoop)
    }

    init()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      sourceRef.current?.stop()
      sourceRef.current = null
      detectorRef.current?.dispose()
      detectorRef.current = null
      sessionRef.current = null
    }
  }, [exercise])

  const handleFinish = () => {
    if (sessionRef.current) {
      setAllSummaries([...sessionRef.current.summaries])
    }
    setShowSummary(true)
  }

  const handleNewSet = () => {
    sessionRef.current?.reset()
    setRepCount(0)
    setCurrentState('REST')
    setLastRep(null)
    setShowSummary(false)
    setAllSummaries([])
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-start justify-between gap-4 pr-24">
          <div>
            <Link
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ← {t.ui.exercise.back}
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
              {exInfo?.displayName ?? exercise.id}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              {exInfo?.tagline ?? ''}
            </p>
          </div>
          {repCount > 0 && !showSummary && (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-full bg-white text-neutral-950 text-sm font-medium hover:bg-neutral-200 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {t.ui.exercise.finishSet}
            </button>
          )}
        </header>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-neutral-800 shadow-2xl">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 z-20">
                <div className="text-center max-w-md">
                  <div className="text-xl mb-2 text-red-400">
                    {t.ui.exercise.error}
                  </div>
                  <div className="text-sm text-neutral-400">{errorMsg}</div>
                </div>
              </div>
            )}

            {status === 'ready' && !poseDetected && (
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="px-4 py-2 rounded-lg bg-yellow-500/90 text-yellow-950 text-sm backdrop-blur shadow-lg">
                  {t.ui.exercise.cantSee}
                </div>
              </div>
            )}

            {status === 'ready' && poseDetected && (
              <div className="absolute top-4 right-4 z-10">
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur shadow-lg transition-colors ${
                    currentState === 'PEAK'
                      ? 'bg-blue-500/90 text-blue-950'
                      : 'bg-green-500/90 text-green-950'
                  }`}
                >
                  ●{' '}
                  {currentState === 'PEAK'
                    ? t.ui.exercise.statePeak
                    : t.ui.exercise.stateRest}
                </div>
              </div>
            )}

            {showSummary && (
              <SetSummary
                summaries={allSummaries}
                exerciseName={exInfo?.displayName ?? exercise.id}
                onNewSet={handleNewSet}
                t={t}
              />
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-lg">
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                {t.ui.exercise.reps}
              </div>
              <div className="text-7xl font-bold tabular-nums leading-none">
                {repCount}
              </div>
              {primaryAngle !== null && (
                <div className="text-xs text-neutral-500 mt-3 font-mono">
                  {t.ui.exercise.angle}: {primaryAngle.toFixed(0)}°
                </div>
              )}
            </div>

            {lastRep && (
              <div
                className={`rounded-xl border p-4 transition-all ${
                  lastRep.isClean
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
                  {t.ui.exercise.lastRep} (#{lastRep.repNumber})
                </div>
                {lastRep.isClean ? (
                  <div className="text-sm text-green-200">
                    {t.ui.exercise.goodForm} ✓
                  </div>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {lastRep.violations.map((v, i) => (
                      <li
                        key={i}
                        className={
                          v.severity === 'red'
                            ? 'text-red-200'
                            : 'text-amber-200'
                        }
                      >
                        <span className="font-medium">
                          {v.severity === 'red' ? '✗' : '⚠'}
                        </span>{' '}
                        {t.rules[v.messageKey] ?? v.messageKey}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
                {t.ui.exercise.cameraTips}
              </div>
              <ul className="text-sm text-neutral-300 space-y-1.5">
                {(exInfo?.instructions ?? []).map((inst, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-neutral-500">·</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function SetSummary({
  summaries,
  exerciseName,
  onNewSet,
  t,
}: {
  summaries: RepSummary[]
  exerciseName: string
  onNewSet: () => void
  t: Messages
}) {
  const totalReps = summaries.length
  const cleanReps = summaries.filter((s) => s.isClean).length
  const score = totalReps === 0 ? 0 : Math.round((cleanReps / totalReps) * 100)

  const violationCounts: Record<
    string,
    { count: number; messageKey: string; severity: Severity }
  > = {}
  for (const s of summaries) {
    for (const v of s.violations) {
      const existing = violationCounts[v.ruleId]
      if (existing) {
        existing.count++
      } else {
        violationCounts[v.ruleId] = {
          count: 1,
          messageKey: v.messageKey,
          severity: v.severity,
        }
      }
    }
  }
  const topViolation = Object.entries(violationCounts).sort(
    ([, a], [, b]) => b.count - a.count,
  )[0]

  return (
    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md flex items-center justify-center p-4 z-30 overflow-auto">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl p-6 border border-neutral-700 shadow-2xl">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
          {t.ui.exercise.setSummary}
        </div>
        <h2 className="text-2xl font-bold mb-1">{exerciseName}</h2>

        <div className="my-6 flex items-end gap-3">
          <div className="text-6xl font-bold tabular-nums">{score}</div>
          <div className="pb-2 text-sm text-neutral-500">/ 100</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-neutral-800/50">
            <div className="text-xs text-neutral-500">
              {t.ui.exercise.totalReps}
            </div>
            <div className="text-2xl font-bold">{totalReps}</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-800/50">
            <div className="text-xs text-neutral-500">
              {t.ui.exercise.cleanReps}
            </div>
            <div className="text-2xl font-bold text-green-400">{cleanReps}</div>
          </div>
        </div>

        {topViolation && (
          <div
            className={`p-4 rounded-lg mb-5 ${
              topViolation[1].severity === 'red'
                ? 'bg-red-500/10 border border-red-500/30 text-red-200'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="text-xs uppercase tracking-wide opacity-70 mb-1">
              {t.ui.exercise.mostCommon(topViolation[1].count)}
            </div>
            <div className="text-sm">
              {t.rules[topViolation[1].messageKey] ?? topViolation[1].messageKey}
            </div>
          </div>
        )}

        {!topViolation && totalReps > 0 && (
          <div className="p-4 rounded-lg mb-5 bg-green-500/10 border border-green-500/30 text-green-200 text-sm">
            {t.ui.exercise.perfectSet}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onNewSet}
            className="w-full h-11 rounded-full bg-white text-neutral-950 font-medium hover:bg-neutral-200 transition-all duration-200 hover:scale-[1.02]"
          >
            {t.ui.exercise.newSet}
          </button>
          <Link
            href="/"
            className="w-full h-11 rounded-full border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-900 flex items-center justify-center text-sm transition-all"
          >
            {t.ui.exercise.changeExercise}
          </Link>
        </div>
      </div>
    </div>
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
