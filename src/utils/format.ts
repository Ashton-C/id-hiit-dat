/** Format a whole number of seconds as m:ss (or mm:ss). */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
