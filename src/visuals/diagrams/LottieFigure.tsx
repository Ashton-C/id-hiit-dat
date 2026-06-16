/**
 * Plays a Lottie exercise animation (from `public/animations/<id>.json`) using
 * lottie-web's SVG renderer. The JSON is fetched lazily per `src` and the
 * service worker caches it for offline play. Honours prefers-reduced-motion by
 * holding a single representative frame instead of looping.
 */

import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function LottieFigure({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const reduced = prefersReducedMotion()
    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: !reduced,
      autoplay: !reduced,
      path: src,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
    })

    // Under reduced motion, settle on a mid-rep frame so the pose still reads.
    const holdStill = () => anim.goToAndStop(Math.floor(anim.totalFrames / 2), true)
    if (reduced) anim.addEventListener('DOMLoaded', holdStill)

    return () => {
      if (reduced) anim.removeEventListener('DOMLoaded', holdStill)
      anim.destroy()
    }
  }, [src])

  return <div ref={containerRef} className="exercise-animation" aria-hidden="true" />
}
