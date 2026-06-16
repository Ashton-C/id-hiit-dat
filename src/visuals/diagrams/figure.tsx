/**
 * Shared stick-figure SVG primitives. All diagrams draw on a 0 0 100 100 viewBox
 * using `currentColor` so they recolor per phase for free. Motion hints carry
 * data-motion so prefers-reduced-motion can strip them.
 */

import type { ReactNode } from 'react'

export const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const

export function Head({ cx, cy, r = 7 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} {...STROKE} />
}

export function Limb({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...STROKE} />
}

export function Floor() {
  return <Limb x1={10} y1={92} x2={90} y2={92} />
}

/** A short dashed arc near a hand/foot to imply motion. Stripped under reduced-motion. */
export function MotionArc({ d }: { d: string }) {
  return <path d={d} {...STROKE} strokeWidth={2.5} strokeDasharray="3 4" data-motion="" />
}

/** A faint duplicate pose to imply the rep. Stripped under reduced-motion. */
export function Ghost({ children }: { children: ReactNode }) {
  return (
    <g opacity={0.22} data-motion="">
      {children}
    </g>
  )
}

/** Wrapper that frames a diagram's contents in the standard svg + a11y label. */
export function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="exercise-diagram" role="img" aria-label={label}>
      {children}
    </svg>
  )
}
