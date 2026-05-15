import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/I18nProvider'
import { LocaleToggle } from '@/components/LocaleToggle'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gym Uncle — Free in-browser exercise form analysis',
  description:
    'Free, browser-based form analysis for bodyweight exercises. Privacy-first: video never leaves your device. Squat, push-up, biceps curl with real-time pose detection.',
  keywords: [
    'exercise form',
    'pose detection',
    'mediapipe',
    'squat',
    'push-up',
    'biceps curl',
    'workout',
    'fitness',
    'demo',
  ],
  openGraph: {
    title: 'Gym Uncle — Free exercise form analysis',
    description:
      'Browser-based form coach. No accounts, no subscriptions, no uploads.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <LocaleToggle className="fixed top-4 right-4 z-50" />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
