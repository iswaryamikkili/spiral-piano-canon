export default class PianoSampleManifest {
    constructor(
        manifestUrl =
            `${import.meta.env.BASE_URL}audio/estate-grand/manifest/piano-manifest.json`
    ) {
        this.manifestUrl = manifestUrl;
        this.manifest = null;
        this.loaded = false;
    }

    async load() {
        if (this.loaded) {
            return;
        }

        const response = await fetch(
            this.manifestUrl
        );

        if (!response.ok) {
            throw new Error(
                `Could not load piano manifest: ${response.status}`
            );
        }

        this.manifest =
            await response.json();

        this.loaded = true;

        console.log(
            "Piano sample manifest loaded."
        );
    }

    getEntries(midiNumber) {
        this.ensureLoaded();

        const entries =
            this.manifest.notes[
                String(midiNumber)
            ];

        if (!entries) {
            return [];
        }

        return entries;
    }

    getAttackSample(
        midiNumber,
        velocity,
        sustain = false
    ) {
        this.ensureLoaded();

        const midiVelocity =
            this.normalizeVelocity(
                velocity
            );

        const entries =
            this.getEntries(
                midiNumber
            );

        const attackEntries =
            entries.filter(
                (entry) =>
                    entry.trigger ===
                    "attack"
            );

        /*
         * CC64:
         *
         * 0–63   = sustain pedal up
         * 64–127 = sustain pedal down
         */
        const pedalValue =
            sustain ? 127 : 0;

        const candidates =
            attackEntries.filter(
                (entry) => {
                    const velocityMatches =
                        midiVelocity >=
                            entry.velocity.min &&
                        midiVelocity <=
                            entry.velocity.max;

                    const pedalMatches =
                        this.matchesPedal(
                            entry,
                            pedalValue
                        );

                    return (
                        velocityMatches &&
                        pedalMatches
                    );
                }
            );

        if (candidates.length === 0) {
            return null;
        }

        /*
         * If the SFZ ever contains overlapping
         * candidates, prefer an exact-pitch
         * recording over a transposed one.
         */
        candidates.sort(
            (a, b) =>
                Math.abs(
                    a.transpose ?? 0
                ) -
                Math.abs(
                    b.transpose ?? 0
                )
        );

        return candidates[0];
    }

    matchesPedal(
        entry,
        pedalValue
    ) {
        const min =
            entry.pedal?.min;

        const max =
            entry.pedal?.max;

        /*
         * A region without a CC64 restriction
         * is valid regardless of pedal state.
         */
        if (
            min === null ||
            min === undefined ||
            max === null ||
            max === undefined
        ) {
            return true;
        }

        return (
            pedalValue >= min &&
            pedalValue <= max
        );
    }

    normalizeVelocity(velocity) {
        /*
         * @tonejs/midi commonly gives velocity
         * as a normalized 0–1 value.
         *
         * Manual playing may give us the normal
         * MIDI 0–127 range.
         */

        if (
            typeof velocity !==
                "number" ||
            Number.isNaN(velocity)
        ) {
            return 100;
        }

        if (velocity >= 0 &&
            velocity <= 1) {
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

    ensureLoaded() {
        if (
            !this.loaded ||
            !this.manifest
        ) {
            throw new Error(
                "PianoSampleManifest must be loaded before use."
            );
        }
    }
}