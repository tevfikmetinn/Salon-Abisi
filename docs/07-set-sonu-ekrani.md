# 07 — Set Sonu Özet Ekranı

Setin bittikten sonra kullanıcının gördüğü ekran. **Projenin imza ekranı** — portfolyo demolarında en sık ekran görüntüsü buradan alınır, recruiter'a anlık değer aktaran tek ekran.

## Amaç (Öncelik Sırasıyla)

1. **Bilgilendirme:** Set'te ne yaptın, ne kadarı doğruydu
2. **Eğitim:** En sık hata + nasıl düzeltilir
3. **Motivasyon:** İyi rep'lerini gör, devam et

**Bu sıra önemli.** Önce bilgi, sonra eğitim, en son motivasyon. Ters sıra: önce "harika, devam et" diyorsun, kullanıcı kapatıyor, hiçbir şey öğrenmiyor.

## Bilgi Hiyerarşisi (Üstten Alta)

### Birincil (Hero Zone)
- **Set skoru (M4)** — büyük rakam (0-100), renk bandlı, animasyonlu sayım
- **Egzersiz adı + rep sayısı** ("Squat × 5 rep")
- **Süre** (alt satır, küçük)

### İkincil (Ana İçerik)
- **En sık hata (M5)** + öneri sözlüğünden eşleşen 1-2 cümlelik öneri
- **Rep-by-rep score bar chart** — her bar bir rep
- **Set tutarlılığı (M1)** — yüzde
- **Yorgunluk uyarısı (M2)** — varsa

### Üçüncül (Detay Paneli, Default Kapalı Accordion)
- **Kural × Rep heatmap** — 6 kural × N rep grid ()
- **Best rep (M3)** — vurgulanmış bar + "en iyi rep'in buydu, hatırla"
- **Worst rep (M3)** — vurgulanmış bar + "en zayıf rep'in buydu, üzerinde düşün"

### Eylem CTA'ları (Alt)
- **"Yeni set başlat"** — birincil, vurgulu
- **"Egzersiz değiştir"** — ikincil
- **"Ayrıntılı incele"** — accordion'ı açar
- "Ana sayfaya dön" — tertiary, link tarzı

## Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────┐
│ [] Squat × 5 rep 2dk 14sn │
│ │
│ │
│ ╭─────╮ │
│ │ 82 │ │
│ ╰─/100╯ │
│ │
│ Set tutarlılığın: 87% │
│ │
├─────────────────────────────────────────────────────────┤
│ │
│ En çok yapılan: Derinlik (5 rep'in 3'ünde) │
│ │
│ ► Sebep: Ankle mobility yetersiz olabilir │
│ ► Çözüm: Topuğun altına 1 cm kitap koy, tekrar dene │
│ │
├─────────────────────────────────────────────────────────┤
│ │
│ Rep-by-rep performans: │
│ │
│ 100 ┤ │
│ 80 ┤ ▓▓▓ ▓▓▓ ▓▓▓ │
│ 60 ┤ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ │
│ 40 ┤ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ │
│ 20 ┤ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ ▓▓▓ │
│ └─────────────────────────────────── │
│ 1 2 3 4 5 │
│ │
│ En iyi: Rep #1 (95) En zayıf: Rep #4 (45) │
│ │
├─────────────────────────────────────────────────────────┤
│ ▼ Kural detayları (tıkla aç) │
├─────────────────────────────────────────────────────────┤
│ [ Yeni set başlat ] [ Egzersiz değiştir ] [ Detay ] │
└─────────────────────────────────────────────────────────┘
```

## Visualizasyonlar

### 1. Skor Gauge (Hero)
- Büyük dairesel skor göstergesi (0-100)
- Konik gradient: kırmızı (0) → sarı (60) → yeşil (80) → koyu yeşil (100)
- Animasyon: sayfa açılışında 0'dan final değere kadar 1.5sn'de sayar (Framer Motion)
- Skor altında: tutarlılık yüzdesi

**Tasarım kararı:** Recharts'ın `RadialBarChart` componenti kullanılabilir. Custom SVG daha güzel ama Recharts MVP için yeterli.

### 2. Rep-by-Rep Bar Chart (İkincil)
- Recharts `BarChart`
- X ekseni: rep numarası (1, 2, 3, ...)
- Y ekseni: rep score (0-100)
- Bar renkleri:
 - Yeşil: score ≥ 80
 - Sarı: 60 ≤ score < 80
 - Kırmızı: score < 60
- **Best rep:** altın kontur (2px stroke, gold)
- **Worst rep:** kırmızı kontur (2px stroke, red-dim)
- Hover: tooltip ile o rep'in detayı
 - Hangi kurallar yeşil/sarı/kırmızı
 - O rep'in özel notu (varsa)

### 3. Kural × Rep Heatmap (Üçüncül, Accordion İçinde)

```
 Rep1 Rep2 Rep3 Rep4 Rep5
Derinlik
Sırt eğimi
Diz pozisyonu
Tempo
Topuk
Alt pause
```

- Tek bakışta "hangi rep'te hangi kural sıkıntılı" görülür
- Her hücre tıklanabilir → o rep + kural detayı (modal)
- Renk + ikon birlikte (a11y için tek başına renge bağlı kalmaz)

### 4. En Sık Hata Kartı

```
┌─────────────────────────────────────────────┐
│ Derinlik │
│ │
│ 5 rep'in 3'ünde derinlik yetersizdi. │
│ │
│ Neden olabilir: │
│ • Ankle mobility yetersiz │
│ • Kalça mobilite kısıtlı │
│ │
│ Dene: │
│ Topuğunun altına 1 cm kitap koy │
│ Hareket öncesi 5 ankle mobilization │
│ │
│ [Drill videosu izle] (v2'de eklenir) │
└─────────────────────────────────────────────┘
```

## Animasyon ve Mikro Etkileşimler

1. **Sayfa açılışı (1.5 sn):**
 - Skor gauge: 0'dan final'e animasyonlu sayar
 - Bar chart: bottom-up animasyon (her bar sırayla 200ms gecikmeyle yükselir)
 - En sık hata kartı: fade-in + hafif slide-up

2. **Hover etkileşimleri:**
 - Bar chart'taki bar üzerinde rep detay tooltip
 - Best rep'in altın konturu yumuşak pulsate (1.5sn'de bir)
 - CTA butonlarda subtle background shift

3. **Accordion açılışı:**
 - Heatmap fade-in + height animation
 - Detay rep modal'i: scale + opacity

**Animasyon prensibi:** Hiçbir animasyon **2 saniyeden uzun** değil. Hız > kalite.

## Empty / Edge States

### A) Set 0 rep ile bitti
```
Hiç tam rep tamamlanmadı.
Belki kurulum hatalı veya çok erken durdun?

[ Tekrar dene ] [ Kurulumu kontrol et ]
```

### B) Tüm rep mükemmel (5/5 yeşil)
```
 Set mükemmel!
Tüm rep'lerinde tüm kurallar yeşildi.

Bir sonraki adıma hazırsın:
• Aynı egzersizi daha çok rep'le dene
• Yeni bir egzersiz keşfet

[ Bir set daha ] [ Yeni egzersiz ]
```

### C) Tek rep
```
Tek rep ile sağlıklı analiz yapamıyoruz.
En az 3 rep yapmayı dene.

[ Tekrar dene ]
```

### D) Çok hızlı set (5 rep < 10 saniyede)
```
 Çok hızlı yaptın gibi görünüyor.
Tempo kontrolüne dikkat — özellikle eccentric (iniş) fazda yavaşla.

[ Tekrar dene, bu sefer yavaş ]
```

### E) Görünürlük kötü (set boyunca düşük confidence)
```
 Kameranın gördüğü veriler eksikti.
Sonuçlar güvenilir değil.

Olası sebepler:
• Aydınlatma yetersiz
• Bol kıyafet
• Kameradan çok uzak/yakın

[ Kamera kurulumunu yenile ] [ Yine de göster ]
```

### F) Sistem hatası / kayıt bozuldu
```
Bir şeyler ters gitti, set kaydı kayboldu.
Tekrar denemek ister misin?

[ Tekrar dene ] [ Ana sayfa ]
```

## Mobil / Tablet Uyumu

### Tablet (768-1024px)
- Aynı layout, daha sıkı padding
- Skor gauge biraz küçük
- Bar chart tam genişlik
- Yan yana 2 kolonluk kart'lar tek kolona inebilir

### Telefon (< 768px)
- Tek kolon
- Skor gauge en üstte
- En sık hata altta tam genişlik
- Bar chart yatay scroll'lu olabilir (5+ rep için)
- Heatmap default kapalı, "Detay" CTA ile açılır

(MVP'de mobil-first değil — ama responsive davranır, tablet'te oturma odasında izleyebilesin.)

## Erişilebilirlik (a11y)

- **Renk tek başına anlam taşımaz:** ikon + metin her zaman birlikte
- **Tab navigasyon:** Tüm CTA'lar klavyeden erişilebilir
- **Screen reader sırası:**
 1. "Set tamamlandı: 82 puan"
 2. "En sık hata: derinlik, 5 rep'in 3'ünde"
 3. "Önerilen düzeltme: ..."
 4. Diğer detaylar
- **Kontrast:** WCAG AA (4.5:1 metin, 3:1 büyük metin)
- **Focus indicators:** Görünür, default browser'dan daha belirgin

## Geliştirme Sırası (Yol Haritası 05 ile Uyumlu)

| Hafta | Bu Ekran İçin Yapılan |
|---|---|
| **Hafta 4** (squat çalışırken) | Minimal viable — rep count + en sık hata text |
| **Hafta 5** (görsel polish) | Bar chart + skor gauge eklenir |
| **Hafta 7** (3. egzersiz) | Heatmap, öneri sözlüğü entegrasyonu, eylem CTA'ları |
| **Hafta 8** (onboarding) | Empty/edge states polish |
| **Hafta 10** (yayın) | Final animasyon pass, performance audit |

## v2 / Sonraki Sürümler

- **Paylaşım:** PNG export, sosyal medya kartı
- **Karşılaştırma:** Önceki setlerle karşılaştırma grafiği (IndexedDB ile)
- **Drill videoları:** Öneri sözlüğüne YouTube embed'leri
- **Goals/Streaks:** Haftalık/aylık hedefler
- **Detay rep modal'i:** Her rep için MediaPipe overlay'li mini-video (video kaydetmeyi destekliyorsa)

## Tasarım Tonu

- **Profesyonel** ama **dostane** — Strava değil Duolingo
- **Net** — her sayı bir anlama gelmeli, "buzzword" yok
- **Aksiyon odaklı** — her ekran kullanıcıyı bir sonraki adıma yönlendirmeli
- **Suçlayıcı değil** — "yanlış yaptın" değil "bunu deneyebilirsin"
