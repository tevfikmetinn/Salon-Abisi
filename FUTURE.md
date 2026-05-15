# Future Development

Ideas for where Gym Uncle could go next. Organized by horizon.

## Short term — refinements (weeks)

### More exercises
The plugin architecture makes this cheap. Each new exercise is ~50 lines of TypeScript.
- **Plank** — hold detection (not rep-based), body line alignment
- **Glute bridge** — hip-knee-shoulder line at top, hold time
- **Lunge** — front knee angle, back knee height
- **Bird-dog** — opposite limb extension, hold time
- **Wall sit** — knee angle, hold timer

### Form rules expansion
Each exercise currently has 1 rule (depth/ROM). The full spec calls for 6 rules per exercise:
- Squat: + forward lean, knee tracking, tempo, heel lift, bottom pause
- Push-up: + elbow flare, body sag/pike, neck position, lockout pause
- Curl: + shoulder elevation, upper-arm stability, body sway, peak contraction pause

See `docs/02-egzersiz-spekleri.md` for biomechanical details.

### Per-rep visual feedback
Currently feedback shows after rep completes. Could surface during the rep:
- Color the skeleton red on violating body parts in real-time
- Show a "target depth" line for squats
- Show angle dial with target zones

### Audio cues
- Beep on rep counted
- Voice cue on form issue ("knees in", "go deeper") — Web Speech API, free
- Toggle in settings

### Session persistence
- Save sets to IndexedDB (still local, no cloud)
- "Today's volume", "Last 7 days" stats
- Personal record tracking (best score per exercise)

### Setup wizard
Optional onboarding overlay for first-time users:
- Animated silhouette showing how to position yourself
- Auto camera-angle detection (front vs side)

## Medium term — bigger features (months)

### Multi-angle support
Currently each exercise has a fixed best angle. Users could upload from any angle:
- Detect available view (front/side/¾) from landmark visibility patterns
- Switch rule sets based on view
- "Re-record from side" suggestion for ambiguous views

### Video upload + offline analysis
Test page already has video upload. Bring to main exercise pages:
- Drop a workout video, get a full set analysis
- Useful for trainers analyzing client form
- Useful for users reviewing past sessions

### Symmetry analysis
Left vs right detection. Requires front view but very valuable for:
- Squat: knee valgus, hip tilt
- Push-up: shoulder elevation asymmetry
- Curl: bilateral comparison for alternating reps

### Workout programs
Beyond single exercises, support sequences:
- "5x5 Stronglifts beginner" preset
- Rest timer between sets
- Set/rep tracking across a session
- Auto-progression suggestions

### Body-weight workout suggestions
Based on what user can do, suggest a routine. No equipment assumptions.

## Long term — ambitious (quarters)

### ML-based form scoring
Current rules are geometric. Add a quality classifier as a secondary signal:
- Train on a small set of expert-labeled "good vs sloppy" reps
- Run alongside rule-based system; flag disagreement
- Privacy preserved: train upstream, run inference in-browser

### Pose smoothing / occlusion handling
MediaPipe gets confused when joints are occluded (e.g., back leg in lunge):
- Kalman filter on landmark trajectories
- Use anatomical priors (joint lengths constant)
- Better handling for body part briefly leaving frame

### Trainer mode
Multi-user features for coaches:
- Analyze client-submitted videos in batch
- Side-by-side comparison (client vs reference athlete)
- Generate PDF reports

### Cloud sync (opt-in only)
For users who want history across devices:
- End-to-end encrypted (Signal protocol or similar)
- Self-hosted option (Docker image)
- Default remains 100% local — sync is purely opt-in

### Voice-driven UX
- "Start squat set of 10"
- "Skip exercise"
- "How was my last rep?"
- Useful for hands-free flow while exercising

### Mobile app (PWA → native)
Currently desktop-first. For real gym use:
- PWA install on iOS/Android
- Native wrappers for camera optimization
- Watch app for rest timers

### Wearable integration
- Sync heart rate from Apple Watch / Garmin / Polar
- Show HR overlay during sets
- Recovery suggestions based on HR variability

## Things explicitly NOT planned

These have been considered and ruled out for clarity:

- **Accounts / user profiles** — opposes the privacy-by-architecture stance
- **Ads** — degrades the user experience
- **Backend for video processing** — defeats the local-first principle
- **Social features (compare with friends)** — outside the focus
- **Calorie/macro tracking** — different app, different problem

## Want to contribute?

This is a portfolio project, but contributions are welcome. Good first issues:

- Add a new exercise plugin
- Expand the i18n catalog with another language (German, Spanish, etc.)
- Improve the threshold values for existing rules based on real user testing
- Write more rule definitions following the patterns in `docs/02-egzersiz-spekleri.md`

Open an issue first to discuss any larger change.
