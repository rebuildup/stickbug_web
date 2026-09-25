# stickbug_web

Web-native reconstruction of the Stick Bug meme template.

This revision treats the user's four screenshots as hard visual targets instead of approximate references. The screenshots were exhaustively matched against all 443 frames of the supplied source clip before camera/layout calibration.

## Timeline

The reusable template starts at the first metallophone strike, so the source clip's ~0.987 s leading silence is removed.

- 0.000–2.666 s: 9 metallophone strikes
  - strikes 1–7: source object line components
  - strike 8: base/ledge
  - strike 9: background
- 4.000 s: final metallophone strike; the source object disappears
- 4.813 s: brass transition starts and the remaining lines move toward the traced stick-bug + ledge target
- 6.346 s: calibrated 2D target pose (source 7.333 s)
- 6.513 s: deliberately abrupt 2D -> 3D cut (source 7.500 s)
- 6.546 s: first calibrated 3D/live composition target (source 7.533 s)
- 9.613 s: pre-whip calibrated composition target (source 10.600 s)
- 9.643 s: camera whip begins
- 10.280 s: forest-side calibrated composition target (source 11.267 s)

## Rendering

- `src/scene.mjs` — 2D line extraction/morph. The final 2D pose is a pixel-space trace of the 7.333 s reference frame.
- `src/stickbug3d.mjs` — Three.js renderer. The insect, ledge, occluding post and camera have calibrated keyframes at 7.533 / 10.600 / 11.267 source seconds.
- `src/app.mjs` — transport and separately timed audio layers.

The 3D insect is made from real 3D segment meshes. Leg feet stay pinned to the ledge; the body and knees absorb the beat-synchronous motion between calibrated frames.

## Separate generated assets

- `assets/sfx/intro-bells.wav` — 9 overlapping metallophone tones + delayed final tone
- `assets/sfx/morph-brass.wav` — brass-like transition using the measured 5.8–7.5 s onset pattern
- `assets/sfx/reveal-hit.wav`
- `assets/music/stickbug-inspired-loop.wav`
- `assets/image/morph-keyframe.svg`
- `assets/image/stickbug-2d-pose.svg`

Regenerate with:

```bash
npm run generate
```

Preview with:

```bash
npm run serve
```
