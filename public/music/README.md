# Bundled music — drop `.ogg` files here

These files are served at `/music/<name>.ogg`, runtime-cached by the service worker
for offline play, and referenced from `src/assets/music/tracks.ts`. The build does
**not** require them — until a file is present the mixer simply skips that track and
falls back to the next.

Download each track, convert to `.ogg` (e.g. `ffmpeg -i in.mp3 -c:a libvorbis -q:a 5 out.ogg`),
and save with the **exact** filename below. Files map to playlists via each track's
`category` in `tracks.ts`.

## Hip Hop — CC0 (no attribution required)

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

## Electronic — CC-BY 4.0 (attribution REQUIRED, shown in Settings → Credits)

All by Kevin MacLeod (incompetech.com), https://incompetech.com/music/royalty-free/

| File | Track |
| ---- | ----- |
| `8bit-dungeon-boss.ogg` | 8bit Dungeon Boss |
| `club-diver.ogg` | Club Diver |
| `desert-of-lost-souls.ogg` | Desert of Lost Souls |
| `double-o.ogg` | Double O |
| `equatorial-complex.ogg` | Equatorial Complex |
| `future-cha-cha.ogg` | Future Cha Cha |
| `getting-it-done.ogg` | Getting it Done |
| `harmful-or-fatal.ogg` | Harmful or Fatal |
| `laser-groove.ogg` | Laser Groove |
| `raving-energy-faster.ogg` | Raving Energy (faster) |
| `reformat.ogg` | Reformat |
| `shiny-tech.ogg` | Shiny Tech |
| `shiny-tech-ii.ogg` | Shiny Tech II |
| `show-your-moves.ogg` | Show Your Moves |
| `video-dungeon-boss.ogg` | Video Dungeon Boss |
| `voice-over-under.ogg` | Voice Over Under |

## Latin & Jazz — CC-BY 4.0 (attribution REQUIRED, shown in Settings → Credits)

All by Kevin MacLeod (incompetech.com), https://incompetech.com/music/royalty-free/

| File | Track |
| ---- | ----- |
| `apero-hour.ogg` | Apero Hour |
| `faster-does-it.ogg` | Faster Does It |
| `night-on-the-docks-piano.ogg` | Night on the Docks - Piano |
| `night-on-the-docks-sax.ogg` | Night on the Docks - Sax |
| `night-on-the-docks-trumpet.ogg` | Night on the Docks - Trumpet |
| `nouvelle-noel.ogg` | Nouvelle Noel |
| `shades-of-spring.ogg` | Shades of Spring |
| `no-frills-salsa.ogg` | No Frills Salsa |

