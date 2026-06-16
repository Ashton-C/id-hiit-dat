# Continuous Crossfade Music Player — Design Spec

Status: design (target for implementation)
Owner: audio architect
Repo: `id-hiit-dat` (Vite 8 + React 19 + TS strict, Vitest 4, PWA-first, fully offline)

## Goal

Bundled royalty-free electronic tracks play as one seamless, gap-free DJ-style mix
for the entire workout session. The player exposes play/pause, skip, and volume, and
follows the workout timer lifecycle (start → resume music, pause → duck/stop, done →
fade out). It must work **fully offline today** with **zero audio assets** via a
procedural synth fallback, behind the same manifest interface that real CC0 tracks
drop into later.

This document specifies five things:

1. The framework-agnostic Web Audio crossfade mixer (`src/engine/audioMixer.ts`).
2. The track manifest format + Vite bundling for offline use (`src/assets/music/`, `tracks.ts`).
3. The procedural synth demo-track generator + CC0 sourcing + `LICENSES.md`.
4. The `MusicBar` React control bound to `useSettings()` music state + the mixer.
5. Vitest-testable seams (pure crossfade math + scheduling decisions, injectable AudioContext).

---

## 0. Grounding in the existing code

Read and verified against the real repo:

- `src/engine/cues.ts` — `CuePlayer` lazily creates its **own** `AudioContext`, resumes it
  on `unlock()` from a user gesture, synthesizes oscillator beeps to `ctx.destination`.
  It does **not** expose its context.
- `src/engine/timer.ts` — `TimerEngine` is `performance.now()`-driven, owns no loop, emits
  `TransitionEvent{from,to,toIndex}` via `onTransition`. `TimerStatus` is
  `'idle'|'running'|'paused'|'done'`.
- `src/state/useTimer.ts` — drives the engine with rAF only while running; re-exposes
  `onTransition`.
- `src/components/TimerScreen.tsx` — currently owns engine binding, cue playback, flash.
  **Being refactored** toward the planned seam (settings store, `VisualLayer`, `MusicBar`,
  `SettingsPanel`). Design against the seam, not this file.
- The planned `useSettings()` exposes `{ settings, update(partial) }` with
  `music: { enabled: boolean, volume: number /*0..1*/, trackId: string | null }`.

Engine code has **no React imports** — `audioMixer.ts` must keep that invariant.
TS is strict: `verbatimModuleSyntax` (use `import type`), `erasableSyntaxOnly`
(no enums/parameter-properties/namespaces — use `const` objects + union types),
`noUnusedLocals/Params`.

---

## 1. AudioContext lifecycle & sharing with CuePlayer

### Recommendation: share ONE AudioContext between cues and music.

Reasons:

- **Autoplay unlock is per-context.** The browser gates each `AudioContext` behind a user
  gesture independently. One shared context means a single `unlock()` from the Start button
  satisfies the policy for *both* beeps and music. Two contexts = two unlock paths and a
  class of "music silent until second tap" bugs.
- **Mobile/iOS limits the number of contexts** (historically very few; creating many leaks
  and eventually throws). One context is the safe, well-trodden path.
- **A shared master clock** (`ctx.currentTime`) lets cues and music schedule on the same
  timeline, so we can later duck music precisely when a beep fires.
- **One `destination` graph** to reason about for volume/mute.

### Implementation: an `AudioBus` owner, injected into both.

Introduce a tiny shared owner so neither `CuePlayer` nor `AudioMixer` "owns" the context.

```
src/engine/audioContext.ts   (new, ~40 lines, no React)
```

```ts
export interface AudioBus {
  readonly ctx: AudioContext
  /** Master node everything connects through; cues + music both route here. */
  readonly master: GainNode
  unlock(): Promise<void>      // resume() — call from a user gesture
  suspend(): Promise<void>     // optional: release HW on long pause
}

export function createAudioBus(ctorOverride?: typeof AudioContext): AudioBus | null {
  const Ctor =
    ctorOverride ??
    (typeof window !== 'undefined'
      ? window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined)
  if (!Ctor) return null
  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(ctx.destination)
  return {
    ctx,
    master,
    async unlock() { if (ctx.state === 'suspended') await ctx.resume() },
    async suspend() { if (ctx.state === 'running') await ctx.suspend() },
  }
}
```

`CuePlayer` is refactored to **optionally accept** a `ctx`/`master` so it can share the bus
(keeping its current self-creating behavior as a fallback for unit tests that only test
cues). The bus is created once, near the settings/timer wiring (e.g. in `TimerScreen` or a
small `useAudioBus()` hook), and passed to both `CuePlayer` and `AudioMixer`.

> Migration note: `CuePlayer` currently hardcodes `ctx.destination`. Change it to connect to
> an injected `master` (defaulting to `ctx.destination`) so beeps sit above the music on the
> same master, and cues can later duck music. This is a 2-line change, backward compatible.

### Autoplay policy

- `unlock()` is wired to the same Start-button gesture already calling `cue.unlock()` in
  `TimerScreen`. Both run from the one handler.
- Music does **not** auto-start on unlock; it starts when the timer enters `running`
  *and* `settings.music.enabled` is true. Unlock just makes that subsequent start legal.

---

## 2. decodeAudioData (AudioBufferSourceNode) vs HTMLAudioElement

### Recommendation: `decodeAudioData` → `AudioBufferSourceNode`, NOT `HTMLAudioElement`.

| Concern | AudioBufferSource (decoded) | HTMLAudioElement (MediaElementSource) |
|---|---|---|
| Sample-accurate scheduling | **Yes** — `start(when)` on the audio clock | No — `play()`/`currentTime` are best-effort, ~tens of ms jitter |
| Gap-free crossfade | **Yes** — schedule next `start()` before current ends, ramp gains on the same clock | Hard — element scheduling is not sample-accurate; audible seams |
| Loop without click | **Yes** — `loop=true` with `loopStart/loopEnd`, or schedule fresh sources | `loop` works but no precise loop points; seam at wrap |
| Procedural synth source | **Yes** — `OfflineAudioContext` renders straight to an `AudioBuffer` | No natural path; would have to encode to a blob URL |
| Memory | Whole track decoded in RAM (PCM) | Streamed, low RAM |
| Long tracks | Costly (PCM is ~10 MB/min stereo @44.1k) | Cheap |

Decoded buffers are the only way to get **sample-accurate, gap-free crossfades** and they're
also the only clean fit for the procedural synth path (which produces an `AudioBuffer`
directly). The tradeoff is memory: PCM is large. Mitigations:

- Demo electronic tracks are **short loops (8–16 s)** that we loop; we hold at most 2 decoded
  buffers (current + next) at once.
- Real CC0 tracks should be **~60–120 s loop-friendly** files, decoded lazily (only the next
  one), and the previous buffer dropped after a crossfade so peak memory ≈ 2 buffers.
- We accept the RAM cost for a workout-length session; it is bounded and small.

So: each "voice" = an `AudioBufferSourceNode` → its own per-track `GainNode` → master gain.

---

## 3. The mixer: `src/engine/audioMixer.ts` (no React)

### Responsibilities

- Own a playlist (ordered list of `TrackId`s from the manifest).
- Decode/generate the **current** and **next** buffers ahead of time (preload).
- Keep current track playing; **schedule the next track to start exactly `crossfadeSeconds`
  before the current ends**, ramping master-of-voice gains with **equal-power** curves so
  total perceived loudness stays flat through the overlap.
- React to timer lifecycle: `running` → play/resume, `paused` → pause (or duck), `done` →
  fade to silence.
- Controls: `play()`, `pause()`, `next()` (skip with a fast crossfade), `setVolume(0..1)`.

### Public shape

```ts
import type { Track } from '../assets/music/tracks'

export interface AudioMixerDeps {
  bus: AudioBus
  /** Resolve a track to PCM. For real files: fetch+decodeAudioData. For demo: synth. */
  loadBuffer: (track: Track, ctx: BaseAudioContext) => Promise<AudioBuffer>
}

export interface AudioMixerOptions {
  playlist: Track[]
  crossfadeSeconds?: number   // default 6
  skipCrossfadeSeconds?: number // default 1.5 (faster on manual skip)
  volume?: number             // 0..1, default 0.6
  loopPlaylist?: boolean      // default true (wrap to start)
}

export type MixerState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped'

export interface MixerSnapshot {
  state: MixerState
  currentTrackId: string | null
  nextTrackId: string | null
  volume: number
}

export class AudioMixer {
  constructor(deps: AudioMixerDeps, opts: AudioMixerOptions)
  getSnapshot(): MixerSnapshot
  onChange(listener: (s: MixerSnapshot) => void): () => void

  // lifecycle
  play(): Promise<void>     // start current (or resume), kick preloading
  pause(): void             // ramp voices to 0 over ~150ms, suspend sources
  resume(): Promise<void>
  stop(): void              // fade out + tear down all voices
  fadeOutAndStop(seconds?: number): void // for 'done'

  // controls
  next(): Promise<void>     // crossfade now into the next track (skipCrossfade)
  setVolume(v: number): void // master-of-music gain, smoothed
  setPlaylist(tracks: Track[]): void

  // tick — called by a scheduler (rAF/setInterval) to evaluate "time to crossfade?"
  update(): void

  dispose(): void
}
```

### Voices & graph

```
voiceA.source (AudioBufferSourceNode, loop=true)
  → voiceA.gain (GainNode, per-track)  ┐
voiceB.source                          ├─→ musicGain (master-of-music) → bus.master → ctx.destination
  → voiceB.gain                        ┘
```

- Two reusable "voice slots" (A/B). A crossfade always means: active voice fades out while the
  newly-started voice fades in. After the fade, the faded-out voice is stopped and its buffer
  released.
- `musicGain` holds the **user volume** (separate from per-voice crossfade gains and from
  `bus.master`). This keeps three concerns independent: per-track fade (mixer), music volume
  (user), and global mute/duck (bus).

### Gap-free scheduling

The mixer does **not** rely on `ended` events (too late, not sample-accurate). Instead:

1. When a voice starts at audio-clock time `t0`, we know its play length `L`
   (track duration, or for looped demo loops we pick a musical number of loops ≈ target
   segment length so the mix advances). We record `voice.endTime = t0 + L`.
2. On each `update()` tick we compute, on the **audio clock** (`ctx.currentTime`):
   `shouldStartNext = ctx.currentTime >= voice.endTime - crossfadeSeconds` and the next
   buffer is decoded/ready.
3. When true, we schedule the next voice's `source.start(startAt)` where
   `startAt = max(ctx.currentTime, voice.endTime - crossfadeSeconds)`, and schedule the two
   gain ramps over `[startAt, startAt + crossfadeSeconds]`. **All scheduling is on the audio
   clock**, so a janky rAF tick cannot create a gap — we book the future ahead of time.
4. We begin **preloading the track after `next`** as soon as a crossfade is committed, so
   there's always a decoded buffer ready before the following boundary.

Because everything is pre-scheduled on `ctx.currentTime`, the `update()` cadence only needs to
be "frequently enough to notice the boundary `crossfadeSeconds` ahead" — every 250 ms is
plenty. We piggy-back on a lightweight `setInterval(250)` owned by the React binding (not rAF;
the mixer must run even when the timer is paused but music keeps playing, per product choice).

### Equal-power crossfade gain math (the pure, testable core)

Linear crossfade dips ~3–6 dB in the middle (two correlated/uncorrelated signals sum below
unity perceived loudness). **Equal-power** keeps perceived loudness flat:

```ts
// progress p in [0,1] across the crossfade
export function equalPowerGains(p: number): { out: number; in: number } {
  const x = clamp01(p)
  return {
    out: Math.cos((x * Math.PI) / 2), // 1 → 0
    in: Math.sin((x * Math.PI) / 2),  // 0 → 1
  }
}
// invariant: out^2 + in^2 === 1 for all p  (constant power)
```

Web Audio can't ramp along an arbitrary curve with one call, but `setValueCurveAtTime` takes a
sampled `Float32Array`. We sample the cos/sin curves at e.g. 128 points and hand them to
`setValueCurveAtTime(curve, startAt, crossfadeSeconds)`. The **curve generation is a pure
function** (testable without any AudioContext):

```ts
export function equalPowerCurve(dir: 'in' | 'out', steps = 128): Float32Array {
  const a = new Float32Array(steps)
  for (let i = 0; i < steps; i++) {
    const p = i / (steps - 1)
    a[i] = dir === 'in' ? Math.sin((p * Math.PI) / 2) : Math.cos((p * Math.PI) / 2)
  }
  return a
}
```

Per-voice ramps are scaled by the curve only; the user **volume** lives on `musicGain` and is
**not** part of the crossfade math, so volume and crossfade are orthogonal and independently
testable.

### Scheduling decision — pure function

Extract the "should we start the next track now?" decision so it's unit-testable with no audio:

```ts
export interface CrossfadePlan {
  startAt: number      // audio-clock time to start next voice
  crossfade: number    // seconds
}
export function planCrossfade(args: {
  now: number          // ctx.currentTime
  currentEndTime: number
  crossfadeSeconds: number
  nextBufferReady: boolean
}): CrossfadePlan | null {
  const { now, currentEndTime, crossfadeSeconds, nextBufferReady } = args
  if (!nextBufferReady) return null
  const boundary = currentEndTime - crossfadeSeconds
  if (now < boundary) return null
  return { startAt: Math.max(now, boundary), crossfade: crossfadeSeconds }
}
```

`update()` becomes a thin wrapper: call `planCrossfade(...)`, and if non-null, perform the
(impure) scheduling. The branchy decision logic is fully covered by Vitest.

### Volume

`setVolume(v)`: ramp `musicGain.gain` to `clamp01(v)` over ~80 ms
(`setTargetAtTime`) to avoid zipper noise. Stored separately so crossfades don't clobber it.
Persisted via `useSettings().update({ music: { volume } })`.

### Skip / next

`next()` chooses the next track in the playlist (wrapping if `loopPlaylist`), forces its buffer
ready (await `loadBuffer` if not preloaded), then runs a crossfade **now** with the shorter
`skipCrossfadeSeconds` (≈1.5 s) for snappy UX. It also re-arms preloading of the track after
the new one. The currently-displayed track in `MusicBar` updates via `onChange`.

### Timer lifecycle integration

The React binding subscribes the mixer to timer status. Product behavior:

| Timer event | Mixer action |
|---|---|
| `idle` | mixer `idle`; nothing playing |
| user taps Start (gesture) | `bus.unlock()` (shared with cues) |
| timer → `running` & `music.enabled` | `mixer.play()` (start/resume current track) |
| timer → `paused` | `mixer.pause()` — quick fade to silence, keep position; **(alt: keep playing — see below)** |
| timer → `done` | `mixer.fadeOutAndStop(3)` — graceful 3 s fade as the "done" cue rings |
| `music.enabled` toggled off | `mixer.stop()` |
| `music.enabled` toggled on while running | `mixer.play()` |

Pause policy (decision, configurable): **pause the music when the timer pauses.** A HIIT pause
is usually "I need a breather / answer the door" — silence is expected and saves battery. We
make this a constructor flag (`pauseMusicWithTimer: boolean`, default `true`) so it's a
one-liner to switch to "music keeps grooving through pauses" if user testing prefers it.

Cue ducking (nice-to-have, wired but cheap): since cues share the bus, when a beep plays we can
briefly ramp `musicGain` down ~6 dB for 150 ms so the countdown beep cuts through. Implemented
by `CuePlayer` calling an optional `bus`-level duck hook; out of scope for v1 if time-boxed.

---

## 4. Track manifest & Vite bundling — `src/assets/music/`

### Directory

```
src/assets/music/
  tracks.ts            # the manifest (the stable interface MusicBar + mixer consume)
  synth.ts             # procedural demo generator (Web Audio / OfflineAudioContext)
  loadBuffer.ts        # the loadBuffer(track, ctx) resolver used by the mixer
  *.ogg / *.mp3        # real CC0 files dropped in LATER (none today)
```

### Manifest format — `tracks.ts`

```ts
export type TrackSource =
  | { kind: 'synth'; seed: number; preset: SynthPreset } // procedural; zero assets
  | { kind: 'file'; url: string }                          // real CC0 file (Vite-resolved)

export interface Track {
  id: string                 // stable, used as settings.music.trackId
  title: string
  artist: string             // 'Procedural Demo' for synth tracks
  bpm: number
  durationSeconds: number    // intended segment length (loops for synth)
  loopable: boolean          // can we wrap seamlessly?
  source: TrackSource
  license: string            // SPDX-ish, e.g. 'CC0-1.0' or 'demo-synth'
  attribution?: string       // required text for some CC licenses
}

// REAL files use Vite's asset URL import so they're bundled + hashed for offline:
//   import duskUrl from './dusk-loop.ogg'   // Vite returns a hashed, bundled URL
// then: { kind: 'file', url: duskUrl }
// This guarantees the file ships in the build and is cached by the PWA service worker.

export const TRACKS: Track[] = [
  // Today: all synth, no assets.
  { id: 'demo-pulse', title: 'Pulse',  artist: 'Procedural Demo', bpm: 124,
    durationSeconds: 90, loopable: true, license: 'demo-synth',
    source: { kind: 'synth', seed: 1, preset: 'deep-house' } },
  { id: 'demo-glow',  title: 'Glow',   artist: 'Procedural Demo', bpm: 128,
    durationSeconds: 90, loopable: true, license: 'demo-synth',
    source: { kind: 'synth', seed: 2, preset: 'synthwave' } },
  { id: 'demo-drive', title: 'Drive',  artist: 'Procedural Demo', bpm: 132,
    durationSeconds: 90, loopable: true, license: 'demo-synth',
    source: { kind: 'synth', seed: 3, preset: 'techno' } },
]

export const DEFAULT_PLAYLIST: string[] = TRACKS.map((t) => t.id)
```

### Vite bundling for offline use

- **Synth tracks ship no bytes** — pure code, generated at runtime in an `OfflineAudioContext`.
  This is why the player is testable/usable today with zero assets.
- **Real files** are imported as URLs (`import url from './file.ogg'`). Vite 8 fingerprints and
  emits them into `dist/assets/`, so the URL is build-relative and offline-safe. Large files
  (> `assetsInlineLimit`, default 4 KB) are emitted as files, not inlined — correct for audio.
- **PWA**: the service worker (when added) must precache these emitted asset URLs. Use the
  manifest (`TRACKS.filter(kind==='file').map(url)`) to feed the precache list so nothing is
  fetched at runtime. No runtime network calls — satisfies the offline requirement.
- Format: prefer **`.ogg` (Vorbis/Opus)** for size; ship an `.mp3` fallback only if Safari
  coverage demands it. `decodeAudioData` handles both. Keep files mono or 96–128 kbps stereo
  to bound the bundle.

### `loadBuffer.ts` — the resolver injected into the mixer

```ts
import type { Track } from './tracks'
import { renderSynthTrack } from './synth'

export async function loadBuffer(track: Track, ctx: BaseAudioContext): Promise<AudioBuffer> {
  if (track.source.kind === 'synth') {
    return renderSynthTrack(track, track.source)  // OfflineAudioContext render
  }
  const res = await fetch(track.source.url)        // bundled asset; offline-cached
  const arr = await res.arrayBuffer()
  return ctx.decodeAudioData(arr)
}
```

The mixer only knows `loadBuffer(track, ctx) => Promise<AudioBuffer>` — it never branches on
synth-vs-file. Real tracks drop in by editing `tracks.ts` only.

---

## 5. Procedural synth demo-track generator — `src/assets/music/synth.ts`

Goal: generate **loopable electronic** audio offline, deterministically (seeded), into an
`AudioBuffer`, so the crossfade is fully exercised today with no assets.

### Approach: render with `OfflineAudioContext`

`OfflineAudioContext(channels, length, sampleRate)` renders a graph faster-than-realtime to an
`AudioBuffer`. We build a few-bar electronic loop and render it once at module/track load.

```ts
export type SynthPreset = 'deep-house' | 'synthwave' | 'techno'

export async function renderSynthTrack(
  track: Track,
  source: { kind: 'synth'; seed: number; preset: SynthPreset },
): Promise<AudioBuffer> {
  const sampleRate = 44100
  const length = Math.round(track.durationSeconds * sampleRate)
  const Ctor = globalThis.OfflineAudioContext
    ?? (globalThis as any).webkitOfflineAudioContext
  const octx: OfflineAudioContext = new Ctor(2, length, sampleRate)

  const rng = mulberry32(source.seed)         // deterministic PRNG (pure, testable)
  const secondsPerBeat = 60 / track.bpm

  // Layers (all standard Web Audio nodes):
  //  - kick:  sine osc with fast pitch+amp envelope, on every beat (4-on-the-floor)
  //  - bass:  saw/square through lowpass, root-note pattern from the scale + seed
  //  - pad:   detuned saw stack → lowpass → slow LFO on cutoff (movement)
  //  - hat:   shaped noise burst (BufferSource of white noise) on offbeats
  //  - arp:   short square plucks following a seeded scale pattern (synthwave/techno)
  // Each scheduled with octx.currentTime offsets across the loop length.
  scheduleDrums(octx, track, rng)
  scheduleBassAndPad(octx, track, source.preset, rng)
  scheduleArp(octx, track, source.preset, rng)

  const buffer = await octx.startRendering()
  return makeSeamlessLoop(buffer) // crossfade the tail into the head so loop wrap is clickless
}
```

Key details:

- **Loopable**: we render exactly an integer number of bars
  (`durationSeconds = bars * 4 * secondsPerBeat`), and apply a short (~30 ms) head/tail
  equal-power crossfade inside the buffer (`makeSeamlessLoop`) so `source.loop=true` wraps with
  no click. The phrase length is chosen musically so loops don't sound obviously repetitive
  over a 13-min session.
- **Deterministic** via a seeded PRNG (`mulberry32`) — same seed ⇒ same track ⇒ snapshot-stable
  tests and identical playback across reloads.
- **Distinct presets** give the playlist variety so crossfades are audibly real (different
  timbre/BPM each track) rather than three copies of one loop.
- **Pure helpers** (`mulberry32`, scale tables, `makeSeamlessLoop`'s gain math, bar/beat math)
  are exported and unit-tested without any audio context.

### Testability of synth in Vitest

- Pure scheduling math (note times, bar counts, loop crossfade window) tested directly.
- Rendering tested against a **mocked `OfflineAudioContext`** (jsdom has none) that records node
  creation/connections, or in a real-audio integration test gated to environments that provide
  it. The mixer/`loadBuffer` is injected, so tests pass a fake `loadBuffer` returning a tiny
  hand-built `AudioBuffer` — no synth needed to test the mixer.

### CC0 sourcing (for real tracks later)

Where to get genuinely free-to-redistribute electronic music (verify license per track at
download time — licenses vary *within* a site):

- **Pixabay Music** (`pixabay.com/music`) — Pixabay Content License: free for commercial use,
  no attribution required, redistribution within an app allowed. Large electronic/EDM catalog.
  Best default for a bundled app.
- **Free Music Archive** (`freemusicarchive.org`) — filter to **CC0** or **CC BY** tracks; lots
  of electronic. CC0 = no attribution needed; CC BY = attribution required (see LICENSES.md).
- **Incompetech (Kevin MacLeod)** (`incompetech.com`) — CC BY 4.0 (attribution required); some
  electronic/ambient.
- **Free PD** (`freepd.com`) — CC0 instrumental tracks, several electronic.
- **OpenGameArt** (`opengameart.org`) — filter to CC0; loopable electronic loops, ideal because
  they're authored to loop.
- **ccMixter** (`ccmixter.org`) — filter to CC0/CC BY.

Rules: prefer **CC0 / Pixabay-license** (no attribution) to keep the UI clean; if using **CC
BY**, you MUST display/ship attribution. Download the **highest-quality** source, re-encode to
~128 kbps OGG, keep loop-friendly tracks, and record provenance in `LICENSES.md`.

### `LICENSES.md` (project root) — required template

```md
# Music Licenses & Attribution

This app bundles audio for offline playback. Each track below lists its source and license.

## Demo (procedural)
- "Pulse", "Glow", "Drive" — generated procedurally at runtime (no copyrighted audio).
  License: original code, MIT (same as this project). No attribution required.

## Bundled tracks
<!-- One block PER real track. Fill on adding a file. -->
- Title:        <track title>
  Artist:       <artist / uploader>
  Source URL:   <direct page URL where downloaded>
  License:      <CC0-1.0 | CC-BY-4.0 | Pixabay Content License | ...>
  License URL:  <link to the license text>
  Attribution:  <exact required attribution string, or "none required">
  Date added:   <YYYY-MM-DD>
  File:         src/assets/music/<file>.ogg
```

For any **CC BY** track, the `Attribution` string must also be surfaced in-app (e.g. a
"credits" line in `SettingsPanel` or a `…` info popover in `MusicBar`), driven by
`Track.attribution`.

---

## 6. `MusicBar` React control — `src/components/MusicBar.tsx`

Rendered by `TimerScreen` **only when `settings.music.enabled`**. Binds the persisted music
settings to the mixer instance.

### Wiring

A small hook owns the mixer lifecycle and bridges it to React + settings + timer:

```
src/state/useMusic.ts  (new)
```

```ts
export interface UseMusic {
  snapshot: MixerSnapshot          // from mixer.onChange
  play(): void
  pause(): void
  next(): void
  setVolume(v: number): void       // also persists via useSettings().update
}

export function useMusic(args: {
  bus: AudioBus | null
  timerStatus: TimerStatus         // drives lifecycle reactions
}): UseMusic
```

`useMusic` responsibilities:

- Lazily construct `AudioMixer` once (ref), with `playlist` resolved from `TRACKS` filtered by
  `DEFAULT_PLAYLIST` (or a settings-chosen subset), `volume` from `settings.music.volume`,
  `loadBuffer` from `loadBuffer.ts`.
- Run the `setInterval(250)` `update()` driver while state is `playing`.
- Subscribe to `mixer.onChange` → `setState(snapshot)`; persist `currentTrackId` to
  `settings.music.trackId` so the session resumes on the same track.
- React to `timerStatus` per the lifecycle table (§3): `running`→`play`, `paused`→`pause`,
  `done`→`fadeOutAndStop`.
- React to `settings.music.enabled`/`volume` changes.
- `dispose()` on unmount.

This keeps `MusicBar` a **pure presentational** component:

```tsx
export function MusicBar({
  snapshot, onPlayPause, onNext, volume, onVolume,
}: {
  snapshot: MixerSnapshot
  onPlayPause: () => void
  onNext: () => void
  volume: number
  onVolume: (v: number) => void
}) {
  const playing = snapshot.state === 'playing'
  return (
    <div className="music-bar" role="group" aria-label="Music">
      <button className="music-bar__btn" onClick={onPlayPause}
              aria-label={playing ? 'Pause music' : 'Play music'}>
        {playing ? '⏸' : '▶'}
      </button>
      <button className="music-bar__btn" onClick={onNext} aria-label="Skip track">⏭</button>
      <span className="music-bar__title">{snapshot.currentTrackId ?? '—'}</span>
      <input className="music-bar__vol" type="range" min={0} max={1} step={0.01}
             value={volume} onChange={(e) => onVolume(e.currentTarget.valueAsNumber)}
             aria-label="Music volume" />
    </div>
  )
}
```

`TimerScreen` composes: `const music = useMusic({ bus, timerStatus: snapshot.status })` then
`{settings.music.enabled && <MusicBar snapshot={music.snapshot} … volume={settings.music.volume}
onVolume={music.setVolume} … />}`. The Start gesture handler calls `bus.unlock()` (covers both
cues and music). Volume changes flow `MusicBar → useMusic.setVolume → mixer.setVolume +
useSettings().update({ music: { volume } })`.

Display the human title via `TRACKS.find(t => t.id === snapshot.currentTrackId)?.title` rather
than the raw id (kept out of the snippet for brevity).

---

## 7. Vitest-testable seams (summary)

Pure functions (no AudioContext — direct unit tests):

- `equalPowerGains(p)` — assert `out²+in²≈1` across `[0,1]`, endpoints `(1,0)`/`(0,1)`.
- `equalPowerCurve(dir, steps)` — length, monotonicity, endpoints.
- `planCrossfade({now,currentEndTime,crossfadeSeconds,nextBufferReady})` — null when not ready,
  null before boundary, correct `startAt` at/after boundary, `startAt` never < `now`.
- Playlist advance/wrap logic (`nextIndex(i, len, loop)`).
- Synth: `mulberry32` determinism, bar/beat time math, `makeSeamlessLoop` gain window.

Injectable/mockable boundaries:

- `AudioMixer` takes `deps.bus` and `deps.loadBuffer`. Tests inject a **fake bus** (an object
  with a fake `ctx` exposing `createGain`/`createBufferSource`/`currentTime` as a controllable
  clock, plus `master`) and a **fake `loadBuffer`** returning a stub `AudioBuffer`. Then drive
  `update()` with an advancing fake `currentTime` and assert: the next source is started, gain
  curves are applied at the planned time, the old voice is stopped after the fade, preloading is
  re-armed, `next()`/`setVolume()`/`pause()` produce the right node calls and snapshots.
- Provide a tiny `createFakeAudioBus()` test helper that records node creation and
  `setValueCurveAtTime`/`setTargetAtTime` calls for assertions. jsdom has no Web Audio, so this
  helper (not a real context) is what makes mixer behavior testable headlessly.
- The synth render is tested via a recording mock of `OfflineAudioContext` (asserts the expected
  layers/nodes are scheduled) and/or gated real-audio integration tests; the mixer itself never
  needs the synth because `loadBuffer` is injected.

---

## 8. File checklist

| File | New? | React? | Purpose |
|---|---|---|---|
| `src/engine/audioContext.ts` | new | no | shared `AudioBus` (one AudioContext + master) |
| `src/engine/audioMixer.ts` | new | no | crossfade mixer + pure `planCrossfade`/`equalPower*` |
| `src/engine/cues.ts` | edit | no | accept injected `ctx`/`master` (share the bus) |
| `src/assets/music/tracks.ts` | new | no | manifest (`Track`, `TRACKS`, `DEFAULT_PLAYLIST`) |
| `src/assets/music/synth.ts` | new | no | procedural demo track generator (OfflineAudioContext) |
| `src/assets/music/loadBuffer.ts` | new | no | `loadBuffer(track, ctx)` resolver (synth or fetch+decode) |
| `src/state/useMusic.ts` | new | yes | mixer lifecycle bridge to React/settings/timer |
| `src/components/MusicBar.tsx` (+`.css`) | new | yes | presentational controls |
| `src/engine/audioMixer.test.ts` | new | no | pure-math + mixer-with-fake-bus tests |
| `LICENSES.md` (root) | new | n/a | track provenance/attribution |

## 9. Key decisions (TL;DR)

- One shared `AudioContext` via an `AudioBus`, injected into both `CuePlayer` and `AudioMixer`
  (single autoplay unlock, sane mobile behavior).
- `decodeAudioData` + `AudioBufferSourceNode` (not `HTMLAudioElement`) for sample-accurate,
  gap-free crossfades and a clean synth path; bound memory to ~2 buffers.
- Equal-power (cos/sin) crossfade via `setValueCurveAtTime`, with the curve/decision math as
  pure functions; user volume on a separate `musicGain` so it's orthogonal to fades.
- Gap-free scheduling = pre-book the next `start()` and gain ramps on the audio clock
  `crossfadeSeconds` ahead; rAF/interval jank can't open a gap.
- Manifest abstracts synth-vs-file behind `loadBuffer`; ship **only synth** today (zero assets),
  drop CC0 OGG files in later via Vite URL imports + PWA precache.
- Music follows the timer: play on `running`, pause on `paused` (configurable), fade out on
  `done`; mute/duck routed through the shared master.
