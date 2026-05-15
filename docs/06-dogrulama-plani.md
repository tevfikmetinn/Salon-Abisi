# 06 — Doğrulama Planı

Sistem gerçekten doğru çalışıyor mu? Hangi metriklerle ölçeceğiz? Hangi adımlarla onaylayacağız?

## Doğrulama Felsefesi

**3 katmanlı güven:**
1. **Kod güveni** — birim testler, deterministik girdiyle deterministik çıktı
2. **Sistem güveni** — kayıtlı videolar üzerinde regression testleri, ölçülen metriklerle
3. **Domain güveni** — fitness eğitmenleri "evet bu doğru tespit ediyor" diyor
4. **Kullanıcı güveni** — gerçek acemiler bağımsız kullanabiliyor ve değer alıyor

Her katmanı **sırayla** geçeriz. Önceki katmanı atlamadan sonrakine geçilmez.

---

## SEVİYE 1 — Birim Testler (Kod)

### Kapsam
- `core/math/*` (angles, geometry, stats, smoothing): **%100**
- `core/exercise-engine/*` (RuleEvaluator, StateMachine, FeedbackGenerator): **%80+**
- `core/pose-detection/*` (MediaPipe wrapper): smoke test (init/dispose çalışıyor mu)
- `exercises/*` (plugin tanımları): her kuralın bilinen senaryolarla testi

### Test Stratejisi

#### Math fonksiyonları
```typescript
// angles.test.ts
describe('angleBetween', () => {
  it('returns 90° for perpendicular vectors', () => {
    expect(angleBetween({x:0,y:0}, {x:1,y:0}, {x:1,y:1})).toBeCloseTo(90)
  })
  it('returns 180° for collinear opposite vectors', () => {
    expect(angleBetween({x:-1,y:0}, {x:0,y:0}, {x:1,y:0})).toBeCloseTo(180)
  })
  // ... edge cases
})
```

#### Rule değerlendirme
```typescript
// squat-rules.test.ts
describe('Squat R1 (depth)', () => {
  it('passes when hip below knee', () => {
    const landmarks = mockSquatBottom({ hipY: 0.6, kneeY: 0.5 })
    expect(evaluateRule(squatRules.depth, landmarks)).toEqual({ severity: 'green' })
  })
  it('fails when hip well above knee', () => {
    const landmarks = mockSquatBottom({ hipY: 0.3, kneeY: 0.5 })
    expect(evaluateRule(squatRules.depth, landmarks)).toEqual({ severity: 'red' })
  })
})
```

#### State machine
```typescript
// state-machine.test.ts
it('counts 5 reps for 5 squat cycles', () => {
  const frames = simulateSquatCycles(5)
  const sm = new RepStateMachine(squatStateMachineConfig)
  let repCount = 0
  for (const frame of frames) {
    const { repCompleted } = sm.transition(frame)
    if (repCompleted) repCount++
  }
  expect(repCount).toBe(5)
})
```

### Araçlar
- **Vitest** — runner
- **@vitest/coverage-v8** — coverage raporu
- **Mock fixtures** — `tests/fixtures/landmarks/*.json` (önceden hazırlanmış landmark dizileri)

### CI Entegrasyonu
- GitHub Actions: her push'ta test çalıştır
- PR'da test geçmiyorsa merge engelle (branch protection)

---

## SEVİYE 2 — Regression Testleri (Video)

### Hazırlık

#### Test video seti
**Hedef: Egzersiz başına 20 video** (10 doğru + 10 farklı türde hatalı)

Kendi videolarını çek:
- Webcam'le, MVP'nin kullanacağı kalitede
- 720p, 30FPS yeterli
- Aydınlatma: hem iyi hem orta kalite, çeşitlilik için
- 3-4 kıyafet varyasyonu (dar/bol, koyu/açık)

#### Etiketleme
Her video için bir JSON dosyası:
```json
{
  "videoFile": "squat-correct-001.mp4",
  "exerciseId": "squat",
  "expectedReps": 5,
  "expectedViolations": [],
  "notes": "İdeal form, derinlik tam, sırt dik"
}

{
  "videoFile": "squat-shallow-001.mp4",
  "exerciseId": "squat",
  "expectedReps": 5,
  "expectedViolations": [
    { "ruleId": "depth", "severity": "red", "minOccurrences": 4 }
  ],
  "notes": "Yarım squat, derinlik kuralı 5 rep'in 4'ünde ihlal edilmeli"
}
```

### Otomatik Çalıştırma

Test script:
```
pnpm test:regression
```

Çalışma:
1. Her test video için `VideoFileSource` üzerinden sistemi simüle et
2. Sistemin ürettiği rep sayısını ve violations'ı topla
3. Beklenenle karşılaştır
4. Rapor üret:
   - Test başına PASS/FAIL
   - Toplam metrikler

### Hedef Metrikler

| Metrik | MVP hedef | İdeal |
|---|---|---|
| Rep sayma doğruluğu | ≥ %95 | %99 |
| True Positive Rate (kural başına) | ≥ %85 | %95 |
| False Positive Rate (kural başına) | ≤ %10 | ≤ %5 |
| False Negative Rate | ≤ %15 | ≤ %5 |

**Per kural ayrı ölç.** Squat derinliği %95 doğru ama curl ROM %60 doğruysa → curl iyileştirilmeli.

### Hata Analizi

Test başarısız olursa:
1. Hangi kural? Hangi senaryo?
2. False positive mi, false negative mi?
3. Sebep: eşik mi, landmark gürültüsü mi, state machine mi?
4. Düzeltme: eşik ayarı, smoothing, veya algoritma değişikliği

---

## SEVİYE 3 — Domain Uzmanı Geri Bildirimi

### Uzman Profili
Aradığımız kişi:
- En az 3 yıl personal trainer / fitness eğitmenliği deneyimi
- Bodyweight ve dumbbell egzersizlerinde uzman (powerlifting/olympic değil)
- Acemi müşterilerle çalışmış (sertifikalı, NASM/ACE/NSCA referansı bonus)
- Türkçe konuşan (uygulama dili Türkçe)

### Bulma Stratejisi

**Mesaj şablonu (Instagram DM / LinkedIn):**

> Merhaba [İsim],
>
> Ben [üniversite] yazılım mühendisliği öğrencisiyim. Spora yeni başlayanlara
> bodyweight squat, push-up ve dambıl curl egzersizlerinde doğru formu
> öğreten ücretsiz bir web uygulaması geliştiriyorum. Tamamen tarayıcıda
> çalışıyor, video sunucuya gönderilmiyor, kullanıcı bilgisayarı önüne
> oturup kamerasıyla canlı geri bildirim alıyor.
>
> Sistemi profesyonel bir gözle değerlendirmeniz benim için çok değerli
> olur. 30-60 dakikalık bir görüş için müsait misiniz? Karşılığında:
> - Uygulamada "danışman" olarak ismen yer ayırırım (istemezseniz koymam)
> - Detaylı bir teşekkür / referans yazısı paylaşırım
>
> Cevabınız ne olursa olsun zamanınız için teşekkürler.
>
> [İsim]

**Kanallar:**
- Instagram: `#fitnesseğitmeni`, `#personaltrainerturkey` etiketlerini ara
- LinkedIn: "Personal Trainer" + Türkiye filtresi
- Üniversiten beden eğitimi bölümü hocaları
- Yerel spor salonlarına e-posta
- Türkçe fitness YouTube kanallarına yorum/DM

**Hedef:** 10 kişiye ulaş, 2-3 cevap dön bekle, 1-2'yle gerçek görüş.

### Görüş Yapısı (60 dakika)

| Süre | Etkinlik |
|---|---|
| 0-5 dk | Tanışma + uygulama özeti |
| 5-15 dk | Canlı demo: 3 egzersizi yaparım, eğitmen sistemin verdiği feedback'i görür |
| 15-35 dk | 6 video çal (egzersiz başına 2: 1 doğru, 1 yanlış). Eğitmen sistemin yorumlarını değerlendirir. |
| 35-50 dk | Eşik değerlerini birlikte ince ayar |
| 50-55 dk | Eksik gördüğü hata tipleri (v2 için not) |
| 55-60 dk | Teşekkür + bir sonraki adım (yazılı onay) |

### Çıktılar

1. **Yazılı/sesli onay:** "X egzersizinde sistemin tespiti doğru" (1 paragraf)
2. **Ayarlanmış eşikler:** Kodda commit edilecek son değerler
3. **v2 hata tipleri listesi:** Eğitmenin önerdiği ek kontroller

---

## SEVİYE 4 — Gerçek Kullanıcı Testleri

### Hedef Kullanıcı: Acemi Spor Yapan
Aradığımız kişi:
- Spora yeni başlamış (< 6 ay deneyim)
- Doğru form konusunda kendinden emin değil
- Bilgisayarı / laptop'u var
- Yardım almadan, sıfır brief ile deneyecek

### Bulma Stratejisi
- Üniversitende sınıf arkadaşları (5 kişiye sor, 2-3 katılır)
- Aile fertleri (kuzen, kardeş)
- Discord topluluklarında "test eden lazım" gönderisi

### Test Yapısı

#### Pre-test (5 dk)
- "Hiç spor yaptın mı?" / "Form konusunda kaygın var mı?"
- Beklenti seti: "Bu uygulamayı şimdi açacağım, sen kullanacaksın. Ben yardım etmeyeceğim — anlamadığın yerde kalırsan kalmaya devam et, ben gözlemleyeceğim."

#### Test (15-20 dk)
- Kullanıcıya linki ver, bilgisayarı önüne oturt
- **Hiç açıklama yapma, hiç müdahale etme**
- Ekran kaydı al (kullanıcı izni ile)
- Sesli kayıt al (think-aloud protocol: kullanıcı düşüncelerini söyleyecek)
- Gözlem notları:
  - Hangi adımda duraksadı?
  - Hangi mesaj kafa karıştırıcıydı?
  - Tamamlama süresi?
  - Tamamlayabildi mi?

#### Post-test (10 dk)
- "Ne hissettin?"
- "Hangi kısım faydalı geldi?"
- "Hangi kısım sinir bozdu?"
- "Tekrar kullanır mıydın?"
- "Bir arkadaşına önerir miydin?"
- NPS skoru (0-10): "Önerme ihtimalin nedir?"

### Hedef Metrikler

| Metrik | MVP hedef |
|---|---|
| Tamamlama oranı (egzersiz başlatabildi) | ≥ %80 |
| Ortalama tamamlama süresi (link aç → ilk rep) | ≤ 5 dk |
| Kullanıcı başına anlam veremediği mesaj sayısı | ≤ 2 |
| NPS | ≥ 7 (10 üzerinden) |
| "Tekrar kullanır mıyım?" → evet | ≥ %60 |

### Test Sayısı
5 kullanıcı yeterli — Nielsen Norman Group araştırmasına göre 5 kullanıcı UX issue'larının %85'ini ortaya çıkarır.

---

## Risk Senaryoları ve Mitigasyon

| Risk | Olasılık | Etki | Mitigasyon |
|---|---|---|---|
| MediaPipe yanlış landmark verir | Düşük | Yüksek | Confidence filtering (< 0.5 dışla), 3-frame moving average |
| Eşik değerleri hatalı | Yüksek | Orta | İteratif ayar, Seviye 3'te uzman onayı |
| Kötü aydınlatma | Yüksek | Yüksek | SetupWizard'da otomatik tespit + uyarı |
| Bol giysi keypoint'leri bozar | Orta | Orta | UX uyarı "dar giysi tercih edin", görsel ipucu |
| Düşük FPS donanım | Orta | Orta | Adaptive frame rate, MediaPipe lite model |
| False positive (gerçekte doğru, hatalı diyor) | Yüksek | Yüksek | Cömert başlangıç eşikleri, "emin değilsen sessiz kal" prensibi |
| False negative (gerçekte hatalı, geçer diyor) | Orta | Orta | Yine eşik ayarı, ama daha az tehlikeli |
| Kullanıcı kafası karışır | Yüksek | Yüksek | Onboarding + tutorial + kullanıcı testi (Seviye 4) |
| Privacy iddiası zedelenir | Düşük | Çok yüksek | Backend yok kararına sadık kal, tüm analytics opt-in |
| Browser uyumsuzluğu | Orta | Orta | Chrome, Firefox, Safari, Edge son 2 sürüm test |

---

## Yayın Sonrası Doğrulama

### Telemetri (Privacy-First)
**Sadece anonim, çıkarılabilir bilgi olmayan veriler:**
- Hangi egzersiz seçildi (sayım)
- Ortalama oturum süresi
- Browser ve OS dağılımı
- Tamamlanan rep sayıları (aggregate)

**Toplamadığımız:**
- IP adresi
- Kullanıcı ID
- Video/kamera verisi (zaten cihazdan çıkmıyor)
- Konum

**Araç:** Plausible (privacy-first analytics) veya Umami (self-hosted, sıfır cookie).

### Geri Bildirim Kanalları
- Footer'da "Geri bildirim ver" linki → Tally form
- GitHub Issues (bug raporu için)
- E-posta (`hello@formkocu.app` veya benzeri)

### Sürekli İyileştirme
- Her ay: en sık şikayet edilen 3 konuyu düzelt
- Her 2 ayda bir: 2 yeni kullanıcı testi
- Her 3 ayda bir: regression test setini genişlet (yeni video ekle)

---

## Başarı Tanımı (MVP Sonu)

**MVP başarılı sayılır eğer:**
1. ✅ Seviye 1: tüm testler geçiyor, coverage hedefleri tutuyor
2. ✅ Seviye 2: TPR %85+, FPR %10-, rep doğruluğu %95+
3. ✅ Seviye 3: en az 1 uzmandan yazılı onay
4. ✅ Seviye 4: 5 kullanıcı testinde NPS ≥ 7
5. ✅ Vercel'de canlı, çalışıyor, paylaşılabilir
6. ✅ GitHub'da temiz, dokümante, profesyonel

**Bu 6 madde tamamsa MVP "tamamlandı" demektir.** Hâlâ iyileştirilebilir ama "yayınlanabilir, gösterilebilir, CV'ye konabilir" durumdadır.
