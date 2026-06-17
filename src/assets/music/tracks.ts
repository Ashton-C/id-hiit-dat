/**
 * Track manifest — the stable interface the mixer + MusicBar consume.
 *
 * Real CC0/CC-BY tracks are referenced by a public path ('/music/<slug>.ogg').
 * Drop the matching .ogg files into `public/music/` (see its README) and they
 * play automatically — the build never needs the files present, and the mixer
 * gracefully skips any track whose file is missing. Tracks are tagged by genre so
 * the Settings playlist picker can select All / Electronic / Hip Hop / Latin & Jazz.
 * See LICENSES.md for sources.
 */

export type SynthPreset = 'deep-house' | 'synthwave' | 'techno'

export type TrackSource =
  | { kind: 'synth'; seed: number; preset: SynthPreset }
  | { kind: 'file'; url: string }

/** Genre tag used by the playlist picker. */
export type TrackCategory = 'energetic' | 'aggressive' | 'hiphop' | 'latin-jazz'

/** A selectable playlist: a genre, or 'all'. */
export type PlaylistId = 'all' | TrackCategory

export const PLAYLISTS: { id: PlaylistId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'hiphop', label: 'Hip Hop' },
  { id: 'latin-jazz', label: 'Latin & Jazz' },
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

/** Build a Kevin MacLeod CC-BY 4.0 track (attribution shown on Credits screen). */
const km = (id: string, title: string, bpm: number): Track => ({
  id,
  title,
  artist: 'Kevin MacLeod',
  bpm,
  durationSeconds: SEGMENT,
  loopable: true,
  license: 'CC-BY-4.0',
  attribution: `"${title}" by Kevin MacLeod (incompetech.com) — licensed under Creative Commons: By Attribution 4.0 (http://creativecommons.org/licenses/by/4.0/)`,
  source: { kind: 'file', url: `/music/${id}.ogg` },
})

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

/**
 * CC-BY electronica (Kevin MacLeod), split by mood. Aggressive = videogame or
 * "dark"/"aggressive"-tagged tracks; Energetic = the bright/bouncy/driving rest.
 */
const AGGRESSIVE_TRACKS: Track[] = [
  km('8bit-dungeon-boss', '8bit Dungeon Boss', 134), // videogame + Dark
  km('club-diver', 'Club Diver', 140), // Aggressive + Dark
  km('harmful-or-fatal', 'Harmful or Fatal', 135), // Aggressive (harsh industrial)
  km('video-dungeon-boss', 'Video Dungeon Boss', 142), // videogame + Dark
]

const ENERGETIC_TRACKS: Track[] = [
  km('desert-of-lost-souls', 'Desert of Lost Souls', 134),
  km('double-o', 'Double O', 140),
  km('equatorial-complex', 'Equatorial Complex', 120),
  km('future-cha-cha', 'Future Cha Cha', 140),
  km('getting-it-done', 'Getting it Done', 135),
  km('laser-groove', 'Laser Groove', 140),
  km('raving-energy-faster', 'Raving Energy (faster)', 134),
  km('reformat', 'Reformat', 140),
  km('shiny-tech', 'Shiny Tech', 138),
  km('shiny-tech-ii', 'Shiny Tech II', 138),
  km('show-your-moves', 'Show Your Moves', 136),
  km('voice-over-under', 'Voice Over Under', 135),
]

/** CC-BY latin & jazz (Kevin MacLeod) — the Latin & Jazz playlist. */
const LATIN_JAZZ_TRACKS: Track[] = [
  km('apero-hour', 'Apero Hour', 140),
  km('faster-does-it', 'Faster Does It', 135),
  km('night-on-the-docks-piano', 'Night on the Docks - Piano', 100),
  km('night-on-the-docks-sax', 'Night on the Docks - Sax', 100),
  km('night-on-the-docks-trumpet', 'Night on the Docks - Trumpet', 100),
  km('nouvelle-noel', 'Nouvelle Noel', 135),
  km('shades-of-spring', 'Shades of Spring', 131),
  km('no-frills-salsa', 'No Frills Salsa', 144),
]

const withCategory = (tracks: Track[], category: TrackCategory): Track[] =>
  tracks.map((t) => ({ ...t, category }))

export const TRACKS: Track[] = [
  ...withCategory(ENERGETIC_TRACKS, 'energetic'),
  ...withCategory(AGGRESSIVE_TRACKS, 'aggressive'),
  ...withCategory(HIPHOP_CC0_TRACKS, 'hiphop'),
  ...withCategory(LATIN_JAZZ_TRACKS, 'latin-jazz'),
]

export function trackById(id: string | null | undefined): Track | undefined {
  return id ? TRACKS.find((t) => t.id === id) : undefined
}

/** Resolve a playlist selection to the tracks it includes. */
export function tracksForPlaylist(id: string): Track[] {
  const isGenre = PLAYLISTS.some((p) => p.id === id && p.id !== 'all')
  return isGenre ? TRACKS.filter((t) => t.category === id) : TRACKS
}

/** Tracks whose license requires displayed attribution (for the Credits screen). */
export function tracksRequiringAttribution(): Track[] {
  return TRACKS.filter((t) => !!t.attribution)
}
