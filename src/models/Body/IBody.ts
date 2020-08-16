import { Vector3, PointLight } from "babylonjs";
import { IPhysicsObject } from "./IPhysicsObject";
import { BodyAppearance } from "../../components/simulation";

export interface IBody extends IPhysicsObject {
    id: number,
    name: string,
    diameter: number,
    appearance: BodyAppearance,
    lightRange: number,
    dispose(): void
}