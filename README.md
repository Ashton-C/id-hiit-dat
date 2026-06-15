# I'd HIIT Dat 💪

A seamless, single-screen HIIT (High Intensity Interval Training) workout app.
Open it, glance, hit start. Built as a **PWA-first React web app** so it installs to
the home screen, works offline, and is straightforward to port to a real mobile app
later.

> Replicates and improves on a 13-minute, 30s-work / 10s-rest video routine, with full
> customization, royalty-free electronic music, selectable visuals, and audio/visual cues.

## Status

Early build. Working today:

- ⏱️ **Interval engine** — framework-agnostic, `performance.now()`-driven state machine
  (accurate even when backgrounded). Default **13-Minute Classic** routine.
- 🖥️ **Single-screen timer UI** (dark) — start / pause / reset, big countdown, current &
  next exercise, round + total-time readout.
- 🔊 **Audio cues** — countdown ticks + work/rest/done tones (synthesized, no assets).
- ⚡ **Minimal visual mode** — phase-colored background + transition flash.

See [`PLANNING.md`](./PLANNING.md) for the full vision and roadmap (music crossfade,
gradient visuals, exercise diagrams, settings/presets, PWA offline caching).

> **TODO:** the default exercise sequence is a placeholder — to be replaced with the
> real exercises from the source video.

## Architecture

Core logic in `src/engine/` has **no React imports** — it's pure, unit-tested, and
portable to a future React Native build. React subscribes to it via `src/state/useTimer.ts`.

```
src/
  engine/    routine.ts · timer.ts · cues.ts   (framework-agnostic core)
  state/     useTimer.ts                        (React binding)
  components/ TimerScreen · Controls
  visuals/   TimerDisplay
  utils/     format.ts
```

## Develop

```bash
npm install
npm run dev      # start dev server
npm test         # run engine unit tests (Vitest)
npm run build    # type-check + production build
```

Requires Node 20+ (built on Node 26 / npm 11).
