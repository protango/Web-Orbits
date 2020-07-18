const G = 6.67408e-11;
export type Point3DTuple = [number, number, number];

function gpuCalcDistance(p1: Point3DTuple, p2: Point3DTuple): number {
    return gpuVectorMagnitude(gpuVectorSubtract(p1, p2));
}

function gpuVectorAdd(v1: Point3DTuple, v2: Point3DTuple): Point3DTuple {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function gpuVectorMultiply(v1: Point3DTuple, n: number): Point3DTuple {
    return [v1[0] * n, v1[1] * n, v1[2] * n];
}

function gpuVectorDivide(v1: Point3DTuple, n: number): Point3DTuple {
    return [v1[0] / n, v1[1] / n, v1[2] / n];
}

function gpuVectorSubtract(v1: Point3DTuple, v2: Point3DTuple): Point3DTuple {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

function gpuVectorMagnitude(v: Point3DTuple): number {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2) + Math.pow(v[2], 2));
}

function gpuIntegrateMotion(a: Point3DTuple, initial: Point3DTuple, dt: number): Point3DTuple {
    return gpuVectorAdd(gpuVectorMultiply(a, dt), initial);
} 

function gpuAccelerationFromForce(force: Point3DTuple, mass: number): Point3DTuple {
    return gpuVectorDivide(force, mass);
}

export {gpuCalcDistance, gpuVectorAdd, gpuVectorSubtract, gpuVectorMultiply, gpuVectorDivide, gpuVectorMagnitude, gpuAccelerationFromForce, gpuIntegrateMotion};