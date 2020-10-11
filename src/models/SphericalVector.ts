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
            this.radius * Math.sin(this.inclination) * Math.cos(this.azimuth),
            this.radius * Math.cos(this.inclination),
            this.radius * Math.sin(this.inclination) * Math.sin(this.azimuth)
        );
    }

    public static fromCartesian(v: Vector3): SphericalVector {
        return this.fromCartesianVals(v.x, v.y, v.z);
    }

    public static fromCartesianVals(x: number, y: number, z: number): SphericalVector {
        let r = Math.sqrt(Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2));
        return new SphericalVector(
            r,
            Math.acos(y/r),
            Math.atan(z/x) + (x < 0 ? Math.PI : 0)
        );
    }
}