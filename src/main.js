import "./styles/style.css";
import * as THREE from "three";
import RendererManager from "./core/RendererManager";
import CameraManager from "./core/CameraManager";
import SceneManager from "./core/SceneManager";
import LightManager from "./core/LightManager";

import { createFullKeyboardBlueprint } from "./piano/PianoBlueprint";
import SpiralPath from "./piano/SpiralPath";
import KeyboardBuilder from "./piano/KeyboardBuilder";
import KeyPressController from "./interaction/KeyPressController";
import KeySoundController from "./interaction/KeySoundController";
import RisingNoteOrbController from "./effects/RisingNoteOrbController";

import MidiJumpingOrbController
    from "./effects/MidiJumpingOrbController";

import MidiPlaybackController
    from "./midi/MidiPlaybackController";

import MidiSidebarControls
    from "./ui/MidiSidebarControls";
import EffectsSidebar from "./ui/EffectsSidebar";
const rendererManager = new RendererManager();
const renderer = rendererManager.getRenderer();

const sceneManager = new SceneManager();
const scene = sceneManager.getScene();

const cameraManager = new CameraManager();
const camera = cameraManager.getCamera();
const clock = new THREE.Clock();
new LightManager(scene);

const blueprint = createFullKeyboardBlueprint();
const path = new SpiralPath();

const keyboard = new KeyboardBuilder(
    scene,
    blueprint,
    path
);

keyboard.build();

const jumpingOrbController =
    new MidiJumpingOrbController({
        scene,
        keyboard,
        color: 0x38bdf8,
        coreRadius: 0.24,
        haloRadius: 0.48,
        jumpHeight: 3.2
    });

const keyPressController =
    new KeyPressController({
        renderer,
        camera,
        scene,
        whitePressDepth: 0.12,
        blackPressDepth: 0.08,
        pressDuration: 80,
        releaseDuration: 140
    });

    const orbController =
    new RisingNoteOrbController({
        scene,
        color: 0x38bdf8,
        lifetime: 1.1,
        riseSpeed: 2.8,
        coreRadius: 0.12,
        haloRadius: 0.28
    });

    new EffectsSidebar(
        orbController
    );
    const keySoundController =
    new KeySoundController({
        renderer,
        camera,
        scene,
        flashColor: 0x7dd3fc,
        flashDuration: 180,
        noteDuration: "8n",

        onKeyTriggered: (key) => {
            orbController.spawn(key);
        }
    });

    
    const midiController =
    new MidiPlaybackController({
        keyboard,
        keyPressController,
        keySoundController,
        orbController,
        jumpingOrbController
    });
    
    const sidebarContainer =
        document.getElementById(
            "effectsSidebar"
        );
    
    new MidiSidebarControls({
        container: sidebarContainer,
        midiController
    });

const testPoints = [
    0,
    0.1,
    0.25,
    0.5,
    0.75,
    1
];
const hoverRaycaster = new THREE.Raycaster();
const hoverMouse = new THREE.Vector2();

let hoveredKey = null;

const tooltip = document.createElement("div");

tooltip.style.position = "fixed";
tooltip.style.pointerEvents = "none";
tooltip.style.display = "none";
tooltip.style.padding = "8px 11px";
tooltip.style.borderRadius = "8px";
tooltip.style.background = "rgba(5, 7, 14, 0.9)";
tooltip.style.border = "1px solid rgba(255, 255, 255, 0.18)";
tooltip.style.color = "#ffffff";
tooltip.style.fontFamily = "Arial, sans-serif";
tooltip.style.fontSize = "13px";
tooltip.style.lineHeight = "1.4";
tooltip.style.zIndex = "1000";
tooltip.style.backdropFilter = "blur(6px)";
tooltip.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.35)";
tooltip.style.transform = "translate(14px, 14px)";

document.body.appendChild(tooltip);
renderer.domElement.addEventListener("mousemove", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();

    hoverMouse.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

    hoverMouse.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

    hoverRaycaster.setFromCamera(hoverMouse, camera);

    const intersections =
        hoverRaycaster.intersectObjects(
            scene.children,
            true
        );

    if (intersections.length === 0) {
        hoveredKey = null;
        tooltip.style.display = "none";
        renderer.domElement.style.cursor = "default";
        return;
    }

    let object = intersections[0].object;

    while (
        object &&
        object !== scene &&
        object.userData.note === undefined
    ) {
        object = object.parent;
    }

    if (
        !object ||
        object === scene ||
        object.userData.note === undefined
    ) {
        hoveredKey = null;
        tooltip.style.display = "none";
        renderer.domElement.style.cursor = "default";
        return;
    }

    hoveredKey = object;

    const note = object.userData.note;
    const midiNumber = object.userData.midiNumber;

    tooltip.innerHTML = `
        <strong>${note}</strong><br>
        MIDI: ${midiNumber}
    `;

    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
    tooltip.style.display = "block";

    renderer.domElement.style.cursor = "pointer";
});


renderer.domElement.addEventListener(
    "mouseleave",
    () => {
        hoveredKey = null;
        tooltip.style.display = "none";
        renderer.domElement.style.cursor = "default";
    }
);
for (const progress of testPoints) {
    const frame =
        path.getFrameAtProgress(progress);

    console.log({
        progress,
        theta: frame.theta,
        curvature: frame.curvature,
        curvatureRadius:
            frame.curvatureRadius,
        position: frame.position
    });
}


import * as Tone from "tone";

const transport =
    typeof Tone.getTransport ===
    "function"
        ? Tone.getTransport()
        : Tone.Transport;
        function animate(currentTime) {
            requestAnimationFrame(animate);
        
            const deltaTime =
                Math.min(
                    clock.getDelta(),
                    0.05
                );
        
            keyPressController.update(
                currentTime
            );
        
            orbController.update(
                deltaTime
            );
        
            jumpingOrbController.update(
                deltaTime,
                transport.seconds
            );
        
            renderer.render(
                scene,
                camera
            );
        }
        
        requestAnimationFrame(animate);