import { WHITE_KEY } from "../utils/Constants";

export default class StraightPath {
    constructor(startX = 0) {
        this.startX = startX;
    }

    getTransform(whiteIndex) {
        return {
            position: {
                x: this.startX + whiteIndex * WHITE_KEY.WIDTH,
                y: 0,
                z: 0
            },
            rotationY: 0
        };
    }
}