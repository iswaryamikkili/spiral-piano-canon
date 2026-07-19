import * as THREE from "three";
import { WORLD } from "../utils/Constants";

export default class SceneManager {

    constructor() {

        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(WORLD.BACKGROUND);

    }

    getScene() {
        return this.scene;
    }

}