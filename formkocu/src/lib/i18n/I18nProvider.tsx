'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getMessages, type Locale, type Messages } from './messages'

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Messages
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'gymuncle.locale'

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'tr') return stored
  } catch {
    // localStorage erişimi başarısız (private mode vb.)
  }
  // Tarayıcı dil tercihinden otomatik seçim
  const lang = window.navigator.language?.toLowerCase() ?? ''
  if (lang.startsWith('tr')) return 'tr'
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [hydrated, setHydrated] = useState(false)

  // Hydration sonrası gerçek locale'i set et (SSR safe)
  useEffect(() => {
    setLocaleState(detectInitialLocale())
    setHydrated(true)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
  }

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: getMessages(locale),
  }

  return (
    <I18nContext.Provider value={value}>
      <div data-hydrated={hydrated ? 'true' : 'false'}>{children}</div>
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}

export function useT(): Messages {
  return useI18n().t
}
