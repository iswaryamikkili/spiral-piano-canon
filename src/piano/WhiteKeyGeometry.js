import * as THREE from "three";

import {
    WHITE_KEY,
    KEYBOARD
} from "../utils/Constants";

export default class WhiteKeyGeometry {
    static create(path, whiteIndex) {
        const keyCount =
            KEYBOARD.WHITE_KEY_COUNT;

        const segmentCount =
            KEYBOARD.KEY_CURVE_SEGMENTS;

        const gap =
            KEYBOARD.KEY_GAP_FRACTION;

        const startProgress =
            (whiteIndex + gap) / keyCount;

        const endProgress =
            (whiteIndex + 1 - gap) / keyCount;

        const middleProgress =
            (startProgress + endProgress) * 0.5;

        const middleFrame =
            path.getFrameAtProgress(
                middleProgress
            );

        const keyLength =
            this.getCurvatureLimitedLength(
                middleFrame.curvature
            );

        const inwardFraction =
            KEYBOARD.INWARD_LENGTH_FRACTION;

        const inwardLength =
            keyLength * inwardFraction;

        const outwardLength =
            keyLength * (1 - inwardFraction);

        const innerPoints = [];
        const outerPoints = [];

        for (
            let segment = 0;
            segment <= segmentCount;
            segment++
        ) {
            const t =
                segment / segmentCount;

            const progress =
                THREE.MathUtils.lerp(
                    startProgress,
                    endProgress,
                    t
                );

            const frame =
                path.getFrameAtProgress(
                    progress
                );

            const innerPoint =
                frame.position
                    .clone()
                    .add(
                        frame.normal
                            .clone()
                            .multiplyScalar(
                                -inwardLength
                            )
                    );

            const outerPoint =
                frame.position
                    .clone()
                    .add(
                        frame.normal
                            .clone()
                            .multiplyScalar(
                                outwardLength
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
                WHITE_KEY.HEIGHT
            );

        geometry.userData = {
            whiteIndex,
            startProgress,
            endProgress,
            middleProgress,
            effectiveLength: keyLength,
            curvature:
                middleFrame.curvature,
            curvatureRadius:
                middleFrame.curvatureRadius
        };

        return {
            geometry,
            position: origin,
            frame: middleFrame,
            innerPoints,
            outerPoints
        };
    }

    static getCurvatureLimitedLength(
        curvature
    ) {
        const desiredLength =
            WHITE_KEY.LENGTH;

        if (
            !Number.isFinite(curvature) ||
            curvature <= 1e-8
        ) {
            return desiredLength;
        }

        const ratioLimit =
            KEYBOARD.MAX_WIDTH_RATIO;

        const inwardFraction =
            KEYBOARD.INWARD_LENGTH_FRACTION;

        const outwardFraction =
            1 - inwardFraction;

        const denominator =
            curvature *
            (
                outwardFraction +
                ratioLimit *
                inwardFraction
            );

        if (denominator <= 1e-8) {
            return desiredLength;
        }

        const maximumSafeLength =
            (ratioLimit - 1) /
            denominator;

        const minimumLength =
            desiredLength * 0.52;

        return THREE.MathUtils.clamp(
            maximumSafeLength,
            minimumLength,
            desiredLength
        );
    }

    static calculateOrigin(
        innerPoints,
        outerPoints
    ) {
        const origin =
            new THREE.Vector3();

        let pointCount = 0;

        for (const point of innerPoints) {
            origin.add(point);
            pointCount++;
        }

        for (const point of outerPoints) {
            origin.add(point);
            pointCount++;
        }

        if (pointCount > 0) {
            origin.multiplyScalar(
                1 / pointCount
            );
        }

        return origin;
    }

    static buildGeometry(
        innerPoints,
        outerPoints,
        origin,
        height
    ) {
        const geometry =
            new THREE.BufferGeometry();

        const vertices = [];
        const indices = [];

        const columnCount =
            innerPoints.length;

        const topY = height / 2;
        const bottomY = -height / 2;

        this.pushPointRow(
            vertices,
            innerPoints,
            origin,
            topY
        );

        this.pushPointRow(
            vertices,
            outerPoints,
            origin,
            topY
        );

        this.pushPointRow(
            vertices,
            innerPoints,
            origin,
            bottomY
        );

        this.pushPointRow(
            vertices,
            outerPoints,
            origin,
            bottomY
        );

        const topInnerStart = 0;
        const topOuterStart =
            columnCount;

        const bottomInnerStart =
            columnCount * 2;

        const bottomOuterStart =
            columnCount * 3;

        for (
            let i = 0;
            i < columnCount - 1;
            i++
        ) {
            const next = i + 1;

            // Top surface
            indices.push(
                topInnerStart + i,
                topOuterStart + i,
                topOuterStart + next
            );

            indices.push(
                topInnerStart + i,
                topOuterStart + next,
                topInnerStart + next
            );

            // Bottom surface
            indices.push(
                bottomInnerStart + i,
                bottomOuterStart + next,
                bottomOuterStart + i
            );

            indices.push(
                bottomInnerStart + i,
                bottomInnerStart + next,
                bottomOuterStart + next
            );

            // Inner curved wall
            indices.push(
                topInnerStart + i,
                topInnerStart + next,
                bottomInnerStart + next
            );

            indices.push(
                topInnerStart + i,
                bottomInnerStart + next,
                bottomInnerStart + i
            );

            // Outer curved wall
            indices.push(
                topOuterStart + i,
                bottomOuterStart + next,
                topOuterStart + next
            );

            indices.push(
                topOuterStart + i,
                bottomOuterStart + i,
                bottomOuterStart + next
            );
        }

        // Starting side
        indices.push(
            topInnerStart,
            bottomInnerStart,
            bottomOuterStart
        );

        indices.push(
            topInnerStart,
            bottomOuterStart,
            topOuterStart
        );

        // Ending side
        const last =
            columnCount - 1;

        indices.push(
            topInnerStart + last,
            topOuterStart + last,
            bottomOuterStart + last
        );

        indices.push(
            topInnerStart + last,
            bottomOuterStart + last,
            bottomInnerStart + last
        );

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

    static pushPointRow(
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