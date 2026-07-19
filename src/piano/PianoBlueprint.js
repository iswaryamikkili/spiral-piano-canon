const NOTE_NAMES = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];

const BLACK_NOTES = new Set([
    "C#", "D#", "F#", "G#", "A#"
]);

export function createFullKeyboardBlueprint() {
    const keys = [];

    // Standard piano: MIDI 21 (A0) through MIDI 108 (C8)
    for (let midiNumber = 21; midiNumber <= 108; midiNumber++) {
        const noteIndex = midiNumber % 12;
        const noteName = NOTE_NAMES[noteIndex];
        const octave = Math.floor(midiNumber / 12) - 1;

        keys.push({
            id: midiNumber - 21,
            note: `${noteName}${octave}`,
            noteName,
            octave,
            midiNumber,
            type: BLACK_NOTES.has(noteName)
                ? "black"
                : "white"
        });
    }

    return keys;
}