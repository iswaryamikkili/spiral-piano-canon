import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

export default class MidiPlaybackController {
    constructor({
        keyboard,
        keyPressController,
        keySoundController,
        orbController,
        jumpingOrbController
    })  {

        this.jumpingOrbController =
    jumpingOrbController;
        this.keyboard = keyboard;

        this.keyPressController =
            keyPressController;

        this.keySoundController =
            keySoundController;

        this.orbController =
            orbController;

        /*
         * Compatible with Tone versions exposing either
         * getTransport() or the global Transport object.
         */
        this.transport =
            typeof Tone.getTransport ===
            "function"
                ? Tone.getTransport()
                : Tone.Transport;

        this.notes = [];
        this.duration = 0;
        this.fileName = "";

        this.state = "empty";

        this.scheduledEventIds = [];

        /*
         * Counts overlapping notes on the same key.
         * This prevents an early note-off from releasing
         * a second overlapping occurrence of that note.
         */
        this.keyHoldCounts = new Map();

        this.stateListeners = new Set();
        
    }

    async loadFile(file) {
        if (!(file instanceof File)) {
            throw new TypeError(
                "A valid MIDI file is required."
            );
        }

        this.stop();
        this.clearSchedule();

        this.setState("loading");

        try {
            const arrayBuffer =
                await file.arrayBuffer();

            const midi =
                new Midi(arrayBuffer);

            this.notes = midi.tracks
                .flatMap(
                    (track) => track.notes
                )
                .filter(
                    (note) =>
                        note.midi >= 21 &&
                        note.midi <= 108
                )
                .sort(
                    (a, b) =>
                        a.time - b.time
                );

            if (this.notes.length === 0) {
                throw new Error(
                    "The MIDI file contains no piano-range notes."
                );
            }

            this.duration = Math.max(
                midi.duration ?? 0,
                ...this.notes.map(
                    (note) =>
                        note.time +
                        note.duration
                )
            );

            this.fileName = file.name;

            this.noteGroups =
    this.groupSimultaneousNotes(
        this.notes
    );

this.jumpingOrbController?.setSequence(
    this.noteGroups
);

this.scheduleNotes();

            this.transport.seconds = 0;

            this.setState("ready");
        } catch (error) {
            this.notes = [];
            this.duration = 0;
            this.fileName = "";

            this.clearSchedule();
            this.setState("error");

            throw error;
        }

        this.noteGroups =
    this.groupSimultaneousNotes(
        this.notes
    );

this.jumpingOrbController?.setSequence(
    this.noteGroups
);
    }

    scheduleNotes() {
        this.clearSchedule();

        for (const note of this.notes) {
            const key =
                this.keyboard
                    .getKeyByMidiNumber(
                        note.midi
                    );

            if (!key) {
                continue;
            }

            const startEventId =
                this.transport.schedule(
                    (audioTime) => {
                        this.handleNoteStart(
                            key,
                            note,
                            audioTime
                        );
                    },
                    note.time
                );

            const endEventId =
                this.transport.schedule(
                    () => {
                        this.handleNoteEnd(
                            key
                        );
                    },
                    note.time +
                        note.duration
                );

            this.scheduledEventIds.push(
                startEventId,
                endEventId
            );
        }

        const finishEventId =
            this.transport.schedule(
                () => {
                    this.finishPlayback();
                },
                this.duration + 0.05
            );

        this.scheduledEventIds.push(
            finishEventId
        );



        this.noteGroups.forEach(
            (group, groupIndex) => {
                const eventId =
                    this.transport.schedule(
                        () => {
                            this.jumpingOrbController
                                ?.triggerGroup(
                                    groupIndex,
                                    group.time
                                );
                        },
                        group.time
                    );
        
                this.scheduledEventIds.push(
                    eventId
                );
            }
        );
    }

    handleNoteStart(
        key,
        note,
        audioTime
    ) {
        const currentCount =
            this.keyHoldCounts.get(key) ?? 0;

        this.keyHoldCounts.set(
            key,
            currentCount + 1
        );

        this.keyPressController.pressKey(
            key
        );

        this.keySoundController.triggerKey(
            key,
            {
                duration:
                    Math.max(
                        note.duration,
                        0.03
                    ),

                velocity:
                    note.velocity ?? 0.8,

                time: audioTime,

                flash: true
            }
        );

        // this.orbController.spawn(key);
        /*
 * Individual rising orbs are reserved for mouse clicks.
 * MIDI uses the jumping melody orb and chord echoes.
 */
    }

    handleNoteEnd(key) {
        const currentCount =
            this.keyHoldCounts.get(key) ?? 0;

        const nextCount =
            Math.max(
                currentCount - 1,
                0
            );

        if (nextCount === 0) {
            this.keyHoldCounts.delete(key);

            this.keyPressController
                .releaseKey(key);

            return;
        }

        this.keyHoldCounts.set(
            key,
            nextCount
        );
    }

    async play() {
        if (
            this.state === "empty" ||
            this.state === "loading" ||
            this.state === "error"
        ) {
            throw new Error(
                "Load a valid MIDI file first."
            );
        }

        await Tone.start();

        if (this.state === "paused") {
            this.resume();
            return;
        }

        /*
         * Play from the beginning after stop or finish.
         */
        this.transport.stop();
        this.transport.seconds = 0;

        this.releaseAllActiveKeys();
        this.keySoundController
            .stopAllSounds();

        this.transport.start();
        this.jumpingOrbController?.start();

        this.setState("playing");
    }

    pause() {
        if (this.state !== "playing") {
            return;
        }

        this.transport.pause();
        this.jumpingOrbController?.pause();

        /*
         * Release active audio and visual keys while
         * paused. Future scheduled events remain intact.
         */
        this.keySoundController
            .stopAllSounds();

        this.releaseAllActiveKeys();

        this.setState("paused");
    }

    async resume() {
        if (this.state !== "paused") {
            return;
        }

        await Tone.start();

        this.transport.start();
        this.jumpingOrbController?.resume();

        this.setState("playing");
    }

    stop() {
        this.transport.stop();
        this.jumpingOrbController?.stop();
        this.transport.seconds = 0;

        this.keySoundController
            ?.stopAllSounds();

        this.releaseAllActiveKeys();

        if (
            this.notes.length > 0
        ) {
            this.setState("stopped");
        } else {
            this.setState("empty");
        }
    }

    togglePauseResume() {
        if (this.state === "playing") {
            this.pause();
            return;
        }

        if (this.state === "paused") {
            this.resume();
        }
    }

    finishPlayback() {
        this.transport.stop();
        this.jumpingOrbController?.stop();
        this.transport.seconds = 0;

        this.keySoundController
            .stopAllSounds();

        this.releaseAllActiveKeys();

        this.setState("stopped");
    }

    releaseAllActiveKeys() {
        for (
            const key
            of this.keyHoldCounts.keys()
        ) {
            this.keyPressController
                .releaseKey(key);
        }

        this.keyHoldCounts.clear();
    }

    clearSchedule() {
        for (
            const eventId
            of this.scheduledEventIds
        ) {
            this.transport.clear(
                eventId
            );
        }

        this.scheduledEventIds = [];
    }

    addStateListener(listener) {
        if (
            typeof listener !==
            "function"
        ) {
            throw new TypeError(
                "State listener must be a function."
            );
        }

        this.stateListeners.add(
            listener
        );

        listener(
            this.getStatus()
        );

        return () => {
            this.stateListeners.delete(
                listener
            );
        };
    }

    getStatus() {
        return {
            state: this.state,
            fileName: this.fileName,
            duration: this.duration,
            currentTime:
                this.transport.seconds,
            noteCount:
                this.notes.length
        };
    }

    setState(state) {
        this.state = state;

        const status =
            this.getStatus();

        for (
            const listener
            of this.stateListeners
        ) {
            listener(status);
        }
    }

    destroy() {
        this.stop();
        this.clearSchedule();
        this.stateListeners.clear();
    }



    groupSimultaneousNotes(
        notes,
        tolerance = 0.01
    ) {
        const groups = [];
    
        for (const note of notes) {
            const previousGroup =
                groups[
                    groups.length - 1
                ];
    
            if (
                previousGroup &&
                Math.abs(
                    note.time -
                    previousGroup.time
                ) <= tolerance
            ) {
                previousGroup.notes.push(
                    note
                );
    
                continue;
            }
    
            groups.push({
                time: note.time,
                notes: [note]
            });
        }
    
        return groups;
    }
}