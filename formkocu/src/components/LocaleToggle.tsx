'use client'

import { useI18n } from '@/lib/i18n/I18nProvider'

/**
 * Locale toggle — her sayfada üst sağda görünür.
 * Mobile'da kompakt, desktop'ta daha belirgin.
 */
export function LocaleToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  const next = locale === 'en' ? 'tr' : 'en'

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={`Switch to ${next.toUpperCase()}`}
      className={`inline-flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[10px] md:text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-600 backdrop-blur transition-all duration-200 hover:scale-105 ${className}`}
    >
      <span className={locale === 'en' ? 'text-white' : 'text-neutral-500'}>
        EN
      </span>
      <span className="text-neutral-700">/</span>
      <span className={locale === 'tr' ? 'text-white' : 'text-neutral-500'}>
        TR
      </span>
    </button>
  )
}
