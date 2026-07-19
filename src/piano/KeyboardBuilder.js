import * as THREE from "three";
import { Materials } from "./Materials";
import {
    WHITE_KEY,
    BLACK_KEY
} from "../utils/Constants";

import WhiteKeyGeometry from "./WhiteKeyGeometry";
import BlackKeyGeometry from "./BlackKeyGeometry";
export default class KeyboardBuilder {
    constructor(scene, blueprint, path) {
        this.scene = scene;
        this.blueprint = blueprint;
        this.path = path;

        this.whiteKeyCount = 0;
        this.whiteKeyMeshes = [];
        this.keysByMidiNumber = new Map();
    }

    build() {
        this.blueprint.forEach((keyData) => {
            if (keyData.type === "white") {
                this.addWhiteKey(keyData);
            } else {
                this.addBlackKey(keyData);
            }
        });
    }

    addWhiteKey(keyData) {
        const result = WhiteKeyGeometry.create(
            this.path,
            this.whiteKeyCount
        );

        const mesh = new THREE.Mesh(
            result.geometry,
            Materials.whiteKey.clone()
        );

        mesh.position.copy(result.position);
        mesh.userData.effectPosition =
    result.frame.position.clone();

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            ...keyData,
            whiteIndex: this.whiteKeyCount,
            effectPosition: result.frame.position.clone()
        };
        mesh.castShadow = true;
mesh.receiveShadow = true;
this.keysByMidiNumber.set(
    keyData.midiNumber,
    mesh
);

        this.scene.add(mesh);
        this.whiteKeyMeshes.push(mesh);

        this.whiteKeyCount++;
    }


addBlackKey(keyData) {
    /*
     * At this point, whiteKeyCount represents the
     * next white key. Therefore, it is also the
     * boundary where this black key belongs.
     */
    const boundaryIndex =
        this.whiteKeyCount;

    const result =
        BlackKeyGeometry.create(
            this.path,
            boundaryIndex
        );

    const mesh =
        new THREE.Mesh(
            result.geometry,
            Materials.blackKey.clone()
        );

    mesh.position.copy(result.position);
    mesh.castShadow = true;
mesh.receiveShadow = true;

    /*
     * White key top:
     * WHITE_KEY.HEIGHT / 2
     *
     * Black key bottom should sit slightly above it.
     */
    mesh.position.y =
    WHITE_KEY.HEIGHT / 2 +
    BLACK_KEY.HEIGHT / 2 +
    0.015;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.userData = {
        ...keyData,
        boundaryIndex,
        boundaryProgress:
            result.boundaryProgress,
        effectPosition:
            result.frame.position.clone()
    };
    this.keysByMidiNumber.set(
        keyData.midiNumber,
        mesh
    );
    

    this.scene.add(mesh);
}

getKeyByMidiNumber(midiNumber) {
    return (
        this.keysByMidiNumber.get(
            midiNumber
        ) ?? null
    );
}
}
