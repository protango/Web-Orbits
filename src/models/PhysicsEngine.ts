import Body from "./Body";
import { Vector3 } from "babylonjs";

const G = 6.67408 * Math.pow(10, -11);

function calcNetForce(body: Body, allBodies: Body[]): Vector3 {
    let result: Vector3 = Vector3.Zero();
    for (let otherBody of allBodies) {
        if (otherBody === body) continue;
        let p2pVect = vectorSubtract(otherBody.position, body.position);
        let distance = vectorMagnitude(p2pVect);
        let forceVector = vectorMultiply(p2pVect, (G * body.mass * otherBody.mass) / Math.pow(distance, 3))
        result = vectorAdd(result, forceVector);
    }
    return result;
}

function calcDistance(p1: Vector3, p2: Vector3): number {
    return vectorMagnitude(vectorSubtract(p1, p2));
}

function vectorAdd(v1: Vector3, v2: Vector3): Vector3 {
    return new Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

function vectorMultiply(v1: Vector3, n: number): Vector3 {
    return new Vector3(v1.x * n, v1.y * n, v1.z * n);
}

function vectorDivide(v1: Vector3, n: number): Vector3 {
    return new Vector3(v1.x / n, v1.y / n, v1.z / n);
}

function vectorSubtract(v1: Vector3, v2: Vector3): Vector3 {
    return new Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

function vectorMagnitude(v: Vector3): number {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2) + Math.pow(v.z, 2));
}

function integrateMotion(a: Vector3, initial: Vector3, dt: number): Vector3 {
    return vectorAdd(vectorMultiply(a, dt), initial);
} 

function accelerationFromForce(force: Vector3, mass: number): Vector3 {
    return vectorDivide(force, mass);
}

export {calcNetForce, calcDistance, vectorAdd, vectorSubtract, vectorMultiply, vectorDivide, vectorMagnitude, accelerationFromForce, integrateMotion};