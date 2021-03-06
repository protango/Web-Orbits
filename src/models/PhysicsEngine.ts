import Body3D from "./Body/Body3D";
import { Vector3 } from "babylonjs";
import { IPhysicsObject } from "./Body/IPhysicsObject";

const G = 6.67408e-11;

function calcNetForce(body: IPhysicsObject, allBodies: IPhysicsObject[]): Vector3 {
    let result: Vector3 = Vector3.Zero();
    for (let otherBody of allBodies) {
        if (otherBody === body) continue;
        let p2pVect = vectorSubtract(otherBody.position, body.position);
        let distance = vectorMagnitude(p2pVect);
        if (distance >= 0.1) { // ignore forces between collided bodies 
            let forceVector = vectorMultiply(p2pVect, (G * body.mass * otherBody.mass) / Math.pow(distance, 3))
            result = vectorAdd(result, forceVector);
        }
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

function vectorRotate(v: Vector3, u: Vector3, θ: number): Vector3 {
    u = normalize(u);
    let R = [[Math.cos(θ) + Math.pow(u.x,2)*(1-Math.cos(θ)), u.x*u.y*(1-Math.cos(θ))-u.z*Math.sin(θ), u.x*u.z*(1-Math.cos(θ))+u.y*Math.sin(θ)],
             [u.y*u.x*(1-Math.cos(θ))+u.z*Math.sin(θ), Math.cos(θ)+Math.pow(u.y,2)*(1-Math.cos(θ)), u.y*u.z*(1-Math.cos(θ)), u.y*u.z*(1-Math.cos(θ))-u.x*Math.sin(θ)],
             [u.z*u.x*(1-Math.cos(θ))-u.y*Math.sin(θ), u.z*u.y*(1-Math.cos(θ))+u.x*Math.sin(θ), Math.cos(θ)+Math.pow(u.z,2)*(1-Math.cos(θ))]];
    return transform(R, v);
}

function normalize(v: Vector3) {
    let mag = vectorMagnitude(v);
    return vectorDivide(v, mag);
}

function transform(T: number[][], v: Vector3) {
    return new Vector3(
        T[0][0] * v.x + T[0][1] * v.y + T[0][2] * v.z,
        T[1][0] * v.x + T[1][1] * v.y + T[1][2] * v.z,
        T[2][0] * v.x + T[2][1] * v.y + T[2][2] * v.z
    )
}

export {calcNetForce, calcDistance, vectorAdd, vectorSubtract, vectorMultiply, vectorDivide, vectorMagnitude, accelerationFromForce, integrateMotion};