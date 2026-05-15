# FormKoçu (Çalışma Adı)

> Spora yeni başlayanlara doğru egzersiz formunu, tamamen tarayıcıda, ücretsiz olarak öğreten web uygulaması.

## Bu Proje Nedir?

FormKoçu, **bilgisayarındaki kamerayı kullanarak** (veya video yükleyerek) bir kullanıcının squat, şınav ve dambıl curl gibi temel egzersizlerini analiz eden, **gerçek zamanlı geri bildirim veren** bir web uygulamasıdır.

Hedef kitle: **Spora yeni başlayan, evde antrenman yapan, doğru formu kimseye sormadan öğrenmek isteyen kişi.**

## Temel Prensipler

1. **Ücretsiz, sonsuza kadar.** Abonelik, hesap, kart yok.
2. **%100 tarayıcıda.** Video sunucuya gitmez — kamera görüntün senin cihazından çıkmaz.
3. **Açıklanabilir geri bildirim.** "Yanlış" demez, "dizin 8° içeri kaydı, ayak başparmağına doğrultmaya çalış" der.
4. **Niş ve derinlik.** 100 egzersiz değil, 3 egzersizi mükemmel yapan bir uygulama.
5. **Biyomekanik temelli.** Kara kutu ML değil, koçluk literatüründen kurallar.

## MVP Egzersizleri

| Egzersiz | Açı | Ana Kontroller |
|---|---|---|
| Bodyweight Squat | Yan profil | Derinlik, sırt eğimi, diz pozisyonu, tempo |
| Şınav (Push-up) | Yan profil | Vücut hizası, dirsek açısı, derinlik, tempo |
| Dambıl Biceps Curl | Ön ¾ açı | Üst kol stabilitesi, vücut sallama, ROM, tempo |

## Dokümantasyon

Detaylı tasarım dokümanları `docs/` klasöründe:

1. [Vizyon ve Kapsam](docs/01-vizyon-ve-kapsam.md) — Hedef kitle, MVP sınırları, başarı kriterleri
2. [Egzersiz Spesifikasyonları](docs/02-egzersiz-spekleri.md) — Her egzersiz için biyomekanik kurallar ve kaynaklar
3. [Mimari](docs/03-mimari.md) — Eklenti tabanlı sistem tasarımı, ileriye dönük genişleme
4. [Teknoloji Yığını](docs/04-teknoloji-yigini.md) — Seçimler ve gerekçeler
5. [Yol Haritası](docs/05-yol-haritasi.md) — 10 haftalık plan
6. [Doğrulama Planı](docs/06-dogrulama-plani.md) — Test ve uzman onayı stratejisi
7. [Set Sonu Özet Ekranı](docs/07-set-sonu-ekrani.md) — Summary UI tasarımı, visualizasyonlar, eylem CTA'ları

## Teknoloji Özeti

- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **Computer Vision:** MediaPipe Tasks Vision (tarayıcıda WASM, 33 vücut noktası)
- **State:** Zustand
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Test:** Vitest
- **Deployment:** Vercel (free tier)

**Toplam maliyet: 0 TL.**

## Mevcut Durum

Planlama fazı. Kod henüz yok — önce tasarım dokümanları, sonra implementasyon.

## Sonraki Adım

`docs/05-yol-haritasi.md` → Hafta 1: Next.js + MediaPipe kurulumu, ilk iskelet overlay.
