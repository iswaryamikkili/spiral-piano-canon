import * as THREE from "three";

export const Materials = {
    whiteKey: new THREE.MeshPhysicalMaterial({
        color: 0xf7f7f3,

        roughness: 0.16,
        metalness: 0.01,

        clearcoat: 1,
        clearcoatRoughness: 0.07,

        reflectivity: 0.8,

        sheen: 0.08,
        sheenColor: new THREE.Color(0xffffff),
        sheenRoughness: 0.25
    }),

    blackKey: new THREE.MeshPhysicalMaterial({
        color: 0x050609,

        roughness: 0.1,
        metalness: 0.16,

        clearcoat: 1,
        clearcoatRoughness: 0.045,

        reflectivity: 1,

        sheen: 0.12,
        sheenColor: new THREE.Color(0x5b67a8),
        sheenRoughness: 0.2
    })
};