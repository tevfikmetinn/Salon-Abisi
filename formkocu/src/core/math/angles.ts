/**
 * 2D nokta veya vektör.
 */
export type Point2 = {
  x: number
  y: number
}

/**
 * İki vektör arasındaki açı, derece cinsinden.
 * Aralık: [0, 180]. Sıfır vektör girilirse 0 döner (NaN üretmez).
 */
export function angleBetweenVectors(a: Point2, b: Point2): number {
  const magA = Math.hypot(a.x, a.y)
  const magB = Math.hypot(b.x, b.y)
  if (magA === 0 || magB === 0) return 0

  const cos = (a.x * b.x + a.y * b.y) / (magA * magB)
  // Float aritmetik gürültüsü için clamp
  const clamped = Math.max(-1, Math.min(1, cos))
  return (Math.acos(clamped) * 180) / Math.PI
}

/**
 * B köşesindeki açı (A-B-C üçgeninde).
 * Yaygın "eklem açısı" hesabı.
 *
 * Örnek: diz açısı = angleAtVertex(hip, knee, ankle)
 *        dirsek açısı = angleAtVertex(shoulder, elbow, wrist)
 *
 * Aralık: [0, 180].
 */
export function angleAtVertex(a: Point2, b: Point2, c: Point2): number {
  const ba: Point2 = { x: a.x - b.x, y: a.y - b.y }
  const bc: Point2 = { x: c.x - b.x, y: c.y - b.y }
  return angleBetweenVectors(ba, bc)
}

/**
 * Bir vektörün dikey eksene göre açısı, derece cinsinden.
 * Dikey: (0, -1) yönü — image coordinates'ta "yukarı".
 *
 * Kullanım: "sırt eğimi" gibi torso-vertical hesaplamaları.
 * Vektör (omuz - kalça) olarak verilirse, vücut dikse 0°, yere paralelse 90°.
 *
 * Aralık: [0, 180].
 */
export function angleFromVertical(v: Point2): number {
  return angleBetweenVectors(v, { x: 0, y: -1 })
}
