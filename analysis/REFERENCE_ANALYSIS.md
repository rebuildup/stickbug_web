# Reference analysis

## Visual structure

The supplied clip's reusable template boundary is not the EA logo. The logo is setup/bait content that happens to occupy the replaceable first slot.

The reusable transition is:

1. around **5.0 s**, the source image has collapsed to a pale line treatment;
2. from **5.8 s**, line geometry progressively resolves into a 2D stick-insect silhouette;
3. at **7.5 s**, there is a hard medium change from flat 2D graphics to the insect footage;
4. around **10.63–11.25 s**, the camera/background moves into the brighter garden view.

The implementation therefore keeps the transition in SVG and moves the post-7.5 s section to Three.js. The 3D insect uses the proportions and side-on leg geometry of the reference frames, but no source pixels.

## 3D motion target

The 7.5–10.6 s section is dominated by a long horizontal body, small head on the right, three high angular leg pairs, alternating compression/extension close to eighth-note timing, and small body bob/roll.

The Three.js renderer models six two-segment legs, a segmented body and two antennae. After 10.63 s the camera, insect scale and background shift together to preserve the original spatial discontinuity.

## Outline cue SFX

A 25 ms-window analysis around 5.0 s shows a dominant **~880 Hz** component with a fast exponential tail:

- 5.050 s: about -8 dB RMS
- 5.200 s: about -31 dB RMS
- 5.350 s: about -51 dB RMS
- 5.500 s: about -72 dB RMS

A much quieter component sits around **6.2 kHz**. The replacement SFX recreates those properties by synthesis rather than copying the recording.

## Morph SFX

Onset detection between 5.8 and 7.5 s finds 22 dense attacks:

`5.824, 5.901, 5.968, 6.021, 6.120, 6.229, 6.283, 6.387, 6.424, 6.472, 6.509, 6.587, 6.624, 6.765, 6.867, 6.931, 7.027, 7.067, 7.131, 7.253, 7.368, 7.440 s`

Dominant repeating resonances cluster around:

`255, 327, 375–400, 491–527, 582–586, 655, 764–782, 964–982, 1.15 kHz, 1.45 kHz, 1.95 kHz, 2.2 kHz`

with weaker upper energy into roughly 3–6 kHz. The generator uses these measured event positions and resonance families to excite damped synthetic oscillators plus filtered noise.

## Music texture

Post-reveal analysis gives a dominant tempo near **130.8 BPM** and a very low spectral center. The first reconstruction was too sparse because notes decayed before later voices accumulated.

The current loop deliberately overlaps sustained sub and mid layers, eighth-note bass/plucks, octave support, independent lead/support voices, low-band transient noise, saturation and low-pass filtering. The note sequence/harmony is newly composed; the target is density and timbre, not melody.
