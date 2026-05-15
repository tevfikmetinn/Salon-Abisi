# 05 — Yol Haritası

10 haftalık plan. Her hafta:
- **Hedef:** Hafta sonu eline geçecek somut çıktı
- **Görevler:** Adım adım iş listesi
- **Öğrenilecekler:** Bilmiyorsan bu hafta öğreneceğin konular
- **Risk / Dikkat:** Bu haftaya özel tuzaklar
- **Doğrulama:** Hafta sonu "tamam mı?" testi

> **Süre varsayımı:** Haftada 15-20 saat. 2. sınıf öğrencisi, ders + bu proje. Yoğun haftalarda buffer hafta 11-12'de.

---

## HAFTA 1 — Temel Kurulum + İlk Iskelet

### Hedef
Webcam'den canlı görüntü + üzerinde 33 noktalık iskelet overlay çalışan, dağınık ama çalışan bir prototip.

### Görevler
1. **Next.js 14 projesi başlat:**
   ```
   pnpm create next-app@latest formkocu --typescript --tailwind --app --eslint
   ```
2. **shadcn/ui kurulumu** (`npx shadcn-ui@latest init`)
3. **Git repo + ilk commit + GitHub'a push**
4. **README placeholder oluştur** (proje adı + kısa açıklama)
5. **Husky + lint-staged + prettier ayarla** (pre-commit hook)
6. **MediaPipe Tasks Vision ekle:**
   ```
   pnpm add @mediapipe/tasks-vision
   ```
7. **Model dosyalarını public/models/ altına indir** (Pose Landmarker lite)
8. **Basit bir `/test` sayfası:**
   - `<video>` elementine webcam stream bağla
   - MediaPipe ile her frame'de pose tespiti
   - Canvas overlay üzerinde 33 noktayı daire olarak çiz
   - Eklemleri çizgi olarak bağla

### Öğrenilecekler
- Next.js 14 App Router temelleri (server components vs client components)
- `'use client'` direktifi ne zaman gerekir
- `navigator.mediaDevices.getUserMedia` ile webcam erişimi
- `useEffect` cleanup ile MediaStream durdurma (memory leak'tan kaçınma)
- MediaPipe Tasks Vision API (PoseLandmarker init + detect)
- Canvas API temelleri (clearRect, beginPath, arc, stroke)

### Risk / Dikkat
- ⚠️ **MediaPipe wasm yükleme:** Next.js SSR ile uyumsuz olabilir. `dynamic import` + `ssr: false` kullan.
- ⚠️ **Webcam izni:** localhost dışında HTTPS gerekir. Vercel deploy'da otomatik.
- ⚠️ **Memory leak:** useEffect cleanup yazılmadığında 5dk içinde tab donar. Her stream/detector için dispose çağır.

### Doğrulama
- Webcam aç → kendi üzerinde iskelet çiziliyor mu? ✓
- Tab'i 10dk açık bırak → FPS düşmüyor mu? ✓
- Sayfa yenile → wasm yeniden yükleniyor ama hata yok ✓

---

## HAFTA 2 — Soyutlama Katmanı (PoseDetector + FrameSource)

### Hedef
`core/` klasörü kuruldu. `PoseDetector` ve `FrameSource` interface'leri + MediaPipe + Webcam implementasyonları. UI bunları kullanıyor.

### Görevler
1. **Klasör yapısını oluştur:**
   ```
   src/core/pose-detection/
   src/core/frame-source/
   src/core/math/
   ```
2. **TypeScript tipleri yaz:**
   - `Landmark` (x, y, z, visibility)
   - `PoseLandmarks` (33 landmark + meta)
   - `Frame` (ImageData wrapper)
3. **`PoseDetector` interface + `MediaPipePoseDetector` implementasyonu**
4. **`FrameSource` interface:**
   - `WebcamSource` implementasyonu
   - `VideoFileSource` implementasyonu (HTML video element wrapper)
5. **`/test` sayfasını refactor et** — yeni adapter'lar üzerinden çalışsın
6. **Video upload UI ekle** — kullanıcı .mp4 yüklesin, aynı flow çalışsın
7. **Vitest kurulumu + ilk birim testleri:**
   - `core/math/angles.ts` için 5-10 test

### Öğrenilecekler
- TypeScript interface + implementation pattern
- Dependency Inversion Principle (mimariyi bu yönlendiriyor)
- Async iterators veya RxJS-benzeri stream'ler
- File reader API + video file ile çalışma
- Vitest temelleri

### Risk / Dikkat
- ⚠️ **API stabilitesi:** Bu hafta yazdığın interface'ler ileride değiştirilirse her şey kırılır. Tasarımı düşün, acele etme.
- ⚠️ **Performance:** PoseDetector her frame'de instance yaratmıyor, tek instance reuse ediliyor olsun.

### Doğrulama
- Webcam VEYA yüklenen video, **aynı `/test` sayfasında**, aynı kod akışıyla pose çıktısı veriyor ✓
- Birim testler geçiyor ✓
- 30+ FPS hâlâ stabil ✓

---

## HAFTA 3 — Exercise Engine Çekirdeği

### Hedef
`ExerciseDefinition` tipi tanımlı. Boş bir Squat plugin'i var. State machine "rep 1, rep 2..." şeklinde sayıyor (henüz kural yok).

### Görevler
1. **`core/exercise-engine/types.ts`:** ExerciseDefinition, Rule, Violation, RepState interface'leri
2. **`core/math/` klasörünü tamamla:**
   - `angles.ts` — 3 nokta arası açı
   - `geometry.ts` — mesafe, projeksiyon, perpendicular distance
   - `stats.ts` — stdev, mean, moving average
3. **`StateMachine.ts`:** Generic state machine engine
4. **`exercises/squat.ts`:** İlk plugin
   - Camera setup config (yan profil, 2m, vb.)
   - Visibility checks (omuz-kalça-diz-ayak görünürlük)
   - State machine config (STANDING → DESCENDING → BOTTOM → ASCENDING)
   - Rules: **boş bırak** (hafta 4'te dolduracağız)
5. **`exercises/index.ts`:** registry oluştur
6. **Yeni UI:** `/exercise/squat` sayfası — kameradan akış geliyor, ekranda "Rep: X" sayacı çalışıyor
7. **Birim testler:**
   - State machine farklı senaryolarla test (simüle landmark dizisi)

### Öğrenilecekler
- Plugin pattern (data-driven design)
- Finite State Machine kavramı
- Vector math (cosine rule, dot product) — eğer rusty ise refresh
- Test fixture pattern (mock landmark dizileri)

### Risk / Dikkat
- ⚠️ **State machine flickering:** Velocity sıfıra çok yaklaşınca state oscillate edebilir. Minimum frame sayısı + hysteresis ekle.
- ⚠️ **Calibration:** "Standing baseline" oturum başında alınıyor — kullanıcı oturum başında düzgün dursun.

### Doğrulama
- Webcam aç, squat yap → ekranda "Rep: 1, 2, 3..." artıyor ✓
- 5 rep yaptıysan 5 göstermeli, 4 veya 6 değil ✓
- Yarım squat (yarı eğil → kalk) sayıyor mu? **Henüz kuralı yok, sayar.** Hafta 4'te düzelteceğiz.

---

## HAFTA 4 — Squat Kuralları (İlk Tam Egzersiz)

### Hedef
Squat egzersizi tamamen çalışıyor. 4 kuralın hepsi (derinlik, sırt eğimi, diz, tempo) tespit ediliyor. Live feedback panel mesajlar gösteriyor.

### Görevler
1. **`exercises/squat.ts` kurallarını yaz** (02-egzersiz-spekleri.md'deki R1-R4)
2. **`core/exercise-engine/RuleEvaluator.ts`:** Per-frame kural değerlendirme
3. **`core/exercise-engine/FeedbackGenerator.ts`:** Violation → Türkçe mesaj
4. **Mesaj öncelik mantığı:** Aynı anda max 1 mesaj, 2sn cooldown
5. **UI: LiveFeedbackPanel** — sağ tarafta sticky panel, aktif mesaj
6. **UI: RepCounter** — büyük rep sayısı
7. **Rep aggregation:** Her rep tamamlandığında özet üret (`RepSummary`)
8. **UI: Son rep özeti küçük badge** (✅ derinlik, ❌ sırt vb.)
9. **Birim testler:**
   - Her squat kuralı için bilinen landmark senaryoları
   - "Derin squat → derinlik kuralı geçer", "yarım squat → R1 ihlal"

### Öğrenilecekler
- Real-time veri akışında throttling (her frame'de DOM güncellemesi yapma)
- Pure function pattern (RuleEvaluator stateless olmalı)
- Time-series veri toplama (rep boyunca açı geçmişi)

### Risk / Dikkat
- ⚠️ **Eşik değerleri büyük ihtimalle yanlış başlangıçta.** Self-test ile ayarla.
- ⚠️ **False positives:** Sistem sürekli kırmızı mesaj basıyorsa kullanıcı kaybeder güven. Tolerans biraz cömert tutsun, sonra sıkıştırırız.

### Doğrulama
- Kendi videolarınla test (en az 3 doğru, 3 yanlış squat) ✓
- Yarım squat → "Daha derine in" mesajı gözüküyor ✓
- Aşırı öne eğilme → "Göğsünü dik tut" mesajı gözüküyor ✓
- Tüm doğru rep'lerde yeşil onay alıyor ✓

---

## HAFTA 5 — Görsel Polish + Setup Wizard

### Hedef
"Hayatımda gördüğüm en güzel form app'i" hissi. İskelet rengi, animasyonlu siluet, kamera setup wizard.

### Görevler
1. **PoseOverlay'i geliştir:**
   - Segment bazlı renkler (uyum: omuz-dirsek-bilek üst kol; diz violation varsa kırmızı)
   - Smooth interpolation (her frame'de %50 yeni + %50 önceki = jitter azalır)
   - Drop shadow efekti
2. **SilhouetteGuide komponenti (Framer Motion):**
   - SVG path olarak squat pozisyonunda insan silueti
   - Animasyon: kameraya doğru yan dön → squat pozisyonu al → tekrar
3. **SetupWizard akışı:**
   - Adım 1: "Kamerayı şuraya koy" (siluet animasyonu + metin)
   - Adım 2: "Kareye gir" (canlı kamera + checklist, otomatik tıklanır)
   - Adım 3: "Aydınlatma yeterli mi?" (otomatik tespit)
   - Adım 4: "Hazır mısın?" → 3-2-1 countdown → egzersiz başlar
4. **VisibilityCheck logic:**
   - Tüm gerekli landmark'lar visible > 0.7 mı?
   - Vücut çerçeve içinde mi?
   - Yan profilde mi (omuz-kalça yatay mesafe küçük)?
5. **UI: Polish pass**
   - Renk paleti seç (yeşil = vibrant, kırmızı = uyarı ama dostane, mavi = nötr)
   - Typography ölçeği (büyük başlıklar, okunaklı geri bildirim)
   - Hover/focus state'leri

### Öğrenilecekler
- Framer Motion path animations + variants
- Canvas performans optimizasyonu (offscreen canvas, batching)
- Tailwind ile tasarım sistemi kurma
- shadcn/ui komponentlerini özelleştirme

### Risk / Dikkat
- ⚠️ **Aşırı tasarım dürtüsü:** Bu hafta polish, ama saatlerini emmesin. Functional first.
- ⚠️ **Animasyon performansı:** Framer Motion ağır animasyonlar low-end cihazda donar. `will-change` ve `transform-only` ile sınırlandır.

### Doğrulama
- Bir arkadaşa link gönder → açıklama yapmadan ilk repini yapabiliyor mu? ✓
- 60 yaşındaki birine göster, anlayabiliyor mu (test edemezsen hayal et)? ✓
- Demo videosu çekmeye uygun görsel kalitede mi? ✓

---

## HAFTA 6 — Şınav (Push-up)

### Hedef
İkinci egzersiz aynı kalitede. Plugin pattern'in faydasını ilk kez gözle göreceksin.

### Görevler
1. **`exercises/pushup.ts`** yaz (4 kural: vücut hizası, dirsek açısı, derinlik, tempo)
2. **Push-up state machine** (squat'tan farklı: elbow açısı tabanlı, vücut yatay)
3. **Modified push-up tespiti** (diz yerde mi?) — opsiyonel
4. **SetupWizard for push-up:** kamera daha düşük, kullanıcı yatay
5. **Camera angle differentiation:** SilhouetteGuide push-up için farklı animasyon
6. **Birim testler:**
   - Hip sag senaryosu → R1 ihlal
   - Yarım push-up → R3 ihlal
   - Flared elbows → R2 ihlal

### Öğrenilecekler
- Plugin pattern'in gerçek değeri (core kod değişmeden yeni egzersiz)
- Body orientation tespiti (yatay vs dikey vücut)

### Risk / Dikkat
- ⚠️ **Modified push-up + standart push-up aynı plugin'de mi ayrı mı?**
  - Önerim: aynı plugin, state machine içinde "knee on floor?" tespiti, label rep accordingly.
- ⚠️ **Düşük kamera açısı sorunu:** Yere yakın kamera, alt vücut görünmeyebilir. SetupWizard uyar.

### Doğrulama
- Push-up yap → rep sayılıyor, kurallar çalışıyor ✓
- Kalçanı kasıtlı düşür → "Kalçan çöküyor" mesajı ✓
- Yarım push-up → "Daha aşağıya in" mesajı ✓

---

## HAFTA 7 — Dambıl Curl + İterasyon

### Hedef
Üçüncü egzersiz. Önceki ikisinde haftalardır biriken küçük issue'ları düzelt.

### Görevler
1. **`exercises/biceps-curl.ts`** yaz (4 kural: üst kol stabilitesi, vücut sallama, ROM, tempo)
2. **Front-¾ açı için yeni SetupWizard varyantı**
3. **Aktif kol tespiti** (hangi elinde dambıl var: dirsek bükülen kol)
4. **Squat + push-up için bug fix listesi** — bu hafta GitHub Issues açtığın her şey
5. **Threshold ayarlamaları** — kendi self-test verinden
6. **README'yi güncelle** — 3 egzersiz var artık

### Öğrenilecekler
- Aktif kol/taraf tespiti (frame-by-frame öncelik)
- Sallama (variance) tespiti — `core/math/stats.ts` kullanımı

### Risk / Dikkat
- ⚠️ **Tek kol vs iki kol curl:** MVP'de tek kol odaklı. İki kol simultaneous v2.
- ⚠️ **Dambıl tespiti:** MediaPipe dambılı görmez, sadece bileği. Bilek pozisyonu yeterli ipucu.

### Doğrulama
- 3 egzersiz çalışıyor, geçiş smooth ✓
- Squat regression: hâlâ doğru çalışıyor ✓
- Self-test seti: %85+ true positive ✓

---

## HAFTA 8 — Onboarding, Landing Page, Tutorial

### Hedef
Yabancı bir kullanıcı **link açar, hiç açıklama olmadan ilk rep'ini yapar.**

### Görevler
1. **Landing page (`/`):**
   - Hero: "Spora yeni mi başlıyorsun? Doğru formu öğren — ücretsiz, kayıt yok, kameran cihazdan çıkmıyor."
   - 3 egzersiz kartı (resim + ad + açıklama)
   - "Nasıl çalışır?" 3 adımlı animasyon
   - FAQ accordion (5-7 soru)
   - Footer (GitHub linki, hakkında, gizlilik)
2. **Egzersiz seçim sayfası (`/exercises`):**
   - 3 kart, hover'da tutorial preview
   - "Yeni başlayan ipuçları" sidebar
3. **Tutorial overlay (her egzersizin ilk kullanımında):**
   - 30 saniye animasyon: hareketi nasıl yapmalı (referans form)
   - "Anladım, başla" butonu
4. **Hata durumları:**
   - Kamera izni reddedildi → friendly mesaj + video upload alternatifi
   - Tarayıcı uyumsuz → uyarı + Chrome öner
   - Internet kesik (model indirilemedi) → retry
5. **Gizlilik sayfası (`/privacy`):**
   - "Verin cihazdan çıkmaz" net bir şekilde açıkla
6. **404 ve hata sayfaları**

### Öğrenilecekler
- User onboarding tasarımı
- Mikro-kopya yazımı (tek cümle UX yazısı)
- Next.js metadata API (SEO için)
- A11y (erişilebilirlik) checklist

### Risk / Dikkat
- ⚠️ **Aşırı feature açıklaması:** Landing page kısa olsun. 3 ekran kaydırma, daha fazla değil.
- ⚠️ **Tutorial uzunluğu:** 30sn yeterli. 2dk olursa kimse izlemez.

### Doğrulama
- **Test:** 2 farklı arkadaşına linki gönder, "uygulamayı dene, ben sana açıklamayacağım" de.
  - Her ikisi de ilk rep'ini 5 dakikada yapabildi mi? ✓
  - Hangi noktada takıldılar? → o noktayı düzelt.

---

## HAFTA 9 — Doğrulama ve Uzman Geri Bildirimi

### Hedef
**Profesyonel onay.** Bir fitness eğitmeni "evet bu doğru tespit ediyor" diyecek.

### Görevler
1. **Regression test seti oluştur:**
   - Her egzersiz için kendi videolarını çek
   - 10 doğru form + 10 farklı tipte yanlış form
   - Otomatik test scripti: video → sistem analizi → beklenen sonuç karşılaştırması
2. **Metrikleri ölç:**
   - True Positive Rate per kural
   - False Positive Rate per kural
   - Rep sayma doğruluğu
3. **Uzman bul:**
   - Instagram'da Türkçe konuşan fitness eğitmenleri ara
   - LinkedIn personal trainer profilleri
   - Üniversitende beden eğitimi bölümü hocaları
   - 2-3 kişiye mesaj at, 1-2 cevap dön bekle
4. **Uzman oturumu (30-60 dk):**
   - Sistemin verdiği örnek geri bildirimleri göster
   - Her egzersiz için 2-3 örnek video çal
   - Eşik değerleri birlikte ince ayar
   - Eksik gördükleri hata tipleri var mı? (Not al, v2'ye)
5. **Eşik ayarlamalarını commit et**
6. **Bug listesini temizle** (GitHub Issues bu hafta sonu boş olsun)

### Öğrenilecekler
- Regression testing methodology
- Eşik değer ayarlama (gradient descent intuition)
- Domain uzmanlarla görüş etme (önemli bir kariyer skill'i)

### Risk / Dikkat
- ⚠️ **Uzman bulamama riski:** 1 hafta öncesinden mesaj atmaya başla (yani Hafta 8 sonunda).
- ⚠️ **Uzman aşırı eleştirel olursa:** Kapsamı net çiz — "biz acemilere temel form, sen profesyonel sporcu gözüyle bakma". Yine de geri bildirimi v2'ye not et.
- ⚠️ **Test seti küçük:** 20 video başlangıç. v2'de 50+ olabilir.

### Doğrulama
- En az 1 fitness eğitmeni "evet bu doğru çalışıyor" yazılı/sözlü onay verdi ✓
- TPR > %85, FPR < %10 ✓
- Rep sayma doğruluğu > %95 ✓

---

## HAFTA 10 — Performans, Polish, Yayın

### Hedef
**Canlı URL.** Paylaşabilir. İlk 50 kullanıcı.

### Görevler
1. **Performance audit:**
   - Lighthouse → 90+ Performance, A11y, Best Practices, SEO
   - Bundle size analizi (`@next/bundle-analyzer`)
   - MediaPipe lazy load (egzersiz seçildiğinde indirilsin, landing'de değil)
2. **Responsive layout:**
   - Tablet (768px-1024px) çalışsın
   - Telefon için "bu deneyim laptop/desktop'ta daha iyi" uyarısı (full mobile destek MVP'de yok)
3. **SEO:**
   - Meta tags her sayfada
   - OG image (paylaşımda görsel)
   - robots.txt, sitemap.xml
4. **Analytics (opsiyonel, gizlilik dostu):**
   - Plausible veya Umami (privacy-friendly)
   - Veya hiç koyma — MVP'de feedback formu yeterli
5. **Geri bildirim formu:**
   - Tally.so veya Google Forms embed
   - "Bu uygulamayı nasıl buldun?" 3 soru
6. **GitHub README polish:**
   - Hero image (uygulamadan screenshot)
   - "Live demo" linki
   - Tech stack badges
   - Setup talimatları (klon, kur, çalıştır)
   - Kontribütör nasıl katkı sağlar
   - LICENSE dosyası (MIT öner)
7. **Demo videoları:**
   - Her egzersiz için 30sn ekran kaydı
   - Bir tane 90sn'lik ana demo (giriş → tutorial → 1 rep → feedback)
   - YouTube'a yükle, README'e embed
8. **Deploy:**
   - Vercel'e production deploy
   - Custom subdomain (formkocu.vercel.app)
   - HTTPS doğrula
9. **Yayın:**
   - LinkedIn post (Türkçe + İngilizce versiyon)
   - Reddit r/sideproject + r/SoloDevelopers
   - Türkçe topluluklar: Discord grupları, Twitter
   - Üniversitenin kariyer ofisine bildir

### Öğrenilecekler
- Performance optimization (Next.js spesifik)
- Lighthouse audit yorumlama
- SEO temelleri
- Build in public — kendi işini pazarlama

### Risk / Dikkat
- ⚠️ **Launch day bugs:** Production'da localhost'ta görünmeyen bugs çıkar. 24 saat ilk gün hızlı yanıt ver.
- ⚠️ **LinkedIn post tonu:** "Şu projeyi yaptım" değil "şu problemi çözmek için şunu yaptım". Hikaye anlat.

### Doğrulama
- Lighthouse 90+ ✓
- 3 farklı cihazda (laptop Chrome, laptop Firefox, tablet) çalışıyor ✓
- LinkedIn post yayınlandı ✓
- İlk 50 kullanıcı tıklandı (Vercel analytics) ✓
- En az 1 yabancı kullanıcıdan geri bildirim geldi ✓

---

## HAFTA 11-12 (Buffer / v2 Başlangıcı)

### Senaryolar

**Senaryo A: MVP henüz polish gerektiriyor**
- 8-10. haftadaki tüm bugları temizle
- Uzman geri bildirimi henüz alınmadıysa şimdi al

**Senaryo B: MVP solid, v2 başlat**
- Plank, lunge ekle
- Oturum geçmişi (IndexedDB)
- Sesli geri bildirim (Web Speech API)

**Senaryo C: Kullanıcı geri bildirimi geldi, iterasyon zamanı**
- Kullanıcıların belirttiği 3-5 en sık problemi düzelt
- Kullanıcı isteği egzersizleri analiz et

---

## Hafta-Bağlama Stratejisi

Her hafta sonu **15 dakikalık retrospektif:**
1. Hedefe ulaşıldı mı? (evet / kısmen / hayır)
2. En çok hangi konuda takıldım?
3. Bir sonraki hafta için ne öğrenmem lazım?
4. Hangi v2 fikri aklıma geldi? (not al, MVP'ye katma)

Her Cuma akşamı 30 dakika:
- Hafta commit'lerini incele
- README'i güncelle (mevcut durum)
- Bir sonraki haftanın görevlerini detaylandır

---

## Genel İlkeler

- **Erken merge, sık merge.** Feature branch'leri uzun yaşamasın.
- **Test yazmaktan kaçma.** core/math/* %100, exercise-engine %80 hedefi.
- **Eşik değerleri uçuk olmasın.** Önce cömert, sonra sıkı. Aşırı kırmızı kullanıcı kaybettirir.
- **CV için commit history önemli.** Anlamlı mesajlar, conventional commits, küçük commit'ler.
- **Kapsam disiplini sözleşmesine sadık kal.** 01-vizyon-ve-kapsam.md sonu.
