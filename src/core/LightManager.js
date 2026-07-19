// import * as THREE from "three";

// export default class LightManager {
//     constructor(scene) {
//         const ambient =
//             new THREE.AmbientLight(
//                 0x8c93a8,
//                 0.7
//             );

//         scene.add(ambient);

//         const mainLight =
//             new THREE.DirectionalLight(
//                 0xffffff,
//                 2.6
//             );

//         mainLight.position.set(
//             12,
//             18,
//             10
//         );

//         mainLight.castShadow = true;

//         scene.add(mainLight);

//         const blueLight =
//             new THREE.PointLight(
//                 0x4169ff,
//                 16,
//                 45,
//                 2
//             );

//         blueLight.position.set(
//             -11,
//             7,
//             5
//         );

//         scene.add(blueLight);

//         const purpleLight =
//             new THREE.PointLight(
//                 0xa044ff,
//                 14,
//                 42,
//                 2
//             );

//         purpleLight.position.set(
//             7,
//             6,
//             -9
//         );

//         scene.add(purpleLight);

//         const pinkLight =
//             new THREE.PointLight(
//                 0xff3e98,
//                 11,
//                 38,
//                 2
//             );

//         pinkLight.position.set(
//             12,
//             5,
//             6
//         );

//         scene.add(pinkLight);
//     }
// }


import * as THREE from "three";

export default class LightManager {
    constructor(scene) {
        const ambient =
            new THREE.AmbientLight(
                0x8890a8,
                0.65
            );

        scene.add(ambient);

        const mainLight =
            new THREE.DirectionalLight(
                0xffffff,
                3.2
            );

        mainLight.position.set(
            10,
            18,
            12
        );

        scene.add(mainLight);

        const blueLight =
            new THREE.PointLight(
                0x3f7cff,
                20,
                50,
                2
            );

        blueLight.position.set(
            -10,
            7,
            7
        );

        scene.add(blueLight);

        const purpleLight =
            new THREE.PointLight(
                0x9b4dff,
                16,
                45,
                2
            );

        purpleLight.position.set(
            8,
            6,
            -10
        );

        scene.add(purpleLight);

        const pinkLight =
            new THREE.PointLight(
                0xff4b9b,
                12,
                40,
                2
            );

        pinkLight.position.set(
            14,
            5,
            6
        );

        scene.add(pinkLight);
    }
}