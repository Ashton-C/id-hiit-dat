/**
 * Track manifest — the stable interface the mixer + MusicBar consume.
 *
 * Real CC0/CC-BY tracks are referenced by a public path ('/music/<slug>.ogg').
 * Drop the matching .ogg files into `public/music/` (see its README) and they
 * play automatically — the build never needs the files present, and the mixer
 * gracefully skips any track whose file is missing. The procedurally-synthesized
 * demo tracks are kept at the end as an always-available offline fallback, so
 * music works even before the real files are added. See LICENSES.md for sources.
 */

export type SynthPreset = 'deep-house' | 'synthwave' | 'techno'

export type TrackSource =
  | { kind: 'synth'; seed: number; preset: SynthPreset }
  | { kind: 'file'; url: string }

export interface Track {
  /** Stable id, also used as settings.music.trackId. */
  id: string
  title: string
  artist: string
  bpm: number
  /** Crossfade segment length before moving to the next track. */
  durationSeconds: number
  loopable: boolean
  source: TrackSource
  /** SPDX-ish: 'CC0-1.0', 'CC-BY-4.0', 'Pixabay', or 'demo-synth'. */
  license: string
  /** Required attribution text for CC-BY tracks; surfaced on the Credits screen. */
  attribution?: string
}

const SEGMENT = 90

/** CC0 — no attribution required, free to bundle/redistribute. */
const CC0_TRACKS: Track[] = [
  { id: 'ascend', title: 'Ascend', artist: 'tricksntraps', bpm: 130, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/ascend.ogg' } },
  { id: 'flying-temple', title: 'Flying Temple', artist: 'tricksntraps', bpm: 128, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/flying-temple.ogg' } },
  { id: 'lost-utopia', title: 'Lost Utopia', artist: 'tricksntraps', bpm: 127, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/lost-utopia.ogg' } },
  { id: 'starting-over', title: 'Starting Over', artist: 'tricksntraps', bpm: 122, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/starting-over.ogg' } },
  { id: 'the-lab', title: 'The Lab', artist: 'tricksntraps', bpm: 144, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/the-lab.ogg' } },
  { id: 'drama', title: 'Drama', artist: 'tricksntraps', bpm: 130, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/drama.ogg' } },
  { id: 'extended', title: 'Extended', artist: 'tricksntraps', bpm: 120, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/extended.ogg' } },
  { id: 'retro-synths', title: 'Retro Synths', artist: 'HoliznaCC0', bpm: 120, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/retro-synths.ogg' } },
  { id: 'mutant-club', title: 'Mutant Club', artist: 'HoliznaCC0', bpm: 120, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/mutant-club.ogg' } },
  { id: 'happy-dance', title: 'Happy Dance', artist: 'HoliznaCC0', bpm: 120, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/happy-dance.ogg' } },
]

/** CC-BY — usable, but the attribution string MUST be shown (Credits screen). */
const CC_BY_TRACKS: Track[] = [
  {
    id: 'electrodoodle',
    title: 'Electrodoodle',
    artist: 'Kevin MacLeod',
    bpm: 120,
    durationSeconds: SEGMENT,
    loopable: true,
    license: 'CC-BY-4.0',
    attribution:
      '"Electrodoodle" by Kevin MacLeod (incompetech.com) — licensed under Creative Commons: By Attribution 4.0 (http://creativecommons.org/licenses/by/4.0/)',
    source: { kind: 'file', url: '/music/electrodoodle.ogg' },
  },
  {
    id: 'local-forecast',
    title: 'Local Forecast',
    artist: 'Kevin MacLeod',
    bpm: 154,
    durationSeconds: SEGMENT,
    loopable: true,
    license: 'CC-BY-4.0',
    attribution:
      '"Local Forecast" by Kevin MacLeod (incompetech.com) — licensed under Creative Commons: By Attribution 4.0 (http://creativecommons.org/licenses/by/4.0/)',
    source: { kind: 'file', url: '/music/local-forecast.ogg' },
  },
]

/**
 * Procedural fallback (zero assets, always works offline). Kept at the END of the
 * playlist so the mixer lands here if the real files aren't present yet; remove
 * once the bundled tracks are confirmed in place.
 */
const SYNTH_TRACKS: Track[] = [
  { id: 'demo-pulse', title: 'Pulse', artist: 'Procedural Demo', bpm: 124, durationSeconds: 48, loopable: true, license: 'demo-synth', source: { kind: 'synth', seed: 1, preset: 'deep-house' } },
  { id: 'demo-glow', title: 'Glow', artist: 'Procedural Demo', bpm: 100, durationSeconds: 48, loopable: true, license: 'demo-synth', source: { kind: 'synth', seed: 2, preset: 'synthwave' } },
  { id: 'demo-drive', title: 'Drive', artist: 'Procedural Demo', bpm: 132, durationSeconds: 48, loopable: true, license: 'demo-synth', source: { kind: 'synth', seed: 3, preset: 'techno' } },
]

export const TRACKS: Track[] = [...CC0_TRACKS, ...CC_BY_TRACKS, ...SYNTH_TRACKS]

export function trackById(id: string | null | undefined): Track | undefined {
  return id ? TRACKS.find((t) => t.id === id) : undefined
}

/** Tracks whose license requires displayed attribution (for the Credits screen). */
export function tracksRequiringAttribution(): Track[] {
  return TRACKS.filter((t) => !!t.attribution)
}
