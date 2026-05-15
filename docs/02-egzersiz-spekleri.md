# 02 — Egzersiz Spesifikasyonları

Her egzersiz için: kamera açısı, kullanılan vücut noktaları, kural seti (geometrik tanım + eşik değerleri + biyomekanik gerekçe), state machine, geri bildirim mesajları.

## MediaPipe Pose Landmark Referansı

MediaPipe Tasks Vision Pose Landmarker 33 nokta tespit eder. Bu doküman boyunca kullanılan indeksler:

| İndeks | Nokta |
|---|---|
| 0 | Burun |
| 11 / 12 | Sol / Sağ omuz |
| 13 / 14 | Sol / Sağ dirsek |
| 15 / 16 | Sol / Sağ bilek |
| 23 / 24 | Sol / Sağ kalça |
| 25 / 26 | Sol / Sağ diz |
| 27 / 28 | Sol / Sağ ayak bileği |
| 29 / 30 | Sol / Sağ topuk |
| 31 / 32 | Sol / Sağ ayak başparmağı |

**Koordinat sistemi:** MediaPipe normalize edilmiş koordinatlar verir: `x ∈ [0,1]` (sola=0, sağa=1), `y ∈ [0,1]` (yukarı=0, aşağı=1), `z` = derinlik. Bu dokümanda `y` arttıkça aşağı yönde kabul edilir.

**Confidence:** Her landmark'ın `visibility` skoru vardır (0-1). 0.5'in altındaki noktalar güvenilmez kabul edilir.

---

## 1. BODYWEIGHT SQUAT

### Kamera Açısı: Yan Profil (90°)
Kullanıcı kameraya yan duracak. Sol veya sağ taraf kameraya dönük, fark etmez. Sistem otomatik olarak hangi tarafın daha görünür olduğunu tespit edip o tarafın landmark'larını kullanır.

**Yerleşim talimatları (kullanıcıya animasyonla gösterilecek):**
- Kameradan **2 metre** uzakta dur
- Kamera **kalça yüksekliğinde** (~90 cm) olsun
- Sehpa, masa veya sandalye üstüne koy
- Vücudun **tamamı kareye sığsın** (baş üstü → ayak tabanı)
- Arkanda dağınık nesne olmasın (tespit doğruluğu için)

**Otomatik kontroller (yeşil ışık öncesi):**
- Landmark'lar 11, 23, 25, 27 (omuz, kalça, diz, ayak) hepsi visible > 0.7
- Vücut yatay genişliği (ankle_x − shoulder_x) çerçevenin %30'undan az → yan profilde
- Vücut çerçeve içinde (margin > 5%)

### Kullanılan Noktalar
- Omuz (11 veya 12) → torso üst referansı
- Kalça (23 veya 24) → torso alt + üst bacak başlangıcı
- Diz (25 veya 26)
- Ayak bileği (27 veya 28)
- Topuk (29 veya 30) — opsiyonel, tempo için

### Kurallar

#### R1: Derinlik (Squat Depth)
**Tanım:** Repsin en alt noktasında, kalçanın diz hizasına veya altına inmesi.

**Hesaplama:**
```
en_alt_kalca_y = max(hip_y_over_rep)
diz_y_o_anda = knee_y at the same frame
depth_ratio = en_alt_kalca_y - diz_y_o_anda

# y aşağı arttığı için kalça aşağı indikçe y artar
# kalça diz altına indi ↔ kalca_y >= diz_y ↔ depth_ratio >= 0
```

**Seviyeler:**
- **Yeşil:** depth_ratio ≥ 0.01 (paralel veya altı, "ass to grass" gerekmez)
- **Sarı:** -0.03 ≤ depth_ratio < 0.01 (paralele yakın ama tam değil)
- **Kırmızı:** depth_ratio < -0.03 (yarım squat)

**Bilimsel temel:**
Schoenfeld (2010) — paralel veya altı derinlik tüm alt vücut kaslarını optimal aktive eder. Yarım squat'lar sadece quadriceps'i hedefler ve ROM eksikliği nedeniyle uzun vadede zayıf hareket alışkanlığı oluşturur.

**Geri bildirim:**
- Sarı: "Biraz daha derine in — kalçan dizinin hizasına gelsin"
- Kırmızı: "Yeterince inmiyorsun. Kalçanı dizlerinin hizasına veya altına indir"

#### R2: Sırt Eğimi (Torso Forward Lean)
**Tanım:** Repsin en alt noktasında torso'nun dikey eksenle yaptığı açı.

**Hesaplama:**
```
torso_vector = (shoulder_x - hip_x, shoulder_y - hip_y)
vertical = (0, -1)
lean_angle = acos(dot(torso_vector, vertical) / |torso_vector|)
```

**Seviyeler:**
- **Yeşil:** 25° ≤ lean_angle ≤ 50°
- **Sarı:** 50° < lean_angle ≤ 65°
- **Kırmızı:** lean_angle > 65° (aşırı öne eğilme)

**Bilimsel temel:**
McKean et al. (2010) — bodyweight squatta normal forward lean 30-45° aralığında, ankle dorsifleksiyonu sınırlı olan kişilerde 50°'ye kadar normal. 65° üzeri eğilme alt sırta aşırı yük bindirir ve squat'tan çok good morning hareketine dönüşür.

**Geri bildirim:**
- Sarı: "Göğsünü biraz daha dik tut"
- Kırmızı: "Çok öne eğiliyorsun. Göğsünü yukarı doğrult, kalçanı geri it"

#### R3: Diz Pozisyonu (Knee Position)
**Tanım:** Repsin en alt noktasında diz X koordinatının ayak bileği X koordinatına göre konumu.

**Hesaplama:**
```
knee_forward = (knee_x - ankle_x) / shin_length
where shin_length = sqrt((knee_x - ankle_x)² + (knee_y - ankle_y)²)
```

**Seviyeler:**
- **Yeşil:** -0.2 ≤ knee_forward ≤ 0.5 (normal aralık)
- **Sarı:** 0.5 < knee_forward ≤ 0.8
- **Kırmızı:** knee_forward > 0.8 (aşırı öne, muhtemelen topuk kalkışı var)

**Bilimsel temel:**
Fry et al. (2003) — "diz parmak ucunu geçmemeli" kuralı **bilimsel olarak güncel değil**. Modern konsensüs: knee forward translation normal ve gereklidir, ankle dorsifleksiyonu olan kişilerde diz parmağı geçer. Yalnızca aşırı durumlar (topuk kalkışı ile birlikte) sorunludur. Bu nedenle eşiklerimiz toleranslı.

**Geri bildirim:**
- Sarı: "Dizin biraz fazla öne kaçıyor — topuğun yerden kalkıyor olabilir"
- Kırmızı: "Topuğun yerden kalkıyor olabilir. Kalçanı geri itmeye odaklan"

#### R4: Tempo (Eccentric Control)
**Tanım:** İniş süresinin kalkış süresine oranı.

**Hesaplama:**
```
eccentric_frames = (BOTTOM state'e giriş) - (DESCENDING state'e giriş)
concentric_frames = (TOP state'e dönüş) - (BOTTOM state'ten çıkış)
tempo_ratio = eccentric_frames / concentric_frames
```

**Seviyeler (per rep değerlendirme, anlık değil):**
- **Yeşil:** tempo_ratio ≥ 1.5 (kontrollü iniş)
- **Sarı:** 1.0 ≤ tempo_ratio < 1.5
- **Kırmızı:** tempo_ratio < 1.0 (iniş kalkıştan hızlı, kontrolsüz)

**Geri bildirim:** "Daha kontrollü in — aşağıya en az 2 saniyede in"

#### R5: Topuk Kalkışı (Heel Lift)
**Tanım:** İniş ve dip fazlarında topuğun yerden kalkıp kalkmadığı. Topuk kalkışı genellikle ankle dorsifleksiyonu yetersizliğine işaret eder ve aşırı öne eğilmeyle birlikte gelir.

**Hesaplama:**
```
baseline_heel_y = heel_y (ilk DESCENDING frame'inde)
min_heel_y = iniş + dip boyunca min(heel_y) # en yüksek topuk konumu
heel_lift = baseline_heel_y - min_heel_y # pozitif = topuk yukarı kalktı
shin_length = |knee_y - ankle_y| (baseline frame'de)
heel_lift_ratio = heel_lift / shin_length
```

**Seviyeler:**
- **Yeşil:** heel_lift_ratio < 0.03 (topuk sağlam yerde)
- **Sarı:** 0.03 ≤ heel_lift_ratio < 0.08
- **Kırmızı:** heel_lift_ratio ≥ 0.08 (belirgin topuk kalkışı)

**Bilimsel temel:**
Bone et al. (2013) — yetersiz ankle dorsifleksiyonu (< 35°) olan kişiler bodyweight squat'ta topuk kalkışı yaşar. Çözümler: ankle mobility çalışması veya heel elevation (topuk altına 1-2 cm yükselti).

**Geri bildirim:**
- Sarı: "Topuğun yerden hafif kalkıyor — ankle mobilizene çalış"
- Kırmızı: "Topuğun yerden kalkıyor — daha az derine in veya topuğun altına ince kitap koy"

#### R6: Alt Nokta Duraksaması (Bottom Pause)
**Tanım:** Repsin en alt noktasında kısa duraklama. Momentum yerine kontrol göstergesidir.

**Hesaplama:**
```
BOTTOM state'inde ardışık kaç frame |hip_y_velocity| < 0.005 (per-frame normalize edilmiş)?
30 FPS'de 3 frame = 100ms.
```

**Seviyeler:**
- **Yeşil:** pause_frames ≥ 3 (≥100ms duraklama)
- **Sarı:** 1 ≤ pause_frames ≤ 2 (kısa)
- **Kırmızı:** pause_frames = 0 (bouncing, momentum kullanımı)

**Bilimsel temel:**
Stretch-shortening cycle'ı sınırlamak için kısa pause; momentum hilesi yerine kasla yukarı itme. Powerlifting standardı "pause squat" buradan gelir — acemiye uyarlanmış versiyonu kısa duraklama yeterli.

**Geri bildirim:**
- "Squat'ın dibinde 1 saniye dur — momentum kullanma, kontrolle yukarı çık"

### State Machine
```
States: STANDING → DESCENDING → BOTTOM → ASCENDING → STANDING (rep++)

Transitions:
- STANDING → DESCENDING: hip_y artmaya başladı (≥3 frame consistent)
- DESCENDING → BOTTOM: hip_y velocity ≈ 0 (3 frame'de değişim < eşik)
- BOTTOM → ASCENDING: hip_y azalmaya başladı
- ASCENDING → STANDING: hip_y, standing baseline'a ≤ %5 yaklaştı (rep tamamlandı)

Standing baseline: oturum başında 1 saniyelik kalibrasyon ile alınır.
```

### Tekrar Bittiğinde Üretilen Özet
- Derinlik (en alt nokta) //
- Maks sırt eğim açısı //
- Diz pozisyonu //
- Tempo //
- Hangi an'da en büyük hata yapıldı (timestamp)

---

## 2. ŞINAV (PUSH-UP)

### Kamera Açısı: Yan Profil, Düşük Yükseklik
Kullanıcı yere paralel duracak şekilde push-up pozisyonu alır. Kamera yan tarafta, yere yakın.

**Yerleşim talimatları:**
- Kameradan **2.5 metre** uzakta yere uzan
- Kamera **yere çok yakın** (~30 cm yükseklik)
- Yastık üstüne telefon koy veya yan döndürülmüş laptop ekranına bak
- Tüm vücudun kareye sığması için kamera **yatay** olsun
- Modified (diz yerde) versiyon da desteklenir, sistem otomatik tespit eder

**Otomatik kontroller:**
- Omuz, kalça, ayak bileği (veya diz) hepsi visible > 0.7
- Vücut yatay (omuz_y ≈ ayak bileği_y → aralarındaki dikey fark vücut uzunluğunun %15'inden az)

### Kullanılan Noktalar
- Omuz (11/12)
- Dirsek (13/14)
- Bilek (15/16)
- Kalça (23/24)
- Diz (25/26) — modified versiyon tespiti için
- Ayak bileği (27/28)

### Kurallar

#### R1: Vücut Hizası (Body Line)
**Tanım:** Omuz–kalça–ayak bileği üç noktası bir düz çizgi üzerinde olmalı.

**Hesaplama:**
```
shoulder, hip, ankle koordinatları
# Hip'in shoulder-ankle çizgisinden dikey uzaklığı:
line_length = distance(shoulder, ankle)
hip_deviation = perpendicular_distance(hip, line(shoulder, ankle))
deviation_ratio = hip_deviation / line_length

# Yön tespiti: hip çizginin üstünde mi altında mı?
# Üstünde = pike (kalça yukarı), altında = sag (kalça aşağı)
```

**Seviyeler:**
- **Yeşil:** deviation_ratio < 0.04
- **Sarı:** 0.04 ≤ deviation_ratio < 0.08
- **Kırmızı:** deviation_ratio ≥ 0.08

**Bilimsel temel:**
NSCA push-up standardı — vücut başından topuğa düz bir çizgi olmalı. Hip sag (kalça çökmesi) alt sırta yük bindirir; hip pike (kalça yükselmesi) hareket aralığını azaltır ve gerçek bir push-up değildir.

**Geri bildirim:**
- Sag (kalça aşağı, kırmızı): "Kalçan çöküyor — karın kaslarını sıkıp düz tut"
- Pike (kalça yukarı, kırmızı): "Kalçan yukarı kaçıyor — vücudunu düz çizgi yap"

#### R2: Dirsek Açısı (Elbow Tuck)
**Tanım:** En alt noktada üst kolun vücuda göre açısı.

**Hesaplama:**
```
upper_arm_vector = (elbow_x - shoulder_x, elbow_y - shoulder_y)
torso_vector = (hip_x - shoulder_x, hip_y - shoulder_y)
elbow_flare = angle_between(upper_arm_vector, torso_vector)
# 90° = dirsekler tamamen açık (T şekli)
# 0° = dirsekler vücuda yapışık
```

**Seviyeler:**
- **Yeşil:** 30° ≤ elbow_flare ≤ 60° (orta tuck, omuz sağlığı için optimal)
- **Sarı:** 60° < elbow_flare ≤ 80° veya 15° ≤ elbow_flare < 30°
- **Kırmızı:** elbow_flare > 80° (tamamen açık, omuz riski) veya < 15° (aşırı dar)

**Bilimsel temel:**
Cogley et al. (2005) — el pozisyonu çalışması; dirsek açısı 45° civarında genel kullanım için en güvenli aralık. 90° (tam açık) acemi push-up'larda omuz impingement riskini artırır.

**Geri bildirim:**
- "Dirseklerin çok açık — vücuduna 45° açıyla yaklaştır, T şekli yapma"

#### R3: Derinlik (Push-up Depth)
**Tanım:** En alt noktada omzun dirseğe göre Y pozisyonu.

**Hesaplama:**
```
en_alt_omuz_y = max(shoulder_y_over_rep)
dirsek_y_o_anda = elbow_y at the same frame
depth_diff = en_alt_omuz_y - dirsek_y_o_anda
# Pozitif = omuz dirseğin altına inmiş = derinlik yeterli
```

**Seviyeler:**
- **Yeşil:** depth_diff ≥ 0 (omuz dirsek hizasına veya altına)
- **Sarı:** -0.02 ≤ depth_diff < 0
- **Kırmızı:** depth_diff < -0.02 (yarım push-up)

**Geri bildirim:**
- "Daha aşağıya in — göğsünü dirseklerin hizasına getir"

#### R4: Tempo (Squat ile aynı mantık)
Eccentric (iniş) ≥ 1.5 × concentric (kalkış)

#### R5: Boyun ve Baş Pozisyonu (Neck Alignment)
**Tanım:** Baş ve boynun vücut çizgisinde nötr kalması. Aşırı baş düşürme (chin to chest) veya kaldırma (boyun arkaya) servikal stres yaratır.

**Hesaplama:**
```
spine_vector = (hip_x - shoulder_x, hip_y - shoulder_y)
head_vector = (nose_x - shoulder_x, nose_y - shoulder_y)
# İdeal: head omuzdan baş yönüne, vücudun tersine uzanır
neck_angle = angle_between(-spine_vector, head_vector)
# 0° = baş tam vücut hizasında
# pozitif = baş yukarı, negatif = baş aşağı
```

**Seviyeler:**
- **Yeşil:** -15° ≤ neck_angle ≤ 25° (nötr)
- **Sarı:** -30° ≤ neck_angle < -15° (baş hafif düşük) veya 25° < neck_angle ≤ 45° (baş hafif yukarı)
- **Kırmızı:** neck_angle < -30° (chin to chest) veya neck_angle > 45° (boyun aşırı arkaya)

**Bilimsel temel:**
NSCA push-up tekniği rehberi — "neutral head, eyes look at floor slightly forward". Servikal lordosis stresi acemilerde yaygın hata, uzun vadede boyun sorunu.

**Geri bildirim:**
- Sarı: "Boynunu nötr tut — yere doğru hafif bak"
- Kırmızı: "Boynunu zorlama — başını ne yere düşür ne yukarı kaldır"

#### R6: Üst Nokta Duraksaması (Lockout Pause)
**Tanım:** Repsin en üst noktasında (kollar tam uzantıda) kısa duraklama. Kontrolsüz drop'u engeller.

**Hesaplama:**
```
TOP state'inde (elbow_angle > 160°) ardışık kaç frame:
 - |shoulder_y_velocity| yakın sıfır
 - elbow_angle değişimi minimal
30 FPS'de 3 frame = 100ms.
```

**Seviyeler:**
- **Yeşil:** pause_frames ≥ 3
- **Sarı:** 1 ≤ pause_frames ≤ 2
- **Kırmızı:** pause_frames = 0 (sürekli akış, kontrolsüz iniş)

**Geri bildirim:**
- "Yukarıda kollarını tam uzat ve kısa bir an dur — sonra kontrollü in"

### State Machine
```
States: TOP → DESCENDING → BOTTOM → ASCENDING → TOP (rep++)

Transitions (elbow açısı ile takip):
- TOP: dirsek açısı > 160°
- DESCENDING: dirsek açısı azalıyor
- BOTTOM: dirsek açısı velocity ≈ 0, minimum noktada
- ASCENDING: dirsek açısı artıyor
- TOP'a dönüş: dirsek açısı > 160°

Modified push-up: diz_y ≈ ayak_bileği_y ise diz yerde, normal push-up için
ayak referansı yerine diz referansı kullan.
```

---

## 3. DAMBIL BICEPS CURL

### Kamera Açısı: Ön ¾ Açı
Kullanıcı kameraya hafif yan dönük (yaklaşık 30-45° açıyla). Tek kollu curl'lerde dambılı tutan kolun tarafı kameraya yakın.

**Yerleşim talimatları:**
- Kameradan **2 metre** uzakta ayakta dur
- Kamera **göğüs yüksekliğinde** (~120 cm)
- Vücudunun **hafif yan döndüğünü** anlamak için: kameraya bakıyorsun ama omuzların 30-45° açıyla
- Üst vücut + kalça hizan kareye sığmalı (ayaklara kadar gerekmiyor)
- Curl yaparken hangi kolla başlayacaksan o kol kameraya yakın olsun

**Otomatik kontroller:**
- Omuz (11), dirsek (13), bilek (15) — aktif kol — hepsi visible > 0.7
- Kalçalar (23, 24) ikisi de visible > 0.5 (vücut sallama tespiti için)
- Aktif kol omuzu dış kol omuzdan daha çok görünür olmalı

### Kullanılan Noktalar
- Aktif kol omuz, dirsek, bilek
- Her iki kalça (gövde sallama tespiti)
- Boyun (0) — başın hareketi izlenir (sallama doğrulama)

### Kurallar

#### R1: Üst Kol Stabilitesi (Upper Arm Stability)
**Tanım:** Rep boyunca dirseğin X pozisyonu sabit kalmalı. Dirseğin öne kaçması = front delts ile yardım = cheat.

**Hesaplama:**
```
rep_baslangic → rep_son boyunca:
 elbow_x_values = [elbow_x at every frame]
 upper_arm_length = mean(distance(shoulder, elbow))
 stability_ratio = stdev(elbow_x_values) / upper_arm_length
```

**Seviyeler:**
- **Yeşil:** stability_ratio < 0.05
- **Sarı:** 0.05 ≤ stability_ratio < 0.10
- **Kırmızı:** stability_ratio ≥ 0.10

**Bilimsel temel:**
Biseps tek başına curl hareketinde dirseği omuzdan ayırmaz — bu hareket biseps izolasyonunu kaybeder ve front deltoid'i devreye sokar. Klasik koçluk hatası.

**Geri bildirim:**
- "Dirseğin oynuyor — vücuduna sabit tut, sadece ön kolun hareket etsin"

#### R2: Vücut Sallama (Body Sway / Cheating)
**Tanım:** Kalçanın ve omzun X-Z pozisyonu rep boyunca sabit kalmalı. Sallanma = momentum kullanma = cheat.

**Hesaplama:**
```
rep boyunca:
 hip_center_x = (left_hip_x + right_hip_x) / 2
 shoulder_center_x = (left_shoulder_x + right_shoulder_x) / 2
 hip_sway = stdev(hip_center_x) / hip_width
 shoulder_sway = stdev(shoulder_center_x) / shoulder_width
 max_sway = max(hip_sway, shoulder_sway)
```

**Seviyeler:**
- **Yeşil:** max_sway < 0.03
- **Sarı:** 0.03 ≤ max_sway < 0.06
- **Kırmızı:** max_sway ≥ 0.06

**Geri bildirim:**
- "Vücudun sallıyor — hile yapıyorsun. Daha hafif bir ağırlıkla dene"

#### R3: Hareket Aralığı (Range of Motion)
**Tanım:** Dirsek açısı tam ekstansiyona (kol düz) ve tam fleksiyona (top contraction) ulaşmalı.

**Hesaplama:**
```
elbow_angle = angle(shoulder, elbow, wrist)
rep_max_extension = max(elbow_angle_over_rep) # kol en düz
rep_max_flexion = min(elbow_angle_over_rep) # kol en bükülü
```

**Seviyeler:**
- **Yeşil:** max_extension > 160° AND max_flexion < 50°
- **Sarı:** max_extension > 145° AND max_flexion < 70°
- **Kırmızı:** ikisinden biri başarısız

**Bilimsel temel:**
Tam ROM ile çalışmak biceps brachii'nin tüm uzunluğunda gerilim üretir. Partial reps ile sadece orta aralıkta kalmak büyüme potansiyelini azaltır (Schoenfeld & Grgic, 2020).

**Geri bildirim:**
- "Kolunu tamamen uzat ve sonra tamamen büküp tepeye çıkar — yarım yapma"

#### R4: Tempo
Eccentric (indirme) ≥ 1.5 × concentric (kaldırma). Eccentric kontrolsüzlük = ağırlığın düşmesi.

#### R5: Omuz Stabilitesi (Shoulder Elevation)
**Tanım:** Curl yaparken omzun yukarı kalkmaması. Omuz elevation = trapezius kompansasyonu = biceps izolasyonu kaybı.

**Hesaplama:**
```
baseline_shoulder_y = shoulder_y (rep başlangıcında, kol uzantıda)
min_shoulder_y = rep boyunca min(shoulder_y) # en yüksek omuz konumu
elevation = baseline_shoulder_y - min_shoulder_y # pozitif = omuz kalktı
upper_arm_length = mean(|shoulder - elbow|) rep boyunca
elevation_ratio = elevation / upper_arm_length
```

**Seviyeler:**
- **Yeşil:** elevation_ratio < 0.05
- **Sarı:** 0.05 ≤ elevation_ratio < 0.10
- **Kırmızı:** elevation_ratio ≥ 0.10 (belirgin shrug, trap devreye girdi)

**Bilimsel temel:**
Biceps brachii izolasyonu için scapular depression (omuz aşağıda) korunmalı. Acemilerde upper trap kompansasyonu yaygın — kuvvet biceps yerine trap'e kayar, hareketin amacı bozulur.

**Geri bildirim:**
- "Omuzun yukarı kalkıyor — omuzlarını rahat aşağıda tut, sadece dirseğini bük"

#### R6: Tepe Kontraksiyon Duraklaması (Peak Contraction Pause)
**Tanım:** Repsin tepe noktasında (kol tam bükülü) kısa duraklama. "Squeeze the biceps" prensibi.

**Hesaplama:**
```
FLEXED state'inde (elbow_angle < 60°) ardışık kaç frame:
 elbow_angle değişimi < 2° per frame (stable hold)
30 FPS'de 3 frame = 100ms.
```

**Seviyeler:**
- **Yeşil:** pause_frames ≥ 3
- **Sarı:** 1 ≤ pause_frames ≤ 2
- **Kırmızı:** pause_frames = 0 (yön anlık değişiyor, gerilim kayboluyor)

**Geri bildirim:**
- "Tepede 1 saniye biseps'ini sık — sonra kontrollü indir"

### State Machine
```
States: EXTENDED → LIFTING → FLEXED → LOWERING → EXTENDED (rep++)

Transitions (elbow açısı ile):
- EXTENDED: elbow_angle > 150°
- LIFTING: elbow_angle azalıyor
- FLEXED: elbow_angle < 60° (peak contraction)
- LOWERING: elbow_angle artıyor
- EXTENDED'a dönüş: elbow_angle > 150° (rep tamamlandı)
```

---

## Ongoing Setup Monitoring

SetupWizard sadece oturum başında çalışır. Set boyunca sistem **sessiz arka plan kontrolleri** yapar:

### Kontroller (her 2 saniyede bir, kullanıcı görmez)
- **Görünürlük:** Gerekli landmark'lar hâlâ visibility > 0.5 mı?
- **Çerçeve içi:** Kritik noktalar çerçevenin %5-95 aralığında mı?
- **Açı doğru mu:** Yan profil bekleniyorsa omuz-kalça yatay mesafesi makul mü?
- **Aydınlatma:** Frame'in ortalama parlaklığı yeterli mi (> 0.3 normalize) ?

### Tetikleyici Davranış
- Bir kontrol **3 saniyedir** başarısızsa → soft warning (üstte sarı bant)
- **10 saniyedir** başarısızsa → set pause, setup yeniden başlat

### Mesajlar
- "Çerçeveden çıktın — geri gel"
- "Kameranın açısı bozulmuş — yeniden ayarlamak ister misin?"
- "Işık karardı — daha aydınlık bir yere geç"

---

## Simetri Hakkında Not (Yan Profil Sınırlamaları)

MVP'de squat ve push-up **yan profilden** çekildiği için bazı simetri analizleri **güvenilir değildir**.

### Tespit edilemez (yan profil):
- Diz valgus (içe kayma) — önden bakılması gerekir
- Sol/sağ ROM farkı (asimetrik depth) — z-derinlik gürültülü
- Push-up'ta omuz simetrisi (bir tarafın çökmesi)

### Tespit edilebilir (sınırlı):
- **Pelvis tilt:** Yan profilden sol-sağ kalça Y farkı görülebilir (eğik leğen kemiği)
- **Curl bilateral:** Ön ¾ açıdan iki kolu sırayla yapan kullanıcı için kıyaslama

### MVP Kararı
- **MVP'de simetri analizi yapılmaz** — yan profile dayalı güvensiz sonuçlar üretir
- **v2:** Çoklu açı seçeneği geldiğinde **gerçek simetri analizi** eklenir (kullanıcı önden çekim de yükleyebilir)
- **MVP'de telafi:** Set sonu özetinde bilgilendirici not: "Daha detaylı simetri analizi sonraki sürümde önden çekim seçeneğiyle gelecek"

---

## Set Seviyesi Analizler (M-Metrikleri)

Per-rep kurallar **anlık** kontrol içindir. **Set sonunda** rep'leri agreggate eden metrikler hesaplanır. Bu metrikler set sonu özet ekranının özünü oluşturur (detay için bkz. `07-set-sonu-ekrani.md`).

### M1: Set Tutarlılığı (Consistency Score)
Her kuralın tüm rep'lerdeki ölçüm değerlerinin variyansı.

```
Her kural R için:
 values = [R'nin her rep'teki ölçüm değeri]
 consistency_R = 1 / (1 + stdev(values) / mean(|values|)) # 0-1, 1 = mükemmel tutarlı

overall_consistency = mean(consistency_R, tüm kurallar)
```

**Gösterim:** "Set tutarlılığın: 87%"

### M2: Yorgunluk Tespiti (Fatigue Detection)
Set'in ikinci yarısında form bozulması.

```
Her kural R için:
 first_half_avg = avg(R'nin ilk N/2 rep değeri)
 second_half_avg = avg(R'nin son N/2 rep değeri)
 degradation_R = (second_half_avg - first_half_avg) / first_half_avg

Kuralların çoğunluğunda > %10 bozulma → yorgunluk uyarısı.
```

**Gösterim:** "Yorgunluk: son rep'lerde formun bozuldu. Set'lerini biraz kısalt."

### M3: Best / Worst Rep
Her rep için overall score:
```
rep_score = (green_count × 1 + yellow_count × 0.5 + red_count × 0) / total_rules
```

- **Best rep:** max(rep_score) — vurgulu gösterilir
- **Worst rep:** min(rep_score) — düzeltme noktası olarak işaretlenir

### M4: Set Skoru (Overall Score)
Setin genel performansı, motivasyon için.

```
multiplier = 0.7 + 0.3 × overall_consistency
final_score = round(mean(rep_scores) × multiplier × 100)
```

**Gösterim:** Büyük 0-100 rakam, renk bandı (< 60 kırmızı, 60-79 sarı, ≥ 80 yeşil).

### M5: En Sık Hata
Tüm rep'lerde en fazla ihlal edilen kural.

```
violation_count[R] = sum(rep_violations.count(R) for each rep)
most_common = argmax(violation_count)
```

**Gösterim:** "5 rep'in 4'ünde **derinlik** yetersizdi. Ana çalışman gereken alan bu."
Bu metrik **öneri sözlüğüyle** birleşir → kullanıcıya somut iyileştirme önerisi.

---

## Öneri Sözlüğü (Recommendation Dictionary)

Her kural ihlali için **neden olabilir** + **nasıl iyileştirilir** bilgisi. Set sonu ekranında M5 (en sık hata) ile birlikte gösterilir.

### Yapı
```typescript
interface Recommendation {
 ruleId: string // 'squat.depth', 'curl.shoulder-elevation' vb.
 shortLabel: string // "Derinlik"
 likelyCauses: string[] // 1-3 olası sebep
 fixes: string[] // 1-3 pratik öneri
 drills?: { title: string; description: string }[]
}
```

### MVP Sözlüğü (12 hata × öneri)

**squat.depth.shallow (Yarım Squat)**
- Sebepler: Ankle dorsifleksiyon eksikliği, kalça mobilite, korku, zayıf quad
- Öneriler: Ankle mobility (duvar dorsifleksiyon × 10/gün), heel-elevated squat, box squat (sandalye)

**squat.forward-lean (Aşırı Öne Eğilme)**
- Sebepler: Zayıf core, ankle mobilite, kalça mobilite
- Öneriler: Goblet squat (önde dambıl), foam roll thoracic spine, plank serisi

**squat.knee-forward (Diz Aşırı Öne)**
- Sebepler: Topuk kalkışı, kalça aşağıya değil öne giden hareket
- Öneriler: "Sit back" cue'su — kalçanı sandalyeye otururmuş gibi geri it

**squat.heel-lift (Topuk Kalkışı)**
- Sebepler: Ankle dorsifleksiyon kısıtlılığı
- Öneriler: Çıplak ayak veya düz tabanlı ayakkabı, heel elevation, günlük calf stretch

**squat.bottom-pause (Bouncing)**
- Sebepler: Momentum alışkanlığı, kontrolsüz iniş
- Öneriler: Tempo squat (3 sn iniş, 1 sn dur, 1 sn kalk)

**pushup.body-line (Kalça Çökmesi/Yükselmesi)**
- Sebepler: Zayıf core, vücut yorgun
- Öneriler: Plank (3 × 30 sn), modified push-up (diz yerde), "ribs down" cue'su

**pushup.elbow-flare (Dirsek Aşırı Açık)**
- Sebepler: Eller çok geniş, omuz mobilite yetersiz
- Öneriler: Eller omuz genişliğinde, "squeeze elbows toward ribs" cue'su

**pushup.depth (Yarım Şınav)**
- Sebepler: Zayıf, korku, ROM kısıtlı
- Öneriler: Modified push-up (diz), incline push-up (eller masaya), negative-only

**pushup.neck (Boyun Hatalı)**
- Sebepler: Bilinçsiz alışkanlık
- Öneriler: "Yere bak, başını dik tutma" cue'su, video kayıt al kendini izle

**curl.body-sway (Vücut Sallama)**
- Sebepler: Çok ağır dambıl, momentum hilesi
- Öneriler: %20 daha hafif dambıl, sırt duvarda curl, concentration curl (oturarak)

**curl.shoulder-elevation (Omuz Yukarı)**
- Sebepler: Çok ağır, upper trap kompansasyonu
- Öneriler: Daha hafif ağırlık, "shoulders down and back" cue'su, wall-anchored curl

**curl.rom (Yarım ROM)**
- Sebepler: Çok ağır, ego, ROM bilinçsizliği
- Öneriler: %30 daha hafif → tam ROM, full extension'da 1 sn dur

---

## Genel Tasarım Notları

### Eşik Değerlerinin Kaynağı
Yukarıdaki tüm eşik değerleri **başlangıç önerileridir**. Hafta 9'daki uzman geri bildirim oturumunda **ayarlanacaktır**. Kod tarafında bu değerler `exerciseDefinition.thresholds` objesinde tutulur — kod değişmeden ince ayar yapılabilir.

### Confidence Filtering
Her landmark için `visibility < 0.5` ise o frame **kuraldan dışlanır**. Bu durum 5+ frame sürerse kullanıcıya uyarı: "Vücudunu kareye al" / "Daha iyi ışık".

### Smoothing
Tek frame'lik gürültü kuralları yanlış tetiklemesin diye kritik metrikler **3-frame moving average** ile yumuşatılır. Ham veri rep özetinde de tutulur (analiz için).

### Geri Bildirim Önceliği
Aynı anda birden fazla kural ihlal ediliyorsa **şu öncelik**:
1. Güvenlik (sırt yuvarlanması, omuz riski) — her zaman göster
2. Form temelleri (derinlik, ROM)
3. İnce ayar (tempo, küçük açı sapmaları)

Aynı anda **maksimum 1 ana mesaj** gösterilir. Mesaj cooldown: 2 saniye (aynı mesaj her frame'de blink etmesin).

---

## Bilimsel Kaynaklar

- **Schoenfeld, B. J. (2010).** Squatting Kinematics and Kinetics and Their Application to Exercise Performance. *Journal of Strength and Conditioning Research*, 24(12), 3497-3506.
- **Fry, A. C., Smith, J. C., & Schilling, B. K. (2003).** Effect of knee position on hip and knee torques during the barbell squat. *Journal of Strength and Conditioning Research*, 17(4), 629-633.
- **McKean, M. R., Dunn, P. K., & Burkett, B. J. (2010).** The lumbar and sacrum movement pattern during the back squat exercise. *Journal of Strength and Conditioning Research*, 24(10), 2731-2741.
- **Cogley, R. M., et al. (2005).** Comparison of muscle activation using various hand positions during the push-up exercise. *Journal of Strength and Conditioning Research*, 19(3), 628-633.
- **Schoenfeld, B. J., & Grgic, J. (2020).** Effects of range of motion on muscle development during resistance training interventions: A systematic review. *SAGE Open Medicine*.
- **NSCA (2016).** *Essentials of Strength Training and Conditioning*, 4th Edition. Human Kinetics.
- **ACE (2014).** *Personal Trainer Manual*, 5th Edition. American Council on Exercise.

Bu kaynaklar referans amaçlıdır; tam kural eşiklerinin son hali Hafta 9 uzman geri bildirimi ile kesinleşir.
