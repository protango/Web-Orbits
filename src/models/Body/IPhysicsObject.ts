import { Vector3 } from "babylonjs";

export interface IPhysicsObject {
    acceleration: Vector3;
    velocity: Vector3;
    position: Vector3;
    mass: number;
}