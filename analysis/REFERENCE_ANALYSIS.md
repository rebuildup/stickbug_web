# Reference analysis

## Exact screenshot/frame identification

The four user-provided 408x360 screenshots were compared against every frame in the 30 fps / 443-frame source MP4 using pixel MSE. Best matches:

| screenshot content | source frame | source time | MSE |
| --- | ---: | ---: | ---: |
| 2D stick-bug pose | 220 | 7.333 s | 1.462 |
| first live/3D-looking mauve ledge frame | 226 | 7.533 s | 1.021 |
| bright right post / sloped ledge | 318 | 10.600 s | 1.184 |
| forest background / other ledge face | 338 | 11.267 s | 4.160 |

This is the chronological order used by the implementation and verification. The order in which screenshots were attached was not chronological.

## Visual constraints

### 7.333 s

The final 2D pose is traced in 408x360 pixel coordinates. Its body/leg endpoints and the sloped platform line are stored directly in `src/scene.mjs` and form the convergence target of the morph.

### 7.533 s

The first 3D frame keeps almost the same insect silhouette but replaces the flat graphic with a physical ledge. The calibrated rail edge runs approximately from the left at y=132–145 to the right at y=167–181. The insect feet remain pinned along that edge.

### 10.600 s

The ledge slopes much more strongly from left to right. A large pale vertical post occupies the right side and occludes the insect. This is a required camera-composition keyframe, not a decorative approximation.

### 11.267 s

After the whip, the camera exposes the ledge corner and a different face of the railing. The background is a strongly defocused forest; dark/bright vertical structural elements sit at the left edge. The insect is smaller and remains attached to the ledge.

## Intro audio

Source onset analysis finds the nine ascending metallophone attacks at approximately:

`0.987, 1.317, 1.653, 1.984, 2.320, 2.651, 2.987, 3.317, 3.653 s`

and the later isolated tone at approximately `4.987 s`.

The template removes the original leading silence, shifting these to approximately:

`0.000, 0.330, 0.666, 0.997, 1.333, 1.664, 2.000, 2.330, 2.666 s`, then `4.000 s`.

Approximate dominant frequencies measured around those attacks:

`527, 516, 598, 621, 656, 656, 738, 785, 844 Hz`, final tone `~879 Hz`.

The generated tones use long overlapping metallophone envelopes so the texture does not collapse into isolated sine beeps.

## Morph SFX

The 5.8–7.5 s source interval contains dense irregular attacks at:

`5.824, 5.901, 5.968, 6.021, 6.120, 6.229, 6.283, 6.387, 6.424, 6.472, 6.509, 6.587, 6.624, 6.765, 6.867, 6.931, 7.027, 7.067, 7.131, 7.253, 7.368, 7.440 s`.

Dominant resonant bands cluster near `255, 327, 375–400, 491–527, 582–586, 655, 764–782, 964–982, 1.15 kHz, 1.45 kHz, 1.95 kHz, 2.2 kHz`. The current generator voices the same event density with overlapping brass-like harmonic stacks instead of the previous metallic/noise-only morph.

## Reveal music

Measured dominant tempo: **130.8 BPM**. The generated composition remains newly composed but intentionally preserves the source-like overlap, low spectral center, saturation and dense attack pattern.
