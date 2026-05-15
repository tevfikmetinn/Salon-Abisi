# 04 — Teknoloji Yığını

Her seçim için: **ne, neden, alternatif, karar gerekçesi.** Hiçbir seçim "popüler olduğu için" alınmadı.

---

## Framework: Next.js 14 (App Router)

**Ne:** React tabanlı, full-stack framework. Server components, file-based routing, built-in optimization.

**Neden:**
- Landing page için SEO/SSR gerekli (Google'da bulunmak istersen)
- App Router modern React patterns (Server Components, Streaming) — 2026'da güncel
- Vercel ile sıfır config deploy
- Türkiye dahil global mühendislik pazarında en yaygın React framework — CV değeri yüksek

**Alternatif:** Vite + React (saf SPA)
- Avantaj: daha hafif, basit
- Dezavantaj: Landing page SEO için ekstra iş, deployment biraz daha manual

**Karar:** Next.js. SEO + deploy kolaylığı + CV değeri birlikte ağır basıyor.

**Sürüm hedefi:** Next.js 14+ (App Router stable). 15 çıkmışsa o da olur, ama LTS'i tercih edelim.

---

## Computer Vision: MediaPipe Tasks Vision

**Paket:** `@mediapipe/tasks-vision`

**Ne:** Google'ın açık kaynak ML kütüphanesi. Browser'da WebAssembly ile çalışır.

**Neden:**
- **33 vücut noktası** (MoveNet 17, BlazePose 33 ile aynı kalite)
- WebAssembly → CPU'da bile hızlı, GPU varsa daha hızlı (WebGL backend)
- **Lisans:** Apache 2.0 — ticari kullanım, modifikasyon, distribute hepsi serbest
- Google sürdürüyor → uzun ömürlü, sürekli güncelleniyor
- Yan profil pose tahmininde MoveNet'ten daha güvenilir (deneme ile gözlemlenecek ama community konsensüsü)

**Alternatifler:**
- **TensorFlow.js MoveNet:** 17 keypoint, daha az detay
- **TensorFlow.js BlazePose:** 33 keypoint, MediaPipe ile aynı altyapı ama TF.js wrapper
- **OpenPose:** masaüstü/server odaklı, browser'a uygun değil
- **YOLOv8-pose / YOLOv11-pose:** Modern, hassas. ONNX Runtime ile browser'da çalışabilir ama setup karmaşık.

**Karar:** MediaPipe Tasks Vision — en kolay browser entegrasyonu + yeterli hassasiyet.

**Model varyantı:** Pose Landmarker `full` (lite ve heavy arasında). Sebep: Form analizinde joint pozisyon hassasiyeti kritik. `lite` (~3MB, ~15ms inference) test için OK ama küçük gürültü; `heavy` (~26MB, ~50ms) overkill. `full` (~6MB, ~25ms) **accuracy/speed sweet spot**. v2'de kullanıcı seçimi olarak heavy eklenebilir (yüksek performans cihazları için), zayıf cihazlar için lite fallback.

**Threshold ayarları:**
- `minPoseDetectionConfidence: 0.5` — ilk tespit, yanlış pozitiflere karşı koruyucu
- `minPosePresenceConfidence: 0.5` — pose devamlılığı
- `minTrackingConfidence: 0.3` — "sticky" tracking, kısa süreli kapanmalarda pose kaybetme

**Delegate:** GPU (otomatik CPU fallback). Modern tarayıcıların hepsi destekler.

---

## State Management: Zustand

**Paket:** `zustand`

**Ne:** Minimal global state kütüphanesi. ~1KB, sıfır boilerplate.

**Neden:**
- Real-time stream verisi için Redux abartı, Context API yavaş
- React 18 concurrent mode ile uyumlu (`useSyncExternalStore` üzerine yapılı)
- Subscribe selector pattern ile yalnızca ilgili state değiştiğinde re-render
- TypeScript-first API

**Alternatifler:**
- **Redux Toolkit:** boilerplate, bu boyuttaki proje için aşırı
- **Jotai:** atom tabanlı, kötü değil ama Zustand daha basit
- **React Context:** her güncellemede tüm consumer re-render olur, real-time için kötü

**Karar:** Zustand.

---

## UI Komponentleri: shadcn/ui + Radix UI

**Ne:** Kopyala-yapıştır komponent kitliği. Bağımlılık değil — kodu projeye kopyalarsın, sahibi olursun.

**Neden:**
- 2026'da hâlâ en sevilen yaklaşım: vendoring (paket değil, kod sahipliği)
- Erişilebilirlik (a11y) sıfırdan yapılmış — Radix tabanlı, klavye + screen reader uyumlu
- Tailwind ile tam uyumlu
- Modern tasarım dili (recruiterlar görür görmez "polished" der)

**Alternatifler:**
- **MUI / Material UI:** geniş ama bundle büyük + opinionated tasarım
- **Chakra UI:** iyi ama 2026'da momentum kaybı
- **Ant Design:** kurumsal hava, fitness app'e uymaz

**Karar:** shadcn/ui.

**Kurulum stratejisi:** Tüm komponentleri başta yükleme. Kullanılan komponentleri tek tek ekle: `npx shadcn-ui add button card dialog ...`.

---

## Styling: Tailwind CSS

**Paket:** `tailwindcss`

**Ne:** Utility-first CSS framework.

**Neden:**
- shadcn/ui ile zorunlu eşleşme
- Hızlı iterasyon (className içinde her şey görünür)
- Bundle'da kullanılmayan stiller otomatik tree-shake
- Türkçe arayüz için herhangi bir ekstra yapılandırma gerektirmez

**Karar:** Tailwind 3 (Tailwind 4 alpha'da ise stabil olana kadar bekle).

---

## Animasyonlar: Framer Motion

**Paket:** `framer-motion`

**Ne:** React animasyon kütüphanesi.

**Neden:**
- Setup wizard'daki **animasyonlu siluet** için ideal (path animasyonları, morphing)
- Declarative API — props ile animasyon, kod kirletmez
- GPU-accelerated → 60FPS kolay
- Layout animasyonları otomatik (UI değişiklikleri smooth)

**Alternatifler:**
- **GSAP:** daha güçlü ama imperative, React ile entegrasyon eklemek lazım
- **Native CSS animations:** basit şeyler için OK, siluet morphing için yeterli değil
- **Lottie:** After Effects export, ama bizim siluet basit, overkill

**Karar:** Framer Motion.

---

## Görselleştirme

### Kamera Overlay: HTML5 Canvas (native)
React renderer kullanmayız — her frame'de canvas'a çiziyoruz, virtual DOM'a gitmeye gerek yok. Direct `<canvas>` + `getContext('2d')` + animation loop.

### Grafikler (Session Summary): Recharts
**Paket:** `recharts`
- Rep history grafiği, açı zamanlaması grafiği için
- React-native, TypeScript-friendly, Tailwind ile uyumlu
- Alternatif: Chart.js (daha güçlü ama React entegrasyonu manuel)
- **Karar:** Recharts.

---

## TypeScript (strict mode)

**Sürüm:** TypeScript 5.3+

**Yapılandırma:**
```json
{
 "compilerOptions": {
 "strict": true,
 "noUncheckedIndexedAccess": true,
 "noImplicitOverride": true,
 "exactOptionalPropertyTypes": true
 }
}
```

**Neden:**
- Real-time veri akışında tip hataları runtime bug
- Refactor cesareti şart (10 hafta boyunca büyük değişiklikler olacak)
- 2026'da TypeScript artık temel beklenti
- `strict: true`'dan **ödün vermeyiz** — başta zor, uzun vadede kurtarıcı

---

## Test: Vitest

**Paket:** `vitest`

**Ne:** Vite ekosistemi için modern test runner. Jest API uyumlu ama daha hızlı.

**Neden:**
- TypeScript yerli destek (Jest config karmaşık)
- ES modules native
- Watch mode hızlı (HMR ile)
- Coverage built-in

**Alternatif:** Jest. Çalışır ama config dağ gibi.

**Karar:** Vitest.

**Test kapsamı hedefleri:**
- `core/math/*` — %100
- `core/exercise-engine/*` — %80+
- UI testleri MVP'de yok (Playwright sonraki fazda)

---

## Code Quality

### ESLint
**Yapılandırma:** Next.js eslint config + TypeScript strict + react-hooks plugin.

### Prettier
**Yapılandırma:** Default + 2 space indent + 100 char line width.

### Husky + lint-staged
Pre-commit hook: değişen dosyalarda eslint + prettier otomatik çalışsın. Commit'i kirli kodla yapma alışkanlığı erken oluşur.

### Conventional Commits
Commit mesajları: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`. CV'de git history'e bakıldığında profesyonel görünür.

---

## Deployment: Vercel

**Ne:** Next.js'in arkasındaki şirket. Free tier projemiz için fazlasıyla yeterli.

**Free tier limitleri (2026 itibarıyla):**
- 100 GB bandwidth/ay
- Sınırsız sayıda deploy
- CDN dahil, edge functions dahil
- Custom domain destekleniyor

**Workflow:**
- GitHub repo bağla
- `main` branch push → otomatik production deploy
- PR açıldığında preview URL otomatik

**Alternatifler:**
- **Cloudflare Pages:** çok benzer, bazı durumlarda daha cömert
- **Netlify:** OK ama Next.js'de Vercel kadar smooth değil

**Karar:** Vercel.

---

## Diğer Paketler

| Paket | Kullanım | Sebep |
|---|---|---|
| `lucide-react` | İkonlar | shadcn/ui ile uyumlu, modern, ağaç-shake'lenebilir |
| `clsx` veya `cn` | Conditional className | Standart Tailwind helper |
| `zod` | Veri doğrulama (config'ler için) | TypeScript-first, runtime validation |

---

## NEYİ KULLANMIYORUZ (ve neden)

- **Backend (Express, Fastify, vb.):** Mimari karar gereği yok. %100 client-side.
- **Veritabanı:** MVP'de oturum geçmişi yok. v2'de IndexedDB (yine backend değil).
- **Auth library (NextAuth, Clerk, vb.):** Kullanıcı hesabı yok.
- **CSS-in-JS (styled-components, emotion):** Tailwind yeterli, bundle yükü gereksiz.
- **GraphQL:** Backend yok.
- **React Query / SWR:** Network çağrısı yok.
- **Form library (React Hook Form, Formik):** MVP'de form yok.
- **i18n library (i18next):** Türkçe için tek dosya yeterli, abstraction over-engineering.

---

## Bağımlılık Bütçesi

**Hedef:** Production bundle size **< 250KB gzipped** (MediaPipe hariç).

MediaPipe WASM ayrıca lazy yüklenir (~3MB ama ilk yüklemeden sonra browser cache'lenir).

**Bundle analyzer ile her PR'da kontrol:** `@next/bundle-analyzer` kurulumu.

---

## Maliyet Toplamı

| Kalem | Maliyet |
|---|---|
| Hosting (Vercel free tier) | 0 TL |
| Tüm kütüphane lisansları | 0 TL (MIT/Apache) |
| MediaPipe modelleri | 0 TL (Apache 2.0) |
| Domain (opsiyonel) | ~300 TL/yıl |
| **MVP TOPLAM (domain olmadan)** | **0 TL** |
| **MVP TOPLAM (domain ile)** | **~300 TL/yıl** |

---

## Sürüm Sabitleme Stratejisi

`package.json`:
- Major sürüm sabit (`^` kullan): otomatik patch ve minor güncelleme
- Major güncelleme öncesi CHANGELOG oku, manuel onay

**Lock file:** `package-lock.json` veya `pnpm-lock.yaml` git'e commit edilir. Reproducible build için kritik.

**Paket yöneticisi tercihi:** `pnpm` (disk verimli, hızlı). Alternatif: `npm` (built-in, yeterli).

Karar: `pnpm` kullanacağız. Tek sebep: CV'de "pnpm kullandım" demek modern bir detay.
