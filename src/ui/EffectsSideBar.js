// export default class EffectsSidebar {

//     constructor(orbController) {

//         this.orbController = orbController;

//         this.createSidebar();

//     }

//     createSidebar() {

//         const sidebar =
//             document.createElement("div");

//         sidebar.id = "effectsSidebar";

//         document.body.appendChild(sidebar);

//         sidebar.innerHTML = `

//             <h2>Effects</h2>

//             <label>

//                 Core Size

//                 <input
//                     id="coreSlider"
//                     type="range"
//                     min="0.5"
//                     max="8"
//                     step="0.1"
//                     value="1"
//                 >

//             </label>

//             <span id="coreValue">

//                 1.0

//             </span>

//             <br><br>

//             <label>

//                 Halo Size

//                 <input
//                     id="haloSlider"
//                     type="range"
//                     min="0.5"
//                     max="8"
//                     step="0.1"
//                     value="1"
//                 >

//             </label>

//             <span id="haloValue">

//                 1.0

//             </span>

//         `;

//         const coreSlider =
//             document.getElementById(
//                 "coreSlider"
//             );

//         const haloSlider =
//             document.getElementById(
//                 "haloSlider"
//             );

//         const coreValue =
//             document.getElementById(
//                 "coreValue"
//             );

//         const haloValue =
//             document.getElementById(
//                 "haloValue"
//             );

//             coreSlider.addEventListener(
//                 "input",
//                 () => {
//                     const value =
//                         Number(coreSlider.value);
            
//                     coreValue.textContent =
//                         value.toFixed(1);
            
//                     this.orbController
//                         .setCoreRadius(value);
            
//                     console.log(
//                         "Core size:",
//                         value
//                     );
//                 }
//             );
//             haloSlider.addEventListener(
//                 "input",
//                 () => {
//                     const value =
//                         Number(haloSlider.value);
            
//                     haloValue.textContent =
//                         value.toFixed(1);
            
//                     this.orbController
//                         .setHaloRadius(value);
            
//                     console.log(
//                         "Halo size:",
//                         value
//                     );
//                 }
//             );
//     }

// }
export default class EffectsSidebar {
    constructor(orbController) {
        this.orbController = orbController;
        this.createSidebar();
    }

    createSidebar() {
        const sidebar = document.createElement("div");

        sidebar.id = "effectsSidebar";
        document.body.appendChild(sidebar);

        sidebar.innerHTML = `
            <h2>Effects</h2>

            <label for="coreSlider">
                Core Size
            </label>

            <input
                id="coreSlider"
                type="range"
                min="0.05"
                max="1.5"
                step="0.05"
                value="0.12"
            >

            <span id="coreValue">0.12</span>

            <br><br>

            <label for="haloSlider">
                Halo Size
            </label>

            <input
                id="haloSlider"
                type="range"
                min="0.10"
                max="3.0"
                step="0.05"
                value="0.28"
            >

            <span id="haloValue">0.28</span>
        `;

        const coreSlider =
            sidebar.querySelector("#coreSlider");

        const haloSlider =
            sidebar.querySelector("#haloSlider");

        const coreValue =
            sidebar.querySelector("#coreValue");

        const haloValue =
            sidebar.querySelector("#haloValue");

        coreSlider.addEventListener(
            "input",
            (event) => {
                const value =
                    Number(event.target.value);

                coreValue.textContent =
                    value.toFixed(2);

                this.orbController
                    .setCoreRadius(value);

                console.log(
                    "Core size:",
                    value
                );
            }
        );

        haloSlider.addEventListener(
            "input",
            (event) => {
                const value =
                    Number(event.target.value);

                haloValue.textContent =
                    value.toFixed(2);

                this.orbController
                    .setHaloRadius(value);

                console.log(
                    "Halo size:",
                    value
                );
            }
        );
    }
}