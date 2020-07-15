import { Vector3 } from "babylonjs";
import { keys } from "ts-transformer-keys";

export default class SerializableVector3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(og: Vector3) {
        this.x = og.x;
        this.y = og.y;
        this.z = og.z;
    }
}