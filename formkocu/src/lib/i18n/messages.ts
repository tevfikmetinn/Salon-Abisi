export type Locale = 'en' | 'tr'

export type Messages = {
  brand: string
  tagline: string
  demoBadge: string
  ui: {
    home: {
      heroSub: string
      heroDesc: string
      exercisesLabel: string
      rulesCount: (n: number) => string
      sideView: string
      frontView: string
      threeQuarterView: string
      howItWorks: string
      howItWorksBody: string
      privacy: string
      privacyBody: string
      free: string
      freeBody: string
      poseDemo: string
      footer: string
    }
    exercise: {
      back: string
      finishSet: string
      reps: string
      angle: string
      lastRep: string
      goodForm: string
      cameraTips: string
      mediapipeLoading: string
      mediapipeLoadingHint: string
      error: string
      notFound: string
      notFoundDesc: (id: string) => string
      backHome: string
      cantSee: string
      statePeak: string
      stateRest: string
      setSummary: string
      score: string
      totalReps: string
      cleanReps: string
      mostCommon: (n: number) => string
      perfectSet: string
      newSet: string
      changeExercise: string
    }
    testPose: {
      title: string
      subtitle: string
      status: string
      statusIdle: string
      statusInit: string
      statusReady: string
      statusError: string
      fps: string
      detected: string
      yes: string
      no: string
      tipsTitle: string
      tipsClickHint: string
      tipsLighting: string
      tipsDistance: string
      tipsClothing: string
      tipsBackground: string
      tipsCameraHeight: string
      tipsModel: string
      criteria: string
      modeWebcam: string
      modeVideo: string
      videoUploadHint: string
    }
  }
  exercises: {
    [id: string]: {
      displayName: string
      description: string
      tagline: string
      instructions: string[]
    }
  }
  rules: Record<string, string>
}

const en: Messages = {
  brand: 'Gym Uncle',
  tagline: 'Free, in-browser exercise form analysis',
  demoBadge: 'Demo — actively developed',
  ui: {
    home: {
      heroSub: 'Turn on your camera, do your exercise, get feedback.',
      heroDesc:
        'Runs in your browser. Video never leaves your device. No accounts, no subscriptions.',
      exercisesLabel: 'Exercises',
      rulesCount: (n) => (n === 1 ? '1 form check' : `${n} form checks`),
      sideView: 'Side view',
      frontView: 'Front',
      threeQuarterView: '¾ angle',
      howItWorks: 'How it works',
      howItWorksBody:
        'Turn on your camera. Start exercising. Get instant feedback on your form — right in your browser, instantly.',
      privacy: 'Is my data safe?',
      privacyBody:
        'Yes. Your video stays on your device — never uploaded, never recorded, never seen by anyone but you.',
      free: 'Is it free?',
      freeBody:
        'Yes. Fully free, no account, no signup, no ads.',
      poseDemo: 'Pose detection demo',
      footer: 'Open source on GitHub.',
    },
    exercise: {
      back: 'Exercises',
      finishSet: 'Finish set',
      reps: 'Reps',
      angle: 'angle',
      lastRep: 'Last rep',
      goodForm: 'Good form — all checks passed',
      cameraTips: 'Camera tips',
      mediapipeLoading: 'Loading MediaPipe...',
      mediapipeLoadingHint: 'May take 5-15 seconds on first load',
      error: 'Error',
      notFound: 'Exercise not found',
      notFoundDesc: (id) => `"${id}" is not in the list of available exercises.`,
      backHome: 'Back to home',
      cantSee: "Can't see you — adjust your camera",
      statePeak: 'Down',
      stateRest: 'Up',
      setSummary: 'Set complete',
      score: 'Score',
      totalReps: 'Total reps',
      cleanReps: 'Clean reps',
      mostCommon: (n) =>
        n === 1
          ? 'Most common feedback (in 1 rep)'
          : `Most common feedback (in ${n} reps)`,
      perfectSet: 'Perfect set — all reps had clean form.',
      newSet: 'New set',
      changeExercise: 'Change exercise',
    },
    testPose: {
      title: 'Pose Detection Demo',
      subtitle:
        'Live pose detection — see how the app sees you',
      status: 'Status',
      statusIdle: 'idle',
      statusInit: 'initializing',
      statusReady: 'ready',
      statusError: 'error',
      fps: 'FPS',
      detected: 'Detected',
      yes: 'yes',
      no: 'no',
      tipsTitle: 'Tips for best results',
      tipsClickHint: '(click to expand)',
      tipsLighting:
        'Lighting: even, soft light on face and body. Avoid backlight (window behind you).',
      tipsDistance:
        'Distance: 2-3 meters from camera. Full body in frame.',
      tipsClothing:
        'Clothing: form-fitting, not baggy. Loose clothes confuse joint detection.',
      tipsBackground:
        'Background: plain, still. A walking person nearby may be detected as another pose.',
      tipsCameraHeight: 'Camera height: hip-level is ideal for most exercises.',
      tipsModel:
        'Runs entirely in your browser. No data leaves your device.',
      criteria: 'Verification criteria',
      modeWebcam: 'Live camera',
      modeVideo: 'Upload video',
      videoUploadHint:
        'Pick an mp4 or webm file using the "Upload video" button',
    },
  },
  exercises: {
    squat: {
      displayName: 'Bodyweight Squat',
      description: 'Air squat with side-view camera.',
      tagline: 'Stand sideways and start squatting.',
      instructions: [
        'Stand sideways to the camera (face perpendicular)',
        '1.5-2.5 meters from the camera',
        'Camera at hip height',
        'Your legs should be in the frame',
      ],
    },
    pushup: {
      displayName: 'Push-up',
      description: 'Classic push-up with side-view camera.',
      tagline: 'Get into push-up position and start.',
      instructions: [
        'Get into push-up position facing the side',
        'Place camera on the side, close to the ground',
        'Full body visible from the side',
        'Arms and torso should be in the frame',
      ],
    },
    curl: {
      displayName: 'Dumbbell Biceps Curl',
      description:
        'Single or double dumbbell curl. We track the active arm automatically.',
      tagline: 'Hold a dumbbell and start curling.',
      instructions: [
        'Turn slightly toward the camera (30-45°)',
        '1.5-2 meters from the camera',
        'Camera at chest height',
        'Your upper body should be in the frame',
      ],
    },
  },
  rules: {
    'squat.depth.yellow': 'Try going a bit deeper',
    'squat.depth.red': 'Go deeper — hips should reach knee level',
    'pushup.depth.yellow': 'Try going a bit lower',
    'pushup.depth.red': 'Go lower — chest should reach elbow level',
    'curl.rom.peakTooHigh': 'Squeeze biceps at the top — curl higher',
    'curl.rom.restTooLow': "Fully extend arm at the bottom — don't half-rep",
  },
}

const tr: Messages = {
  brand: 'Salon Abisi',
  tagline: 'Tarayıcıda ücretsiz egzersiz form analizi',
  demoBadge: 'Demo — aktif geliştirme',
  ui: {
    home: {
      heroSub: 'Kameranı aç, egzersizini yap, geri bildirim al.',
      heroDesc:
        'Tarayıcıda çalışır. Video sunucuya gönderilmez. Kayıt yok, abonelik yok.',
      exercisesLabel: 'Egzersizler',
      rulesCount: (n) => `${n} form kontrolü`,
      sideView: 'Yan profil',
      frontView: 'Ön',
      threeQuarterView: '¾ açı',
      howItWorks: 'Nasıl çalışır?',
      howItWorksBody:
        'Kameranı aç. Egzersizini yap. Form geri bildirimini anında al — hepsi tarayıcında.',
      privacy: 'Verim güvende mi?',
      privacyBody:
        'Evet. Video sadece senin cihazında kalır — sunucuya gönderilmez, kaydedilmez, kimse görmez.',
      free: 'Bedava mı?',
      freeBody:
        'Evet. Tamamen ücretsiz, hesap yok, kayıt yok, reklam yok.',
      poseDemo: 'Pose tespit demosu',
      footer: 'GitHub\'da açık kaynak.',
    },
    exercise: {
      back: 'Egzersizler',
      finishSet: 'Seti bitir',
      reps: 'Tekrar',
      angle: 'açı',
      lastRep: 'Son rep',
      goodForm: 'Form iyi — tüm kurallar yeşil',
      cameraTips: 'Kamera ipuçları',
      mediapipeLoading: 'MediaPipe yükleniyor...',
      mediapipeLoadingHint: 'İlk yüklemede 5-15 saniye sürebilir',
      error: 'Hata',
      notFound: 'Egzersiz bulunamadı',
      notFoundDesc: (id) => `"${id}" tanımlı egzersizler arasında yok.`,
      backHome: 'Ana sayfaya dön',
      cantSee: 'Vücudunu görmüyorum — kameranı düzelt',
      statePeak: 'Aşağıda',
      stateRest: 'Yukarıda',
      setSummary: 'Set sonu',
      score: 'Skor',
      totalReps: 'Toplam rep',
      cleanReps: 'Temiz form',
      mostCommon: (n) => `En sık geri bildirim (${n} rep'te)`,
      perfectSet: "Set mükemmel — tüm rep'lerde form temiz.",
      newSet: 'Yeni set',
      changeExercise: 'Egzersiz değiştir',
    },
    testPose: {
      title: 'Pose Tespit Demosu',
      subtitle:
        'Canlı pose tespiti — uygulamanın seni nasıl gördüğünü gör',
      status: 'Durum',
      statusIdle: 'beklemede',
      statusInit: 'başlatılıyor',
      statusReady: 'hazır',
      statusError: 'hata',
      fps: 'FPS',
      detected: 'Tespit',
      yes: 'var',
      no: 'yok',
      tipsTitle: 'En iyi sonuç için ipuçları',
      tipsClickHint: '(tıkla aç)',
      tipsLighting:
        'Aydınlatma: yüzüne ve vücuduna eşit, yumuşak ışık. Pencereye sırtın dönükse siluet olursun.',
      tipsDistance: 'Mesafe: kameradan 2-3 metre. Tüm vücudun kareye sığsın.',
      tipsClothing:
        'Kıyafet: hatları belli eden, bol olmayan giysiler. Bol giysi eklem tespitini bozar.',
      tipsBackground:
        'Arka plan: sade ve hareketsiz. Arkanda yürüyen biri "ikinci kişi" olarak algılanabilir.',
      tipsCameraHeight: 'Kamera yüksekliği: kalça hizası çoğu egzersiz için ideal.',
      tipsModel:
        'Tamamen tarayıcında çalışır. Hiçbir veri cihazdan çıkmaz.',
      criteria: 'Doğrulama kriterleri',
      modeWebcam: 'Canlı kamera',
      modeVideo: 'Video yükle',
      videoUploadHint:
        '"Video yükle" butonuyla bir mp4 veya webm dosyası seç',
    },
  },
  exercises: {
    squat: {
      displayName: 'Bodyweight Squat',
      description: 'Ağırlıksız squat — yan profilden çekim.',
      tagline: 'Yan dur ve squat\'a başla.',
      instructions: [
        'Kameraya yan dur (yüzün yana baksın)',
        'Kameradan 1.5-2.5 metre uzakta',
        'Kamera kalça hizasında',
        'Bacakların kareye sığsın',
      ],
    },
    pushup: {
      displayName: 'Şınav',
      description: 'Klasik şınav — yan profilden çekim.',
      tagline: 'Şınav pozisyonu al ve başla.',
      instructions: [
        'Şınav pozisyonu al, yan profilini kameraya ver',
        'Kamerayı yan tarafa, yere yakın koy',
        'Tüm vücudun yan profilden görünsün',
        'Kollar ve gövde kareye sığsın',
      ],
    },
    curl: {
      displayName: 'Dambıl Biceps Curl',
      description:
        'Tek veya çift dambıl ile biceps curl. Aktif kolunu otomatik buluruz.',
      tagline: 'Dambılı tut ve curl yapmaya başla.',
      instructions: [
        'Kameraya hafif yan dön (30-45°)',
        'Kameradan 1.5-2 metre uzakta',
        'Kamera göğüs hizasında',
        'Üst vücudun kareye sığsın',
      ],
    },
  },
  rules: {
    'squat.depth.yellow': 'Biraz daha derine inebilirsin',
    'squat.depth.red': 'Daha derine in — kalçanı diz hizasına indir',
    'pushup.depth.yellow': 'Biraz daha aşağı in',
    'pushup.depth.red': 'Daha aşağı in — göğsün dirsek hizasına gelsin',
    'curl.rom.peakTooHigh': "Tepede biceps'i tam sık — kolunu daha çok bük",
    'curl.rom.restTooLow': 'Aşağıda kolunu tam aç — yarım yapma',
  },
}

export const MESSAGES: Record<Locale, Messages> = { en, tr }

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale]
}
