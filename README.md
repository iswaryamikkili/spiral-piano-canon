# Spiral Piano Visualization

An interactive 3D spiral piano visualization built with Three.js, Tone.js, and MIDI playback support.

The project represents a full 88-key piano arranged along a spiral path. It combines interactive piano-key geometry, MIDI-driven animation, visual note effects, and an experimental sample-based real-piano audio engine.

## Current Features

- Full 88-key piano layout
  - 52 white keys
  - 36 black keys
  - Piano range: A0 to C8
- Spiral keyboard geometry
- Low-frequency notes positioned toward the outer spiral
- High-frequency notes positioned toward the inner spiral
- Curved white and black key geometry following the spiral
- Group-based keyboard scaling
- Mouse hover tooltip displaying:
  - note name
  - MIDI number
- Interactive key press animation
- Key color flash on note trigger
- Rising note-orb effect
- MIDI jumping-orb visualization
- MIDI file loading
- MIDI Play / Pause / Resume / Stop
- Chord and simultaneous-note handling
- Velocity-aware MIDI playback
- Experimental Estate Grand sample-based piano engine

## Technology

- JavaScript
- Three.js
- Tone.js
- @tonejs/midi
- Web Audio API
- Vite

## Project Structure

```text
src/
├── audio/
│   ├── AudioBufferStore.js
│   ├── PianoSampleManifest.js
│   ├── PianoVoice.js
│   ├── PianoVoiceManager.js
│   └── RealPianoEngine.js
│
├── core/
│   ├── CameraManager.js
│   ├── LightManager.js
│   ├── RendererManager.js
│   └── SceneManager.js
│
├── effects/
│   ├── MidiJumpingOrbController.js
│   └── RisingNoteOrbController.js
│
├── interaction/
│   ├── KeyPressController.js
│   └── KeySoundController.js
│
├── midi/
│   └── MidiPlaybackController.js
│
├── piano/
│   ├── BlackKeyGeometry.js
│   ├── KeyboardBuilder.js
│   ├── PianoBlueprint.js
│   ├── SpiralPath.js
│   └── WhiteKeyGeometry.js
│
├── ui/
├── utils/
└── main.js

scripts/
└── build-piano-manifest.mjs

public/
└── audio/
    └── estate-grand/
        ├── manifest/
        │   └── piano-manifest.json
        └── Estate Grand Piano Samples/
            └── [local FLAC samples - not tracked by Git]
## Estate Grand Audio Samples

The project includes an experimental sample-based real piano engine using
Estate Grand piano recordings.

The audio engine source code and generated piano manifest are included in
this repository. However, the raw Estate Grand `.flac` sample library is
NOT included in Git.

The samples are required if you want to run the Estate Grand real-piano
audio feature locally.

Expected local directory:

public/audio/estate-grand/Estate Grand Piano Samples/

The generated sample manifest is stored at:

public/audio/estate-grand/manifest/piano-manifest.json

The sample directory is intentionally excluded through `.gitignore`
because the library is approximately 615 MB and is a third-party audio
asset whose redistribution terms should be verified separately.

A developer cloning or forking this repository can work on the
visualization, geometry, MIDI system, effects, and application code
without these samples. To use the Estate Grand audio engine, the
corresponding sample library must be obtained separately and placed in
the directory above.## Current Status

Working:

- 88-key spiral piano (A0-C8)
- 52 white keys and 36 black keys
- Low frequencies on the outer spiral
- High frequencies toward the inner spiral
- Curved white/black key geometry
- Whole-keyboard group scaling
- Key hover information
- Key press animation
- Key flash effect
- Rising note orb
- MIDI jumping orb
- MIDI file loading
- Play / Pause / Resume / Stop
- Simultaneous MIDI notes/chords
- RealPianoEngine integration

Work in progress:

- Some Estate Grand samples fail to load through the current development
  URL/path handling, particularly filenames containing `#`.
- Some affected notes may therefore be silent.
- Inner-loop white/black key proportions can receive further refinement.
- Real-piano sample hosting for a public deployment has not yet been
  finalized.
## Development

Install dependencies:

npm install

Start development server:

npm run dev

Create a production build:

npm run build

When changing geometry, test:

1. White-key placement
2. Black-key placement
3. A0-C8 ordering
4. Mouse interaction
5. Key animation
6. Rising orb alignment
7. MIDI jumping-orb alignment

Do not commit the Estate Grand FLAC sample directory unless the project's
audio distribution strategy and applicable licensing have been reviewed.