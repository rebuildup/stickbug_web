# Reference analysis

The supplied reference was measured, not eyeballed. The output assets do **not** contain source frames, the EA logo, or the source music.

## Media

- Video: 408×360, H.264, 30 fps, 14.775 s
- Audio: 48 kHz stereo in the MP4; supplied WAV is 48 kHz PCM, 14.7679 s

## Frame-level timing

| Time | Measured event | Reconstruction decision |
| ---: | --- | --- |
| 0.000 | Filled blue corporate mark on white | New custom angular mark, same broad visual role |
| 1.034 | First ascending pluck | Begin progressive fill→outline conversion |
| 1.368–3.701 | 8 further plucks at ≈0.333 s spacing | Nine-step line reveal, synchronized |
| 3.700 | Hard background cut from white to mauve; underline appears | Same hard timing; measured mauve family retained |
| 5.000 | Large transient / visual simplification | New outline-pop SFX; mark switches to ivory monoline |
| 5.800 | Broadband transition audio begins | Line segments begin morphing into insect geometry |
| 7.500 | Hard reveal into live insect footage; music begins | Hard reveal into procedural ledge/garden + generated insect dance |
| 10.630 | Fast camera/background movement | Short procedural whip-pan transition |
| 11.250 | Brighter green garden view settles | Procedural blurred garden plate |

Representative measured palette from the reference:

- logo blue ≈ `#106DBA`
- stage mauve ≈ `#93868F`
- pale line ≈ `#FBF5EC`
- underline ≈ `#AEA8B0`

The generated palette is intentionally nearby rather than a pixel copy.

## Intro SFX analysis

Amplitude/onset detection finds nine attacks:

`1.034, 1.368, 1.701, 2.034, 2.365, 2.701, 3.033, 3.367, 3.701 s`

FFT peaks for the clean early tones are approximately:

`522, 553, 586, 621, 658, ~698, 741, 786, 833 Hz`

This is effectively a roughly chromatic ascending run at one attack per ~333 ms. The generated `intro-rise.wav` keeps the cadence and rising-register behavior but uses a new pitch set and synthesized timbre.

## Reveal music analysis

Analysis is restricted to the post-reveal portion (7.5 s onward).

- dominant tempogram peak: **130.8 BPM**
- secondary nearby peaks: 129.3 / 132.4 BPM
- observed event density: ~5.4 onsets/s
- spectral energy distribution from STFT:
  - <100 Hz: 23.9%
  - 100–300 Hz: 45.8%
  - 300–1000 Hz: 29.5%
  - 1–3 kHz: 0.75%
  - >3 kHz: effectively negligible in this clip

So the recognizable audio texture is not just the tune: it is bass-heavy, attack-dense, strongly bandwidth-limited/lo-fi material around 130.8 BPM. The generated music therefore preserves **tempo, spectral center, low-pass character and attack density**, while using a new A-minor composition rather than transcribing the source melody.

Generated loop metrics after tuning:

- dominant tempogram peak: 130.8 BPM
- <100 Hz: ~20.7%
- 100–300 Hz: ~54.9%
- 300–1000 Hz: ~22.8%
- 1–3 kHz: ~1.6%
- >3 kHz: <0.1%

## Visual motion abstraction

The reference transformation is based on a small number of straight line elements. Instead of tracing the source logo, the generated mark is constructed from original polygons and an eight-segment monoline skeleton. Each segment has a one-to-one destination in a generated stick-insect skeleton, so the morph reads as a structural transformation rather than a crossfade.

The dance after 7.5 s is generated parametrically at the measured music tempo. Body bob, body rotation and alternating leg endpoints use phase-shifted periodic motion; no source video pixels are used.
