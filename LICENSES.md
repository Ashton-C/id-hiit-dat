# Music Licenses & Attribution

This app can bundle audio for offline playback. Procedural demo tracks ship no audio
bytes (synthesized at runtime). Real tracks are dropped into `public/music/` (see
`public/music/README.md`) and referenced from `src/assets/music/tracks.ts`.

## Demo (procedural)

- **Pulse**, **Glow**, **Drive** — generated procedurally at runtime
  (`src/assets/music/synth.ts`); no copyrighted audio. License: project code. No
  attribution. Kept as an always-available offline fallback.

## Bundled tracks — CC0 1.0 (no attribution required)

License URL: https://creativecommons.org/publicdomain/zero/1.0/

- Title: Ascend — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-1 — File: public/music/ascend.ogg
- Title: Flying Temple — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-1 — File: public/music/flying-temple.ogg
- Title: Lost Utopia — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-1 — File: public/music/lost-utopia.ogg
- Title: Starting Over — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-1 — File: public/music/starting-over.ogg
- Title: The Lab — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-1 — File: public/music/the-lab.ogg
- Title: Drama — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-2 — File: public/music/drama.ogg
- Title: Extended — Artist: tricksntraps — Source: https://opengameart.org/content/free-rhythm-game-music-pack-2 — File: public/music/extended.ogg
- Title: Retro Synths — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/power-pop/retro-synths/ — File: public/music/retro-synths.ogg
- Title: Mutant Club — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/power-pop — File: public/music/mutant-club.ogg
- Title: Happy Dance — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/power-pop — File: public/music/happy-dance.ogg

## Bundled tracks — CC0 1.0 hip hop / phonk (no attribution required)

- Title: Only Human — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ — File: public/music/only-human.ogg
- Title: Pantheon — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ — File: public/music/pantheon.ogg
- Title: Phonk-ish — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ — File: public/music/phonk-ish.ogg
- Title: Phonk Remix — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ — File: public/music/phonk-remix.ogg
- Title: Re-Adjustment — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ — File: public/music/re-adjustment.ogg
- Title: Tension in the Air — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/beats-from-the-crypt/ — File: public/music/tension-in-the-air.ogg
- Title: Shadow Self — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/beats-from-the-crypt/ — File: public/music/shadow-self.ogg
- Title: Strange Brew — Artist: HoliznaCC0 — Source: https://freemusicarchive.org/music/holiznacc0/beats-from-the-crypt/ — File: public/music/strange-brew.ogg

## Bundled tracks — CC-BY 4.0 (attribution REQUIRED, shown in Settings → Credits)

License URL: https://creativecommons.org/licenses/by/4.0/

- Title: Electrodoodle — Artist: Kevin MacLeod (incompetech.com) — Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200079 — File: public/music/electrodoodle.ogg
  Attribution: "Electrodoodle" by Kevin MacLeod (incompetech.com) — licensed under Creative Commons: By Attribution 4.0
- Title: Local Forecast — Artist: Kevin MacLeod (incompetech.com) — Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300012 — File: public/music/local-forecast.ogg
  Attribution: "Local Forecast" by Kevin MacLeod (incompetech.com) — licensed under Creative Commons: By Attribution 4.0

> Verify each track's license at download time (licenses can vary per track within a
> site). Pixabay/ccMixter were not auto-verifiable during research — confirm in a
> browser before adding. The CC-BY attribution strings above are wired into the app's
> Credits screen via `Track.attribution`.

## Exercise diagrams

Hand-coded inline SVG (`src/visuals/diagrams/`); original work, no third-party assets.

## Exercise animations — Lottie Simple License (LottieFiles)

Free for commercial use; attribution appreciated, not required. Files in
`public/animations/`, referenced from `src/assets/animations/animations.ts`.
License: https://lottiefiles.com/page/license

Exact matches:
- Burpees — Dinh Bui Xuan — https://lottiefiles.com/free-animation/burpee-and-jump-exercise-gCOcxxnr1X — File: public/animations/burpees.json
- Out + Up Jacks (Jumping Jack) — Dinh Bui Xuan — https://lottiefiles.com/free-animation/jumping-jack-Q3NN7cRkd4 — File: public/animations/out-up-jacks.json
- Jump Squats — Dinh Bui Xuan — https://lottiefiles.com/free-animation/jumping-squats-9hzVV8Ohi6 — File: public/animations/jump-squats.json
- Squats — Daniel Bogdanov — https://lottiefiles.com/free-animation/squat-vSgVOYiNCJ — File: public/animations/squats.json
- Tricep Dips — saagar shrestha — https://lottiefiles.com/free-animation/triceps-dips-2dOoFiAlnP — File: public/animations/tricep-dips.json

Close matches (no exact free Lottie existed — see public/animations/README.md):
- Mountain Climbers ≈ press-up toe tap — Dinh Bui Xuan — https://lottiefiles.com/free-animation/press-up-postion-toe-tap-KunqnEdK18 — File: public/animations/mountain-climbers.json
- Bicycle Crunches ≈ elbow-to-knee crunch — LottieFiles community — https://lottiefiles.com/free-animation/elbow-to-knee-crunch-right-FYWv5sww1I — File: public/animations/bicycle-crunches.json
- Plank Jacks ≈ plank hold — Blinix — https://lottiefiles.com/free-animation/plank-667YC6ODte — File: public/animations/plank-jacks.json
- Station Sprints ≈ running in place — Vasundhara Ghose — https://lottiefiles.com/free-animation/running-Igsta2QgtP — File: public/animations/station-sprints.json
- Skater Taps ≈ split jump — Dinh Bui Xuan — https://lottiefiles.com/free-animation/split-jump-exercise-AHHpx1bumx — File: public/animations/skater-taps.json
