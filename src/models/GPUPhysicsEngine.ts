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

    public preProcess(bodyPositions: number[], bodyMasses: number[]) {
        // === Step 1: Find upper and lower limits ===
        let spaceUpperLimit = extractV3(bodyPositions, 0);
        let spaceLowerLimit = extractV3(bodyPositions, 0);
        for (let i = 0; i < bodyMasses.length; i++) {
            let idx = i * 3;
            if (bodyPositions[idx + 0] > spaceUpperLimit[0]) spaceUpperLimit[0] = bodyPositions[idx + 0];
            if (bodyPositions[idx + 1] > spaceUpperLimit[1]) spaceUpperLimit[1] = bodyPositions[idx + 1];
            if (bodyPositions[idx + 2] > spaceUpperLimit[2]) spaceUpperLimit[2] = bodyPositions[idx + 2];
            if (bodyPositions[idx + 0] < spaceLowerLimit[0]) spaceLowerLimit[0] = bodyPositions[idx + 0];
            if (bodyPositions[idx + 1] < spaceLowerLimit[1]) spaceLowerLimit[1] = bodyPositions[idx + 1];
            if (bodyPositions[idx + 2] < spaceLowerLimit[2]) spaceLowerLimit[2] = bodyPositions[idx + 2];
        }

        // squareify region
        let maxDiff = Math.max(spaceUpperLimit[0] - spaceLowerLimit[0], spaceUpperLimit[1] - spaceLowerLimit[1], spaceUpperLimit[2] - spaceLowerLimit[2]);
        spaceUpperLimit[0] = spaceLowerLimit[0] + maxDiff + 1; 
        spaceUpperLimit[1] = spaceLowerLimit[1] + maxDiff + 1;
        spaceUpperLimit[2] = spaceLowerLimit[2] + maxDiff + 1;

        // === Step 2: Build BH Tree ===
        function extract2D(ar: Float32Array | Int32Array | number[], i: number, d2: number) {
            let start = i * d2;
            return ar.slice(start, start + d2);
        }
        function insert2D(ar: Float32Array | Int32Array, i: number, d2: number, newVals: Float32Array | Int32Array | number[]) {
            let start = i * d2;
            for (let i = 0; i < d2; i++) {
                ar[start + i] = newVals[i];
            }
        }
        // Pre-allocate memory for speed, assume number of nodes will be 4x higher than n
        let nodeBodyIds: Int32Array = new Int32Array(bodyMasses.length * 4);
        let nodeCoMs: Float32Array = new Float32Array(bodyMasses.length * 4 * 3);
        let nodeMasses: Float32Array = new Float32Array(bodyMasses.length * 4 * 3);
        let nodeChildren: Int32Array = new Int32Array(bodyMasses.length * 4 * 8);
        let nodeUpperLimits: Float32Array = new Float32Array(bodyMasses.length * 4 * 3);
        let nodeLowerLimits: Float32Array = new Float32Array(bodyMasses.length * 4 * 3);
        let nodeCenters: Tuple3[] = new Array(bodyMasses.length * 4);
        let nodeCount = 0;

        function createNode(upper: Tuple3, lower: Tuple3): number {
            insert2D(nodeUpperLimits, nodeCount, 3, upper);
            insert2D(nodeLowerLimits, nodeCount, 3, lower);
            nodeBodyIds[nodeCount] = -1;
            return nodeCount++;
        }
        function bodyInRange(node: number, body: number): boolean {
            let lower = extract2D(nodeLowerLimits, node, 3);
            let upper = extract2D(nodeUpperLimits, node, 3);
            return lower[0] <= bodyPositions[body * 3 + 0] &&
                lower[1] <= bodyPositions[body * 3 + 1] &&
                lower[2] <= bodyPositions[body * 3 + 2] &&
                upper[0] > bodyPositions[body * 3 + 0] &&
                upper[1] > bodyPositions[body * 3 + 1] &&
                upper[2] > bodyPositions[body * 3 + 2];
        }
        function subDivideNode(node: number) {
            if (nodeChildren[node * 8 + 7] !== 0) return; //  check last child idx since the first one might be 0
            let upperLimit = extract2D(nodeUpperLimits, node, 3) as Tuple3;
            let lowerLimit = extract2D(nodeLowerLimits, node, 3) as Tuple3;
            let center = [(upperLimit[0] + lowerLimit[0]) / 2, (upperLimit[1] + lowerLimit[1]) / 2, (upperLimit[2] + lowerLimit[2]) / 2] as Tuple3;
            nodeCenters[node] = center;
            insert2D(nodeChildren, node, 8, [
                // Left-Bottom-Front
                createNode(center, lowerLimit),
                // Left-Bottom-Back
                createNode([center[0], center[1], upperLimit[2]], [lowerLimit[0], lowerLimit[1], center[2]]),
                // Left-Top-Front
                createNode([center[0], upperLimit[1], center[2]], [lowerLimit[0], center[1], lowerLimit[2]]),
                // Left-Top-Back
                createNode([center[0], upperLimit[1], upperLimit[2]], [lowerLimit[0], center[1], center[2]]),

                // Right-Bottom-Front
                createNode([upperLimit[0], center[1], center[2]], [center[0], lowerLimit[1], lowerLimit[2]]),
                // Right-Bottom-Back
                createNode([upperLimit[0], center[1], upperLimit[2]], [center[0], lowerLimit[1], center[2]]),
                // Right-Top-Front
                createNode([upperLimit[0], upperLimit[1], center[2]], [center[0], center[1], lowerLimit[2]]),
                // Right-Top-Back
                createNode(upperLimit, center)
            ]);
            if (nodeBodyIds[node] !== -1) {
                // There was a body assigned to this node, move it to a subdivision
                let childIdx = findChildNodeForBody(node,  nodeBodyIds[node]);
                assignBody(childIdx, nodeBodyIds[node]);
                nodeBodyIds[node] = -1;
            }
        }
        function findChildNodeForBody(node: number, b: number): number {
            let center = nodeCenters[node];
            let childIdx = node * 8;
            if (bodyPositions[b * 3 + 0] >= center[0]) childIdx += 4; // RIGHT
            if (bodyPositions[b * 3 + 1] >= center[1]) childIdx += 2; // TOP
            if (bodyPositions[b * 3 + 2] >= center[2]) childIdx += 1; // BACK
            return nodeChildren[childIdx];
        }
        function assignBody(node: number, b: number): void {
            // TESTING ONLY, CAN BE REMOVED LATER
            //if (!bodyInRange(node, b)) {
            //    throw "Body not in range!";
            //}

            // Update octant weight statistics 
            let oldMass = nodeMasses[node];
            nodeMasses[node] += bodyMasses[b];
            nodeCoMs[node * 3 + 0] = (nodeCoMs[node * 3 + 0] * oldMass + bodyMasses[b] * bodyPositions[b * 3 + 0]) / nodeMasses[node];
            nodeCoMs[node * 3 + 1] = (nodeCoMs[node * 3 + 1] * oldMass + bodyMasses[b] * bodyPositions[b * 3 + 1]) / nodeMasses[node];
            nodeCoMs[node * 3 + 2] = (nodeCoMs[node * 3 + 2] * oldMass + bodyMasses[b] * bodyPositions[b * 3 + 2]) / nodeMasses[node];

            if (oldMass === 0) {
                nodeBodyIds[node] = b;
            } else {
                subDivideNode(node); // will not subdivide if already subdivided.

                let childIdx = findChildNodeForBody(node, b);
                assignBody(childIdx, b);
            }
        }
        let t0 = performance.now();
        for (let x = 0; x < 10; x++) {

            nodeBodyIds = new Int32Array(bodyMasses.length * 4);
            nodeCoMs = new Float32Array(bodyMasses.length * 4 * 3);
            nodeMasses = new Float32Array(bodyMasses.length * 4 * 3);
            nodeChildren= new Int32Array(bodyMasses.length * 4 * 8);
            nodeUpperLimits= new Float32Array(bodyMasses.length * 4 * 3);
            nodeLowerLimits= new Float32Array(bodyMasses.length * 4 * 3);
            nodeCenters= new Array(bodyMasses.length * 4);
            nodeCount = 0;

            let root = createNode(spaceUpperLimit, spaceLowerLimit);
            for (let i = 0; i < bodyMasses.length; i++) {
                assignBody(root, i);
            }    
        }

        let t1 = performance.now();
        let time = t1 - t0;
        console.log(time / 10);
    }

    public processSimulationStep(bodies: IBody[]) {
        if (!bodies || bodies.length === 0) return;
        let t0 = performance.now();
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

        let t1 = performance.now();

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
                for (let i = 0; i < o.children.length; i++) {
                    addToFlatTree(o.children[i], i < o.children.length - 1 ? o.children[i + 1] : null);
                }
            }
        }
        addToFlatTree(root);

        for (let sc of shortcutsToAdd) {
            flatTree[sc[0]] = sc[1].flatIndex;
        }

        let t3 = performance.now();
        console.log(t1 - t0 + "ms");
        console.log(t2 - t1 + "ms");
        console.log(t3 - t2 + "ms");
        console.log("TOTAL: " + (t3 - t0) + "ms");

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