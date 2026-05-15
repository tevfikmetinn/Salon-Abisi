import { EXERCISES } from '@/exercises'
import { ExerciseAnalyzerClient } from './Analyzer'

/**
 * Static export için gerekli — build sırasında bu fonksiyon tüm dinamik
 * route'ların ID'lerini döndürür, Next.js her biri için statik HTML üretir.
 */
export function generateStaticParams() {
  return Object.keys(EXERCISES).map((id) => ({ id }))
}

/**
 * Server component wrapper — sadece params'ı çözer ve client component'e geçer.
 * Tüm interaktif mantık Analyzer.tsx'te ('use client').
 */
export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ExerciseAnalyzerClient id={id} />
}
