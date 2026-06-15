# HIIT Workout App — Planning Document

> Status: **Draft for review** · Last updated: 2026-06-15

## 1. Vision

A seamless, single-screen HIIT (High Intensity Interval Training) web app. The user
opens it and sees everything they need: interval timer, start control, music control,
and visual control. Designed to replicate (and improve on) the video routine the user's
wife follows — Mon/Wed/Fri, 13 minutes, 30s work / 10s rest — while allowing full
customization.

Built as a **PWA-first React web app** so it installs to the home screen, works offline,
and is straightforward to port to a real mobile app later.

## 2. Core principles

- **One screen, zero friction.** Open → glance → press start. Settings are a layer on
  top, not a separate destination you have to navigate to first.
- **Logic separate from UI.** Timer/engine/audio logic lives in framework-agnostic
  modules so a future React Native port reuses the brains and only rewrites the views.
- **Offline-first.** Bundled assets (music, exercise diagrams) work with no network.

## 3. Decisions locked in (from planning Q&A)

| Area | Decision |
|------|----------|
| **Stack** | Vite + React + TypeScript (NOT create-react-app — it's deprecated) |
| **PWA** | Yes, from the start. Installable + offline caching. |
| **Timer config** | Presets + full custom. 13-min routine ships as default preset; settings panel allows full edit of work/rest/rounds/total. |
| **Exercises** | Named exercise sequence. Each work interval shows a specific exercise (name + simple diagram). Routines are editable. |
| **Music source** | Bundled local royalty-free electronic tracks (offline-safe). |
| **Music feel** | Continuous crossfaded mix — seamless DJ-style playback for the whole session, no gaps. |
| **Visuals** | All three modes available, user-selectable: (a) animated gradient, (b) exercise diagrams, (c) timer. |
| **Transition cues** | Sound beeps + screen flash/color change on work↔rest transitions. |

## 4. Feature scope

### v1 (MVP — what we build first)
- Single-screen timer UI with start / pause / reset.
- Interval engine: configurable work / rest / rounds, with the 13-min routine as the
  default preset.
- Settings layer to fully customize intervals and pick a preset.
- Named exercise sequence with simple diagrams shown per work interval.
- Three selectable visual modes (gradient / exercise diagram / minimal timer).
- Transition cues: countdown beeps + transition tone + screen flash/color shift.
- Bundled royalty-free electronic music with continuous crossfade mixing.
- Music controls: play/pause, skip, volume.
- PWA: installable, offline-capable.

### Later phases (explicitly deferred)
- Workout history / streaks / stats.
- Multiple saved custom routines + routine builder UI.
- Larger exercise library with richer animations (vs simple diagrams).
- Intensity-matched music (tempo follows work vs rest).
- Voice prompts, vibration/haptics.
- Native mobile app (React Native / Capacitor) reusing the core engine.
- Cloud sync / accounts.

## 5. Architecture sketch

```
src/
  engine/            # framework-agnostic core (portable to RN)
    timer.ts         #   interval state machine: phases, ticks, transitions
    routine.ts       #   routine/preset model + the default 13-min routine
    audioMixer.ts    #   Web Audio crossfade engine for continuous music
    cues.ts          #   beep/tone generation (Web Audio)
  state/             # React state binding over the engine (hooks/store)
  components/        # UI: TimerScreen, Controls, MusicBar, SettingsPanel, VisualLayer
  visuals/           # gradient animation, exercise diagram renderer, timer display
  assets/
    music/           # bundled royalty-free tracks + license records
    exercises/       # exercise diagrams (SVG) + metadata
  pwa/               # manifest, service worker config
```

**Key design choice:** the `engine/` folder has no React imports. The timer is a pure
state machine driven by ticks; React subscribes to it. This is the seam that makes the
future mobile rewrite cheap.

## 6. Technical notes & risks

- **Continuous crossfade** is the hardest piece. Plan: use the **Web Audio API** with two
  gain nodes and overlapping playback to crossfade track N into track N+1. Beeps/cues
  route through the same audio context so volume is coordinated.
- **Background timer accuracy.** `setInterval` drifts and throttles when the tab is
  backgrounded. Plan: drive the timer off `performance.now()` timestamps (compute elapsed,
  don't count ticks) and consider an audio-clock fallback so a phone-locked session stays
  accurate.
- **Music licensing.** Each bundled track must be genuinely royalty-free for app
  distribution (e.g. Pixabay Music, Free Music Archive CC0). We'll keep a
  `LICENSES.md` recording source + license per track.
- **Exercise diagrams.** v1 uses simple SVG diagrams. We need to source/create a small
  set matching the default routine's exercises.

## 7. Proposed build sequence

1. **Scaffold** — `npm create vite@latest` (React + TS), init git, push to GitHub via `gh`.
2. **Engine** — timer state machine + default routine, with unit tests. Bare debug UI.
3. **Timer screen** — single-screen layout, start/pause/reset wired to the engine.
4. **Cues + minimal visuals** — beeps, transition tone, screen flash, timer display.
5. **Exercise sequence** — diagram rendering per work interval.
6. **Visual modes** — gradient animation + mode switcher.
7. **Settings layer** — presets + full custom editing.
8. **Music** — bundle tracks, build crossfade mixer, music controls.
9. **PWA** — manifest + service worker + offline asset caching.
10. **Polish** — responsive layout, install prompt, QA on mobile browser.

## 8. Open questions for next round

- Working name / branding for the app?
- GitHub repo: name, and public or private?
- What are the actual exercises in the wife's 13-min routine (so the default sequence
  matches it)? Or should we define a sensible default sequence to start?
- Light/dark/either for the base theme?
