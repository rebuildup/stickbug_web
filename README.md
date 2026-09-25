# stickbug_web

Web-native reconstruction of the Stick Bug meme mechanics.

The template is intentionally split into two different rendering domains:

- **setup/bait content** — external; not part of this repository
- **5.8–7.5 s** — 2D SVG trace/morph into a stick-bug silhouette
- **7.5 s onward** — hard cut to a procedural **Three.js 3D stick insect**

That 2D → 3D discontinuity is treated as part of the gag, rather than rendering the whole sequence with one visual system.

## Run

```bash
npm run serve
```

The serve script regenerates the separate audio/image assets before starting the preview.

## Source of truth

- `src/scene.mjs` — 2D transition and timing constants
- `src/stickbug3d.mjs` — procedural 3D insect, rig motion, camera and ledge/garden transition
- `src/app.mjs` — shared timeline/audio transport
- `scripts/generate-assets.mjs` — separate WAV and SVG synthesis

## Separate assets

### Images

- `assets/image/morph-keyframe.svg`
- `assets/image/stickbug-2d-pose.svg`

### Music

- `assets/music/stickbug-inspired-loop.wav`

The composition is new. The target is the source clip's **texture**: 130.8 BPM, overlapping low/mid layers, dense attacks, saturation and a low spectral ceiling.

### SFX

- `assets/sfx/outline-pop.wav`
- `assets/sfx/morph.wav`
- `assets/sfx/reveal-hit.wav`

The SFX are resynthesized from measured onset timing, pitch/resonance bands, envelopes and noise balance. They do not embed samples from the reference recording.

Regenerate all generated assets with:

```bash
npm run generate
```

or audio only:

```bash
npm run generate:audio
```

## Reference-derived timing

| event | time |
| --- | ---: |
| outline cue | 5.000 s |
| 2D morph starts | 5.800 s |
| 2D → 3D reveal / music | 7.500 s |
| camera whip | 10.630 s |
| garden settles | 11.250 s |

The pre-5 s EA footage in the supplied reference is treated as the replaceable setup slot, not as part of the meme template.
