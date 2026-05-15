# Gym Uncle / Salon Abisi

> Free, in-browser exercise form analysis. Privacy by architecture — video never leaves your device.

**🚀 Live demo:** [salon-abisi.pages.dev](https://salon-abisi.pages.dev)

**Status:** Demo version, actively developed. Not production-ready.
**Languages:** English · Turkish (toggle in-app)

---

## What it does

You open the page, point your webcam at yourself, and do bodyweight exercises. The app:

- **Detects 33 body landmarks** in real-time with MediaPipe (runs entirely in the browser via WebAssembly)
- **Counts your reps** using angle-based state machines (camera-distance independent)
- **Checks your form** against simple biomechanical rules
- **Summarizes your set** with a score, rep count, and most common feedback

No accounts. No subscriptions. No uploads. Your camera data stays on your device.

## Currently supported exercises

| Exercise | Camera | Primary signal | Form checks |
|---|---|---|---|
| Bodyweight Squat | Side view | Knee angle | Depth |
| Push-up | Side view, low angle | Elbow angle | Depth |
| Dumbbell Biceps Curl | ¾ angle | Active arm elbow angle | Range of motion |

The active arm in curl is auto-detected (you can use left, right, or alternating).

## Screenshots

> _Screenshots will be added here after first user test._

- **Home page:** `docs/screenshots/home.png`
- **Squat live analyzer:** `docs/screenshots/squat-live.png`
- **Set summary:** `docs/screenshots/set-summary.png`
- **Language toggle (TR ↔ EN):** `docs/screenshots/locale-toggle.png`

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Computer vision:** MediaPipe Tasks Vision (`pose_landmarker_full`, runs in WebAssembly with GPU delegate)
- **Styling:** Tailwind CSS 4
- **Type safety:** TypeScript (strict mode)
- **Testing:** Vitest (27 unit tests passing)
- **Deployment target:** Vercel (free tier)

**Total cost to ship and run:** $0. Everything is open source or free-tier.

## How it works

1. **Pose detection** — MediaPipe's pre-trained model identifies 33 body landmarks per frame
2. **Primary angle** — Each exercise computes a single primary angle (knee for squat, elbow for push-up/curl)
3. **State machine** — Simple 2-state automaton: `REST` ↔ `PEAK`. A rep is a full round-trip
4. **Rule evaluation** — At rep completion, biomechanical rules check the rep's metrics (e.g., minimum angle reached)
5. **Set summary** — On finish, score is the percentage of reps with clean form

The architecture is **plugin-based**: each exercise lives in its own file (`src/exercises/<id>.ts`). Adding a new exercise = adding a new file. No changes to core code.

See `docs/03-mimari.md` for the full architecture (currently in Turkish).

## Run locally

Requires Node.js 20+ and npm.

```bash
git clone https://github.com/tevfikmetinn/Salon-Abisi.git
cd Salon-Abisi/formkocu
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build         # production build
npm run test          # watch mode tests
npm run test:run      # single run (CI mode)
npm run test:coverage # with coverage report
npm run lint          # eslint
```

## Project structure

```
Salon-Abisi/
├── README.md                    # this file
├── docs/                        # design documents (Turkish)
│   ├── 01-vizyon-ve-kapsam.md   # vision and scope
│   ├── 02-egzersiz-spekleri.md  # exercise specifications
│   ├── 03-mimari.md             # architecture
│   ├── 04-teknoloji-yigini.md   # tech stack rationale
│   ├── 05-yol-haritasi.md       # roadmap (development log)
│   ├── 06-dogrulama-plani.md    # validation plan
│   └── 07-set-sonu-ekrani.md    # summary screen design
├── FUTURE.md                    # future development ideas
└── formkocu/                    # Next.js app
    ├── src/
    │   ├── app/                 # routes (home, exercise/[id], test-pose)
    │   ├── core/                # pure TypeScript engine
    │   │   ├── pose-detection/  # MediaPipe wrapper
    │   │   ├── frame-source/    # webcam + video file adapters
    │   │   ├── exercise-engine/ # session, state machine, types
    │   │   └── math/            # angle calculations
    │   ├── exercises/           # plugins: squat, pushup, curl
    │   ├── lib/i18n/            # internationalization (EN/TR)
    │   └── components/          # shared UI
    └── package.json
```

## Roadmap

See [FUTURE.md](FUTURE.md) for planned improvements.

## Why "Gym Uncle" / "Salon Abisi"?

In Turkish gym culture, the _"salon abisi"_ is the slightly older, more experienced lifter who quietly corrects your form when you're about to hurt yourself. This app is a digital version of that — free advice from someone who's been there.

## License

MIT — use it, fork it, ship it.

## Built by

Tevfik Metin (2nd-year software engineering student). Portfolio project — feedback welcome.

🤖 _Developed in collaboration with Claude (Anthropic) for architecture decisions and iteration._
