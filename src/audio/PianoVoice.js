export default class PianoVoice {
    constructor({
        audioContext,
        audioBuffer,
        destination,
        transpose = 0,
        velocity = 100
    }) {
        this.audioContext =
            audioContext;

        this.audioBuffer =
            audioBuffer;

        this.destination =
            destination;

        this.transpose =
            transpose;

        this.velocity =
            this.normalizeVelocity(
                velocity
            );

        this.source = null;
        this.gainNode = null;

        this.started = false;
        this.stopped = false;
    }

    start(
        when =
            this.audioContext.currentTime
    ) {
        if (this.started) {
            return;
        }

        this.started = true;

        this.source =
            this.audioContext
                .createBufferSource();

        this.gainNode =
            this.audioContext
                .createGain();

        this.source.buffer =
            this.audioBuffer;

        /*
         * Estate Grand sometimes maps one
         * recorded piano pitch across nearby
         * MIDI notes.
         *
         * Example:
         *
         * recorded B0 = MIDI 23
         * requested A#0 = MIDI 22
         *
         * transpose = -1
         */
        this.source.playbackRate.value =
            Math.pow(
                2,
                this.transpose / 12
            );

        /*
         * The sample itself already contains
         * the recorded velocity layer.
         *
         * This gain is only used as a modest
         * final level adjustment.
         */
        const gain =
            this.velocity / 127;

        this.gainNode.gain.setValueAtTime(
            gain,
            when
        );

        this.source.connect(
            this.gainNode
        );

        this.gainNode.connect(
            this.destination
        );

        this.source.onended =
            () => {
                this.cleanup();
            };

        this.source.start(
            when
        );
    }

    release(
        releaseTime = 0.12
    ) {
        if (
            !this.started ||
            this.stopped ||
            !this.source ||
            !this.gainNode
        ) {
            return;
        }

        this.stopped = true;

        const now =
            this.audioContext
                .currentTime;

        const endTime =
            now +
            releaseTime;

        this.gainNode.gain
            .cancelScheduledValues(
                now
            );

        this.gainNode.gain
            .setValueAtTime(
                this.gainNode.gain.value,
                now
            );

        this.gainNode.gain
            .linearRampToValueAtTime(
                0,
                endTime
            );

        try {
            this.source.stop(
                endTime
            );
        } catch {
            // Source may already have ended.
        }
    }

    stopImmediately() {
        if (
            !this.source ||
            this.stopped
        ) {
            return;
        }

        this.stopped = true;

        try {
            this.source.stop();
        } catch {
            // Ignore if already stopped.
        }

        this.cleanup();
    }

    cleanup() {
        try {
            this.source?.disconnect();
        } catch {
            // Already disconnected.
        }

        try {
            this.gainNode?.disconnect();
        } catch {
            // Already disconnected.
        }

        this.source = null;
        this.gainNode = null;
    }

    normalizeVelocity(
        velocity
    ) {
        if (
            typeof velocity !==
                "number" ||
            Number.isNaN(
                velocity
            )
        ) {
            return 100;
        }

        if (
            velocity >= 0 &&
            velocity <= 1
        ) {
            return Math.round(
                velocity * 127
            );
        }

        return Math.round(
            Math.max(
                0,
                Math.min(
                    127,
                    velocity
                )
            )
        );
    }
}