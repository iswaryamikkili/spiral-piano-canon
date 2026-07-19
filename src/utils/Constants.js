// src/utils/Constants.js

export const WORLD = {

    BACKGROUND: 0x05060A

};

export const CAMERA = {

    FOV: 95,

    NEAR: 0.1,

    FAR: 1000,

    POSITION: {

        x: 28,
        y: 24,
        z: 28

    }

};
export const WHITE_KEY = {
    HEIGHT: 0.50,
    LENGTH: 5.2
};

export const BLACK_KEY = {
    HEIGHT: 0.75,
    LENGTH: 2.65,
    WIDTH_FRACTION: 0.48,
    INWARD_OFFSET: 0.38,
    CURVE_SEGMENTS: 6
};
// export const WHITE_KEY = {
//     WIDTH: 1.6,
//     HEIGHT: 0.35,
//     LENGTH: 5.2
// };

export const KEYBOARD = {
    WHITE_KEY_COUNT: 52,
    KEY_GAP_FRACTION: 0.018,
    KEY_CURVE_SEGMENTS: 8,
    MAX_WIDTH_RATIO: 1.35,
    INWARD_LENGTH_FRACTION: 0.20
};

export const SPIRAL = {
    START_RADIUS: 2.8,
    OUTER_RADIUS: 17.0,
    TURNS: 2.4,
    SAMPLE_COUNT: 8000,

    // Used when estimating tangent and curvature.
    DERIVATIVE_STEP: 0.002
};


// export const BLACK_KEY = {
//     HEIGHT: 0.62,
//     LENGTH: 2.8,

//     /*
//      * Width relative to the distance occupied
//      * by one white key along the path.
//      */
//     WIDTH_FRACTION: 0.55,

//     /*
//      * Moves the black key toward the inner/rear
//      * portion of the white keyboard.
//      */
//     INWARD_OFFSET: 0.45,

//     CURVE_SEGMENTS: 5
// };


