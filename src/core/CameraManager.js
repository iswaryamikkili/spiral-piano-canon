import * as THREE from "three";
import { CAMERA } from "../utils/Constants";

export default class CameraManager {

    constructor() {

        this.camera = new THREE.PerspectiveCamera(
            CAMERA.FOV,
            window.innerWidth / window.innerHeight,
            CAMERA.NEAR,
            CAMERA.FAR
        );

        this.camera.position.set(
            CAMERA.POSITION.x,
            CAMERA.POSITION.y,
            CAMERA.POSITION.z
        );

        this.camera.lookAt(0, 0, 0);
    }

    getCamera() {
        return this.camera;
    }

    resize(width, height) {

        this.camera.aspect = width / height;

        this.camera.updateProjectionMatrix();

    }

}