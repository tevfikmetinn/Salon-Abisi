'use client'

import Link from 'next/link'
import { listExercises } from '@/exercises'
import { useI18n } from '@/lib/i18n/I18nProvider'

function angleLabel(
  angle: 'side' | 'front' | 'three-quarter',
  t: ReturnType<typeof useI18n>['t'],
): string {
  switch (angle) {
    case 'side':
      return t.ui.home.sideView
    case 'front':
      return t.ui.home.frontView
    case 'three-quarter':
      return t.ui.home.threeQuarterView
  }
}

export default function Home() {
  const { t } = useI18n()
  const exercises = listExercises()

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs uppercase tracking-wider text-amber-300 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {t.demoBadge}
        </span>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          {t.brand}
        </h1>

        <p className="text-xl md:text-2xl text-neutral-200 mb-3 max-w-2xl">
          {t.ui.home.heroSub}
        </p>

        <p className="text-base text-neutral-400 mb-14 max-w-2xl">
          {t.ui.home.heroDesc}
        </p>

        <h2 className="text-sm uppercase tracking-wider text-neutral-500 mb-4">
          {t.ui.home.exercisesLabel}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => {
            const exInfo = t.exercises[ex.id]
            return (
              <Link
                key={ex.id}
                href={`/exercise/${ex.id}`}
                className="group block p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5"
              >
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-300 transition-colors">
                  {exInfo?.displayName ?? ex.id}
                </h3>
                <p className="text-sm text-neutral-400 mb-4">
                  {exInfo?.description ?? ''}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                    {angleLabel(ex.cameraSetup.angle, t)}
                  </span>
                  <span>{t.ui.home.rulesCount(ex.rules.length)}</span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-20 pt-10 border-t border-neutral-800 grid md:grid-cols-3 gap-6 text-sm text-neutral-400">
          <div>
            <h3 className="font-semibold text-neutral-200 mb-2">
              {t.ui.home.howItWorks}
            </h3>
            <p>{t.ui.home.howItWorksBody}</p>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-200 mb-2">
              {t.ui.home.privacy}
            </h3>
            <p>{t.ui.home.privacyBody}</p>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-200 mb-2">
              {t.ui.home.free}
            </h3>
            <p>
              {t.ui.home.freeBody}{' '}
              <Link
                href="/test-pose"
                className="text-blue-400 hover:underline"
              >
                {t.ui.home.poseDemo}
              </Link>
              .
            </p>
          </div>
        </div>

        <footer className="mt-16 pt-6 border-t border-neutral-900 text-xs text-neutral-600">
          {t.ui.home.footer}
        </footer>
      </div>
    </main>
  )
}
