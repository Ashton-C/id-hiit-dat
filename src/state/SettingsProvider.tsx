/**
 * Settings context: holds the persisted Settings and exposes focused mutators.
 * Editing any interval value flips presetId to 'custom'; selecting a preset
 * replaces the active routine with a fresh copy.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Routine } from '../engine/routine'
import {
  CUSTOM_PRESET_ID,
  PRESETS,
  loadSettings,
  saveSettings,
  type MusicSettings,
  type Settings,
  type VisualMode,
} from './settings'

type RoutineParams = Pick<
  Routine,
  'prepareSeconds' | 'workSeconds' | 'restSeconds' | 'rounds'
>

interface SettingsContextValue {
  settings: Settings
  selectPreset: (presetId: string) => void
  updateRoutineParams: (params: Partial<RoutineParams>) => void
  setVisualMode: (mode: VisualMode) => void
  setMusic: (partial: Partial<MusicSettings>) => void
  setCuesMuted: (muted: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  // Persist on every change.
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const selectPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSettings((s) => ({
      ...s,
      presetId: preset.id,
      // Fresh copy so later edits don't mutate the shared preset object.
      routine: structuredClone(preset.routine),
    }))
  }, [])

  const updateRoutineParams = useCallback((params: Partial<RoutineParams>) => {
    setSettings((s) => ({
      ...s,
      presetId: CUSTOM_PRESET_ID,
      routine: { ...s.routine, ...params, id: CUSTOM_PRESET_ID, name: 'Custom' },
    }))
  }, [])

  const setVisualMode = useCallback((visualMode: VisualMode) => {
    setSettings((s) => ({ ...s, visualMode }))
  }, [])

  const setMusic = useCallback((partial: Partial<MusicSettings>) => {
    setSettings((s) => ({ ...s, music: { ...s.music, ...partial } }))
  }, [])

  const setCuesMuted = useCallback((cuesMuted: boolean) => {
    setSettings((s) => ({ ...s, cuesMuted }))
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      selectPreset,
      updateRoutineParams,
      setVisualMode,
      setMusic,
      setCuesMuted,
    }),
    [settings, selectPreset, updateRoutineParams, setVisualMode, setMusic, setCuesMuted],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
