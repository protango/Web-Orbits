import { Vector3 } from "babylonjs";
import { NodeMaterialBuildStateSharedData } from "babylonjs/Materials/Node/nodeMaterialBuildStateSharedData";

export default class SphericalVector {
    public radius: number;
    public inclination: number;
    public azimuth: number;

    constructor (radius: number, inclination: number, azimuth: number) {
        this.radius = radius;
        this.inclination = inclination;
        this.azimuth = azimuth;
    }

    public toCartesian(): Vector3 {
        return new Vector3(
            this.radius * Math.sin(this.azimuth) * Math.cos(this.inclination),
            this.radius * Math.sin(this.azimuth) * Math.sin(this.inclination),
            this.radius * Math.cos(this.azimuth)
        );
    }

    public static fromCartesian(v: Vector3): SphericalVector {
        return this.fromCartesianVals(v.x, v.y, v.z);
    }

    public static fromCartesianVals(x: number, y: number, z: number): SphericalVector {
        let r = Math.sqrt(x^2 + y^2 + z^2);
        return new SphericalVector(
            r,
            Math.atan(y/x),
            Math.acos(z/r)
        );
    }
}