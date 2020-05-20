import { Vector3 } from "babylonjs";

export interface PhysicsObject {
    velocity: Vector3;
    position: Vector3;
    mass: number;
}