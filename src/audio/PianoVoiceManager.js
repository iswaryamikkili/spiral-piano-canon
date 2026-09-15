import PianoVoice
    from "./PianoVoice.js";

export default class PianoVoiceManager {
    constructor({
        audioContext,
        destination
    }) {
        this.audioContext =
            audioContext;

        this.destination =
            destination;

        this.activeVoices =
            new Map();
    }

    startVoice({
        midiNumber,
        audioBuffer,
        transpose = 0,
        velocity = 100
    }) {
        const existingVoices =
            this.activeVoices.get(
                midiNumber
            ) ?? [];

        const voice =
            new PianoVoice({
                audioContext:
                    this.audioContext,

                audioBuffer,

                destination:
                    this.destination,

                transpose,

                velocity
            });

        voice.start();

        existingVoices.push(
            voice
        );

        this.activeVoices.set(
            midiNumber,
            existingVoices
        );

        return voice;
    }

    releaseVoice(
        midiNumber,
        releaseTime = 0.12
    ) {
        const voices =
            this.activeVoices.get(
                midiNumber
            );

        if (
            !voices ||
            voices.length === 0
        ) {
            return;
        }

        /*
         * Release the oldest active voice
         * for this MIDI note.
         *
         * This helps repeated notes behave
         * naturally instead of killing
         * every instance at once.
         */
        const voice =
            voices.shift();

        voice?.release(
            releaseTime
        );

        if (
            voices.length === 0
        ) {
            this.activeVoices.delete(
                midiNumber
            );
        }
    }

    releaseAllForNote(
        midiNumber,
        releaseTime = 0.12
    ) {
        const voices =
            this.activeVoices.get(
                midiNumber
            );

        if (!voices) {
            return;
        }

        for (
            const voice of voices
        ) {
            voice.release(
                releaseTime
            );
        }

        this.activeVoices.delete(
            midiNumber
        );
    }

    stopAll() {
        for (
            const voices
            of this.activeVoices.values()
        ) {
            for (
                const voice of voices
            ) {
                voice.stopImmediately();
            }
        }

        this.activeVoices.clear();
    }

    getActiveVoiceCount() {
        let count = 0;

        for (
            const voices
            of this.activeVoices.values()
        ) {
            count += voices.length;
        }

        return count;
    }
}