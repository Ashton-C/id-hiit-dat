# Visuals Architecture — Three Selectable Visual Modes + Switcher

Status: design spec (to be implemented). Author role: visuals architect.
Targets the **planned foundation seam** (`useSettings()` + refactored
`TimerScreen`), NOT the current `TimerScreen.tsx`, which is being rewritten in
parallel. This document is the contract the visuals layer must satisfy.

Constraints honored throughout: fully offline (no runtime network, no asset
downloads — every diagram is hand-coded inline SVG, every gradient is CSS/JS we
ship), dark theme, PWA-first, mobile battery-conscious, `prefers-reduced-motion`
respected, and the engine (`src/engine/*`) stays React-free.

---

## 0. Where this plugs in

The refactored `TimerScreen` will read settings and render:

```tsx
const { settings } = useSettings()
const { snapshot, toggle, reset, onTransition } = useTimer(settings.routine)

return (
  <main className="timer-screen">
    <VisualLayer mode={settings.visualMode} snapshot={snapshot} />   {/* z:0 background */}
    <div className="timer-screen__content">                          {/* z:1 */}
      <TimerDisplay snapshot={snapshot} />
      <Controls .../>
      {settings.music.enabled && <MusicBar .../>}
    </div>
    <button className="timer-screen__gear" .../>                      {/* opens SettingsPanel */}
    <FlashOverlay onTransition={onTransition} />                      {/* transition flash, see §1.4 */}
  </main>
)
```

`VisualLayer` is the **only** thing that changes when `visualMode` changes.
Everything above it (`TimerDisplay`, `Controls`, `MusicBar`, gear) is mode-agnostic
and always rendered on top at `z-index: 1`. The visual layer is `position: fixed;
inset: 0; z-index: 0` and `pointer-events: none` so taps fall through to controls.

`snapshot: TimerSnapshot` is the single source of truth driving every mode. The
fields we use: `phase.kind` ('prepare'|'work'|'rest'|'done'), `status`,
`phaseRemainingMs`, `phaseRemainingSeconds`, `phase.durationSeconds`,
`currentExercise`, `round`. No new engine fields are required.

A derived value used by all modes — **phase progress 0..1**:

```ts
// utils/phaseProgress.ts (pure, no React)
export function phaseProgress(s: TimerSnapshot): number {
  const total = s.phase.durationSeconds * 1000
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, 1 - s.phaseRemainingMs / total))
}
```

---

## 1. `VisualLayer` component

`src/visuals/VisualLayer.tsx`

```tsx
import type { TimerSnapshot } from '../engine/timer'
import type { VisualMode } from '../state/settings' // 'minimal'|'gradient'|'diagram'
import { MinimalVisual } from './modes/MinimalVisual'
import { GradientVisual } from './modes/GradientVisual'
import { DiagramVisual } from './modes/DiagramVisual'
import './VisualLayer.css'

export function VisualLayer({
  mode,
  snapshot,
}: {
  mode: VisualMode
  snapshot: TimerSnapshot
}) {
  return (
    <div className="visual-layer" aria-hidden="true">
      {mode === 'minimal' && <MinimalVisual snapshot={snapshot} />}
      {mode === 'gradient' && <GradientVisual snapshot={snapshot} />}
      {mode === 'diagram' && <DiagramVisual snapshot={snapshot} />}
    </div>
  )
}
```

Design rules:

- **`aria-hidden="true"`** on the wrapper. The visual layer is decorative; all
  meaningful state is announced by `TimerDisplay`. This avoids double-announcing
  phase/exercise to screen readers.
- **`pointer-events: none`** on `.visual-layer` (CSS) so it never steals taps.
- One mode mounted at a time. Switching modes unmounts the previous one, which
  tears down its rAF loop / CSS animation cleanly — no lingering work.
- The layer is a **pure function of `snapshot` + `mode`**. No internal timers
  except the gradient's optional rAF (and even that derives from `snapshot`, see
  §2). This keeps it testable: render with a fixed snapshot, assert the DOM.

### 1.1 File layout

```
src/visuals/
  VisualLayer.tsx
  VisualLayer.css
  TimerDisplay.tsx          (exists)
  modes/
    MinimalVisual.tsx
    MinimalVisual.css
    GradientVisual.tsx
    GradientVisual.css
    DiagramVisual.tsx
    DiagramVisual.css
  palettes.ts               (shared phase → color map; see §1.2)
  diagrams/
    index.ts                (registry: id -> component, + fallback)
    JumpingJacks.tsx
    Squats.tsx
    PushUps.tsx
    HighKnees.tsx
    Lunges.tsx
    MountainClimbers.tsx
    Plank.tsx
    Burpees.tsx
    GluteBridges.tsx
    GenericExercise.tsx     (fallback)
    figure.tsx              (shared stick-figure primitives, see §3)
```

### 1.2 Shared palette (single source of truth for phase color)

`src/visuals/palettes.ts` centralizes the phase→color mapping so minimal mode,
gradient mode, and the diagram accent all agree. Today these colors live as magic
hex values in `TimerScreen.css`; we promote them.

```ts
export type PhaseKind = 'prepare' | 'work' | 'rest' | 'done'

export interface PhasePalette {
  /** Solid background for minimal mode + diagram accent. */
  base: string
  /** Two-stop gradient ends for gradient mode. */
  gradA: string
  gradB: string
}

export const PALETTES: Record<PhaseKind, PhasePalette> = {
  prepare: { base: '#1f2430', gradA: '#1f2430', gradB: '#2b3550' }, // neutral slate
  work:    { base: '#7a1f2b', gradA: '#7a1f2b', gradB: '#c8402f' }, // intense crimson→ember
  rest:    { base: '#14463f', gradA: '#0f3b46', gradB: '#1e7a63' }, // calm teal
  done:    { base: '#1d4d2b', gradA: '#1d4d2b', gradB: '#3a8f4f' }, // success green
}
```

These exact `base` values are migrated verbatim from the current
`TimerScreen.css` so minimal mode is pixel-identical to today.

### 1.3 Minimal mode (factored out of current TimerScreen)

`MinimalVisual` reproduces today's behavior: a solid, phase-colored background
that cross-fades on phase change.

```tsx
import type { TimerSnapshot } from '../../engine/timer'
import { PALETTES } from '../palettes'
import './MinimalVisual.css'

export function MinimalVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const { base } = PALETTES[snapshot.phase.kind]
  return (
    <div
      className="minimal-visual"
      style={{ '--phase-bg': base } as React.CSSProperties}
    />
  )
}
```

```css
/* MinimalVisual.css */
.minimal-visual {
  position: absolute;
  inset: 0;
  background-color: var(--phase-bg, #15171c);
  transition: background-color 0.5s ease;   /* same 0.5s cross-fade as today */
}
```

The 0.5s `transition` is preserved from `TimerScreen.css`. Because `--phase-bg`
changes value (not the rule), the browser animates it. No JS animation needed.

### 1.4 The transition flash — extracted, mode-independent

Today the flash lives in `TimerScreen` (`flashKey` state + `.timer-screen__flash`
remounted via key). It is **conceptually separate from the visual mode** — it
fires on every transition regardless of mode. We extract it into a small
`FlashOverlay` that subscribes to `onTransition` itself, so `TimerScreen` no
longer juggles `flashKey`:

```tsx
// src/visuals/FlashOverlay.tsx
export function FlashOverlay({ onTransition }: {
  onTransition: (l: (e: TransitionEvent) => void) => () => void
}) {
  const [key, setKey] = useState(0)
  useEffect(() => onTransition(() => setKey((k) => k + 1)), [onTransition])
  if (key === 0) return null
  return <div key={key} className="flash-overlay" aria-hidden="true" />
}
```

CSS reuses the existing `timer-flash` keyframes (`opacity 0.55 → 0` over 0.45s)
and is suppressed under `prefers-reduced-motion: reduce` (already the case today).
It sits at `z-index: 2` (above the visual layer, below/around content — it is
`pointer-events: none`).

> Rationale for extracting rather than leaving in TimerScreen: keeps the screen
> orchestration thin, and the flash + cues are the only two consumers of
> `onTransition`. Cues stay in `TimerScreen` (they touch `CuePlayer`/audio policy);
> the flash is purely visual so it belongs in `src/visuals`.

---

## 2. Gradient mode

`GradientVisual` — a smooth animated gradient that **shifts and pulses with the
interval**: energetic during work, calm during rest, neutral on prepare,
celebratory on done.

### 2.1 Rendering approach — recommendation

Three candidates were considered:

| Approach | Smoothness | Battery (mobile) | Offline | Verdict |
|---|---|---|---|---|
| **CSS animated gradient** (`@keyframes` on `background-position` / `background-image`) | GPU-composited, 60fps, no main-thread cost | **Best** — runs on the compositor; throttled automatically when tab hidden | yes | **Chosen** |
| `requestAnimationFrame` canvas | Full control, but JS runs every frame on the main thread; competes with `useTimer`'s rAF | Worst — wakes CPU 60×/s, drains battery, jank risk | yes | Rejected |
| CSS custom properties driven by React state each frame | Re-renders React 60×/s; defeats compositor | Poor | Rejected for the *animation*, **used sparingly** for phase params (see below) |

**Decision: CSS-driven gradient, with React only writing a handful of CSS custom
properties on phase change (not per frame).** The continuous motion (drift +
pulse) is a pure CSS `@keyframes` animation living entirely on the compositor.
React's job is limited to:

1. Setting the phase palette via custom properties when `phase.kind` changes.
2. Setting the **pulse tempo** as a CSS variable (work = fast pulse, rest = slow
   breathing) — also only on phase change.

This means **zero per-frame JS** for the gradient. The browser's compositor
animates it, auto-throttles it when the PWA is backgrounded/locked, and costs
effectively nothing in battery — exactly what `useTimer`'s rAF-only-while-running
design already optimizes for.

> Why not drive the pulse phase off `snapshot.phaseRemainingMs`? That would
> require per-frame React writes. CSS time-based animation is visually
> indistinguishable for a continuous pulse and is free. We only need `snapshot`
> for the *discrete* palette/tempo switch, which is exactly what React is good at.

### 2.2 Implementation sketch

```tsx
import type { TimerSnapshot } from '../../engine/timer'
import { PALETTES } from '../palettes'
import './GradientVisual.css'

// Pulse period per phase, in seconds (CSS animation-duration).
const PULSE_SECONDS: Record<string, number> = {
  prepare: 6,   // slow, settling
  work: 1.6,    // fast, energetic
  rest: 5,      // slow "breathing"
  done: 3,
}

export function GradientVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const kind = snapshot.phase.kind
  const { gradA, gradB } = PALETTES[kind]
  const running = snapshot.status === 'running'

  const style = {
    '--grad-a': gradA,
    '--grad-b': gradB,
    '--pulse-seconds': `${PULSE_SECONDS[kind] ?? 4}s`,
    // Pause the pulse when not running so a paused timer is visually still.
    '--pulse-play': running ? 'running' : 'paused',
  } as React.CSSProperties

  return (
    <div className={`gradient-visual gradient-visual--${kind}`} style={style}>
      <div className="gradient-visual__drift" />
      <div className="gradient-visual__pulse" />
    </div>
  )
}
```

```css
/* GradientVisual.css */
.gradient-visual {
  position: absolute;
  inset: 0;
  background: var(--grad-a);              /* base fallback color */
  /* Ease the palette swap between phases (color tween over 0.8s). */
  transition: background-color 0.8s ease;
}

/* Layer 1: a large, slowly drifting linear gradient → motion without nausea. */
.gradient-visual__drift {
  position: absolute;
  inset: -25%;                            /* oversize so movement never reveals edges */
  background: linear-gradient(
    135deg,
    var(--grad-a) 0%,
    var(--grad-b) 45%,
    var(--grad-a) 100%
  );
  background-size: 200% 200%;
  animation: grad-drift 18s ease-in-out infinite;
  animation-play-state: var(--pulse-play, running);
  will-change: background-position;
}

/* Layer 2: a radial "energy" glow that pulses at the phase tempo. */
.gradient-visual__pulse {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 55%,
    var(--grad-b) 0%,
    transparent 60%
  );
  opacity: 0.45;
  mix-blend-mode: screen;
  animation: grad-pulse var(--pulse-seconds, 4s) ease-in-out infinite;
  animation-play-state: var(--pulse-play, running);
  will-change: opacity, transform;
}

@keyframes grad-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes grad-pulse {
  0%, 100% { opacity: 0.30; transform: scale(1); }
  50%      { opacity: 0.60; transform: scale(1.06); }
}

/* Accessibility: kill motion, keep the (static) phase color. */
@media (prefers-reduced-motion: reduce) {
  .gradient-visual__drift,
  .gradient-visual__pulse {
    animation: none;
  }
  .gradient-visual__pulse { opacity: 0.4; }  /* still a pleasant static glow */
}
```

### 2.3 Phase → feel mapping

| Phase | Palette (gradA → gradB) | Pulse period | Feel |
|---|---|---|---|
| prepare | slate → muted blue | 6s | calm anticipation |
| work | crimson → ember orange | 1.6s | fast, driving, energetic |
| rest | deep teal → green-teal | 5s | slow "breathing" recovery |
| done | green → bright green | 3s | celebratory, settling |

### 2.4 Easing between phases

Two transition layers combine for a polished phase change:

1. **Palette tween** — the `transition: background-color 0.8s ease` on the base +
   the custom-property swap means the gradient color *morphs* over 0.8s rather
   than snapping. (Note: CSS cannot transition `linear-gradient` color stops
   directly, so the morph is approximated by transitioning the solid base color
   that shows through plus the `screen`-blended pulse picking up the new
   `--grad-b`. In practice this reads as a smooth crossfade.)
2. **Tempo change** — the pulse `animation-duration` changes on phase switch.
   To avoid a visible "jump" when the duration changes mid-cycle, the pulse
   keyframe is symmetric (`0%` and `100%` identical), so any restart lands on a
   neutral frame.

The discrete crimson→teal swap at the work/rest boundary is *intentionally*
reinforced by the §1.4 flash, which masks the 0.8s color tween's start.

---

## 3. Exercise diagrams (hand-coded inline SVG)

`diagram` mode shows a simple, self-authored figure for the **current exercise**,
with the timer overlaid on top. All SVGs are inline React components — no image
files, no fonts, no network. They use `currentColor` + the phase accent so they
re-color per phase for free.

### 3.1 Shared figure primitives

`src/visuals/diagrams/figure.tsx` provides reusable stick-figure parts so the
nine exercises stay terse and visually consistent. All diagrams draw on a
`0 0 100 100` viewBox.

```tsx
export const STROKE = { stroke: 'currentColor', strokeWidth: 4,
  strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const

export function Head({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} {...STROKE} />
}
export function Limb({ x1, y1, x2, y2 }: Record<'x1'|'y1'|'x2'|'y2', number>) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...STROKE} />
}
// Floor line, motion-arrow, and a subtle "ghost" duplicate (for reps) also live here.
export function Floor() { return <Limb x1={10} y1={92} x2={90} y2={92} /> }
```

A diagram component is just composed primitives, e.g.:

```tsx
export function Squats() {
  return (
    <svg viewBox="0 0 100 100" className="exercise-diagram" role="img"
         aria-label="Squats">
      <Floor />
      <Head cx={50} cy={30} />
      <Limb x1={50} y1={37} x2={50} y2={58} />           {/* torso, slightly forward */}
      <Limb x1={50} y1={45} x2={36} y2={52} />           {/* arms extended forward */}
      <Limb x1={50} y1={45} x2={64} y2={52} />
      <Limb x1={50} y1={58} x2={40} y2={70} />           {/* thigh L (bent) */}
      <Limb x1={40} y1={70} x2={42} y2={92} />           {/* shin L */}
      <Limb x1={50} y1={58} x2={60} y2={70} />           {/* thigh R */}
      <Limb x1={60} y1={70} x2={58} y2={92} />           {/* shin R */}
    </svg>
  )
}
```

### 3.2 Sketches of 3 representative exercises

These prove the approach spans standing, ground, and dynamic poses.

**1. Jumping Jacks** (standing, limbs out — wide "X" silhouette + motion arcs):
```
   O          head at (50,22)
  /|\         torso (50,29)->(50,55)
 / | \        arms up-and-out: (50,34)->(28,18) and (50,34)->(72,18)
  / \         legs out: (50,55)->(34,90) and (50,55)->(66,90)
( dashed arcs near hands/feet = motion )
```
Implementation: arms drawn raised + outward, legs spread, plus two short dashed
arc `<path>`s (`stroke-dasharray`) near hands and feet to imply the jump. A second
faint "ghost" figure with limbs *down* (opacity 0.25) communicates the rep.

**2. Push-ups** (horizontal body, ground line, bent arms):
```
 O————————       body roughly horizontal, head at left (24,55)
   \   \         arms bend down to floor: shoulder (30,55)->elbow(30,72)->hand(30,86)
( Floor at y=88 ) and a second arm; legs straight to the right toes (78,80)
```
Implementation: torso line from `(30,55)` to `(72,62)`, head circle at the head
end, two arms angling to the floor, straight legs to toes on the floor. A small
up/down motion arrow at the hips.

**3. Plank** (static hold — horizontal body on forearms, emphasize the *hold*):
```
 O——————————    head (24,52), straight rigid body to heels (84,70)
  |             single forearm down to floor (30,52)->(30,86)
( Floor y=88 )  no motion arrow — instead a subtle "hold" hourglass/clock glyph
```
Implementation: one rigid torso line (no bend), forearm to floor, legs to toes.
Because plank is isometric, we **omit** the motion arrow and instead render the
phase countdown ring tighter around it (see §3.4) to emphasize duration.

The remaining six (`high-knees`, `lunges`, `mountain-climbers`, `burpees`,
`glute-bridges`) follow the same vocabulary:
- **high-knees**: standing, one thigh lifted to ~horizontal, arms pumping, motion arrows.
- **lunges**: split stance, front knee bent ~90°, rear knee toward floor.
- **mountain-climbers**: push-up base with one knee driven toward chest, motion arrow.
- **burpees**: a 3-pose ghost montage (stand → plank → jump) at low opacity to imply the sequence.
- **glute-bridges**: supine on floor, hips raised into a bridge, knees bent.

### 3.3 Registry + fallback

`src/visuals/diagrams/index.ts`

```ts
import type { ComponentType } from 'react'
import { JumpingJacks } from './JumpingJacks'
import { Squats } from './Squats'
// ...imports...
import { GenericExercise } from './GenericExercise'

export type DiagramComponent = ComponentType

const REGISTRY: Record<string, DiagramComponent> = {
  'jumping-jacks': JumpingJacks,
  squats: Squats,
  'push-ups': PushUps,
  'high-knees': HighKnees,
  lunges: Lunges,
  'mountain-climbers': MountainClimbers,
  plank: Plank,
  burpees: Burpees,
  'glute-bridges': GluteBridges,
}

/** Look up a diagram by exercise id, falling back to a generic figure. */
export function diagramFor(id: string | undefined): DiagramComponent {
  return (id && REGISTRY[id]) || GenericExercise
}
```

Keys are exactly the `Exercise.id`s in `routine.ts` (`jumping-jacks`, `squats`,
`push-ups`, `high-knees`, `lunges`, `mountain-climbers`, `plank`, `burpees`,
`glute-bridges`). **Fallback**: any unknown id (custom routines added later) gets
`GenericExercise` — a neutral standing stick figure with a small dumbbell glyph,
so diagram mode never breaks on user-authored exercises.

### 3.4 How diagram mode overlays the timer

`DiagramVisual` renders the figure as a centered, large but content-respecting
background, tinted by the phase accent, with the existing `TimerDisplay` floating
over it (as in §0, `TimerDisplay` always sits at `z-index: 1`).

```tsx
import type { TimerSnapshot } from '../../engine/timer'
import { PALETTES } from '../palettes'
import { diagramFor } from '../diagrams'
import './DiagramVisual.css'

export function DiagramVisual({ snapshot }: { snapshot: TimerSnapshot }) {
  const kind = snapshot.phase.kind
  const { base } = PALETTES[kind]

  // During rest/prepare/done there's no current exercise — show the *next* one
  // dimmed ("coming up") so the screen isn't empty, or a checkmark on done.
  const ex = snapshot.currentExercise ?? snapshot.nextExercise
  const Diagram = diagramFor(ex?.id)
  const isWork = kind === 'work'

  return (
    <div
      className={`diagram-visual diagram-visual--${kind}`}
      style={{ '--accent': base } as React.CSSProperties}
    >
      <div className={`diagram-visual__figure ${isWork ? '' : 'is-preview'}`}>
        {kind === 'done' ? <DoneGlyph /> : <Diagram />}
      </div>
    </div>
  )
}
```

```css
.diagram-visual {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background-color: color-mix(in srgb, var(--accent) 55%, #15171c);
  transition: background-color 0.5s ease;
}
.diagram-visual__figure {
  width: min(70vw, 46vh);            /* large but leaves room; never overlaps controls */
  color: rgba(255, 255, 255, 0.9);  /* figure stroke = currentColor */
  /* Push the figure slightly up so the centered TimerDisplay reads over its legs,
     not its head. */
  transform: translateY(-6%);
}
.diagram-visual__figure.is-preview {  /* rest/prepare: dim the "coming up" figure */
  opacity: 0.4;
}
@media (prefers-reduced-motion: reduce) {
  .diagram-visual__figure svg [data-motion] { display: none; }  /* hide motion arrows/ghosts */
}
```

Layout contract so the figure and timer don't collide: the figure is sized to
`min(70vw, 46vh)` and nudged up 6%; `TimerDisplay` keeps its current centered
layout with a translucent text shadow (added in `TimerDisplay.css` only when
needed) so the big countdown stays legible over line art. On `work` the figure is
full-opacity; on `rest`/`prepare` it dims to 0.4 and shows the *upcoming*
exercise ("get ready for X"); on `done` it swaps to a checkmark glyph.

Motion hints (dashed arcs, ghost poses) are tagged `data-motion` so
`prefers-reduced-motion` can strip them while keeping the core pose.

---

## 4. Mode switcher UX

Two complementary entry points, both reading/writing `useSettings().visualMode`:

### 4.1 Primary: in `SettingsPanel` (canonical)

A three-option segmented control inside the settings overlay:

```
Visual style
[ Minimal ]  [ Gradient ]  [ Diagram ]
```

```tsx
const MODES = [
  { id: 'minimal',  label: 'Minimal',  hint: 'Solid phase colors' },
  { id: 'gradient', label: 'Gradient', hint: 'Animated, pulses with the interval' },
  { id: 'diagram',  label: 'Diagram',  hint: 'Exercise figures' },
] as const

function VisualModePicker() {
  const { settings, update } = useSettings()
  return (
    <fieldset className="mode-picker" role="radiogroup" aria-label="Visual style">
      <legend>Visual style</legend>
      {MODES.map((m) => (
        <button
          key={m.id}
          role="radio"
          aria-checked={settings.visualMode === m.id}
          className="mode-picker__opt"
          onClick={() => update({ visualMode: m.id })}
        >
          <span className="mode-picker__label">{m.label}</span>
          <span className="mode-picker__hint">{m.hint}</span>
        </button>
      ))}
    </fieldset>
  )
}
```

Implemented as a `radiogroup` of `role="radio"` buttons (keyboard: arrows move,
Space/Enter selects). Each option shows a one-line hint. Selection persists
through `useSettings().update({ visualMode })` → localStorage. The change is
**instant and live** (the panel can stay open while the background changes behind
it), which doubles as a preview.

### 4.2 Secondary: on-screen quick toggle (optional, recommended)

A small cycle button in the screen corner (near the gear) that rotates
`minimal → gradient → diagram → minimal`. Useful for one-tap experimentation
without opening settings. It writes the same setting, so the two stay in sync.

```tsx
const ORDER = ['minimal', 'gradient', 'diagram'] as const
function QuickVisualToggle() {
  const { settings, update } = useSettings()
  const next = ORDER[(ORDER.indexOf(settings.visualMode) + 1) % ORDER.length]
  return (
    <button className="quick-visual" aria-label={`Visual style: ${settings.visualMode}. Tap for ${next}.`}
            onClick={() => update({ visualMode: next })}>
      {/* small icon per mode */}
    </button>
  )
}
```

Recommendation: ship the SettingsPanel picker as canonical; gate the on-screen
toggle behind a follow-up (it adds a control to the otherwise clean timer screen).
If included, place it bottom-corner, low-contrast, `pointer-events:auto`, so it
doesn't compete with Start/Pause.

---

## 5. Accessibility notes

- **`prefers-reduced-motion: reduce`** is honored in every mode:
  - minimal: the 0.5s color cross-fade is mild; we keep it (it's a fade, not
    motion) but the transition flash is already disabled under reduced-motion.
  - gradient: both `@keyframes` animations are disabled; a pleasant *static*
    gradient remains.
  - diagram: motion arrows / ghost poses (`[data-motion]`) are hidden; the static
    pose remains.
- **Decorative by default**: `VisualLayer` is `aria-hidden="true"`. Phase,
  exercise, time, and "up next" are conveyed by `TimerDisplay` (the existing
  source of truth), so screen-reader users lose nothing in any mode.
- **Each diagram SVG** carries `role="img"` + `aria-label` (the exercise name) so
  that *if* a future design surfaces the diagram outside the decorative layer it
  is already labeled. Inside `VisualLayer` the `aria-hidden` ancestor keeps it
  from being double-read.
- **Mode picker** uses a proper `radiogroup`/`radio` pattern with visible focus
  rings and `aria-checked`; the quick toggle has a descriptive `aria-label` that
  states current + next mode.
- **Contrast**: timer text over gradient/diagram backgrounds gets a subtle text
  shadow / scrim so the white readout maintains ≥ 4.5:1 against the brightest
  point of the animated background (verify the work-phase ember orange + pulse,
  the worst case).
- **No reliance on color alone**: phase is always also stated as text ("Work",
  "Rest") by `TimerDisplay`, so color-blind users aren't dependent on the
  crimson/teal distinction.

## 6. Performance notes

- **Gradient is compositor-only**: CSS `@keyframes` on `background-position` /
  `opacity` / `transform`, `will-change` hints, **zero per-frame JS**. The browser
  throttles/pauses these when the PWA is backgrounded or the phone is locked,
  matching `useTimer`'s "rAF only while running" battery philosophy. React
  touches the gradient only on discrete phase changes (a handful of custom-prop
  writes), not every frame.
- **`animation-play-state` follows `status`** so a paused timer has a visually
  still background (no needless GPU work while paused).
- **Mode isolation**: only one mode mounts; switching unmounts the rest, so no
  hidden mode keeps animating.
- **No new assets / no network**: every gradient is CSS; every diagram is inline
  SVG bundled in the JS. Total visual-layer payload is a few KB of markup. Works
  fully offline (PWA requirement) with no font/image fetches.
- **SVG is cheap**: each diagram is < ~12 vector primitives at a fixed
  `100×100` viewBox, scaled with CSS. No filters/blurs that would force expensive
  repaints; `mix-blend-mode: screen` on the single pulse layer is the only blend
  op and is GPU-accelerated.
- **Render cost guard**: `VisualLayer` re-renders on every snapshot (60fps while
  running), but minimal & diagram modes produce identical DOM frame-to-frame
  except at phase boundaries — React reconciliation is a near-noop, and the CSS
  custom-property values only change on phase change. (If profiling shows churn,
  memoize each mode component on `phase.kind` + `currentExercise?.id` +
  `status`.)

---

## 7. Implementation checklist (for the engineer)

1. `src/visuals/palettes.ts` — promote phase colors from `TimerScreen.css`.
2. `src/visuals/VisualLayer.tsx` + `.css` (the `pointer-events:none`, `inset:0`
   wrapper).
3. `modes/MinimalVisual` — move the phase-bg + 0.5s fade out of `TimerScreen.css`.
4. `src/visuals/FlashOverlay.tsx` — extract `flashKey`/flash from `TimerScreen`.
5. `modes/GradientVisual` + `.css` — the two-layer CSS gradient.
6. `diagrams/figure.tsx` + nine exercise SVGs + `GenericExercise` + `index.ts`.
7. `modes/DiagramVisual` + `.css`.
8. `SettingsPanel` `VisualModePicker` (and optional `QuickVisualToggle`).
9. Tests (Vitest): `diagramFor()` returns the right component per id and the
   fallback for unknown ids; `VisualLayer` renders the correct mode subtree given
   `mode`; `phaseProgress()` math. (Render assertions only — no animation timing
   tests.)

Note on strict TS (`verbatimModuleSyntax`, `erasableSyntaxOnly`,
`noUnusedLocals/Params`): import types with `import type`, type the CSS custom
properties via `as React.CSSProperties`, and keep the `VisualMode` union exported
from the settings module (don't redeclare it in visuals).
