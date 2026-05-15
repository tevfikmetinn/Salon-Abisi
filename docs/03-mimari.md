# 03 — Mimari

## Temel Prensip: Eklenti Tabanlı Egzersiz Motoru

Sistem, "egzersiz" konseptini bir **veri yapısı** olarak tanımlar. Yeni bir egzersiz eklemek = yeni bir tanım dosyası yazmak. Çekirdek kod hiçbir değişiklik gerektirmez. Bu prensip, projenin uzun ömürlü olmasının anahtarıdır.

## Katmanlı Mimari

Bağımlılıklar tek yönlü akar: **UI → State → Engine → Adapters**. Aşağıdaki katman üstündekini bilmez.

```
┌──────────────────────────────────────────────┐
│ 1. UI Layer (React Components)               │  ← kullanıcının gördüğü
├──────────────────────────────────────────────┤
│ 2. State Management (Zustand stores)         │  ← UI ile core arasında köprü
├──────────────────────────────────────────────┤
│ 3. Exercise Engine                           │  ← saf TypeScript, test edilebilir
│    - Rule Evaluator                          │
│    - State Machine                           │
│    - Feedback Generator                      │
├──────────────────────────────────────────────┤
│ 4. Exercise Definitions (Plugins)            │  ← veri olarak egzersizler
├──────────────────────────────────────────────┤
│ 5. Adapters                                  │
│    - PoseDetector (MediaPipe wrapper)        │
│    - FrameSource (Webcam, Video)             │
└──────────────────────────────────────────────┘
```

## Katman Detayları

### 1. UI Layer (Next.js + React)

**Sorumluluğu:** Kullanıcıyla görsel iletişim.

**Ana komponentler:**
- `LandingPage` — Ne, kimler için, "Hadi Başla"
- `ExerciseSelector` — 3 egzersiz kartı
- `SetupWizard` — Animasyonlu kamera yerleşim sihirbazı
- `LiveAnalyzer` — Kamera + iskelet overlay + feedback paneli
- `SessionSummary` — Set sonu özeti

**İlke:** UI komponentleri **iş mantığı içermez**. Sadece state'i okur ve event tetikler. State store'ları üzerinden core ile konuşur.

### 2. State Management (Zustand)

**Sorumluluğu:** UI ile engine arasında veri akışı.

**Store'lar:**
```typescript
// usePoseStream: real-time landmark akışı
{
  currentLandmarks: Landmark[] | null,
  fps: number,
  isDetecting: boolean,
  startDetection: (source: FrameSource) => void,
  stopDetection: () => void,
}

// useExerciseSession: aktif egzersiz oturumu
{
  exerciseId: string | null,
  currentState: RepState,
  repCount: number,
  currentViolations: Violation[],
  repHistory: RepSummary[],
  startSession: (exerciseId: string) => void,
  endSession: () => SessionSummary,
}

// useCameraSetup: kalibrasyon durumu
{
  step: 'positioning' | 'lighting' | 'visibility' | 'ready',
  checks: SetupCheck[],
  isReady: boolean,
}
```

### 3. Exercise Engine (Pure TypeScript)

**Sorumluluğu:** Landmark stream'inden anlamlı bilgi üretmek. **Tarayıcıya bağımlı değil.**

**Modüller:**

#### `RuleEvaluator`
```typescript
class RuleEvaluator {
  evaluate(
    landmarks: Landmark[],
    exerciseDef: ExerciseDefinition,
    repContext: RepContext
  ): Violation[]
}
```
Her frame'de çağrılır. Tüm kuralları sırayla uygular, ihlal listesi döndürür.

#### `StateMachine`
```typescript
class RepStateMachine {
  transition(
    landmarks: Landmark[],
    currentState: RepState,
    exerciseDef: ExerciseDefinition
  ): { newState: RepState, repCompleted: boolean }
}
```
Rep fazlarını takip eder. Rep tamamlanınca event tetikler.

#### `FeedbackGenerator`
```typescript
class FeedbackGenerator {
  generate(violations: Violation[]): FeedbackMessage[]
  // Öncelik sıralaması + cooldown + max mesaj sayısı uygulanır
}
```

### 4. Exercise Definitions (Plugins)

**Sorumluluğu:** Bir egzersizin tüm karakteristiklerini veri olarak tutmak.

```typescript
interface ExerciseDefinition {
  id: string                       // 'squat', 'pushup', 'biceps-curl'
  displayName: string              // 'Bodyweight Squat'
  description: string
  cameraSetup: CameraSetupConfig   // açı, mesafe, talimatlar
  visibilityChecks: VisibilityCheck[]  // setup wizard için
  landmarks: LandmarkRequirement[] // hangi noktalar gerekli
  rules: Rule[]                    // tüm form kuralları
  stateMachine: StateMachineConfig // rep fazları + geçiş koşulları
  thresholds: ThresholdConfig      // ayarlanabilir eşikler
}
```

**Yeni egzersiz ekleme akışı:**
1. `src/exercises/lunge.ts` dosyası oluştur
2. `ExerciseDefinition` objesi export et
3. `src/exercises/index.ts` registry'e ekle
4. **Bitti.** Hiçbir core kod değişmedi.

### 5. Adapters

**Sorumluluğu:** Dış dünya (tarayıcı API'leri, ML kütüphaneleri) ile core arasında köprü.

#### `PoseDetector` Interface
```typescript
interface PoseDetector {
  initialize(): Promise<void>
  detectFrame(frame: ImageData): Landmark[]
  dispose(): void
}

class MediaPipePoseDetector implements PoseDetector { ... }
// Gelecekte: YOLOv11PoseDetector, OpenPoseDetector, vb.
```

#### `FrameSource` Interface
```typescript
interface FrameSource {
  start(): Promise<void>
  stop(): void
  onFrame(callback: (frame: ImageData) => void): void
}

class WebcamSource implements FrameSource { ... }
class VideoFileSource implements FrameSource { ... }
// Gelecekte: RemoteStreamSource (mobil cihazdan WebRTC), vb.
```

## Veri Akış Diyagramı

```
┌──────────────────┐
│ FrameSource      │  Webcam VEYA Video dosyası
│ (Adapter)        │
└────────┬─────────┘
         │ ImageData (her frame)
         ▼
┌──────────────────┐
│ PoseDetector     │  MediaPipe
│ (Adapter)        │
└────────┬─────────┘
         │ Landmark[] (33 nokta)
         ▼
┌──────────────────────────────────────┐
│ Exercise Engine                      │
│  ┌────────────────────────────────┐  │
│  │ StateMachine                   │  │  ← ExerciseDefinition
│  │ (rep fazını günceller)         │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│  ┌────────────▼───────────────────┐  │
│  │ RuleEvaluator                  │  │  ← ExerciseDefinition.rules
│  │ (kuralları uygular)            │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│  ┌────────────▼───────────────────┐  │
│  │ FeedbackGenerator              │  │
│  │ (mesaj öncelikler, cooldown)   │  │
│  └────────────┬───────────────────┘  │
└───────────────┼──────────────────────┘
                │ Violations + FeedbackMessages
                ▼
┌──────────────────┐
│ Zustand Stores   │  state güncelleme
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ UI Components    │  re-render
└──────────────────┘
```

## İleri Görüşlü Tasarım Kararları

### K1: Eklenti tabanlı egzersizler
**Bugün:** 3 egzersiz. **6 ay sonra:** 20 egzersiz. Eklenti pattern olmasa her egzersiz core'a if-else eklerdi → bakım kabusu.

### K2: PoseDetector arkasında soyutlama
**Bugün:** MediaPipe en iyi seçim. **1 yıl sonra:** Daha hassas bir model gelirse (ör. YOLOv11-pose web versiyonu, veya transformer-based pose), sadece adapter yazılır. Engine değişmez.

### K3: FrameSource adapter pattern
**Bugün:** Webcam + video upload. **2 yıl sonra:** Mobil cihazdan WebRTC ile bilgisayara stream geldiğinde, sadece yeni FrameSource yazılır.

### K4: State machine ayrı katman
Rep sayma mantığı kurallardan tamamen ayrı. Aynı kural seti farklı state machine'lerle çalışabilir. Örnek: squat ve jump squat — kurallar büyük oranda aynı, state machine farklı.

### K5: Tamamen client-side
Bu mimari kararı geri çevrilmeyecek. Sebepleri:
- Mahremiyet taahhüdü (pazarlama söylemi değil, garanti)
- Sıfır operasyon maliyeti
- Sıfır network latency
- Offline çalışır
- GDPR/KVKK uyumu basit (veri toplanmıyor)

### K6: Threshold'lar konfigüre edilebilir
Tüm eşik değerleri kod içinde sabit değil, `exerciseDefinition.thresholds` objesinde. Bu sayede:
- Uzman geri bildirimine göre kod değiştirmeden ayar
- A/B testleri (gelecekte) → farklı kullanıcı gruplarına farklı eşikler
- Power user'lar için "strict mode" / "lenient mode" toggle (v3)

## Planlanan Dosya Yapısı

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing
│   ├── exercises/page.tsx        # Egzersiz seçim
│   ├── exercise/[id]/page.tsx    # Live analyzer
│   └── layout.tsx
│
├── components/                   # React UI komponentleri
│   ├── camera/
│   │   ├── CameraView.tsx
│   │   └── PoseOverlay.tsx       # Canvas overlay
│   ├── feedback/
│   │   ├── LiveFeedbackPanel.tsx
│   │   ├── RepCounter.tsx
│   │   └── ViolationBadge.tsx
│   ├── setup-wizard/
│   │   ├── SetupWizard.tsx
│   │   ├── SilhouetteGuide.tsx   # Framer Motion siluet
│   │   └── VisibilityChecks.tsx
│   ├── session-summary/
│   │   └── SessionReport.tsx
│   └── ui/                       # shadcn/ui base (Button, Card, vb.)
│
├── core/                         # PURE TypeScript, UI'dan bağımsız
│   ├── pose-detection/
│   │   ├── PoseDetector.ts       # interface
│   │   ├── MediaPipePoseDetector.ts
│   │   └── types.ts
│   ├── frame-source/
│   │   ├── FrameSource.ts        # interface
│   │   ├── WebcamSource.ts
│   │   ├── VideoFileSource.ts
│   │   └── types.ts
│   ├── exercise-engine/
│   │   ├── types.ts              # ExerciseDefinition, Rule, vb.
│   │   ├── RuleEvaluator.ts
│   │   ├── StateMachine.ts
│   │   └── FeedbackGenerator.ts
│   └── math/
│       ├── angles.ts             # angle calculations
│       ├── geometry.ts           # distances, projections
│       ├── stats.ts              # variance, moving average
│       └── smoothing.ts          # frame smoothing
│
├── exercises/                    # EXERCISE PLUGINS
│   ├── index.ts                  # registry
│   ├── squat.ts
│   ├── pushup.ts
│   └── biceps-curl.ts
│
├── store/                        # Zustand stores
│   ├── poseStream.ts
│   ├── exerciseSession.ts
│   └── cameraSetup.ts
│
└── lib/                          # Genel utility
    ├── i18n/                     # ileride çoklu dil
    │   └── tr.ts                 # Türkçe mesajlar
    └── types/

tests/
├── core/                         # core/ klasörü için birim testler
└── fixtures/                     # test için kaydedilmiş landmark stream'leri

public/
├── models/                       # MediaPipe model dosyaları
└── videos/                       # demo videoları (varsa)
```

## Test Stratejisi (mimari açısından)

`core/` klasörü tamamen saf TypeScript → **birim test edilmesi kolay**.

- Math fonksiyonları: bilinen değerlerle test (ör. `angle((0,0), (1,0), (1,1)) === 90`)
- Rule'lar: mock landmark dizisi ile bilinen sonuç testi
- State machine: simüle edilmiş frame dizisi → bilinen rep sayısı
- Engine integration: kayıt edilmiş gerçek video → landmark stream → bilinen sonuçlar

UI testleri sonraki fazda (Playwright). MVP için core test kapsamı yeterli.

## Performans Notları

- **Hedef:** 30+ FPS modern donanımda
- **Strateji:**
  - MediaPipe lite model (heavy model değil) — yeterli hassasiyet, 3x hız
  - Frame skip: 60FPS kamerada her 2 frame'de bir tespit (etkili 30FPS)
  - Smoothing & rule evaluation throttling: her frame'de değil, her N ms'de bir
  - Canvas double-buffering
  - React re-render minimize: sık güncellenen veriler için `useSyncExternalStore` veya ref pattern

## Genişleme Yolu (Sürümler arası)

| Sürüm | Mimari değişiklik | Etkilenen katman |
|---|---|---|
| MVP → v2 (yeni egzersiz) | yeni exercises/X.ts dosyası | Sadece exercises/ |
| MVP → v2 (multi-angle) | ExerciseDefinition'a `angles: AngleVariant[]` | exercise-engine + UI |
| v2 → v3 (oturum geçmişi) | IndexedDB persistence layer | yeni store + UI |
| v3 → v4 (ML enhancement) | RuleType olarak MLRule, RuleEvaluator çoklu rule tipi handle eder | exercise-engine + adapters |
| v4 → v5 (cloud sync, opsiyonel) | Backend API + sync layer | yeni katman, mevcut core değişmez |

Her sürümde mevcut core kod kırılmadan büyür. Bu mimarinin sınavı.
