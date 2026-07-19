import * as THREE from "three";
import { SPIRAL } from "../utils/Constants";

export default class SpiralPath {
    constructor() {
        this.startRadius = SPIRAL.START_RADIUS;
        this.outerRadius = SPIRAL.OUTER_RADIUS;
        this.turns = SPIRAL.TURNS;
        this.sampleCount = SPIRAL.SAMPLE_COUNT;
        this.derivativeStep = SPIRAL.DERIVATIVE_STEP;

        this.maxTheta = Math.PI * 2 * this.turns;

        this.radiusGrowth =
            (this.outerRadius - this.startRadius) /
            this.maxTheta;

        this.samples = [];
        this.totalLength = 0;

        this.buildArcLengthTable();
    }

    getRadius(theta) {
        return (
            this.startRadius +
            this.radiusGrowth * theta
        );
    }

    getPoint(theta) {
        const radius = this.getRadius(theta);

        return new THREE.Vector3(
            radius * Math.cos(theta),
            0,
            radius * Math.sin(theta)
        );
    }

    /**
     * Exact first derivative of the Archimedean spiral:
     *
     * x = r cos(theta)
     * z = r sin(theta)
     * r = a + b theta
     */
    getFirstDerivative(theta) {
        const radius = this.getRadius(theta);
        const b = this.radiusGrowth;

        return new THREE.Vector3(
            b * Math.cos(theta) -
                radius * Math.sin(theta),

            0,

            b * Math.sin(theta) +
                radius * Math.cos(theta)
        );
    }

    /**
     * Exact second derivative.
     */
    getSecondDerivative(theta) {
        const radius = this.getRadius(theta);
        const b = this.radiusGrowth;

        return new THREE.Vector3(
            -2 * b * Math.sin(theta) -
                radius * Math.cos(theta),

            0,

            2 * b * Math.cos(theta) -
                radius * Math.sin(theta)
        );
    }

    getTangent(theta) {
        return this.getFirstDerivative(theta)
            .normalize();
    }

    getOutwardNormal(theta) {
        const tangent = this.getTangent(theta);

        let normal = new THREE.Vector3(
            tangent.z,
            0,
            -tangent.x
        ).normalize();

        const radialDirection =
            this.getPoint(theta).normalize();

        // Make sure it points away from the origin.
        if (normal.dot(radialDirection) < 0) {
            normal.negate();
        }

        return normal;
    }

    /**
     * Planar curvature:
     *
     * k = |x'z'' - z'x''| /
     *     (x'^2 + z'^2)^(3/2)
     */
    getCurvature(theta) {
        const first =
            this.getFirstDerivative(theta);

        const second =
            this.getSecondDerivative(theta);

        const numerator = Math.abs(
            first.x * second.z -
            first.z * second.x
        );

        const speedSquared =
            first.x * first.x +
            first.z * first.z;

        const denominator =
            Math.pow(speedSquared, 1.5);

        if (denominator < 1e-8) {
            return 0;
        }

        return numerator / denominator;
    }

    getCurvatureRadius(theta) {
        const curvature =
            this.getCurvature(theta);

        if (curvature < 1e-8) {
            return Infinity;
        }

        return 1 / curvature;
    }

    /**
     * Finds which side of the curve contains the
     * local center of curvature.
     *
     * The curvature center is not necessarily in the
     * outward-normal direction.
     */
    getCurvatureNormal(theta) {
        const tangent = this.getTangent(theta);

        const leftNormal = new THREE.Vector3(
            -tangent.z,
            0,
            tangent.x
        ).normalize();

        const delta = this.derivativeStep;

        const previousTangent = this.getTangent(
            Math.max(0, theta - delta)
        );

        const nextTangent = this.getTangent(
            Math.min(
                this.maxTheta,
                theta + delta
            )
        );

        const tangentChange =
            nextTangent.sub(previousTangent);

        if (tangentChange.lengthSq() < 1e-10) {
            return leftNormal;
        }

        if (leftNormal.dot(tangentChange) < 0) {
            leftNormal.negate();
        }

        return leftNormal;
    }

    getCurvatureCenter(theta) {
        const radius =
            this.getCurvatureRadius(theta);

        if (!Number.isFinite(radius)) {
            return null;
        }

        const point = this.getPoint(theta);
        const curvatureNormal =
            this.getCurvatureNormal(theta);

        return point.add(
            curvatureNormal.multiplyScalar(radius)
        );
    }

    buildArcLengthTable() {
        this.samples = [];

        let cumulativeDistance = 0;
        let previousPoint = this.getPoint(0);

        this.samples.push({
            theta: 0,
            distance: 0
        });

        for (
            let i = 1;
            i <= this.sampleCount;
            i++
        ) {
            const theta =
                (i / this.sampleCount) *
                this.maxTheta;

            const currentPoint =
                this.getPoint(theta);

            cumulativeDistance +=
                currentPoint.distanceTo(
                    previousPoint
                );

            this.samples.push({
                theta,
                distance: cumulativeDistance
            });

            previousPoint = currentPoint;
        }

        this.totalLength = cumulativeDistance;
    }

    getThetaAtDistance(targetDistance) {
        const distance = THREE.MathUtils.clamp(
            targetDistance,
            0,
            this.totalLength
        );

        let low = 0;
        let high = this.samples.length - 1;

        while (low <= high) {
            const middle = Math.floor(
                (low + high) / 2
            );

            if (
                this.samples[middle].distance <
                distance
            ) {
                low = middle + 1;
            } else {
                high = middle - 1;
            }
        }

        const upperIndex = Math.min(
            low,
            this.samples.length - 1
        );

        const lowerIndex = Math.max(
            upperIndex - 1,
            0
        );

        const lower =
            this.samples[lowerIndex];

        const upper =
            this.samples[upperIndex];

        const distanceRange =
            upper.distance -
            lower.distance;

        if (distanceRange < 1e-8) {
            return lower.theta;
        }

        const interpolation =
            (distance - lower.distance) /
            distanceRange;

        return THREE.MathUtils.lerp(
            lower.theta,
            upper.theta,
            interpolation
        );
    }

    getFrameAtDistance(distance) {
        const theta =
            this.getThetaAtDistance(distance);

        return this.getFrameAtTheta(theta);
    }

    getFrameAtProgress(progress) {
        const safeProgress =
            THREE.MathUtils.clamp(
                progress,
                0,
                1
            );

        return this.getFrameAtDistance(
            safeProgress * this.totalLength
        );
    }

    getFrameAtTheta(theta) {
        const safeTheta =
            THREE.MathUtils.clamp(
                theta,
                0,
                this.maxTheta
            );

        return {
            theta: safeTheta,

            position:
                this.getPoint(safeTheta),

            tangent:
                this.getTangent(safeTheta),

            normal:
                this.getOutwardNormal(
                    safeTheta
                ),

            curvatureNormal:
                this.getCurvatureNormal(
                    safeTheta
                ),

            curvature:
                this.getCurvature(safeTheta),

            curvatureRadius:
                this.getCurvatureRadius(
                    safeTheta
                ),

            curvatureCenter:
                this.getCurvatureCenter(
                    safeTheta
                )
        };
    }
}