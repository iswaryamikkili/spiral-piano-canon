import * as THREE from "three";

import {
    WHITE_KEY,
    BLACK_KEY,
    KEYBOARD
} from "../utils/Constants";

export default class BlackKeyGeometry {
    static create(path, boundaryIndex) {
        const whiteKeyCount =
            KEYBOARD.WHITE_KEY_COUNT;

        /*
         * A black key sits on the boundary between
         * white key boundaryIndex - 1 and boundaryIndex.
         *
         * Example:
         * boundaryIndex 1 sits between white keys 0 and 1.
         */
        const boundaryProgress =
            boundaryIndex / whiteKeyCount;

        const whiteKeyProgress =
            1 / whiteKeyCount;

        const halfBlackWidth =
            whiteKeyProgress *
            BLACK_KEY.WIDTH_FRACTION *
            0.5;

        const startProgress =
            boundaryProgress - halfBlackWidth;

        const endProgress =
            boundaryProgress + halfBlackWidth;

        const middleFrame =
            path.getFrameAtProgress(
                boundaryProgress
            );

        const innerPoints = [];
        const outerPoints = [];

        /*
         * The white-key path lies inside the white
         * key body. Move the black key toward the
         * inner/rear side, then extend it outward.
         */
        const baseOffset =
            -WHITE_KEY.LENGTH *
            KEYBOARD.INWARD_LENGTH_FRACTION +
            BLACK_KEY.INWARD_OFFSET;

        for (
            let segment = 0;
            segment <= BLACK_KEY.CURVE_SEGMENTS;
            segment++
        ) {
            const t =
                segment /
                BLACK_KEY.CURVE_SEGMENTS;

            const progress =
                THREE.MathUtils.lerp(
                    startProgress,
                    endProgress,
                    t
                );

            const frame =
                path.getFrameAtProgress(progress);

            const innerPoint =
                frame.position
                    .clone()
                    .add(
                        frame.normal
                            .clone()
                            .multiplyScalar(
                                baseOffset
                            )
                    );

            const outerPoint =
                innerPoint
                    .clone()
                    .add(
                        frame.normal
                            .clone()
                            .multiplyScalar(
                                BLACK_KEY.LENGTH
                            )
                    );

            innerPoints.push(innerPoint);
            outerPoints.push(outerPoint);
        }

        const origin =
            this.calculateOrigin(
                innerPoints,
                outerPoints
            );

        const geometry =
            this.buildGeometry(
                innerPoints,
                outerPoints,
                origin,
                BLACK_KEY.HEIGHT
            );

        return {
            geometry,
            position: origin,
            frame: middleFrame,
            boundaryProgress
        };
    }

    static calculateOrigin(
        innerPoints,
        outerPoints
    ) {
        const origin =
            new THREE.Vector3();

        let count = 0;

        for (const point of innerPoints) {
            origin.add(point);
            count++;
        }

        for (const point of outerPoints) {
            origin.add(point);
            count++;
        }

        origin.multiplyScalar(1 / count);

        return origin;
    }

    static buildGeometry(
        innerPoints,
        outerPoints,
        origin,
        height
    ) {
        const vertices = [];
        const indices = [];

        const count = innerPoints.length;

        const topY = height / 2;
        const bottomY = -height / 2;

        this.pushRow(
            vertices,
            innerPoints,
            origin,
            topY
        );

        this.pushRow(
            vertices,
            outerPoints,
            origin,
            topY
        );

        this.pushRow(
            vertices,
            innerPoints,
            origin,
            bottomY
        );

        this.pushRow(
            vertices,
            outerPoints,
            origin,
            bottomY
        );

        const topInner = 0;
        const topOuter = count;
        const bottomInner = count * 2;
        const bottomOuter = count * 3;

        for (let i = 0; i < count - 1; i++) {
            const next = i + 1;

            // Top
            indices.push(
                topInner + i,
                topOuter + i,
                topOuter + next
            );

            indices.push(
                topInner + i,
                topOuter + next,
                topInner + next
            );

            // Bottom
            indices.push(
                bottomInner + i,
                bottomOuter + next,
                bottomOuter + i
            );

            indices.push(
                bottomInner + i,
                bottomInner + next,
                bottomOuter + next
            );

            // Inner wall
            indices.push(
                topInner + i,
                topInner + next,
                bottomInner + next
            );

            indices.push(
                topInner + i,
                bottomInner + next,
                bottomInner + i
            );

            // Outer wall
            indices.push(
                topOuter + i,
                bottomOuter + next,
                topOuter + next
            );

            indices.push(
                topOuter + i,
                bottomOuter + i,
                bottomOuter + next
            );
        }

        // Start cap
        indices.push(
            topInner,
            bottomInner,
            bottomOuter
        );

        indices.push(
            topInner,
            bottomOuter,
            topOuter
        );

        // End cap
        const last = count - 1;

        indices.push(
            topInner + last,
            topOuter + last,
            bottomOuter + last
        );

        indices.push(
            topInner + last,
            bottomOuter + last,
            bottomInner + last
        );

        const geometry =
            new THREE.BufferGeometry();

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        return geometry;
    }

    static pushRow(
        vertices,
        points,
        origin,
        y
    ) {
        for (const point of points) {
            vertices.push(
                point.x - origin.x,
                y,
                point.z - origin.z
            );
        }
    }
}