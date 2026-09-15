export default class AudioBufferStore {
    constructor(
        audioContext,
        basePath =
            `${import.meta.env.BASE_URL}audio/estate-grand/Estate Grand Piano Samples/`
    ) {
        this.audioContext =
            audioContext;

        this.basePath =
            basePath;

        this.cache =
            new Map();

        this.loadingPromises =
            new Map();
    }

    async loadSample(
        sampleName
    ) {
        if (
            this.cache.has(
                sampleName
            )
        ) {
            return this.cache.get(
                sampleName
            );
        }

        if (
            this.loadingPromises.has(
                sampleName
            )
        ) {
            return this.loadingPromises.get(
                sampleName
            );
        }

        const loadPromise =
            this.fetchAndDecode(
                sampleName
            );

        this.loadingPromises.set(
            sampleName,
            loadPromise
        );

        try {
            const audioBuffer =
                await loadPromise;

            this.cache.set(
                sampleName,
                audioBuffer
            );

            return audioBuffer;
        } finally {
            this.loadingPromises.delete(
                sampleName
            );
        }
    }

    async fetchAndDecode(
        sampleName
    ) {
        const encodedSampleName =
            sampleName
                .split("/")
                .map(
                    encodeURIComponent
                )
                .join("/");
        const url =
            `${this.basePath}${encodedSampleName}`;
        console.log(
            "Loading piano sample:",
            url
        );
    const response =
            await fetch(url);

        console.log(
            "HTTP response:",
            {
                sampleName,
                url,
                status:
                    response.status,
                ok:
                    response.ok,
                contentType:
                    response.headers.get(
                        "content-type"
                    ),
                contentLength:
                    response.headers.get(
                        "content-length"
                    )
            }
        );

        if (!response.ok) {
            throw new Error(
                `Could not load sample "${sampleName}" (${response.status})`
            );
        }

        const arrayBuffer =
    await response.arrayBuffer();

console.log(
    "ACTUAL ARRAY BUFFER:",
    arrayBuffer
);

console.log(
    "ACTUAL BYTE LENGTH:",
    arrayBuffer.byteLength
);

console.log(
    "RESPONSE CONTENT LENGTH:",
    response.headers.get(
        "content-length"
    )
);

console.log(
    "RESPONSE CONTENT TYPE:",
    response.headers.get(
        "content-type"
    )
);


if (
    arrayBuffer.byteLength === 0
) {
    throw new Error(
        `EMPTY AUDIO RESPONSE: ${sampleName}`
    );
}

        /*
         * FLAC files normally begin with
         * ASCII characters:
         *
         * fLaC
         *
         * Hex:
         * 66 4C 61 43
         */
        const firstBytes =
            Array.from(
                new Uint8Array(
                    arrayBuffer,
                    0,
                    Math.min(
                        16,
                        arrayBuffer.byteLength
                    )
                )
            );

        console.log(
            "First audio bytes:",
            firstBytes
        );

        try {
            const audioBuffer =
                await this.audioContext
                    .decodeAudioData(
                        arrayBuffer
                    );

            console.log(
                "Decoded piano sample:",
                {
                    sampleName,

                    duration:
                        audioBuffer.duration,

                    sampleRate:
                        audioBuffer.sampleRate,

                    channels:
                        audioBuffer
                            .numberOfChannels
                }
            );

            return audioBuffer;
        } catch (error) {
            console.error(
                "Audio decoding failed:",
                {
                    sampleName,
                    url,

                    byteLength:
                        arrayBuffer.byteLength,

                    firstBytes,

                    error
                }
            );

            throw error;
        }
    }

    has(
        sampleName
    ) {
        return this.cache.has(
            sampleName
        );
    }

    clear() {
        this.cache.clear();
        this.loadingPromises.clear();
    }
}