/**
 * Exercise animation manifest.
 *
 * Each entry maps an exercise id to a royalty-free Lottie animation, served
 * from `public/animations/<id>.json` (vector, loops cleanly, lazy-loaded by
 * `LottieFigure` and runtime-cached by the service worker for offline play).
 *
 * All animations are sourced from LottieFiles under the **Lottie Simple
 * License** (free for commercial use; attribution appreciated but not
 * required — surfaced on the Credits screen via `animationsRequiringCredit()`).
 * See LICENSES.md / public/animations/README.md for full source URLs.
 *
 * `approximate: true` marks a close-match stand-in where no exact free
 * animation existed for that move (see `note`).
 */

export interface ExerciseAnimation {
  /** Exercise id — matches the diagram registry / routine exercise ids. */
  id: string
  /** Human label of the depicted move. */
  label: string
  /** Public path to the dotLottie file. */
  url: string
  /** Original animation title on LottieFiles. */
  sourceTitle: string
  /** Creator (for the Credits screen). */
  author: string
  /** LottieFiles page the asset came from. */
  sourceUrl: string
  /** License identifier. */
  license: string
  /** True when this is a close-match stand-in, not the exact move. */
  approximate?: boolean
  /** Why the stand-in was chosen (only for approximate matches). */
  note?: string
}

const LICENSE = 'Lottie Simple License (LottieFiles)'

export const EXERCISE_ANIMATIONS: ExerciseAnimation[] = [
  {
    id: 'skater-taps',
    label: 'Skater Taps',
    url: '/animations/skater-taps.json',
    sourceTitle: 'Split Jump Exercise',
    author: 'Dinh Bui Xuan',
    sourceUrl: 'https://lottiefiles.com/free-animation/split-jump-exercise-AHHpx1bumx',
    license: LICENSE,
    approximate: true,
    note: 'No free skater/lateral-hop Lottie exists; using a plyometric jump in the same illustration style.',
  },
  {
    id: 'out-up-jacks',
    label: 'Out + Up Jacks',
    url: '/animations/out-up-jacks.json',
    sourceTitle: 'Jumping Jack',
    author: 'Dinh Bui Xuan',
    sourceUrl: 'https://lottiefiles.com/free-animation/jumping-jack-Q3NN7cRkd4',
    license: LICENSE,
  },
  {
    id: 'burpees',
    label: 'Burpees',
    url: '/animations/burpees.json',
    sourceTitle: 'Burpee and Jump Exercise',
    author: 'Dinh Bui Xuan',
    sourceUrl: 'https://lottiefiles.com/free-animation/burpee-and-jump-exercise-gCOcxxnr1X',
    license: LICENSE,
  },
  {
    id: 'station-sprints',
    label: 'Station Sprints',
    url: '/animations/station-sprints.json',
    sourceTitle: 'Running',
    author: 'Vasundhara Ghose',
    sourceUrl: 'https://lottiefiles.com/free-animation/running-Igsta2QgtP',
    license: LICENSE,
    approximate: true,
    note: 'Closest free match: running-in-place loop stands in for in-place station sprints.',
  },
  {
    id: 'jump-squats',
    label: 'Jump Squats',
    url: '/animations/jump-squats.json',
    sourceTitle: 'Jumping Squats',
    author: 'Dinh Bui Xuan',
    sourceUrl: 'https://lottiefiles.com/free-animation/jumping-squats-9hzVV8Ohi6',
    license: LICENSE,
  },
  {
    id: 'mountain-climbers',
    label: 'Mountain Climbers',
    url: '/animations/mountain-climbers.json',
    sourceTitle: 'Press-up Position Toe Tap',
    author: 'Dinh Bui Xuan',
    sourceUrl: 'https://lottiefiles.com/free-animation/press-up-postion-toe-tap-KunqnEdK18',
    license: LICENSE,
    approximate: true,
    note: 'No free mountain-climber Lottie (only premium/IconScout); using a plank-position alternating leg drive in the same style.',
  },
  {
    id: 'squats',
    label: 'Squats',
    url: '/animations/squats.json',
    sourceTitle: 'Squat',
    author: 'Daniel Bogdanov',
    sourceUrl: 'https://lottiefiles.com/free-animation/squat-vSgVOYiNCJ',
    license: LICENSE,
  },
  {
    id: 'tricep-dips',
    label: 'Tricep Dips',
    url: '/animations/tricep-dips.json',
    sourceTitle: 'Triceps Dips',
    author: 'saagar shrestha',
    sourceUrl: 'https://lottiefiles.com/free-animation/triceps-dips-2dOoFiAlnP',
    license: LICENSE,
  },
  {
    id: 'plank-jacks',
    label: 'Plank Jacks',
    url: '/animations/plank-jacks.json',
    sourceTitle: 'Plank',
    author: 'Blinix',
    sourceUrl: 'https://lottiefiles.com/free-animation/plank-667YC6ODte',
    license: LICENSE,
    approximate: true,
    note: 'No free plank-jack Lottie; using a standard plank hold as the closest match.',
  },
  {
    id: 'bicycle-crunches',
    label: 'Bicycle Crunches',
    url: '/animations/bicycle-crunches.json',
    sourceTitle: 'Elbow to Knee Crunch (Right)',
    author: 'LottieFiles community',
    sourceUrl: 'https://lottiefiles.com/free-animation/elbow-to-knee-crunch-right-FYWv5sww1I',
    license: LICENSE,
    approximate: true,
    note: 'Elbow-to-knee crunch is the same opposite-elbow-to-knee motion as a bicycle crunch.',
  },
]

export function animationFor(id: string | null | undefined): ExerciseAnimation | undefined {
  return id ? EXERCISE_ANIMATIONS.find((a) => a.id === id) : undefined
}

/** Animations whose authors should be credited (all, under the Simple License). */
export function animationsRequiringCredit(): ExerciseAnimation[] {
  return EXERCISE_ANIMATIONS
}
