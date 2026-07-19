import * as THREE from "three";
import * as Tone from "tone";

export default class KeySoundController {
    constructor({
        renderer,
        camera,
        scene,
        flashColor = 0x7dd3fc,
        flashDuration = 180,
        noteDuration = "8n",
        onKeyTriggered = null
    })  {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        this.onKeyTriggered = onKeyTriggered;

        this.flashColor = new THREE.Color(flashColor);
        this.flashDuration = flashDuration;
        this.noteDuration = noteDuration;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.synth = new Tone.PolySynth(
            Tone.Synth
        ).toDestination();

        this.restoreTimers = new WeakMap();

        this.handlePointerDown =
            this.handlePointerDown.bind(this);

        this.renderer.domElement.addEventListener(
            "pointerdown",
            this.handlePointerDown
        );
    }

    updatePointer(event) {
        const rect =
            this.renderer.domElement.getBoundingClientRect();

        this.pointer.x =
            ((event.clientX - rect.left) /
                rect.width) *
                2 -
            1;

        this.pointer.y =
            -(
                (event.clientY - rect.top) /
                rect.height
            ) *
                2 +
            1;
    }

    findKeyObject(object) {
        let current = object;

        while (
            current &&
            current !== this.scene &&
            current.userData.note === undefined
        ) {
            current = current.parent;
        }

        if (
            !current ||
            current === this.scene ||
            current.userData.note === undefined
        ) {
            return null;
        }

        return current;
    }

    findKeyAtPointer(event) {
        this.updatePointer(event);

        this.raycaster.setFromCamera(
            this.pointer,
            this.camera
        );

        const intersections =
            this.raycaster.intersectObjects(
                this.scene.children,
                true
            );

        for (const intersection of intersections) {
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
            this.findKeyAtPointer(event);
    
        if (!key) {
            return;
        }
    
        await Tone.start();
    
        this.triggerKey(key, {
            duration: this.noteDuration,
            velocity: 0.8
        });
    
        if (
            typeof this.onKeyTriggered ===
            "function"
        ) {
            this.onKeyTriggered(key);
        }
    }

    playKey(key) {
        const note =
            key.userData.note;

        if (!note) {
            return;
        }

        this.synth.triggerAttackRelease(
            note,
            this.noteDuration
        );
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
            key.userData.originalColor === undefined
        ) {
            key.userData.originalColor =
                material.color.clone();
        }

        const existingTimer =
            this.restoreTimers.get(key);

        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        material.color.copy(
            this.flashColor
        );

        const timer = setTimeout(() => {
            const originalColor =
                key.userData.originalColor;

            if (originalColor) {
                material.color.copy(
                    originalColor
                );
            }

            this.restoreTimers.delete(key);
        }, this.flashDuration);

        this.restoreTimers.set(
            key,
            timer
        );
    }

    triggerKey(
        key,
        {
            duration = "8n",
            velocity = 0.8,
            time = undefined,
            flash = true
        } = {}
    ) {
        if (!key) {
            return;
        }
    
        const note = key.userData.note;
    
        if (!note) {
            console.warn(
                "Cannot play key without note metadata.",
                key
            );
    
            return;
        }
    
        this.synth.triggerAttackRelease(
            note,
            duration,
            time,
            THREE.MathUtils.clamp(
                velocity,
                0,
                1
            )
        );
    
        if (flash) {
            this.flashKey(key);
        }
    }
    stopAllSounds() {
        if (
            typeof this.synth.releaseAll ===
            "function"
        ) {
            this.synth.releaseAll();
        }
    }

    destroy() {
        this.renderer.domElement.removeEventListener(
            "pointerdown",
            this.handlePointerDown
        );

        this.synth.dispose();
    }
}