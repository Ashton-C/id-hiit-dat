/**
 * Hand-coded stick-figure diagrams, one per placeholder exercise, plus a generic
 * fallback and a "done" glyph. Recognizable silhouettes on a 100x100 viewBox —
 * not anatomically precise. Motion hints are tagged data-motion (see figure.tsx).
 */

import { Figure, Floor, Ghost, Head, Limb, MotionArc } from './figure'

export function JumpingJacks() {
  return (
    <Figure label="Jumping jacks">
      <Ghost>
        {/* arms down / legs together */}
        <Limb x1={50} y1={32} x2={38} y2={48} />
        <Limb x1={50} y1={32} x2={62} y2={48} />
        <Limb x1={50} y1={52} x2={46} y2={88} />
        <Limb x1={50} y1={52} x2={54} y2={88} />
      </Ghost>
      <Head cx={50} cy={18} />
      <Limb x1={50} y1={25} x2={50} y2={52} />
      {/* arms up and out */}
      <Limb x1={50} y1={30} x2={28} y2={12} />
      <Limb x1={50} y1={30} x2={72} y2={12} />
      {/* legs spread */}
      <Limb x1={50} y1={52} x2={32} y2={88} />
      <Limb x1={50} y1={52} x2={68} y2={88} />
      <MotionArc d="M24 9 q -5 4 -3 10" />
      <MotionArc d="M76 9 q 5 4 3 10" />
    </Figure>
  )
}

export function Squats() {
  return (
    <Figure label="Squats">
      <Floor />
      <Head cx={50} cy={30} />
      <Limb x1={50} y1={37} x2={50} y2={58} />
      <Limb x1={50} y1={45} x2={36} y2={52} />
      <Limb x1={50} y1={45} x2={64} y2={52} />
      <Limb x1={50} y1={58} x2={40} y2={70} />
      <Limb x1={40} y1={70} x2={42} y2={92} />
      <Limb x1={50} y1={58} x2={60} y2={70} />
      <Limb x1={60} y1={70} x2={58} y2={92} />
      <MotionArc d="M74 48 q 6 12 0 22" />
    </Figure>
  )
}

export function PushUps() {
  return (
    <Figure label="Push-ups">
      <Floor />
      <Head cx={22} cy={56} />
      <Limb x1={28} y1={57} x2={70} y2={64} />
      {/* arms to floor */}
      <Limb x1={32} y1={58} x2={32} y2={88} />
      <Limb x1={42} y1={59} x2={42} y2={88} />
      {/* legs to toes */}
      <Limb x1={70} y1={64} x2={88} y2={84} />
      <MotionArc d="M55 50 q 8 6 0 12" />
    </Figure>
  )
}

export function HighKnees() {
  return (
    <Figure label="High knees">
      <Floor />
      <Head cx={50} cy={18} />
      <Limb x1={50} y1={25} x2={50} y2={55} />
      {/* arms pumping */}
      <Limb x1={50} y1={32} x2={38} y2={42} />
      <Limb x1={50} y1={32} x2={60} y2={22} />
      {/* standing leg */}
      <Limb x1={50} y1={55} x2={48} y2={90} />
      {/* lifted knee */}
      <Limb x1={50} y1={55} x2={66} y2={56} />
      <Limb x1={66} y1={56} x2={60} y2={74} />
      <MotionArc d="M70 52 q 6 6 0 12" />
    </Figure>
  )
}

export function Lunges() {
  return (
    <Figure label="Lunges">
      <Floor />
      <Head cx={46} cy={24} />
      <Limb x1={46} y1={31} x2={46} y2={54} />
      <Limb x1={46} y1={40} x2={38} y2={50} />
      <Limb x1={46} y1={40} x2={54} y2={50} />
      {/* front leg, shin vertical, knee ~90 */}
      <Limb x1={46} y1={54} x2={64} y2={62} />
      <Limb x1={64} y1={62} x2={64} y2={90} />
      {/* rear leg, knee toward floor */}
      <Limb x1={46} y1={54} x2={34} y2={74} />
      <Limb x1={34} y1={74} x2={22} y2={90} />
    </Figure>
  )
}

export function MountainClimbers() {
  return (
    <Figure label="Mountain climbers">
      <Floor />
      <Head cx={24} cy={52} />
      <Limb x1={30} y1={54} x2={64} y2={64} />
      {/* arms to floor */}
      <Limb x1={32} y1={55} x2={32} y2={88} />
      <Limb x1={42} y1={57} x2={42} y2={88} />
      {/* straight back leg */}
      <Limb x1={64} y1={64} x2={86} y2={84} />
      {/* driven knee toward chest */}
      <Limb x1={64} y1={64} x2={50} y2={60} />
      <Limb x1={50} y1={60} x2={54} y2={76} />
      <MotionArc d="M46 56 q -8 6 -2 14" />
    </Figure>
  )
}

export function Plank() {
  return (
    <Figure label="Plank">
      <Floor />
      <Head cx={24} cy={52} />
      {/* rigid body */}
      <Limb x1={30} y1={54} x2={84} y2={68} />
      {/* forearm flat on floor */}
      <Limb x1={32} y1={55} x2={30} y2={72} />
      <Limb x1={30} y1={72} x2={46} y2={72} />
      {/* legs to toes */}
      <Limb x1={84} y1={68} x2={90} y2={86} />
    </Figure>
  )
}

export function Burpees() {
  return (
    <Figure label="Burpees">
      {/* sequence montage: stand → plank → jump */}
      <Ghost>
        {/* stand (left) */}
        <circle cx={16} cy={40} r={4} stroke="currentColor" strokeWidth={3} fill="none" />
        <Limb x1={16} y1={44} x2={16} y2={58} />
        <Limb x1={16} y1={58} x2={12} y2={72} />
        <Limb x1={16} y1={58} x2={20} y2={72} />
        <Limb x1={16} y1={48} x2={10} y2={56} />
        <Limb x1={16} y1={48} x2={22} y2={56} />
      </Ghost>
      {/* plank (center, main) */}
      <circle cx={40} cy={62} r={4.5} stroke="currentColor" strokeWidth={3.5} fill="none" />
      <Limb x1={44} y1={63} x2={68} y2={70} />
      <Limb x1={46} y1={64} x2={46} y2={78} />
      <Limb x1={68} y1={70} x2={80} y2={78} />
      <Ghost>
        {/* jump (right) */}
        <circle cx={88} cy={30} r={4} stroke="currentColor" strokeWidth={3} fill="none" />
        <Limb x1={88} y1={34} x2={88} y2={48} />
        <Limb x1={88} y1={38} x2={82} y2={28} />
        <Limb x1={88} y1={38} x2={94} y2={28} />
        <Limb x1={88} y1={48} x2={84} y2={60} />
        <Limb x1={88} y1={48} x2={92} y2={60} />
      </Ghost>
      <MotionArc d="M26 60 q 6 -10 12 0" />
      <MotionArc d="M70 56 q 6 -10 14 -2" />
    </Figure>
  )
}

export function GluteBridges() {
  return (
    <Figure label="Glute bridges">
      <Floor />
      <Head cx={20} cy={84} />
      {/* back raised from floor to hip */}
      <Limb x1={26} y1={84} x2={54} y2={66} />
      {/* thighs + shins (knees bent, feet flat) */}
      <Limb x1={54} y1={66} x2={72} y2={70} />
      <Limb x1={72} y1={70} x2={72} y2={90} />
      <Limb x1={54} y1={66} x2={66} y2={74} />
      <Limb x1={66} y1={74} x2={66} y2={90} />
      {/* arm along floor */}
      <Limb x1={26} y1={86} x2={12} y2={90} />
      <MotionArc d="M50 58 q 8 -6 14 0" />
    </Figure>
  )
}

export function GenericExercise() {
  return (
    <Figure label="Exercise">
      <Floor />
      <Head cx={50} cy={24} />
      <Limb x1={50} y1={31} x2={50} y2={58} />
      <Limb x1={50} y1={40} x2={36} y2={46} />
      <Limb x1={50} y1={40} x2={64} y2={46} />
      <Limb x1={50} y1={58} x2={42} y2={90} />
      <Limb x1={50} y1={58} x2={58} y2={90} />
      {/* small dumbbell in the right hand */}
      <circle cx={62} cy={46} r={3} stroke="currentColor" strokeWidth={3} fill="none" />
      <circle cx={70} cy={46} r={3} stroke="currentColor" strokeWidth={3} fill="none" />
      <Limb x1={64} y1={46} x2={68} y2={46} />
    </Figure>
  )
}

export function DoneGlyph() {
  return (
    <svg viewBox="0 0 100 100" className="exercise-diagram" role="img" aria-label="Workout complete">
      <circle cx={50} cy={50} r={34} stroke="currentColor" strokeWidth={4} fill="none" />
      <path
        d="M34 51 L46 64 L68 36"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
