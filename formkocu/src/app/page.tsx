import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <span className="inline-block px-3 py-1 rounded-full bg-neutral-800 text-xs uppercase tracking-wide text-neutral-300 mb-6">
          Geliştirme aşamasında — Hafta 1
        </span>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          FormKoçu
        </h1>

        <p className="text-xl md:text-2xl text-neutral-300 mb-4 max-w-2xl">
          Spora yeni başlayanlara, kameralarıyla doğru egzersiz formunu öğreten
          ücretsiz web uygulaması.
        </p>

        <p className="text-base text-neutral-400 mb-12 max-w-2xl">
          Video sunucuya gönderilmez — her şey tarayıcıda çalışır. Kayıt yok,
          abonelik yok.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/test-pose"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-white text-neutral-950 font-medium hover:bg-neutral-200 transition-colors"
          >
            Test sayfasını aç
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-neutral-700 text-neutral-300 hover:border-neutral-500 transition-colors"
          >
            GitHub
          </a>
        </div>

        <div className="mt-20 pt-10 border-t border-neutral-800 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-semibold text-neutral-200 mb-2">Hafta 1 Hedefi</h3>
            <p className="text-neutral-400">
              Webcam + MediaPipe ile canlı iskelet tespiti. <code>/test-pose</code>{' '}
              sayfasında test edilebilir.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-200 mb-2">MVP Egzersizleri</h3>
            <p className="text-neutral-400">
              Bodyweight squat, push-up, dambıl biceps curl. Her biri için
              biyomekanik temelli 6 kural.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-200 mb-2">Teknoloji</h3>
            <p className="text-neutral-400">
              Next.js 16 + React 19 + MediaPipe Tasks Vision + TypeScript strict.
              %100 client-side.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
