import * as THREE from "three";

export default class KeySoundController {
    constructor({
        renderer,
        camera,
        scene,
        pianoEngine,
        flashColor = 0x7dd3fc,
        flashDuration = 180,
        noteDuration = 500,
        onKeyTriggered = null
    }) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        this.pianoEngine = pianoEngine;

        this.onKeyTriggered = onKeyTriggered;

        this.flashColor =
            new THREE.Color(
                flashColor
            );

        this.flashDuration =
            flashDuration;

        /*
         * Temporary manual-click duration.
         *
         * Later we can switch to true
         * pointerdown / pointerup behavior.
         */
        this.noteDuration =
            noteDuration;

        this.raycaster =
            new THREE.Raycaster();

        this.pointer =
            new THREE.Vector2();

        this.restoreTimers =
            new WeakMap();

        this.noteOffTimers =
            new Map();

        this.handlePointerDown =
            this.handlePointerDown.bind(
                this
            );

        this.renderer.domElement
            .addEventListener(
                "pointerdown",
                this.handlePointerDown
            );
    }


    updatePointer(event) {
        const rect =
            this.renderer.domElement
                .getBoundingClientRect();

        this.pointer.x =
            ((event.clientX -
                rect.left) /
                rect.width) *
                2 -
            1;

        this.pointer.y =
            -(
                (event.clientY -
                    rect.top) /
                rect.height
            ) *
                2 +
            1;
    }


    findKeyObject(object) {
        let current =
            object;

        while (
            current &&
            current !== this.scene &&
            current.userData.note ===
                undefined
        ) {
            current =
                current.parent;
        }

        if (
            !current ||
            current === this.scene ||
            current.userData.note ===
                undefined
        ) {
            return null;
        }

        return current;
    }


    findKeyAtPointer(event) {
        this.updatePointer(
            event
        );

        this.raycaster
            .setFromCamera(
                this.pointer,
                this.camera
            );

        const intersections =
            this.raycaster
                .intersectObjects(
                    this.scene.children,
                    true
                );

        for (
            const intersection
            of intersections
        ) {
            const key =
                this.findKeyObject(
                    intersection.object
                );

            if (key) {
                return key;
            }
        }

        return null;
    }


    async handlePointerDown(event) {
        const key =
            this.findKeyAtPointer(
                event
            );

        if (!key) {
            return;
        }

        await this.triggerKey(
            
            key,
            {
                duration:
                    this.noteDuration,

                velocity:
                    0.8
            }

        
        );

        if (
            typeof this.onKeyTriggered ===
            "function"
        ) {
            this.onKeyTriggered(
                key
            );
        }
    }


    getMidiNumber(key) {
        const midiNumber =
            key.userData
                .midiNumber;

        if (
            typeof midiNumber ===
                "number"
        ) {
            return midiNumber;
        }

        console.warn(
            "Key is missing midiNumber metadata:",
            key
        );

        return null;
    }


    async playKey(
        key,
        velocity = 0.8
    ) {
        const midiNumber =
            this.getMidiNumber(
                key
            );

        if (
            midiNumber === null
        ) {
            return;
        }

        await this.pianoEngine
            .noteOn({
                midiNumber,
                velocity
            });
    }


    flashKey(key) {
        const material =
            key.material;

        if (
            !material ||
            !material.color
        ) {
            return;
        }

        if (
            key.userData
                .originalColor ===
            undefined
        ) {
            key.userData
                .originalColor =
                material.color.clone();
        }

        const existingTimer =
            this.restoreTimers
                .get(
                    key
                );

        if (existingTimer) {
            clearTimeout(
                existingTimer
            );
        }

        material.color.copy(
            this.flashColor
        );

        const timer =
            setTimeout(
                () => {
                    const originalColor =
                        key.userData
                            .originalColor;

                    if (
                        originalColor
                    ) {
                        material.color
                            .copy(
                                originalColor
                            );
                    }

                    this.restoreTimers
                        .delete(
                            key
                        );
                },
                this.flashDuration
            );

        this.restoreTimers
            .set(
                key,
                timer
            );
    }


    async triggerKey(
        key,
        {
            duration = 500,
            velocity = 0.8,
            flash = true
        } = {}
    ) {
        if (!key) {
            return;
        }

        const midiNumber =
            this.getMidiNumber(
                key
            );

        if (
            midiNumber === null
        ) {
            return;
        }

        try {
            await this.pianoEngine
                .noteOn({
                    midiNumber,
                    velocity
                });
        } catch (error) {
            console.error(
                "Piano note failed:",
                {
                    note:
                        key.userData.note,
        
                    midiNumber,
        
                    velocity,
        
                    error
                }
            );
        
            return;
        }

        if (flash) {
            this.flashKey(
                key
            );
        }

        /*
         * For now, emulate your old
         * triggerAttackRelease behavior.
         *
         * Later we'll replace this with
         * actual pointerup handling.
         */
        const existingTimer =
            this.noteOffTimers
                .get(
                    midiNumber
                );

        if (existingTimer) {
            clearTimeout(
                existingTimer
            );
        }

        const timer =
            setTimeout(
                () => {
                    this.pianoEngine
                        .noteOff({
                            midiNumber
                        });

                    this.noteOffTimers
                        .delete(
                            midiNumber
                        );
                },
                duration
            );

        this.noteOffTimers
            .set(
                midiNumber,
                timer
            );
    }


    stopAllSounds() {
        for (
            const timer
            of this.noteOffTimers.values()
        ) {
            clearTimeout(
                timer
            );
        }

        this.noteOffTimers.clear();

        this.pianoEngine
            ?.stopAll();
    }


    destroy() {
        this.renderer.domElement
            .removeEventListener(
                "pointerdown",
                this.handlePointerDown
            );

        this.stopAllSounds();
    }
}