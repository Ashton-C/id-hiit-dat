/**
 * Settings overlay: pick a preset, fully customize intervals, choose a visual
 * mode, and toggle audio. Reads/writes the persisted settings store.
 */

import { useEffect, useRef } from 'react'
import { totalSeconds } from '../engine/routine'
import { useSettings } from '../state/SettingsProvider'
import { CUSTOM_PRESET_ID, PRESETS, type VisualMode } from '../state/settings'
import { useInstallPrompt } from '../pwa/useInstallPrompt'
import { tracksRequiringAttribution } from '../assets/music/tracks'
import { formatTime } from '../utils/format'
import './SettingsPanel.css'

const VISUAL_MODES: { id: VisualMode; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'diagram', label: 'Diagram' },
]

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

function NumberField({ label, value, min, max, step = 1, unit, onChange }: NumberFieldProps) {
  return (
    <label className="settings-field">
      <span className="settings-field__label">
        {label}
        <span className="settings-field__value">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    settings,
    selectPreset,
    updateRoutineParams,
    setVisualMode,
    setMusic,
    setCuesMuted,
  } = useSettings()
  const { routine, presetId, visualMode, music, cuesMuted } = settings
  const install = useInstallPrompt()
  const credits = tracksRequiringAttribution()

  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Modal focus management: move focus in on open, restore it on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previouslyFocused?.focus?.()
  }, [])

  // Escape to close; Tab trapped within the panel.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Workout settings"
      onKeyDown={handleKeyDown}
    >
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-panel" ref={panelRef}>
        <header className="settings-panel__header">
          <h2>Settings</h2>
          <button
            type="button"
            className="settings-panel__close"
            onClick={onClose}
            aria-label="Close settings"
            ref={closeRef}
          >
            ✕
          </button>
        </header>

        <div className="settings-panel__body">
          <section className="settings-section">
            <h3>Preset</h3>
            <div className="settings-chips">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`settings-chip ${presetId === p.id ? 'is-active' : ''}`}
                  aria-pressed={presetId === p.id}
                  onClick={() => selectPreset(p.id)}
                >
                  {p.name}
                </button>
              ))}
              {presetId === CUSTOM_PRESET_ID && (
                <span className="settings-chip is-active is-readonly">Custom</span>
              )}
            </div>
          </section>

          <section className="settings-section">
            <h3>
              Intervals
              <span className="settings-section__aside">{formatTime(totalSeconds(routine))} total</span>
            </h3>
            <NumberField
              label="Prepare"
              value={routine.prepareSeconds}
              min={0}
              max={60}
              unit="s"
              onChange={(v) => updateRoutineParams({ prepareSeconds: v })}
            />
            <NumberField
              label="Work"
              value={routine.workSeconds}
              min={5}
              max={120}
              unit="s"
              onChange={(v) => updateRoutineParams({ workSeconds: v })}
            />
            <NumberField
              label="Rest"
              value={routine.restSeconds}
              min={0}
              max={120}
              unit="s"
              onChange={(v) => updateRoutineParams({ restSeconds: v })}
            />
            <NumberField
              label="Rounds"
              value={routine.rounds}
              min={1}
              max={20}
              onChange={(v) => updateRoutineParams({ rounds: v })}
            />
          </section>

          <section className="settings-section">
            <h3>Visuals</h3>
            <div className="settings-segmented" role="radiogroup" aria-label="Visual style">
              {VISUAL_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={visualMode === m.id}
                  className={`settings-segmented__btn ${visualMode === m.id ? 'is-active' : ''}`}
                  onClick={() => setVisualMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>Audio</h3>
            <label className="settings-toggle">
              <span>Cue sounds</span>
              <input
                type="checkbox"
                checked={!cuesMuted}
                onChange={(e) => setCuesMuted(!e.target.checked)}
              />
            </label>
            <label className="settings-toggle">
              <span>Music</span>
              <input
                type="checkbox"
                checked={music.enabled}
                onChange={(e) => setMusic({ enabled: e.target.checked })}
              />
            </label>
            {music.enabled && (
              <NumberField
                label="Music volume"
                value={Math.round(music.volume * 100)}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => setMusic({ volume: v / 100 })}
              />
            )}
          </section>

          {credits.length > 0 && (
            <section className="settings-section">
              <h3>Music credits</h3>
              <ul className="settings-credits">
                {credits.map((t) => (
                  <li key={t.id} className="settings-credits__item">
                    {t.attribution}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(install.canInstall || install.showIosHint) && (
            <section className="settings-section">
              <h3>Install</h3>
              {install.canInstall ? (
                <button
                  type="button"
                  className="settings-install"
                  onClick={() => void install.promptInstall()}
                >
                  <span>Install app</span>
                  <span className="settings-install__sub">Run offline, full screen</span>
                </button>
              ) : (
                <p className="settings-install__hint">
                  On iPhone: tap the Share icon, then “Add to Home Screen” to install.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
