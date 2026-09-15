import PianoSampleManifest
    from "./PianoSampleManifest.js";

import AudioBufferStore
    from "./AudioBufferStore.js";

import PianoVoiceManager
    from "./PianoVoiceManager.js";


export default class RealPianoEngine {
    constructor() {
        this.audioContext = null;

        this.manifest =
            new PianoSampleManifest();

        this.bufferStore = null;
        this.voiceManager = null;

        this.loaded = false;
        this.sustain = false;
    }


    async load() {
        if (this.loaded) {
            return;
        }

        /*
         * Load the JSON manifest.
         *
         * We are NOT loading hundreds of
         * FLAC files here.
         */
        await this.manifest.load();

        this.loaded = true;

        console.log(
            "Real piano engine ready."
        );
    }


    async ensureAudioContext() {
        if (!this.audioContext) {
            this.audioContext =
                new AudioContext();

            this.bufferStore =
                new AudioBufferStore(
                    this.audioContext
                );

            this.voiceManager =
                new PianoVoiceManager({
                    audioContext:
                        this.audioContext,

                    destination:
                        this.audioContext
                            .destination
                });
        }

        /*
         * Browsers often suspend Web Audio
         * until the user interacts with the page.
         */
        if (
            this.audioContext.state ===
            "suspended"
        ) {
            await this.audioContext.resume();
        }
    }


    async noteOn({
        midiNumber,
        velocity = 100
    }) {
        this.ensureLoaded();

        await this.ensureAudioContext();

        const sampleEntry =
            this.manifest.getAttackSample(
                midiNumber,
                velocity,
                this.sustain
            );

        
            console.log(
                "Sample selected:",
                {
                    midiNumber,
                    velocity,
                    sustain: this.sustain,
                    sampleEntry
                }
            );

        if (!sampleEntry) {
            console.warn(
                `No piano sample found for MIDI ${midiNumber}, velocity ${velocity}, sustain ${this.sustain}`
            );

            return null;
        }

        const audioBuffer =
            await this.bufferStore
                .loadSample(
                    sampleEntry.sample
                );

        const voice =
            this.voiceManager
                .startVoice({
                    midiNumber,

                    audioBuffer,

                    transpose:
                        sampleEntry.transpose ??
                        0,

                    velocity
                });

        return voice;
    }


    noteOff({
        midiNumber
    }) {
        if (
            !this.voiceManager
        ) {
            return;
        }

        /*
         * For our first version, sustain simply
         * prevents note-off from releasing the
         * voice immediately.
         *
         * We'll improve pedal behavior later.
         */
        if (this.sustain) {
            return;
        }

        this.voiceManager
            .releaseVoice(
                midiNumber
            );
    }


    setSustain(enabled) {
        const wasSustained =
            this.sustain;

        this.sustain =
            Boolean(enabled);

        /*
         * Phase 1:
         *
         * When the pedal is released, we currently
         * release active voices.
         *
         * Later we can distinguish physically-held
         * notes from pedal-held notes.
         */
        if (
            wasSustained &&
            !this.sustain &&
            this.voiceManager
        ) {
            this.voiceManager.stopAll();
        }
    }


    stopAll() {
        this.voiceManager
            ?.stopAll();
    }


    getActiveVoiceCount() {
        return (
            this.voiceManager
                ?.getActiveVoiceCount() ??
            0
        );
    }


    ensureLoaded() {
        if (!this.loaded) {
            throw new Error(
                "RealPianoEngine must be loaded before playing notes."
            );
        }
    }
}