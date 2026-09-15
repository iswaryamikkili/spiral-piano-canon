import fs from "fs";
import path from "path";

const sfzPath = process.argv[2];

if (!sfzPath) {
    console.error(
        "Usage: node scripts/build-piano-manifest.mjs <path-to-sfz>"
    );
    process.exit(1);
}

if (!fs.existsSync(sfzPath)) {
    console.error(`SFZ file not found: ${sfzPath}`);
    process.exit(1);
}

const sfzText = fs.readFileSync(sfzPath, "utf8");

function toNumber(value) {
    if (value === undefined || value === null) {
        return undefined;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed)
        ? undefined
        : parsed;
}

/*
 * Estate Grand uses unquoted values containing spaces:
 *
 * sample=PDL UP IN-A-1.flac
 * group_label=PDL UP IN
 *
 * Therefore we can't simply split on whitespace.
 */
function parseOpcodes(text) {
    const result = {};

    const opcodeRegex =
        /([a-zA-Z0-9_]+)=/g;

    const matches = [
        ...text.matchAll(opcodeRegex)
    ];

    for (
        let i = 0;
        i < matches.length;
        i++
    ) {
        const current =
            matches[i];

        const key =
            current[1];

        const valueStart =
            current.index +
            current[0].length;

        const valueEnd =
            i + 1 < matches.length
                ? matches[i + 1].index
                : text.length;

        let value =
            text
                .slice(
                    valueStart,
                    valueEnd
                )
                .trim();

        if (
            value.startsWith('"') &&
            value.endsWith('"')
        ) {
            value =
                value.slice(1, -1);
        }

        result[key] = value;
    }

    return result;
}

const rawLines =
    sfzText.split(/\r?\n/);

const regions = [];

let currentHeader = null;

let currentMaster = {};
let currentGroup = {};
let currentRegion = null;

function finishRegion() {
    if (!currentRegion) {
        return;
    }

    const combined = {
        ...currentMaster,
        ...currentGroup,
        ...currentRegion
    };

    regions.push({
        sample:
            combined.sample ??
            null,

        groupLabel:
            combined.group_label ??
            null,

        trigger:
            combined.trigger ??
            "attack",

        loKey:
            toNumber(
                combined.lokey ??
                combined.key
            ),

        hiKey:
            toNumber(
                combined.hikey ??
                combined.key
            ),

        pitchKeycenter:
            toNumber(
                combined.pitch_keycenter ??
                combined.key
            ),

        loVel:
            toNumber(
                combined.lovel
            ) ?? 0,

        hiVel:
            toNumber(
                combined.hivel
            ) ?? 127,

        loCC64:
            toNumber(
                combined.locc64
            ),

        hiCC64:
            toNumber(
                combined.hicc64
            )
    });

    currentRegion = null;
}

for (let rawLine of rawLines) {
    // Remove SFZ comments.
    const commentIndex =
        rawLine.indexOf("//");

    if (commentIndex !== -1) {
        rawLine =
            rawLine.slice(
                0,
                commentIndex
            );
    }

    let line =
        rawLine.trim();

    if (!line) {
        continue;
    }

    /*
     * A line can contain a header and opcodes:
     *
     * <group> group_label=PDL UP IN
     * <region> sample=...
     */

    if (line.startsWith("<master>")) {
        finishRegion();

        currentHeader = "master";
        currentMaster = {};
        currentGroup = {};

        line =
            line
                .replace(
                    "<master>",
                    ""
                )
                .trim();
    } else if (
        line.startsWith("<group>")
    ) {
        finishRegion();

        currentHeader = "group";
        currentGroup = {};

        line =
            line
                .replace(
                    "<group>",
                    ""
                )
                .trim();
    } else if (
        line.startsWith("<region>")
    ) {
        finishRegion();

        currentHeader = "region";
        currentRegion = {};

        line =
            line
                .replace(
                    "<region>",
                    ""
                )
                .trim();
    } else if (
        line.startsWith("<control>")
    ) {
        finishRegion();

        currentHeader = "control";

        line =
            line
                .replace(
                    "<control>",
                    ""
                )
                .trim();
    }

    if (!line) {
        continue;
    }

    const opcodes =
        parseOpcodes(line);

    if (currentHeader === "master") {
        Object.assign(
            currentMaster,
            opcodes
        );
    } else if (
        currentHeader === "group"
    ) {
        Object.assign(
            currentGroup,
            opcodes
        );
    } else if (
        currentHeader === "region"
    ) {
        Object.assign(
            currentRegion,
            opcodes
        );
    }
}

finishRegion();

console.log(
    `Parsed ${regions.length} regions.`
);

const playableRegions =
    regions.filter(
        (region) =>
            region.sample &&
            region.loKey !== undefined &&
            region.hiKey !== undefined
    );

console.log(
    `Playable regions: ${playableRegions.length}`
);

const notes = {};

for (
    let midi = 21;
    midi <= 108;
    midi++
) {
    notes[midi] = [];
}

for (
    const region of playableRegions
) {
    for (
        let midi = region.loKey;
        midi <= region.hiKey;
        midi++
    ) {
        if (
            midi < 21 ||
            midi > 108
        ) {
            continue;
        }

        notes[midi].push({
            sample:
                region.sample,

            pitchKeycenter:
                region.pitchKeycenter,

            velocity: {
                min:
                    region.loVel,
                max:
                    region.hiVel
            },

            trigger:
                region.trigger,

            pedal: {
                min:
                    region.loCC64 ??
                    null,

                max:
                    region.hiCC64 ??
                    null
            },

            groupLabel:
                region.groupLabel,

            transpose:
                region.pitchKeycenter !==
                undefined
                    ? midi -
                      region.pitchKeycenter
                    : 0
        });
    }
}

const missingKeys = [];

let exactMappings = 0;
let transposedMappings = 0;

for (
    let midi = 21;
    midi <= 108;
    midi++
) {
    if (
        notes[midi].length === 0
    ) {
        missingKeys.push(midi);
    }

    for (
        const mapping of notes[midi]
    ) {
        if (
            mapping.transpose === 0
        ) {
            exactMappings++;
        } else {
            transposedMappings++;
        }
    }
}

console.log(
    `Missing MIDI keys: ${missingKeys.length}`
);

console.log(
    `Exact mappings: ${exactMappings}`
);

console.log(
    `Transposed mappings: ${transposedMappings}`
);

const manifest = {
    source: {
        name:
            "Estate Grand LE",

        sfz:
            path.basename(
                sfzPath
            )
    },

    midiRange: {
        min: 21,
        max: 108
    },

    notes
};

const outputDir =
    path.resolve(
        "public/audio/estate-grand/manifest"
    );

fs.mkdirSync(
    outputDir,
    {
        recursive: true
    }
);

const outputPath =
    path.join(
        outputDir,
        "piano-manifest.json"
    );

fs.writeFileSync(
    outputPath,
    JSON.stringify(
        manifest,
        null,
        2
    )
);

console.log(
    `Manifest written to: ${outputPath}`
);