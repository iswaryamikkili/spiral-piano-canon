import * as THREE from "three";
import { WHITE_KEY, BLACK_KEY } from "../utils/Constants";
import { Materials } from "./Materials";

export default class PianoKey {
    constructor(type = "white") {
        this.type = type;
        this.mesh = this.createMesh();
    }

    createMesh() {
        const dimensions = this.type === "white" ? WHITE_KEY : BLACK_KEY;
        const material = this.type === "white"
            ? Materials.whiteKey
            : Materials.blackKey;

            const geometry = new THREE.BoxGeometry(
                dimensions.WIDTH,
                dimensions.HEIGHT,
                dimensions.LENGTH,
                2,
                1,
                8
            );
        const mesh = new THREE.Mesh(geometry, material);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    getMesh() {
        return this.mesh;
    }
}