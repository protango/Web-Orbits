import { GPU, Kernel, IKernelRunShortcut } from "gpu.js";
import { Vector3 } from "babylonjs";
import { IBody } from '../models/Body/IBody';

export type Tuple3 = [number, number, number];
export type Tuple6 = [number, number, number, number, number, number];
export class GPUPhysicsEngine {
    private gpu: GPU = new GPU();
    private functionsInit: boolean = false;
    private _kernel: IKernelRunShortcut = null;

    constructor() {
        this.gpu.addFunction(extractV3, { argumentTypes: { flat: 'Array', n: 'Integer'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorAdd, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorMultiply, { argumentTypes: { v1: 'Array(3)', n: 'Number'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorDivide, { argumentTypes: { v1: 'Array(3)', n: 'Number'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorSubtract, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorMagnitude, { argumentTypes: { v: 'Array(3)'}, returnType: 'Number' });
        this.gpu.addFunction(calcDistance, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Number' });
        this.gpu.addFunction(integrateMotion, { argumentTypes: { a: 'Array(3)', initial: 'Array(3)', dt: 'Number'}, returnType: 'Array(3)' });
    }

    public preProcess(positions: number[], masses: number[], n: number) {
        // === Step 1: Find upper and lower limits ===
        let upperLimit = extractV3(positions, 0);
        let lowerLimit = extractV3(positions, 0);
        for (let i = 0; i < n; i++) {
            let idx = i * 3;
            if (positions[idx + 0] > upperLimit[0]) upperLimit[0] = positions[idx + 0];
            if (positions[idx + 1] > upperLimit[1]) upperLimit[1] = positions[idx + 1];
            if (positions[idx + 2] > upperLimit[2]) upperLimit[2] = positions[idx + 2];
            if (positions[idx + 0] < lowerLimit[0]) lowerLimit[0] = positions[idx + 0];
            if (positions[idx + 1] < lowerLimit[1]) lowerLimit[1] = positions[idx + 1];
            if (positions[idx + 2] < lowerLimit[2]) lowerLimit[2] = positions[idx + 2];
        }

        // squareify region
        let maxDiff = Math.max(upperLimit[0] - lowerLimit[0], upperLimit[1] - lowerLimit[1], upperLimit[2] - lowerLimit[2]);
        upperLimit[0] = lowerLimit[0] + maxDiff + 1; 
        upperLimit[1] = upperLimit[0];
        upperLimit[2] = upperLimit[0];

        // === Step 2: Build BH Tree ===

    }

    public processSimulationStep(bodies: IBody[]) {
        if (!bodies || bodies.length === 0) return;
        let t0 = performance.now();
        for (let d = 0; d< 100; d++) {

        
            // Step 1: Find upper and lower limits
            let upperLimit = v3ToT3(bodies[0].position);
            let lowerLimit = v3ToT3(bodies[0].position);
            for (let b of bodies) {
                if (b.position.x > upperLimit[0]) upperLimit[0] = b.position.x;
                if (b.position.y > upperLimit[1]) upperLimit[1] = b.position.y;
                if (b.position.z > upperLimit[2]) upperLimit[2] = b.position.z;
                if (b.position.x < lowerLimit[0]) lowerLimit[0] = b.position.x;
                if (b.position.y < lowerLimit[1]) lowerLimit[1] = b.position.y;
                if (b.position.z < lowerLimit[2]) lowerLimit[2] = b.position.z;
            }
            // squareify region
            let maxDiff = Math.max(...vectorSubtract(upperLimit, lowerLimit));
            upperLimit = vectorAdd(lowerLimit, [maxDiff + 1, maxDiff + 1, maxDiff + 1]);

            // Step 2: Build BH Tree
            let root = new Octant(vectorAdd(upperLimit, [1, 1, 1]), lowerLimit);
            for (let b of bodies) 
            {
                root.assignBody(b);
            }

            let t2 = performance.now();

            // Step 3: Flatten BH Tree
            let flatTree: number[] = [];
            let shortcutsToAdd: [number, Octant][] = [];
            function addToFlatTree(o: Octant, nextSibling: Octant = null) {
                flatTree.push(...o.centerOfMass, o.mass, o.width, o.body ? o.body.id : -1, -1);
                if (nextSibling) shortcutsToAdd.push([flatTree.length - 1, nextSibling]);
                o.flatIndex = flatTree.length - 7;

                if (o.children) {
                    let children = o.children.filter(x => x.mass > 0);
                    for (let i = 0; i < children.length; i++) {
                        addToFlatTree(children[i], i < o.children.length - 1 ? children[i + 1] : null);
                    }
                }
            }
            addToFlatTree(root);

            for (let sc of shortcutsToAdd) {
                flatTree[sc[0]] = sc[1].flatIndex;
            }

        }

        let t1 = performance.now();
        let time = (t1 - t0) / 100;

        debugger;
        /* FLAT-TREE STRUCTURE: [centerOfMass_x, centerOfMass_y, centerOfMass_z, mass, width, body_id, sibling_index]*/
    }

    public getKernel(n: number): IKernelRunShortcut {
        // cached kernel will do, return it
        if (this._kernel !==null && n === this._kernel.output[0]) {
            return this._kernel;
        }

        this._kernel = this.gpu.createKernel(function(positions: number[], masses: number[]) {
            let netForce = [0.0, 0.0, 0.0] as Tuple3;
                let bp = extractV3(positions, this.thread.x);
                for (let i = 0; i < this.output.x; i++) {
                    if (i !== this.thread.x) {
                        let obp = extractV3(positions, i);
                        
                        let p2pVect = vectorSubtract(obp, bp);
                        let distance = vectorMagnitude(p2pVect);
                        if (distance >= 0.1) { // ignore forces between collided bodies 
                            let m = (6.67408e-11 * masses[this.thread.x] * masses[i]) / Math.pow(distance, 3);
                            netForce[0] += p2pVect[0] * m;
                            netForce[1] += p2pVect[1] * m;
                            netForce[2] += p2pVect[2] * m;
                        }
                    }
                }
    
                return netForce;
        }, {
            output: [n],
            tactic: "precision",
            precision: "single"
        });

        return this._kernel;
    }
}

export class Octant {
    /*

    Y
    |  Z
    | /
    |/
    |---------X

    UPPER limit is always larger than LOWER limit
    
    */
    public mass: number = 0;
    public centerOfMass: Tuple3;
    public readonly center: Tuple3;
    public readonly upperLimit: Tuple3;
    public readonly lowerLimit: Tuple3;
    public children: Octant[] = null;
    public body: IBody = null;
    public readonly width: number;
    public flatIndex: number;
    public parent: Octant = null;

    private weightedPosSum: Tuple3 = [0, 0, 0];

    public subDivide(): void {
        if (this.children) return;
        this.children = [
            // Top-Back-Right
            new Octant(this.upperLimit, this.center, this),
            // Top-Back-Left
            new Octant([this.center[0], this.upperLimit[1], this.upperLimit[2]], [this.lowerLimit[0], this.center[1], this.center[2]], this),
            // Top-Front-Right
            new Octant([this.upperLimit[0], this.upperLimit[1], this.center[2]], [this.center[0], this.center[1], this.lowerLimit[2]], this),
            // Top-Front-Left
            new Octant([this.center[0], this.upperLimit[1], this.center[2]], [this.lowerLimit[0], this.center[1], this.lowerLimit[2]], this),

            // Bottom-Back-Right
            new Octant([this.upperLimit[0], this.center[1], this.upperLimit[2]], [this.center[0], this.lowerLimit[1], this.center[2]], this),
            // Bottom-Back-Left
            new Octant([this.center[0], this.center[1], this.upperLimit[2]], [this.lowerLimit[0], this.lowerLimit[1], this.center[2]], this),
            // Bottom-Front-Right
            new Octant([this.upperLimit[0], this.center[1], this.center[2]], [this.center[0], this.lowerLimit[1], this.lowerLimit[2]], this),
            // Bottom-Front-Left
            new Octant(this.center, this.lowerLimit, this)
        ];
    }

    public assignBody(b: IBody): boolean {
        if (!this.includesBody(b)) {
            return false;
        }

        // Update octant weight statistics 
        this.mass += b.mass;
        this.weightedPosSum[0] += b.position.x * b.mass;
        this.weightedPosSum[1] += b.position.y * b.mass;
        this.weightedPosSum[2] += b.position.z * b.mass;
        this.centerOfMass = vectorDivide(this.weightedPosSum, this.mass);
        
        if (!this.body && !this.children) { // Vacant, accept body 
            this.body = b;
        } else { // Inhabited already, subdivide
            if (!this.children) {
                this.subDivide();
            }

            if (this.body) {
                // Find a new home for the resident body
                for (let o of this.children) {
                    if (this.body && o.assignBody(this.body)) {
                        this.body = null;
                        break;
                    }
                }
            }
           
            // Find a home for the incoming body
            for (let o of this.children) {
                if (o.assignBody(b)) {
                    break;
                }
            }
        }

        return true;
    }

    public includesBody(b: IBody) {
        return this.lowerLimit[0] <= b.position.x &&
            this.lowerLimit[1] <= b.position.y &&
            this.lowerLimit[2] <= b.position.z &&
            this.upperLimit[0] > b.position.x &&
            this.upperLimit[1] > b.position.y &&
            this.upperLimit[2] > b.position.z;
    }

    public includesPoint(p: Tuple3) {
        return this.lowerLimit[0] <= p[0] &&
            this.lowerLimit[1] <= p[1] &&
            this.lowerLimit[2] <= p[2] &&
            this.upperLimit[0] > p[0] &&
            this.upperLimit[1] > p[1] &&
            this.upperLimit[2] > p[2];
    }

    constructor(upperLimit: Tuple3, lowerLimit: Tuple3, parent: Octant = null) {
        this.upperLimit = upperLimit;
        this.lowerLimit = lowerLimit;
        this.center = vectorDivide(vectorAdd(upperLimit, lowerLimit), 2);
        this.centerOfMass = [...this.center] as Tuple3;
        this.width = this.upperLimit[0] - this.lowerLimit[0];
        this.parent = parent;
    }
}

// Utility functions
function extractV3(flat: number[], n: number): Tuple3 {
    return [flat[n * 3 + 0], flat[n * 3 + 1], flat[n * 3 + 2]];
}
function vectorAdd(v1: Tuple3, v2: Tuple3): Tuple3 {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}
function vectorMultiply(v1: Tuple3, n: number): Tuple3 {
    return [v1[0] * n, v1[1] * n, v1[2] * n];
}
function vectorDivide(v1: Tuple3, n: number): Tuple3 {
    return [v1[0] / n, v1[1] / n, v1[2] / n];
}
function vectorSubtract(v1: Tuple3, v2: Tuple3): Tuple3 {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}
function vectorMagnitude(v: Tuple3): number {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2) + Math.pow(v[2], 2));
}
function calcDistance(v1: Tuple3, v2: Tuple3): number {
    return Math.sqrt(Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2) + Math.pow(v1[2] - v2[2], 2));
}
function integrateMotion(a: Tuple3, initial: Tuple3, dt: number): Tuple3 {
    return [a[0] * dt + initial[0], a[1] * dt + initial[1], a[2] * dt + initial[2]];
}
function v3ToT3(v: Vector3): Tuple3 {
    return [v.x, v.y, v.z];
}