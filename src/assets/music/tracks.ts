/**
 * Track manifest — the stable interface the mixer + MusicBar consume. Today every
 * track is procedurally synthesized (zero audio assets, fully offline). Real CC0
 * files drop in later as `{ kind: 'file', url }` using a Vite asset-URL import
 * (`import url from './track.ogg'`), which bundles + fingerprints them for offline
 * use and lets the PWA service worker cache them. No code outside this file and
 * LICENSES.md changes when real tracks are added.
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
  /** Intended segment length before crossfading to the next track. */
  durationSeconds: number
  loopable: boolean
  source: TrackSource
  /** SPDX-ish: 'CC0-1.0', 'CC-BY-4.0', 'Pixabay', or 'demo-synth'. */
  license: string
  /** Required attribution text for CC-BY tracks; surfaced in the UI. */
  attribution?: string
}

export const TRACKS: Track[] = [
  {
    id: 'demo-pulse',
    title: 'Pulse',
    artist: 'Procedural Demo',
    bpm: 124,
    durationSeconds: 48,
    loopable: true,
    license: 'demo-synth',
    source: { kind: 'synth', seed: 1, preset: 'deep-house' },
  },
  {
    id: 'demo-glow',
    title: 'Glow',
    artist: 'Procedural Demo',
    bpm: 100,
    durationSeconds: 48,
    loopable: true,
    license: 'demo-synth',
    source: { kind: 'synth', seed: 2, preset: 'synthwave' },
  },
  {
    id: 'demo-drive',
    title: 'Drive',
    artist: 'Procedural Demo',
    bpm: 132,
    durationSeconds: 48,
    loopable: true,
    license: 'demo-synth',
    source: { kind: 'synth', seed: 3, preset: 'techno' },
  },
]

export function trackById(id: string | null | undefined): Track | undefined {
  return id ? TRACKS.find((t) => t.id === id) : undefined
}
