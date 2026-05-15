import { describe, it, expect } from 'vitest'
import { ExerciseSession } from './ExerciseSession'
import { squatDefinition } from '@/exercises/squat'
import { curlDefinition } from '@/exercises/curl'
import { pushupDefinition } from '@/exercises/pushup'
import type { PoseFrame, PoseLandmark } from '@/core/pose-detection/types'

function fakeLandmark(x: number, y: number, visibility = 1): PoseLandmark {
  return { x, y, z: 0, visibility }
}

/**
 * Squat için sahte landmark: knee açısı parametrik.
 * Ayak bileğini sabit (0.7, 0.9), kalçayı ve dizi açıya göre yerleştir.
 *
 * Düz bacak (180°): hip (0.5, 0.4), knee (0.5, 0.65), ankle (0.5, 0.9)
 * Eğik bacak: hip ile ankle arası bend açısı.
 */
function squatLandmarks(kneeAngleDeg: number): PoseLandmark[] {
  const arr: PoseLandmark[] = []
  for (let i = 0; i < 33; i++) arr.push(fakeLandmark(0.5, 0.5))

  const ankleX = 0.5,
    ankleY = 0.9
  const kneeX = 0.5,
    kneeY = 0.65

  // (knee→ankle) = (0, 0.25) in image coords. (knee→hip) = rotation of (knee→ankle)
  // by kneeAngleDeg (CCW). Rotation matrix:
  //   [cos -sin] [akx]
  //   [sin  cos] [aky]
  const angleRad = (kneeAngleDeg * Math.PI) / 180
  const akx = 0,
    aky = 0.25
  const hx = akx * Math.cos(angleRad) - aky * Math.sin(angleRad)
  const hy = akx * Math.sin(angleRad) + aky * Math.cos(angleRad)
  const hipX = kneeX + hx
  const hipY = kneeY + hy

  arr[23] = fakeLandmark(hipX, hipY) // LEFT_HIP
  arr[24] = fakeLandmark(hipX, hipY) // RIGHT_HIP
  arr[25] = fakeLandmark(kneeX, kneeY) // LEFT_KNEE
  arr[26] = fakeLandmark(kneeX, kneeY) // RIGHT_KNEE
  arr[27] = fakeLandmark(ankleX, ankleY) // LEFT_ANKLE
  arr[28] = fakeLandmark(ankleX, ankleY) // RIGHT_ANKLE

  return arr
}

/**
 * Curl için sahte landmark: dirsek açısı parametrik (sol kolda).
 */
function curlLandmarks(elbowAngleDeg: number): PoseLandmark[] {
  const arr: PoseLandmark[] = []
  for (let i = 0; i < 33; i++) arr.push(fakeLandmark(0.5, 0.5, 0.3))

  // Omuz ve dirsek sabit
  const shoulderX = 0.5,
    shoulderY = 0.3
  const elbowX = 0.5,
    elbowY = 0.5
  // Bilek pozisyonu: dirsek açısına göre. Dirsek-bilek vektörü ile dirsek-omuz vektörü
  // arasındaki açı elbowAngleDeg olmalı.
  const elbowShoulderAngle = -Math.PI / 2 // elbow → shoulder = (-Y) yukarı
  const angleRad = (elbowAngleDeg * Math.PI) / 180
  const elbowWristAngle = elbowShoulderAngle + angleRad
  const wristDist = 0.2
  const wristX = elbowX + wristDist * Math.cos(elbowWristAngle)
  const wristY = elbowY + wristDist * Math.sin(elbowWristAngle)

  arr[11] = fakeLandmark(shoulderX, shoulderY)
  arr[12] = fakeLandmark(0.6, 0.3, 0.3) // sağ omuz pasif
  arr[13] = fakeLandmark(elbowX, elbowY)
  arr[14] = fakeLandmark(0.6, 0.5, 0.3) // sağ dirsek pasif
  arr[15] = fakeLandmark(wristX, wristY)
  arr[16] = fakeLandmark(0.6, 0.7, 0.3) // sağ bilek pasif

  return arr
}

function makeFrame(landmarks: PoseLandmark[], frameIndex: number): PoseFrame {
  return {
    landmarks,
    timestamp: frameIndex * (1000 / 30),
  }
}

/** Squat döngüsü: 180° → 90° → 180° */
function squatCycle(): PoseFrame[] {
  const frames: PoseFrame[] = []
  let idx = 0

  // 10 frame REST (düz bacak)
  for (let i = 0; i < 10; i++) {
    frames.push(makeFrame(squatLandmarks(180), idx++))
  }
  // 15 frame iniş (180 → 90)
  for (let i = 1; i <= 15; i++) {
    const angle = 180 - (90 * i) / 15
    frames.push(makeFrame(squatLandmarks(angle), idx++))
  }
  // 5 frame dipte (90°)
  for (let i = 0; i < 5; i++) {
    frames.push(makeFrame(squatLandmarks(90), idx++))
  }
  // 15 frame kalkış (90 → 180)
  for (let i = 1; i <= 15; i++) {
    const angle = 90 + (90 * i) / 15
    frames.push(makeFrame(squatLandmarks(angle), idx++))
  }
  // 5 frame son REST
  for (let i = 0; i < 5; i++) {
    frames.push(makeFrame(squatLandmarks(180), idx++))
  }
  return frames
}

describe('ExerciseSession (squat)', () => {
  it('başlangıçta REST, rep 0', () => {
    const session = new ExerciseSession(squatDefinition)
    expect(session.currentState).toBe('REST')
    expect(session.reps).toBe(0)
  })

  it('tek tam squat döngüsü = 1 rep', () => {
    const session = new ExerciseSession(squatDefinition)
    for (const frame of squatCycle()) session.tick(frame)
    expect(session.reps).toBe(1)
    expect(session.currentState).toBe('REST')
  })

  it('3 ardışık döngü = 3 rep', () => {
    const session = new ExerciseSession(squatDefinition)
    for (let r = 0; r < 3; r++) {
      for (const frame of squatCycle()) session.tick(frame)
    }
    expect(session.reps).toBe(3)
  })

  it('düz bacak hareketsizliği rep saymaz', () => {
    const session = new ExerciseSession(squatDefinition)
    for (let i = 0; i < 60; i++) {
      session.tick(makeFrame(squatLandmarks(178), i))
    }
    expect(session.reps).toBe(0)
  })

  it('derin squat → derinlik kuralı yeşil (no violation)', () => {
    const session = new ExerciseSession(squatDefinition)
    for (const frame of squatCycle()) session.tick(frame)
    const lastRep = session.summaries[0]
    expect(lastRep.violations.length).toBe(0)
    expect(lastRep.isClean).toBe(true)
  })

  it('yarım squat → derinlik kuralı sarı veya kırmızı', () => {
    const session = new ExerciseSession(squatDefinition)
    let idx = 0
    // 10 REST
    for (let i = 0; i < 10; i++) session.tick(makeFrame(squatLandmarks(180), idx++))
    // İniş ama sadece 130'a kadar (sığ)
    for (let i = 1; i <= 10; i++) {
      const angle = 180 - (50 * i) / 10
      session.tick(makeFrame(squatLandmarks(angle), idx++))
    }
    // 5 frame dipte (130°)
    for (let i = 0; i < 5; i++) session.tick(makeFrame(squatLandmarks(130), idx++))
    // Kalkış
    for (let i = 1; i <= 10; i++) {
      const angle = 130 + (50 * i) / 10
      session.tick(makeFrame(squatLandmarks(angle), idx++))
    }
    // 5 REST
    for (let i = 0; i < 5; i++) session.tick(makeFrame(squatLandmarks(180), idx++))

    expect(session.reps).toBe(1)
    const lastRep = session.summaries[0]
    expect(lastRep.violations.length).toBeGreaterThan(0)
    expect(['yellow', 'red']).toContain(lastRep.violations[0].severity)
  })

  it('null landmarks state değiştirmez', () => {
    const session = new ExerciseSession(squatDefinition)
    session.tick({ landmarks: null, timestamp: 0 })
    expect(session.currentState).toBe('REST')
    expect(session.reps).toBe(0)
  })

  it('reset() oturumu temizler', () => {
    const session = new ExerciseSession(squatDefinition)
    for (const frame of squatCycle()) session.tick(frame)
    expect(session.reps).toBe(1)
    session.reset()
    expect(session.reps).toBe(0)
    expect(session.currentState).toBe('REST')
    expect(session.summaries.length).toBe(0)
  })
})

describe('ExerciseSession (curl)', () => {
  it('tam curl döngüsü = 1 rep', () => {
    const session = new ExerciseSession(curlDefinition)
    let idx = 0
    // 10 REST (180°)
    for (let i = 0; i < 10; i++) session.tick(makeFrame(curlLandmarks(180), idx++))
    // Lifting (180 → 50)
    for (let i = 1; i <= 15; i++) {
      const angle = 180 - (130 * i) / 15
      session.tick(makeFrame(curlLandmarks(angle), idx++))
    }
    // 5 PEAK
    for (let i = 0; i < 5; i++) session.tick(makeFrame(curlLandmarks(50), idx++))
    // Lowering (50 → 180)
    for (let i = 1; i <= 15; i++) {
      const angle = 50 + (130 * i) / 15
      session.tick(makeFrame(curlLandmarks(angle), idx++))
    }
    // 5 REST
    for (let i = 0; i < 5; i++) session.tick(makeFrame(curlLandmarks(180), idx++))

    expect(session.reps).toBe(1)
  })
})

describe('ExerciseSession (pushup definition)', () => {
  it('plugin doğru kayıtlı', () => {
    expect(pushupDefinition.id).toBe('pushup')
    expect(pushupDefinition.rules.length).toBeGreaterThan(0)
  })
})
