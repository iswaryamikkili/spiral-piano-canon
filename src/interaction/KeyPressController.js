import * as THREE from "three";

export default class KeyPressController {
    constructor({
        renderer,
        camera,
        scene,
        whitePressDepth = 0.12,
        blackPressDepth = 0.08,
        pressDuration = 80,
        releaseDuration = 140
    }) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        this.whitePressDepth = whitePressDepth;
        this.blackPressDepth = blackPressDepth;

        this.pressDuration = pressDuration;
        this.releaseDuration = releaseDuration;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        this.animations = new Map();
        this.pressedKey = null;

        this.handlePointerDown =
            this.handlePointerDown.bind(this);

        this.handlePointerUp =
            this.handlePointerUp.bind(this);

        this.renderer.domElement.addEventListener(
            "pointerdown",
            this.handlePointerDown
        );

        this.renderer.domElement.addEventListener(
            "pointerup",
            this.handlePointerUp
        );

        this.renderer.domElement.addEventListener(
            "pointercancel",
            this.handlePointerUp
        );

        this.renderer.domElement.addEventListener(
            "pointerleave",
            this.handlePointerUp
        );

        window.addEventListener(
            "pointerup",
            this.handlePointerUp
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

    handlePointerDown(event) {
        const key =
            this.findKeyAtPointer(event);

        if (!key) {
            return;
        }

        if (
            this.pressedKey &&
            this.pressedKey !== key
        ) {
            this.releaseKey(
                this.pressedKey
            );
        }

        this.pressedKey = key;

        this.pressKey(key);

        try {
            this.renderer.domElement
                .setPointerCapture(
                    event.pointerId
                );
        } catch {
            // Pointer capture may be unavailable
            // in some browser situations.
        }
    }

    handlePointerUp() {
        if (!this.pressedKey) {
            return;
        }

        this.releaseKey(
            this.pressedKey
        );

        this.pressedKey = null;
    }

    pressKey(key) {
        this.ensureOriginalPosition(key);

        const isBlack =
            key.userData.type === "black";

        const pressDepth =
            isBlack
                ? this.blackPressDepth
                : this.whitePressDepth;

        this.animateTo(
            key,
            key.userData.originalY -
                pressDepth,
            this.pressDuration
        );
    }

    releaseKey(key) {
        if (
            key.userData.originalY === undefined
        ) {
            return;
        }

        this.animateTo(
            key,
            key.userData.originalY,
            this.releaseDuration
        );
    }

    ensureOriginalPosition(key) {
        if (
            key.userData.originalY !== undefined
        ) {
            return;
        }

        key.userData.originalY =
            key.position.y;
    }

    animateTo(key, targetY, duration) {
        this.animations.set(key, {
            fromY: key.position.y,
            targetY,
            startTime: performance.now(),
            duration
        });
    }

    easeOutCubic(progress) {
        return (
            1 -
            Math.pow(1 - progress, 3)
        );
    }

    update(currentTime) {
        for (
            const [key, animation]
            of this.animations
        ) {
            const elapsed =
                currentTime -
                animation.startTime;

            const progress =
                Math.min(
                    elapsed /
                        animation.duration,
                    1
                );

            const eased =
                this.easeOutCubic(
                    progress
                );

            key.position.y =
                THREE.MathUtils.lerp(
                    animation.fromY,
                    animation.targetY,
                    eased
                );

            if (progress >= 1) {
                key.position.y =
                    animation.targetY;

                this.animations.delete(key);
            }
        }
    }

    destroy() {
        this.renderer.domElement.removeEventListener(
            "pointerdown",
            this.handlePointerDown
        );

        this.renderer.domElement.removeEventListener(
            "pointerup",
            this.handlePointerUp
        );

        this.renderer.domElement.removeEventListener(
            "pointercancel",
            this.handlePointerUp
        );

        this.renderer.domElement.removeEventListener(
            "pointerleave",
            this.handlePointerUp
        );

        window.removeEventListener(
            "pointerup",
            this.handlePointerUp
        );

        this.animations.clear();
        this.pressedKey = null;
    }
}