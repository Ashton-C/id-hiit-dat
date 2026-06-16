/**
 * Resolve a Track to PCM. The mixer only knows this signature and never branches
 * on synth-vs-file — real CC0 files drop in by editing tracks.ts alone.
 */

import type { Track } from './tracks'
import { renderSynthTrack } from './synth'

export async function loadBuffer(track: Track, ctx: BaseAudioContext): Promise<AudioBuffer> {
  if (track.source.kind === 'synth') {
    return renderSynthTrack(track, track.source)
  }
  const res = await fetch(track.source.url) // bundled, same-origin asset (offline-cached by SW)
  const arr = await res.arrayBuffer()
  return ctx.decodeAudioData(arr)
}
