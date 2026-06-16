# Music Licenses & Attribution

This app bundles audio for offline playback. Each track below lists its source and
license. Procedural demo tracks ship no audio bytes — they are synthesized at runtime.

## Demo (procedural)

- **Pulse**, **Glow**, **Drive** — generated procedurally at runtime in the browser
  (`src/assets/music/synth.ts`); no copyrighted audio is bundled.
  License: original code, same as this project. No attribution required.

## Bundled tracks

> None yet. To add real royalty-free electronic tracks, drop an `.ogg`/`.mp3` into
> `src/assets/music/`, add a `{ kind: 'file', url }` entry in `tracks.ts` (import the
> file so Vite bundles + fingerprints it for offline use), and record provenance below.
> Prefer CC0 / Pixabay-license tracks (no attribution) to keep the UI clean; for CC-BY
> tracks the `attribution` field must be surfaced in-app.

Sources to consider (verify the license **per track** at download time):
Pixabay Music, Free Music Archive (filter CC0/CC BY), Free PD, OpenGameArt (CC0 loops),
ccMixter, Incompetech (CC BY — attribution required).

<!-- Template — one block per real track:
- Title:        <track title>
  Artist:       <artist / uploader>
  Source URL:   <page URL where downloaded>
  License:      <CC0-1.0 | CC-BY-4.0 | Pixabay Content License | ...>
  License URL:  <link to the license text>
  Attribution:  <exact required attribution string, or "none required">
  Date added:   <YYYY-MM-DD>
  File:         src/assets/music/<file>.ogg
-->

## Exercise diagrams

Hand-coded inline SVG (`src/visuals/diagrams/`); original work, no third-party assets.
