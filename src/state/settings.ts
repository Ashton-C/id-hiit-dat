/**
 * App settings: model, presets, defaults, and localStorage persistence.
 * Pure module (no React) so the shapes and helpers are unit-testable and reusable.
 */

import { DEFAULT_ROUTINE, type Routine } from '../engine/routine'
import { PLAYLISTS, type PlaylistId } from '../assets/music/tracks'

export type VisualMode = 'minimal' | 'gradient' | 'diagram'

export interface MusicSettings {
  enabled: boolean
  /** Master music volume, 0..1. */
  volume: number
  /** Selected track id, or null for "shuffle / auto". */
  trackId: string | null
  /** Which playlist to draw from (genre, or 'all'). */
  playlist: PlaylistId
}

export interface Settings {
  /** The active routine (may be a customized copy of a preset). */
  routine: Routine
  /** Id of the selected preset, or 'custom' when intervals were edited. */
  presetId: string
  visualMode: VisualMode
  music: MusicSettings
  cuesMuted: boolean
}

export interface Preset {
  id: string
  name: string
  routine: Routine
}

const exercises = DEFAULT_ROUTINE.exercises

/** Built-in presets. The first is the default. */
export const PRESETS: Preset[] = [
  { id: DEFAULT_ROUTINE.id, name: DEFAULT_ROUTINE.name, routine: DEFAULT_ROUTINE },
  {
    id: 'tabata',
    name: 'Tabata',
    routine: {
      id: 'tabata',
      name: 'Tabata',
      prepareSeconds: 10,
      workSeconds: 20,
      restSeconds: 10,
      exercises: exercises.slice(0, 8),
      rounds: 1,
    },
  },
  {
    id: 'express',
    name: 'Express 20s',
    routine: {
      id: 'express',
      name: 'Express 20s',
      prepareSeconds: 10,
      workSeconds: 40,
      restSeconds: 20,
      exercises,
      rounds: 2,
    },
  },
]

export const CUSTOM_PRESET_ID = 'custom'

export const STORAGE_KEY = 'idhiit:settings:v1'

export function defaultSettings(): Settings {
  return {
    routine: clone(DEFAULT_ROUTINE),
    presetId: DEFAULT_ROUTINE.id,
    visualMode: 'gradient',
    music: { enabled: false, volume: 0.6, trackId: null, playlist: 'all' },
    cuesMuted: false,
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Whole-number-ish clamp used to sanitize loaded/edited interval values. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, n))
}

function isRoutine(value: unknown): value is Routine {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.prepareSeconds === 'number' &&
    typeof r.workSeconds === 'number' &&
    typeof r.restSeconds === 'number' &&
    typeof r.rounds === 'number' &&
    Array.isArray(r.exercises)
  )
}

/**
 * Parse persisted settings, merging onto defaults and sanitizing. Any malformed
 * field falls back to its default rather than throwing — a bad localStorage blob
 * must never brick the app.
 */
export function parseSettings(raw: unknown): Settings {
  const base = defaultSettings()
  if (typeof raw !== 'object' || raw === null) return base
  const data = raw as Record<string, unknown>

  if (isRoutine(data.routine)) {
    const r = data.routine
    base.routine = {
      id: r.id,
      name: r.name,
      prepareSeconds: clampInt(r.prepareSeconds, 0, 60, DEFAULT_ROUTINE.prepareSeconds),
      workSeconds: clampInt(r.workSeconds, 5, 600, DEFAULT_ROUTINE.workSeconds),
      restSeconds: clampInt(r.restSeconds, 0, 600, DEFAULT_ROUTINE.restSeconds),
      rounds: clampInt(r.rounds, 1, 50, DEFAULT_ROUTINE.rounds),
      exercises: r.exercises.length ? r.exercises : clone(DEFAULT_ROUTINE.exercises),
    }
  }
  if (typeof data.presetId === 'string') base.presetId = data.presetId
  if (data.visualMode === 'minimal' || data.visualMode === 'gradient' || data.visualMode === 'diagram') {
    base.visualMode = data.visualMode
  }
  if (typeof data.cuesMuted === 'boolean') base.cuesMuted = data.cuesMuted
  if (typeof data.music === 'object' && data.music !== null) {
    const m = data.music as Record<string, unknown>
    const playlist = PLAYLISTS.some((p) => p.id === m.playlist)
      ? (m.playlist as PlaylistId)
      : base.music.playlist
    base.music = {
      enabled: typeof m.enabled === 'boolean' ? m.enabled : base.music.enabled,
      volume: typeof m.volume === 'number' && Number.isFinite(m.volume) ? Math.min(1, Math.max(0, m.volume)) : base.music.volume,
      trackId: typeof m.trackId === 'string' ? m.trackId : null,
      playlist,
    }
  }
  return base
}

export function loadSettings(): Settings {
  if (typeof localStorage === 'undefined') return defaultSettings()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings()
    return parseSettings(JSON.parse(raw))
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Quota or privacy mode — non-fatal; settings just won't persist.
  }
}
