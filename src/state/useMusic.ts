/**
 * Bridges the AudioMixer to React, the settings store, and the timer lifecycle.
 * Owns the mixer instance + its 250ms update driver, and keeps MusicBar purely
 * presentational. Music follows the timer: play on running, pause on paused, fade
 * out on done.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioBus } from '../engine/audioContext'
import type { TimerStatus } from '../engine/timer'
import { AudioMixer, type MixerSnapshot } from '../engine/audioMixer'
import { tracksForPlaylist } from '../assets/music/tracks'
import { loadBuffer } from '../assets/music/loadBuffer'
import { useSettings } from './SettingsProvider'

const IDLE_SNAPSHOT: MixerSnapshot = {
  state: 'idle',
  currentTrackId: null,
  nextTrackId: null,
  volume: 0.6,
}

export interface UseMusic {
  snapshot: MixerSnapshot
  playPause: () => void
  next: () => void
  setVolume: (v: number) => void
}

export function useMusic(bus: AudioBus | null, timerStatus: TimerStatus): UseMusic {
  const { settings, setMusic } = useSettings()
  const { enabled, volume, playlist: playlistId } = settings.music

  const mixerRef = useRef<AudioMixer | null>(null)
  const [snapshot, setSnapshot] = useState<MixerSnapshot>(IDLE_SNAPSHOT)

  // Construct the mixer once the bus is available.
  useEffect(() => {
    if (!bus || mixerRef.current) return
    const mixer = new AudioMixer(
      { bus, loadBuffer },
      { playlist: tracksForPlaylist(playlistId), volume },
    )
    mixerRef.current = mixer
    const unsub = mixer.onChange(setSnapshot)
    setSnapshot(mixer.getSnapshot())
    return () => {
      unsub()
      mixer.dispose()
      mixerRef.current = null
    }
    // playlist/volume read once at construction; kept in sync by their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus])

  // Swap the underlying playlist when the genre selection changes; crossfade into
  // the new set if currently playing.
  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer) return
    mixer.setPlaylist(tracksForPlaylist(playlistId))
    if (mixer.getSnapshot().state === 'playing') void mixer.next()
  }, [playlistId])

  // Drive the mixer's crossfade scheduler while music is enabled.
  useEffect(() => {
    if (!mixerRef.current || !enabled) return
    const id = setInterval(() => mixerRef.current?.update(), 250)
    return () => clearInterval(id)
  }, [enabled])

  // Keep mixer volume in sync with settings.
  useEffect(() => {
    mixerRef.current?.setVolume(volume)
  }, [volume])

  // React to the timer lifecycle + the enabled toggle.
  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer) return
    if (!enabled) {
      mixer.stop()
      return
    }
    if (timerStatus === 'running') void mixer.play()
    else if (timerStatus === 'paused') mixer.pause()
    else if (timerStatus === 'done') mixer.fadeOutAndStop(3)
    else if (timerStatus === 'idle') mixer.stop()
  }, [enabled, timerStatus])

  const playPause = useCallback(() => {
    const mixer = mixerRef.current
    if (!mixer) return
    if (mixer.getSnapshot().state === 'playing') mixer.pause()
    else void mixer.play()
  }, [])

  const next = useCallback(() => {
    void mixerRef.current?.next()
  }, [])

  const setVolume = useCallback(
    (v: number) => {
      mixerRef.current?.setVolume(v)
      setMusic({ volume: v })
    },
    [setMusic],
  )

  return { snapshot, playPause, next, setVolume }
}
