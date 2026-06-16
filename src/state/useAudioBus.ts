/**
 * Creates the shared AudioBus once per app. The AudioContext starts suspended
 * (no user gesture yet); call bus.unlock() from a tap to resume it. Returns null
 * if Web Audio is unavailable.
 */

import { useRef } from 'react'
import { createAudioBus, type AudioBus } from '../engine/audioContext'

export function useAudioBus(): AudioBus | null {
  // undefined = not yet created; null = unavailable in this environment.
  const ref = useRef<AudioBus | null | undefined>(undefined)
  if (ref.current === undefined) ref.current = createAudioBus()
  return ref.current
}
