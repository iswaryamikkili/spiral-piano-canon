import * as THREE from "three";

export default class MidiJumpingOrbController {
    constructor({
        scene,
        keyboard,
        color = 0x38bdf8,
        coreRadius = 0.24,
        haloRadius = 0.48,
        jumpHeight = 3.2,
        minimumJumpDuration = 0.08,
        landingHeight = 0.35
    }) {
        if (!scene || !keyboard) {
            throw new Error(
                "MidiJumpingOrbController requires scene and keyboard."
            );
        }

        this.scene = scene;
        this.keyboard = keyboard;

        this.color = new THREE.Color(color);

        this.coreRadius = coreRadius;
        this.haloRadius = haloRadius;
        this.jumpHeight = jumpHeight;
        this.minimumJumpDuration = minimumJumpDuration;
        this.landingHeight = landingHeight;

        this.sequence = [];
        this.currentJump = null;
        this.currentSequenceIndex = -1;

        this.isPlaying = false;
        this.isPaused = false;

        this.group = new THREE.Group();
        this.group.name = "MidiJumpingOrbEffects";
        this.scene.add(this.group);

        this.mainOrb = this.createMainOrb();
        this.mainOrb.visible = false;
        this.group.add(this.mainOrb);

        this.echoes = [];

        this.unitSphereGeometry =
            new THREE.SphereGeometry(1, 24, 24);
    }

    createMainOrb() {
        const orb = new THREE.Group();

        const coreGeometry =
            new THREE.SphereGeometry(1, 28, 28);

        const haloGeometry =
            new THREE.SphereGeometry(1, 28, 28);

        const coreMaterial =
            new THREE.MeshBasicMaterial({
                color: this.color.clone(),
                transparent: true,
                opacity: 1,
                depthWrite: false
            });

        const haloMaterial =
            new THREE.MeshBasicMaterial({
                color: this.color.clone(),
                transparent: true,
                opacity: 0.24,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

        const core = new THREE.Mesh(
            coreGeometry,
            coreMaterial
        );

        const halo = new THREE.Mesh(
            haloGeometry,
            haloMaterial
        );

        core.scale.setScalar(this.coreRadius);
        halo.scale.setScalar(this.haloRadius);

        orb.add(core);
        orb.add(halo);

        orb.userData.core = core;
        orb.userData.halo = halo;
        orb.userData.coreMaterial = coreMaterial;
        orb.userData.haloMaterial = haloMaterial;
        orb.userData.coreGeometry = coreGeometry;
        orb.userData.haloGeometry = haloGeometry;

        return orb;
    }

    /**
     * Receives grouped MIDI events:
     *
     * [
     *   {
     *     time: 0,
     *     notes: [{ midi: 60 }, { midi: 64 }, { midi: 67 }]
     *   }
     * ]
     */
    setSequence(groups) {
        this.stop();

        this.sequence = groups
            .map((group) => {
                const notes = group.notes
                    .map((note) => {
                        const key =
                            this.keyboard.getKeyByMidiNumber(
                                note.midi
                            );

                        if (!key) {
                            return null;
                        }

                        return {
                            ...note,
                            key
                        };
                    })
                    .filter(Boolean);

                if (notes.length === 0) {
                    return null;
                }

                /*
                 * Highest note becomes the melody note.
                 */
                const mainNote =
                    notes.reduce((highest, note) =>
                        note.midi > highest.midi
                            ? note
                            : highest
                    );

                const echoNotes =
                    notes.filter(
                        (note) => note !== mainNote
                    );

                return {
                    time: group.time,
                    notes,
                    mainNote,
                    echoNotes
                };
            })
            .filter(Boolean);
    }

    start() {
        if (this.sequence.length === 0) {
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;

        this.currentSequenceIndex = 0;

        const firstGroup = this.sequence[0];
        const firstPosition =
            this.getKeyPosition(
                firstGroup.mainNote.key
            );

        this.mainOrb.position.copy(firstPosition);
        this.mainOrb.visible = true;

        this.spawnEchoes(firstGroup.echoNotes);

        if (this.sequence.length > 1) {
            this.prepareJump(
                0,
                1,
                firstGroup.time
            );
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        if (!this.mainOrb.visible) {
            return;
        }

        this.isPaused = false;
        this.isPlaying = true;
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;

        this.currentJump = null;
        this.currentSequenceIndex = -1;

        if (this.mainOrb) {
            this.mainOrb.visible = false;
        }

        this.clearEchoes();
    }

    /**
     * Called by MidiPlaybackController when a grouped
     * MIDI event starts.
     */
    triggerGroup(groupIndex, transportTime) {
        if (
            groupIndex < 0 ||
            groupIndex >= this.sequence.length
        ) {
            return;
        }

        const group =
            this.sequence[groupIndex];

        this.spawnEchoes(group.echoNotes);

        if (!this.mainOrb.visible) {
            this.mainOrb.position.copy(
                this.getKeyPosition(
                    group.mainNote.key
                )
            );

            this.mainOrb.visible = true;
        }

        this.currentSequenceIndex =
            groupIndex;

        const nextIndex =
            groupIndex + 1;

        if (nextIndex >= this.sequence.length) {
            this.currentJump = null;
            return;
        }

        this.prepareJump(
            groupIndex,
            nextIndex,
            transportTime
        );
    }

    prepareJump(
        fromIndex,
        toIndex,
        currentTransportTime
    ) {
        const fromGroup =
            this.sequence[fromIndex];

        const toGroup =
            this.sequence[toIndex];

        const startPosition =
            this.mainOrb.position.clone();

        const endPosition =
            this.getKeyPosition(
                toGroup.mainNote.key
            );

        const timeDifference =
            Math.max(
                toGroup.time -
                    fromGroup.time,
                this.minimumJumpDuration
            );

        const horizontalDistance =
            new THREE.Vector2(
                endPosition.x - startPosition.x,
                endPosition.z - startPosition.z
            ).length();

        const adaptiveHeight =
            this.jumpHeight +
            Math.min(
                horizontalDistance * 0.16,
                3
            );

        this.currentJump = {
            startPosition,
            endPosition,
            startTransportTime:
                currentTransportTime,
            duration: timeDifference,
            jumpHeight: adaptiveHeight,
            targetIndex: toIndex
        };
    }

    getKeyPosition(key) {
        const position =
            new THREE.Vector3();

        if (
            key.userData.effectPosition
            instanceof THREE.Vector3
        ) {
            position.copy(
                key.userData.effectPosition
            );

            /*
             * The stored position is world-space in our
             * current keyboard builder.
             */
            position.y =
                key.position.y +
                this.getKeyHeight(key) +
                this.landingHeight;

            return position;
        }

        key.getWorldPosition(position);

        position.y +=
            this.getKeyHeight(key) +
            this.landingHeight;

        return position;
    }

    getKeyHeight(key) {
        const box =
            new THREE.Box3().setFromObject(key);

        if (box.isEmpty()) {
            return 0.3;
        }

        return (
            box.max.y -
            box.min.y
        ) / 2;
    }

    spawnEchoes(notes) {
        for (const note of notes) {
            const position =
                this.getKeyPosition(note.key);

            const material =
                new THREE.MeshBasicMaterial({
                    color: this.color.clone(),
                    transparent: true,
                    opacity: 0.65,
                    depthWrite: false,
                    blending:
                        THREE.AdditiveBlending
                });

            const mesh =
                new THREE.Mesh(
                    this.unitSphereGeometry,
                    material
                );

            const velocityScale =
                THREE.MathUtils.lerp(
                    0.14,
                    0.25,
                    note.velocity ?? 0.7
                );

            mesh.scale.setScalar(
                velocityScale
            );

            mesh.position.copy(position);

            this.group.add(mesh);

            this.echoes.push({
                mesh,
                material,
                age: 0,
                lifetime: 0.34,
                initialScale:
                    velocityScale
            });
        }
    }

    updateEchoes(deltaTime) {
        for (
            let index =
                this.echoes.length - 1;
            index >= 0;
            index--
        ) {
            const echo =
                this.echoes[index];

            echo.age += deltaTime;

            const progress =
                THREE.MathUtils.clamp(
                    echo.age /
                        echo.lifetime,
                    0,
                    1
                );

            const pulse =
                THREE.MathUtils.lerp(
                    1,
                    1.8,
                    progress
                );

            echo.mesh.scale.setScalar(
                echo.initialScale *
                    pulse
            );

            echo.material.opacity =
                0.65 *
                (1 - progress);

            echo.mesh.position.y +=
                deltaTime * 0.35;

            if (progress >= 1) {
                this.removeEcho(index);
            }
        }
    }

    removeEcho(index) {
        const echo =
            this.echoes[index];

        if (!echo) {
            return;
        }

        this.group.remove(
            echo.mesh
        );

        echo.material.dispose();

        this.echoes.splice(
            index,
            1
        );
    }

    clearEchoes() {
        for (
            let index =
                this.echoes.length - 1;
            index >= 0;
            index--
        ) {
            this.removeEcho(index);
        }
    }

    update(deltaTime, transportTime) {
        this.updateEchoes(deltaTime);

        if (
            !this.isPlaying ||
            this.isPaused ||
            !this.currentJump ||
            !this.mainOrb.visible
        ) {
            return;
        }

        const elapsed =
            transportTime -
            this.currentJump
                .startTransportTime;

        const progress =
            THREE.MathUtils.clamp(
                elapsed /
                    this.currentJump.duration,
                0,
                1
            );

        const position =
            new THREE.Vector3()
                .lerpVectors(
                    this.currentJump
                        .startPosition,
                    this.currentJump
                        .endPosition,
                    progress
                );

        /*
         * Parabolic jump:
         * 0 at both ends, maximum at progress 0.5.
         */
        const arcHeight =
            4 *
            this.currentJump.jumpHeight *
            progress *
            (1 - progress);

        position.y += arcHeight;

        this.mainOrb.position.copy(
            position
        );

        const halo =
            this.mainOrb.userData.halo;

        halo.scale.setScalar(
            this.haloRadius *
            (
                1 +
                Math.sin(
                    transportTime * 12
                ) *
                    0.08
            )
        );

        if (progress >= 1) {
            this.mainOrb.position.copy(
                this.currentJump
                    .endPosition
            );

            this.currentJump = null;
        }
    }

    setCoreRadius(value) {
        const radius = Number(value);

        if (
            !Number.isFinite(radius) ||
            radius <= 0
        ) {
            return;
        }

        this.coreRadius = radius;

        this.mainOrb.userData
            .core.scale
            .setScalar(radius);
    }

    setHaloRadius(value) {
        const radius = Number(value);

        if (
            !Number.isFinite(radius) ||
            radius <= 0
        ) {
            return;
        }

        this.haloRadius = radius;

        this.mainOrb.userData
            .halo.scale
            .setScalar(radius);
    }

    destroy() {
        this.stop();

        this.unitSphereGeometry.dispose();

        this.mainOrb.userData
            .coreMaterial.dispose();

        this.mainOrb.userData
            .haloMaterial.dispose();

        this.mainOrb.userData
            .coreGeometry.dispose();

        this.mainOrb.userData
            .haloGeometry.dispose();

        this.scene.remove(this.group);
    }
}