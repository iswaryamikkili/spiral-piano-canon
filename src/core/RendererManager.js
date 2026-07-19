import * as THREE from "three";

export default class RendererManager {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.renderer.outputColorSpace =
    THREE.SRGBColorSpace;

this.renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

this.renderer.toneMappingExposure =
    1.15;

    this.renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    this.renderer.shadowMap.enabled = true;
this.renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

        document.body.appendChild(this.renderer.domElement);
    }

    getRenderer() {
        return this.renderer;
    }

    resize(width, height) {
        this.renderer.setSize(width, height);
    }
}