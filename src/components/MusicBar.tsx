/** Presentational music controls: play/pause, skip, current title, volume. */

import type { MixerSnapshot } from '../engine/audioMixer'
import { trackById } from '../assets/music/tracks'
import './MusicBar.css'

interface MusicBarProps {
  snapshot: MixerSnapshot
  volume: number
  onPlayPause: () => void
  onNext: () => void
  onVolume: (v: number) => void
}

export function MusicBar({ snapshot, volume, onPlayPause, onNext, onVolume }: MusicBarProps) {
  const playing = snapshot.state === 'playing'
  const loading = snapshot.state === 'loading'
  const track = trackById(snapshot.currentTrackId)
  const title = track ? `${track.title} · ${track.artist}` : loading ? 'Loading…' : 'Music'

  return (
    <div className="music-bar" role="group" aria-label="Music">
      <button
        type="button"
        className="music-bar__btn"
        onClick={onPlayPause}
        aria-label={playing ? 'Pause music' : 'Play music'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <button type="button" className="music-bar__btn" onClick={onNext} aria-label="Skip track">
        ⏭
      </button>
      <span className="music-bar__title" title={title}>
        {title}
      </span>
      <input
        className="music-bar__vol"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onVolume(e.currentTarget.valueAsNumber)}
        aria-label="Music volume"
      />
    </div>
  )
}
