export default class MidiSidebarControls {
    constructor({
        container,
        midiController
    }) {
        if (!container) {
            throw new Error(
                "MIDI controls require a sidebar container."
            );
        }

        this.container = container;
        this.midiController =
            midiController;

        this.createUI();
        this.bindEvents();

        this.unsubscribe =
            this.midiController
                .addStateListener(
                    (status) => {
                        this.updateUI(
                            status
                        );
                    }
                );
    }

    createUI() {
        this.section =
            document.createElement(
                "section"
            );

        this.section.className =
            "midi-controls-section";

        this.section.innerHTML = `
            <div class="sidebar-divider"></div>

            <h2 class="sidebar-section-title">
                MIDI Player
            </h2>

            <label
                class="midi-file-label"
                for="midiFileInput"
            >
                Choose MIDI File
            </label>

            <input
                id="midiFileInput"
                class="midi-file-input"
                type="file"
                accept=".mid,.midi,audio/midi,audio/x-midi"
            >

            <div
                id="midiFileName"
                class="midi-file-name"
            >
                No file selected
            </div>

            <div class="midi-button-row">
                <button
                    id="midiPlayButton"
                    class="midi-control-button midi-play-button"
                    type="button"
                    disabled
                >
                    Play
                </button>

                <button
                    id="midiPauseButton"
                    class="midi-control-button"
                    type="button"
                    disabled
                >
                    Pause
                </button>

                <button
                    id="midiStopButton"
                    class="midi-control-button"
                    type="button"
                    disabled
                >
                    Stop
                </button>
            </div>

            <div
                id="midiStatus"
                class="midi-status"
            >
                No MIDI loaded
            </div>
        `;

        this.container.appendChild(
            this.section
        );

        this.fileInput =
            this.section.querySelector(
                "#midiFileInput"
            );

        this.fileName =
            this.section.querySelector(
                "#midiFileName"
            );

        this.playButton =
            this.section.querySelector(
                "#midiPlayButton"
            );

        this.pauseButton =
            this.section.querySelector(
                "#midiPauseButton"
            );

        this.stopButton =
            this.section.querySelector(
                "#midiStopButton"
            );

        this.status =
            this.section.querySelector(
                "#midiStatus"
            );
    }

    bindEvents() {
        this.fileInput.addEventListener(
            "change",
            async () => {
                const file =
                    this.fileInput
                        .files?.[0];

                if (!file) {
                    return;
                }

                try {
                    await this.midiController
                        .loadFile(file);
                } catch (error) {
                    console.error(
                        "MIDI load failed:",
                        error
                    );

                    this.status.textContent =
                        error.message ??
                        "Unable to load MIDI.";
                }
            }
        );

        this.playButton.addEventListener(
            "click",
            async () => {
                try {
                    await this.midiController
                        .play();
                } catch (error) {
                    console.error(error);

                    this.status.textContent =
                        error.message;
                }
            }
        );

        this.pauseButton.addEventListener(
            "click",
            async () => {
                if (
                    this.midiController
                        .state === "playing"
                ) {
                    this.midiController
                        .pause();

                    return;
                }

                if (
                    this.midiController
                        .state === "paused"
                ) {
                    await this.midiController
                        .resume();
                }
            }
        );

        this.stopButton.addEventListener(
            "click",
            () => {
                this.midiController
                    .stop();
            }
        );
    }

    updateUI(status) {
        const hasFile =
            Boolean(status.fileName);

        this.fileName.textContent =
            hasFile
                ? status.fileName
                : "No file selected";

        this.playButton.disabled =
            !hasFile ||
            status.state === "loading" ||
            status.state === "playing";

        this.pauseButton.disabled =
            !hasFile ||
            ![
                "playing",
                "paused"
            ].includes(status.state);

        this.stopButton.disabled =
            !hasFile ||
            [
                "ready",
                "stopped",
                "empty",
                "loading"
            ].includes(status.state);

        this.pauseButton.textContent =
            status.state === "paused"
                ? "Resume"
                : "Pause";

        const labels = {
            empty: "No MIDI loaded",
            loading: "Loading MIDI…",
            ready:
                `${status.noteCount} notes ready`,
            playing: "Playing",
            paused: "Paused",
            stopped: "Stopped",
            error: "MIDI load error"
        };

        this.status.textContent =
            labels[status.state] ??
            status.state;
    }

    destroy() {
        this.unsubscribe?.();
        this.section.remove();
    }
}