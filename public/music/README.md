# Bundled music — drop `.ogg` files here

These files are served at `/music/<name>.ogg`, runtime-cached by the service worker
for offline play, and referenced from `src/assets/music/tracks.ts`. The build does
**not** require them — until a file is present the mixer simply skips that track and
falls back to the next (ending on the always-available procedural demo tracks).

Download each track, convert to `.ogg` (e.g. `ffmpeg -i in.mp3 -c:a libvorbis -q:a 5 out.ogg`),
and save with the **exact** filename below.

## CC0 — no attribution required

| File | Track | Artist | Source |
| ---- | ----- | ------ | ------ |
| `ascend.ogg` | Ascend | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-1 |
| `flying-temple.ogg` | Flying Temple | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-1 |
| `lost-utopia.ogg` | Lost Utopia | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-1 |
| `starting-over.ogg` | Starting Over | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-1 |
| `the-lab.ogg` | The Lab | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-1 |
| `drama.ogg` | Drama | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-2 |
| `extended.ogg` | Extended | tricksntraps | https://opengameart.org/content/free-rhythm-game-music-pack-2 |
| `retro-synths.ogg` | Retro Synths | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/power-pop/retro-synths/ |
| `mutant-club.ogg` | Mutant Club | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/power-pop |
| `happy-dance.ogg` | Happy Dance | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/power-pop |

## CC0 hip hop / phonk workout beats — no attribution required

| File | Track | Artist | Source |
| ---- | ----- | ------ | ------ |
| `only-human.ogg` | Only Human | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ |
| `pantheon.ogg` | Pantheon | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ |
| `phonk-ish.ogg` | Phonk-ish | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ |
| `phonk-remix.ogg` | Phonk Remix | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ |
| `re-adjustment.ogg` | Re-Adjustment | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/phonk-aura-farming/ |
| `tension-in-the-air.ogg` | Tension in the Air | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/beats-from-the-crypt/ |
| `shadow-self.ogg` | Shadow Self | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/beats-from-the-crypt/ |
| `strange-brew.ogg` | Strange Brew | HoliznaCC0 | https://freemusicarchive.org/music/holiznacc0/beats-from-the-crypt/ |

## CC-BY 4.0 — attribution REQUIRED (shown in the app's Credits screen)

| File | Track | Artist | Source |
| ---- | ----- | ------ | ------ |
| `electrodoodle.ogg` | Electrodoodle | Kevin MacLeod | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200079 |
| `local-forecast.ogg` | Local Forecast | Kevin MacLeod | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300012 |

To drop a track, remove its entry from `tracks.ts` if you don't want it. The CC-BY
tracks' attribution is already wired into Settings → Credits.
