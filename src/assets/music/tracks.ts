/**
 * Track manifest — the stable interface the mixer + MusicBar consume.
 *
 * Real CC0/CC-BY tracks are referenced by a public path ('/music/<slug>.ogg').
 * Drop the matching .ogg files into `public/music/` (see its README) and they
 * play automatically — the build never needs the files present, and the mixer
 * gracefully skips any track whose file is missing. Tracks are tagged by genre so
 * the Settings playlist picker can select All / Electronic / Hip Hop.
 * See LICENSES.md for sources.
 */

export type SynthPreset = 'deep-house' | 'synthwave' | 'techno'

export type TrackSource =
  | { kind: 'synth'; seed: number; preset: SynthPreset }
  | { kind: 'file'; url: string }

/** Genre tag used by the playlist picker. */
export type TrackCategory = 'electronic' | 'hiphop'

/** A selectable playlist: a genre, or 'all'. */
export type PlaylistId = 'all' | TrackCategory

export const PLAYLISTS: { id: PlaylistId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'hiphop', label: 'Hip Hop' },
]

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
  /** Genre, for the playlist picker. */
  category?: TrackCategory
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

/** CC0 hip hop / phonk beats — high-energy workout fuel, no attribution required. */
const HIPHOP_CC0_TRACKS: Track[] = [
  { id: 'only-human', title: 'Only Human', artist: 'HoliznaCC0', bpm: 160, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/only-human.ogg' } },
  { id: 'pantheon', title: 'Pantheon', artist: 'HoliznaCC0', bpm: 104, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/pantheon.ogg' } },
  { id: 'phonk-ish', title: 'Phonk-ish', artist: 'HoliznaCC0', bpm: 120, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/phonk-ish.ogg' } },
  { id: 'phonk-remix', title: 'Phonk Remix', artist: 'HoliznaCC0', bpm: 90, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/phonk-remix.ogg' } },
  { id: 're-adjustment', title: 'Re-Adjustment', artist: 'HoliznaCC0', bpm: 87, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/re-adjustment.ogg' } },
  { id: 'tension-in-the-air', title: 'Tension in the Air', artist: 'HoliznaCC0', bpm: 87, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/tension-in-the-air.ogg' } },
  { id: 'shadow-self', title: 'Shadow Self', artist: 'HoliznaCC0', bpm: 124, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/shadow-self.ogg' } },
  { id: 'strange-brew', title: 'Strange Brew', artist: 'HoliznaCC0', bpm: 136, durationSeconds: SEGMENT, loopable: true, license: 'CC0-1.0', source: { kind: 'file', url: '/music/strange-brew.ogg' } },
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

const withCategory = (tracks: Track[], category: TrackCategory): Track[] =>
  tracks.map((t) => ({ ...t, category }))

export const TRACKS: Track[] = [
  ...withCategory(CC0_TRACKS, 'electronic'),
  ...withCategory(HIPHOP_CC0_TRACKS, 'hiphop'),
  ...withCategory(CC_BY_TRACKS, 'electronic'),
]

export function trackById(id: string | null | undefined): Track | undefined {
  return id ? TRACKS.find((t) => t.id === id) : undefined
}

/** Resolve a playlist selection to the tracks it includes. */
export function tracksForPlaylist(id: string): Track[] {
  if (id === 'electronic' || id === 'hiphop') return TRACKS.filter((t) => t.category === id)
  return TRACKS
}

/** Tracks whose license requires displayed attribution (for the Credits screen). */
export function tracksRequiringAttribution(): Track[] {
  return TRACKS.filter((t) => !!t.attribution)
}
