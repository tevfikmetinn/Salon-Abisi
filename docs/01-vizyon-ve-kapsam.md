# 01 — Vizyon ve Kapsam

## Problem

Spora yeni başlayan kişiler için "doğru form" öğrenmek pahalı, ulaşılması zor veya kafa karıştırıcı:

- **Mobil fitness uygulamalarının çoğu freemium** — temel özellikler bile abonelik istiyor (FitBod, Kemtai, Vay Sports).
- **YouTube videoları edilgen** — kişinin yaptığı egzersizi izleyip düzeltmiyor, sadece kendi yapan koçu gösteriyor.
- **Spor salonu eğitmeni pahalı** — başlangıçta tek seferlik bir görüş bile maliyetli.
- **Eve özel ekipman içeren çözümler erişilemez** — Tonal, Tempo gibi cihazlar pahalı, ülkemizde dağıtımı yok.

Sonuç: **Acemi insanlar yanlış formla çalışıyor, sakatlanıyor veya sonuç alamayıp vazgeçiyor.**

## Çözüm Önerisi

Tarayıcı tabanlı, kamerayı kullanan, **biyomekanik temelli geri bildirim veren** bir uygulama.

Anahtar fark: **Kara kutu bir ML modeli değil.** MediaPipe ile vücut noktalarını tespit eder, üzerine koçluk literatüründen alınmış geometrik kurallar uygular. Bu sayede sistem "yanlış" demez — *neyin neden yanlış olduğunu* söyler ve düzeltme önerir.

## Hedef Kullanıcı Personası

**"Spora yeni başlayan Ahmet"**
- 18-30 yaş arası, üniversite öğrencisi veya genç çalışan
- Evde çalışıyor (pandemi alışkanlığı kalıcı oldu) veya salona yeni gidiyor
- Bütçesi sınırlı, ücretli uygulamaları tercih etmiyor
- YouTube'dan videolarla öğrenmeye çalışıyor ama "ben bunu doğru mu yapıyorum?" sorusu var
- Bilgisayarı veya laptopu var, fitness için ekstra ekipman yok
- Belki 1 dambıl seti var (3-5 kg)
- Mahremiyet konusunda hassas (video buluta gitmesin)

**Bu uygulama Ahmet için tasarlanıyor — Olympic powerlifter için değil.**

## Tasarım Prensipleri (sıralı öncelik)

1. **Erişilebilirlik** — Ücretsiz, kayıt yok, install yok, link aç ve kullan.
2. **Mahremiyet** — Veri cihazdan çıkmaz. Bu pazarlama söylemi değil, mimari gereklilik (backend yok).
3. **Açıklanabilirlik** — Her geri bildirim *nedenli* ve *eyleme dönük* olmalı.
4. **Niş derinlik** — 100 yüzeysel egzersiz değil, 3 egzersiz kusursuz.
5. **Geleceğe genişleyebilirlik** — Yeni egzersiz eklemek 1 günlük iş olmalı, 1 haftalık değil.

## MVP Kapsamı: NE Var

### Egzersizler (3 tane)
- **Bodyweight Squat** (yan profil)
- **Şınav / Push-up** (yan profil, hem standart hem diz-yerde versiyonu)
- **Dambıl Biceps Curl** (ön ¾ açı, tek kol odaklı)

### Özellikler
- Canlı webcam analizi
- Yüklenen video analizi (MP4, WebM)
- Animasyonlu kamera yerleşim sihirbazı (her egzersiz için ayrı)
- Otomatik kamera kontrolü (vücut görünüyor mu, açı doğru mu, aydınlatma yeterli mi)
- Gerçek zamanlı iskelet overlay
- Vücut segmentlerinin renk kodu (yeşil = OK, sarı = uyarı, kırmızı = düzelt)
- Rep sayacı
- Rep sonrası yazılı geri bildirim ("3. tekrarda dizin içe kaydı")
- Set sonu özeti (kaç doğru rep, en sık hata)

### Teknik
- Tamamen client-side (tarayıcıda)
- Tek sayfa uygulama yok — Next.js multi-route
- Türkçe arayüz (i18n hazır altyapı, ileride İngilizce eklenebilir)
- Modern tarayıcı desteği (Chrome, Firefox, Safari, Edge - son 2 sürüm)
- Webcam izni gerektirir (video yükleme alternatifi var)

## MVP Kapsamı: NE YOK (açıkça)

Aşağıdakiler **MVP'de yok**. Hayır demek "yok" demek. v2/v3'e bırakılır.

- Mobil uygulama (web responsive var ama mobil-first değil)
- Kullanıcı hesabı, kayıt, giriş
- Geçmiş kayıtların depolanması (her oturum bağımsız)
- Antrenman programı, takvim, planlama
- Kalori takibi, kilo takibi, vücut ölçümleri
- Sosyal özellikler (paylaşım, arkadaş, lider tablosu)
- Çoklu açı seçimi (her egzersiz için tek en iyi açı dayatılır)
- Salon ekipmanı gerektiren egzersizler (bench press, lat pulldown, barfiks)
- Ağırlıklı squat / deadlift / overhead press (advanced, sakatlanma riski yüksek)
- Yoga / stretching / cardio analizi
- Ses komutu / sesli geri bildirim (v2)
- Çoklu kişi tespiti (tek kullanıcı kareye)
- Çoklu dil (Türkçe başlangıç)

## Başarı Kriterleri

### Fonksiyonel
- 3 egzersiz canlı modda çalışıyor, **<100ms gecikmeyle**
- Hatasız rep sayma oranı: **>%95**
- Bilinen hatalı formları tespit oranı (True Positive): **>%85**
- Hatasız form'u yanlış damgalama oranı (False Positive): **<%10**
- Modern laptop'ta **30+ FPS**, orta seviye'de 20+ FPS

### Kullanıcı Deneyimi
- **Yabancı bir kullanıcı** açıklama olmadan ilk repi 5 dakikada yapabilmeli
- Kamera setup'ı 1 dakikadan kısa
- 60 yaşındaki bir kullanıcının da kullanabilmesi (büyük yazı, net butonlar)

### Portfolyo / CV
- Canlı, paylaşılabilir URL (`formkocu.vercel.app` veya benzer)
- GitHub reposu: temiz commit history, dokümante edilmiş, README polish
- 30 saniyelik demo videosu (her egzersiz)
- En az **1 fitness eğitmeninden onay/yorum** (sosyal kanıt)
- LinkedIn post + Reddit r/sideproject paylaşımından **en az 50 kullanıcı**

## Sürüm Vizyonu (MVP sonrası)

### v2 (MVP + 2 ay)
- 5 ek egzersiz: plank, lunge, glute bridge, bird-dog, dambıl shoulder press
- Çoklu açı desteği (kullanıcı uygun açıyı seçer)
- Oturum geçmişi (IndexedDB, yine local)
- Sesli geri bildirim (Web Speech API)
- Mobil layout optimizasyonu (telefonu sehpaya koyarak kullanım için)

### v3 (uzun vade)
- ML enhancement: ince kalite skorları (rep "patlayıcılığı", simetri analizi)
- Opsiyonel kullanıcı hesabı (cloud sync, hâlâ encrypted)
- İngilizce dil desteği
- Egzersiz seçim API'si (geliştiriciler kendi egzersizlerini ekleyebilir)
- PWA olarak install edilebilir

## Kapsam Disiplini Sözleşmesi

> Geliştirme sırasında "şunu da ekleyelim mi?" dediğin her şey için:
> 1. **Bu MVP başarı kriterlerine katkı sağlıyor mu?** Hayırsa → v2 listesine yaz, MVP'ye ekleme.
> 2. **3 egzersizi daha iyi yapıyor mu yoksa kapsamı mı genişletiyor?** Genişletme ise → reddet.
> 3. **Eğitmen geri bildiriminden mi geldi?** O zaman ciddiye al.

Bu sözleşmeyi proje süresince yeniden okuyacağız.
