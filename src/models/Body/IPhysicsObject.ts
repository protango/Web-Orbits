import { Vector3 } from "babylonjs";

export interface IPhysicsObject {
    velocity: Vector3;
    position: Vector3;
    mass: number;
}