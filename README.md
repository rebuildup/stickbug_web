# Stick Bug clean-room web asset pack

A web-native reconstruction of the supplied meme reference. The source clip was analyzed for cut timings, FFT peaks, tempo, spectral balance, palette and motion structure. The distributable pack then rebuilds the *mechanics* from original SVG/JS/audio synthesis rather than embedding the reference assets.

## Separate assets

### Video
- `assets/video/visual-only.webm` — full visual timeline, **no audio**
- `assets/video/stickbug-dance-alpha.webm` — isolated generated insect dance with WebM alpha metadata

### Images
- `assets/image/stickbug-pose.svg` / `.png`
- `assets/image/intro-mark.svg` / `.png`
- `assets/image/morph-keyframe.svg` / `.png`

SVG is the source-of-truth format and is resolution independent.

### Music
- `assets/music/stickbug-inspired-loop.wav` — 130.8 BPM, 4 bars, newly composed, intentionally low-bandwidth/lo-fi

### SFX
- `assets/sfx/intro-rise.wav`
- `assets/sfx/outline-pop.wav`
- `assets/sfx/morph.wav`
- `assets/sfx/reveal-hit.wav`

Nothing is premixed. `assets/timeline.json` contains the intended cue positions.

## Web preview

The visual renderer is shared between the browser preview and the export generator:

- `src/scene.mjs` — pure SVG scene renderer
- `src/app.mjs` — interactive timeline + separate audio playback
- `index.html` / `style.css` — preview UI

Serve the folder over HTTP and open `index.html`. The project has no runtime JS dependencies.

## Regeneration

`node scripts/generate-assets.mjs --audio-only` regenerates the synthesized audio files.

`node scripts/generate-assets.mjs` also regenerates stills and convenience WebM renders. The browser/SVG scene in `src/scene.mjs` remains the editable source of truth.

## What was deliberately not copied

- EA logo / wordmark
- source live-action frames
- source music recording
- source melody transcription

The reconstruction instead retains measured timing, transformation grammar, rhythmic feel, frequency emphasis, broad palette relationships and stick-insect motion language. This reduces direct-copy risk but is not a legal guarantee.
