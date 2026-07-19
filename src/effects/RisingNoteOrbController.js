import * as THREE from "three";

export default class RisingNoteOrbController {
    constructor({
        scene,
        color = 0x38bdf8,
        lifetime = 1.1,
        riseSpeed = 2.8,
        coreRadius = 0.12,
        haloRadius = 0.28
    }) {
        if (!scene) {
            throw new Error(
                "RisingNoteOrbController requires a Three.js scene."
            );
        }

        this.scene = scene;

        this.color = new THREE.Color(color);

        this.lifetime = lifetime;
        this.riseSpeed = riseSpeed;

        /*
         * These values are now visual scale values.
         * The reusable sphere geometries have radius 1.
         */
        this.coreRadius = coreRadius;
        this.haloRadius = haloRadius;

        this.activeOrbs = [];

        /*
         * Unit-size reusable geometries.
         * Actual orb size is controlled with mesh.scale.
         */
        this.coreGeometry = new THREE.SphereGeometry(
            1,
            24,
            24
        );

        this.haloGeometry = new THREE.SphereGeometry(
            1,
            24,
            24
        );

        this.effectsGroup = new THREE.Group();
        this.effectsGroup.name = "RisingNoteOrbs";

        this.scene.add(this.effectsGroup);
    }

    spawn(key) {
        if (!key) {
            return;
        }

        const spawnPosition =
            this.getSpawnPosition(key);

        const orbGroup = new THREE.Group();

        const coreMaterial =
            new THREE.MeshBasicMaterial({
                color: this.color.clone(),
                transparent: true,
                opacity: 1,
                depthWrite: false
            });

        const core = new THREE.Mesh(
            this.coreGeometry,
            coreMaterial
        );

        const haloMaterial =
            new THREE.MeshBasicMaterial({
                color: this.color.clone(),
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

        const halo = new THREE.Mesh(
            this.haloGeometry,
            haloMaterial
        );

        /*
         * Core and halo are sized independently.
         */
        core.scale.setScalar(this.coreRadius);
        halo.scale.setScalar(this.haloRadius);

        orbGroup.add(core);
        orbGroup.add(halo);

        orbGroup.position.copy(spawnPosition);

        this.effectsGroup.add(orbGroup);

        this.activeOrbs.push({
            group: orbGroup,
            core,
            halo,

            coreMaterial,
            haloMaterial,

            age: 0,
            lifetime: this.lifetime,

            velocity: new THREE.Vector3(
                0,
                this.riseSpeed,
                0
            ),

            /*
             * Save the current slider values with this orb.
             * Existing orbs keep their original size.
             * Newly spawned orbs use the latest sidebar values.
             */
            coreSize: this.coreRadius,
            haloSize: this.haloRadius,

            initialGrowth: 0.7,
            finalGrowth: 1.35
        });
    }

    getSpawnPosition(key) {
        /*
         * Prefer the geometry-generated effect position.
         */
        if (
            key.userData.effectPosition
            instanceof THREE.Vector3
        ) {
            const position =
                key.userData.effectPosition.clone();

            position.y =
                key.position.y +
                this.getKeyTopOffset(key) +
                0.14;

            return position;
        }

        /*
         * Fallback to the key's world position.
         */
        const fallback = new THREE.Vector3();

        key.getWorldPosition(fallback);

        fallback.y +=
            this.getKeyTopOffset(key) +
            0.14;

        return fallback;
    }

    getKeyTopOffset(key) {
        const box = new THREE.Box3().setFromObject(key);

        if (box.isEmpty()) {
            return 0.3;
        }

        const size = new THREE.Vector3();
        box.getSize(size);

        return size.y / 2;
    }

    update(deltaTime) {
        if (
            !Number.isFinite(deltaTime) ||
            deltaTime <= 0
        ) {
            return;
        }

        for (
            let index = this.activeOrbs.length - 1;
            index >= 0;
            index--
        ) {
            const orb = this.activeOrbs[index];

            orb.age += deltaTime;

            const progress =
                THREE.MathUtils.clamp(
                    orb.age / orb.lifetime,
                    0,
                    1
                );

            orb.group.position.addScaledVector(
                orb.velocity,
                deltaTime
            );

            /*
             * Gradually reduce upward speed.
             */
            orb.velocity.y *= Math.pow(
                0.35,
                deltaTime
            );

            /*
             * Both elements grow while rising,
             * but they retain independent base sizes.
             */
            const growth =
                THREE.MathUtils.lerp(
                    orb.initialGrowth,
                    orb.finalGrowth,
                    this.easeOutCubic(progress)
                );

            orb.core.scale.setScalar(
                orb.coreSize * growth
            );

            /*
             * The halo also has a small pulse.
             */
            const pulse =
                1 +
                Math.sin(orb.age * 10) *
                    0.08;

            orb.halo.scale.setScalar(
                orb.haloSize *
                    growth *
                    pulse
            );

            /*
             * Stay visible at first, then fade.
             */
            const fade =
                1 -
                THREE.MathUtils.smoothstep(
                    progress,
                    0.35,
                    1
                );

            orb.coreMaterial.opacity = fade;
            orb.haloMaterial.opacity =
                0.22 * fade;

            if (progress >= 1) {
                this.removeOrb(index);
            }
        }
    }

    setCoreRadius(value) {
        const number = Number(value);
    
        if (!Number.isFinite(number) || number <= 0) {
            return;
        }
    
        this.coreRadius = number;
    
        for (const orb of this.activeOrbs) {
            orb.coreSize = number;
        }
    }
    
    setHaloRadius(value) {
        const number = Number(value);
    
        if (!Number.isFinite(number) || number <= 0) {
            return;
        }
    
        this.haloRadius = number;
    
        for (const orb of this.activeOrbs) {
            orb.haloSize = number;
        }
    }

    setColor(value) {
        try {
            this.color.set(value);
        } catch (error) {
            console.warn(
                "Invalid orb color:",
                value,
                error
            );
        }
    }

    setRiseSpeed(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return;
        }

        this.riseSpeed = number;
    }

    setLifetime(value) {
        const number = Number(value);

        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {
            return;
        }

        this.lifetime = number;
    }

    easeOutCubic(value) {
        return 1 - Math.pow(1 - value, 3);
    }

    removeOrb(index) {
        const orb = this.activeOrbs[index];

        if (!orb) {
            return;
        }

        this.effectsGroup.remove(orb.group);

        orb.coreMaterial.dispose();
        orb.haloMaterial.dispose();

        this.activeOrbs.splice(index, 1);
    }

    destroy() {
        for (
            let index = this.activeOrbs.length - 1;
            index >= 0;
            index--
        ) {
            this.removeOrb(index);
        }

        this.coreGeometry.dispose();
        this.haloGeometry.dispose();

        this.scene.remove(this.effectsGroup);
    }
}