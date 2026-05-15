import { describe, it, expect } from 'vitest'
import {
  angleBetweenVectors,
  angleAtVertex,
  angleFromVertical,
} from './angles'

describe('angleBetweenVectors', () => {
  it('paralel vektörler için 0° döner', () => {
    expect(angleBetweenVectors({ x: 1, y: 0 }, { x: 2, y: 0 })).toBeCloseTo(0)
  })

  it('dik vektörler için 90° döner', () => {
    expect(angleBetweenVectors({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90)
  })

  it('ters yönlü vektörler için 180° döner', () => {
    expect(angleBetweenVectors({ x: 1, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(180)
  })

  it('45° için doğru değer döner', () => {
    expect(angleBetweenVectors({ x: 1, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45)
  })

  it('sıfır vektör girilirse 0 döner (NaN üretmez)', () => {
    expect(angleBetweenVectors({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0)
    expect(angleBetweenVectors({ x: 1, y: 0 }, { x: 0, y: 0 })).toBe(0)
  })

  it('aynı yönde farklı büyüklük için 0° döner', () => {
    // Yön aynı, büyüklük fark eder
    expect(angleBetweenVectors({ x: 3, y: 4 }, { x: 6, y: 8 })).toBeCloseTo(0)
  })
})

describe('angleAtVertex', () => {
  it('dik açı senaryosu (90°)', () => {
    // A=(0,0), B=(1,0), C=(1,1) — B'deki açı 90°
    expect(
      angleAtVertex({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }),
    ).toBeCloseTo(90)
  })

  it('düz çizgi senaryosu (180°)', () => {
    expect(
      angleAtVertex({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }),
    ).toBeCloseTo(180)
  })

  it('eşkenar üçgen senaryosu (60°)', () => {
    const a = { x: 0, y: 0 }
    const b = { x: 1, y: 0 }
    const c = { x: 0.5, y: Math.sqrt(3) / 2 }
    expect(angleAtVertex(a, b, c)).toBeCloseTo(60)
  })

  it('squat: düz bacak senaryosu (~180°)', () => {
    // Kalça, diz, ayak bileği aynı düşeyde — bacak düz
    const hip = { x: 0.5, y: 0.3 }
    const knee = { x: 0.5, y: 0.6 }
    const ankle = { x: 0.5, y: 0.9 }
    expect(angleAtVertex(hip, knee, ankle)).toBeCloseTo(180)
  })

  it('squat: bükük bacak senaryosu (<180°)', () => {
    // Kalça yan tarafta, diz öne, ayak aşağıda — diz bükülü
    const hip = { x: 0.3, y: 0.5 }
    const knee = { x: 0.5, y: 0.6 }
    const ankle = { x: 0.5, y: 0.9 }
    const angle = angleAtVertex(hip, knee, ankle)
    expect(angle).toBeGreaterThan(90)
    expect(angle).toBeLessThan(180)
  })
})

describe('angleFromVertical', () => {
  it('tam yukarı yönü için 0°', () => {
    expect(angleFromVertical({ x: 0, y: -1 })).toBeCloseTo(0)
  })

  it('sağa yatay için 90°', () => {
    expect(angleFromVertical({ x: 1, y: 0 })).toBeCloseTo(90)
  })

  it('aşağı yön için 180°', () => {
    expect(angleFromVertical({ x: 0, y: 1 })).toBeCloseTo(180)
  })

  it('yukarı-sağ çapraz için 45°', () => {
    expect(angleFromVertical({ x: 1, y: -1 })).toBeCloseTo(45)
  })

  it('squat sırt eğimi: dik duruş (omuz - kalça vektörü yukarı)', () => {
    // Omuz yukarıda (küçük y), kalça aşağıda (büyük y)
    const shoulder = { x: 0.5, y: 0.3 }
    const hip = { x: 0.5, y: 0.5 }
    // "Up-spine" vektörü = omuz - kalça (yani yukarı doğru)
    const upSpine = { x: shoulder.x - hip.x, y: shoulder.y - hip.y }
    expect(angleFromVertical(upSpine)).toBeCloseTo(0)
  })

  it('squat sırt eğimi: öne eğilmiş (~45°)', () => {
    // Kalça (0.5, 0.5), omuz öne ve yukarıda (0.3, 0.3) — 45° öne eğim
    const shoulder = { x: 0.3, y: 0.3 }
    const hip = { x: 0.5, y: 0.5 }
    const upSpine = { x: shoulder.x - hip.x, y: shoulder.y - hip.y }
    expect(angleFromVertical(upSpine)).toBeCloseTo(45)
  })
})
