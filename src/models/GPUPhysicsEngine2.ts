import { GPU, Kernel, IKernelRunShortcut } from "gpu.js";
import { Vector3 } from "babylonjs";
import { IBody } from '../models/Body/IBody';
import Simulation from "../components/simulation";

export type Tuple3 = [number, number, number];
export type Tuple6 = [number, number, number, number, number, number];
export class GPUPhysicsEngine2 {
    // GPU Stuff
    private gpu: GPU = new GPU();
    private _kernel: IKernelRunShortcut;
    
    // Simulation
    private simulation: Simulation;
    private N: number;
    private bodyPositions: number[];
    private bodyMasses: number[];

    // B&H Stuff
    private nodeCount: number = 0;
    private maxNodes: number;
    private nodeBodyIds: Int32Array;
    private nodeCoMs: Float32Array;
    private nodeMasses: Float32Array;
    private nodeChildren: Int32Array;
    private nodeUpperLimits: Float32Array;
    private nodeLowerLimits: Float32Array;
    private nodeCenters: Float32Array;
    private nodeWidths: Float32Array;

    // config
    private readonly nodeMemoryMultiplier = 6;


    constructor(simulation: Simulation) {
        this.simulation = simulation;
        this.N = simulation.bodies.length;
        this.allocateMemory(this.N * this.nodeMemoryMultiplier);
        this.gpu.addFunction(extractV3, { argumentTypes: { flat: 'Array', n: 'Integer'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorAdd, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorMultiply, { argumentTypes: { v1: 'Array(3)', n: 'Number'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorDivide, { argumentTypes: { v1: 'Array(3)', n: 'Number'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorSubtract, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Array(3)' });
        this.gpu.addFunction(vectorMagnitude, { argumentTypes: { v: 'Array(3)'}, returnType: 'Number' });
        this.gpu.addFunction(calcDistance, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Number' });
        this.gpu.addFunction(integrateMotion, { argumentTypes: { a: 'Array(3)', initial: 'Array(3)', dt: 'Number'}, returnType: 'Array(3)' });
        this.gpu.addFunction(floatToInt, { argumentTypes: { float: 'Number' }, returnType: 'Integer' });
    }

    private allocateMemory(maxNodes: number) {
        this.maxNodes = maxNodes;
        this.nodeBodyIds = new Int32Array(maxNodes);
        this.nodeCoMs = new Float32Array(maxNodes * 3);
        this.nodeMasses = new Float32Array(maxNodes);
        this.nodeChildren = new Int32Array(maxNodes * 8);
        this.nodeUpperLimits = new Float32Array(maxNodes * 3);
        this.nodeLowerLimits = new Float32Array(maxNodes * 3);
        this.nodeCenters = new Float32Array(maxNodes * 3);
        this.nodeWidths = new Float32Array(maxNodes);
    }

    private expandMemory(extraNodes: number) {
        let backup = {
            nodeBodyIds: this.nodeBodyIds,
            nodeCoMs: this.nodeCoMs,
            nodeMasses: this.nodeMasses,
            nodeChildren: this.nodeChildren,
            nodeUpperLimits: this.nodeUpperLimits,
            nodeLowerLimits: this.nodeLowerLimits,
            nodeCenters: this.nodeCenters,
            nodeWidths: this.nodeWidths
        };
        this.allocateMemory(this.maxNodes + extraNodes);

        this.nodeBodyIds.set(backup.nodeBodyIds);
        this.nodeCoMs.set(backup.nodeCoMs);
        this.nodeMasses.set(backup.nodeMasses);
        this.nodeChildren.set(backup.nodeChildren);
        this.nodeUpperLimits.set(backup.nodeUpperLimits);
        this.nodeLowerLimits.set(backup.nodeLowerLimits);
        this.nodeCenters.set(backup.nodeCenters);
        this.nodeWidths.set(backup.nodeWidths);
    }

    private createNode(upper: Tuple3, lower: Tuple3): number {
        if (this.nodeCount >= this.maxNodes) this.expandMemory(this.bodyPositions.length * 2);
        insert2D(this.nodeUpperLimits, this.nodeCount, 3, upper);
        insert2D(this.nodeLowerLimits, this.nodeCount, 3, lower);
        this.nodeBodyIds[this.nodeCount] = -1;
        this.nodeMasses[this.nodeCount] = 0;
        this.nodeChildren[this.nodeCount * 8 + 7] = 0;
        this.nodeWidths[this.nodeCount] = upper[0] - lower[0];
        return this.nodeCount++;
    }
    private bodyInRange(node: number, body: number): boolean {
        let lower = extract2D(this.nodeLowerLimits, node, 3);
        let upper = extract2D(this.nodeUpperLimits, node, 3);
        return lower[0] <= this.bodyPositions[body * 3 + 0] &&
            lower[1] <= this.bodyPositions[body * 3 + 1] &&
            lower[2] <= this.bodyPositions[body * 3 + 2] &&
            upper[0] > this.bodyPositions[body * 3 + 0] &&
            upper[1] > this.bodyPositions[body * 3 + 1] &&
            upper[2] > this.bodyPositions[body * 3 + 2];
    }
    private subDivideNode(node: number) {
        if (this.nodeChildren[node * 8 + 7] !== 0) return; //  check last child idx since the first one might be 0
        let upperLimit = extract2D(this.nodeUpperLimits, node, 3) as Tuple3;
        let lowerLimit = extract2D(this.nodeLowerLimits, node, 3) as Tuple3;
        let center = [(upperLimit[0] + lowerLimit[0]) / 2, (upperLimit[1] + lowerLimit[1]) / 2, (upperLimit[2] + lowerLimit[2]) / 2] as Tuple3;
        insert2D(this.nodeCenters, node, 3, center);
        let childrenIds = [
            // Left-Bottom-Front
            this.createNode(center, lowerLimit),
            // Left-Bottom-Back
            this.createNode([center[0], center[1], upperLimit[2]], [lowerLimit[0], lowerLimit[1], center[2]]),
            // Left-Top-Front
            this.createNode([center[0], upperLimit[1], center[2]], [lowerLimit[0], center[1], lowerLimit[2]]),
            // Left-Top-Back
            this.createNode([center[0], upperLimit[1], upperLimit[2]], [lowerLimit[0], center[1], center[2]]),

            // Right-Bottom-Front
            this.createNode([upperLimit[0], center[1], center[2]], [center[0], lowerLimit[1], lowerLimit[2]]),
            // Right-Bottom-Back
            this.createNode([upperLimit[0], center[1], upperLimit[2]], [center[0], lowerLimit[1], center[2]]),
            // Right-Top-Front
            this.createNode([upperLimit[0], upperLimit[1], center[2]], [center[0], center[1], lowerLimit[2]]),
            // Right-Top-Back
            this.createNode(upperLimit, center)
        ];
        insert2D(this.nodeChildren, node, 8, childrenIds);
        if (this.nodeBodyIds[node] !== -1) {
            // There was a body assigned to this node, move it to a subdivision
            let childIdx = this.findChildNodeForBody(node,  this.nodeBodyIds[node]);
            this.assignBody(childIdx, this.nodeBodyIds[node]);
            this.nodeBodyIds[node] = -1;
        }
    }
    private findChildNodeForBody(node: number, b: number): number {
        let childIdx = node * 8;
        if (this.bodyPositions[b * 3 + 0] >= this.nodeCenters[node * 3 + 0]) childIdx += 4; // RIGHT
        if (this.bodyPositions[b * 3 + 1] >= this.nodeCenters[node * 3 + 1]) childIdx += 2; // TOP
        if (this.bodyPositions[b * 3 + 2] >= this.nodeCenters[node * 3 + 2]) childIdx += 1; // BACK
        return this.nodeChildren[childIdx];
    }
    private assignBody(node: number, b: number): void {
        // Update octant weight statistics 
        let oldMass = this.nodeMasses[node];
        this.nodeMasses[node] += this.bodyMasses[b];
        this.nodeCoMs[node * 3 + 0] = (this.nodeCoMs[node * 3 + 0] * oldMass + this.bodyMasses[b] * this.bodyPositions[b * 3 + 0]) / this.nodeMasses[node];
        this.nodeCoMs[node * 3 + 1] = (this.nodeCoMs[node * 3 + 1] * oldMass + this.bodyMasses[b] * this.bodyPositions[b * 3 + 1]) / this.nodeMasses[node];
        this.nodeCoMs[node * 3 + 2] = (this.nodeCoMs[node * 3 + 2] * oldMass + this.bodyMasses[b] * this.bodyPositions[b * 3 + 2]) / this.nodeMasses[node];

        if (oldMass === 0) {
            this.nodeBodyIds[node] = b;
        } else {
            this.subDivideNode(node); // will not subdivide if already subdivided.

            let childIdx = this.findChildNodeForBody(node, b);
            this.assignBody(childIdx, b);
        }
    }

    private preProcess() {
        // === Step 1: Find upper and lower limits ===
        let spaceUpperLimit = extractV3(this.bodyPositions, 0);
        let spaceLowerLimit = extractV3(this.bodyPositions, 0);
        for (let i = 0; i < this.N; i++) {
            let idx = i * 3;
            if (this.bodyPositions[idx + 0] > spaceUpperLimit[0]) spaceUpperLimit[0] = this.bodyPositions[idx + 0];
            if (this.bodyPositions[idx + 1] > spaceUpperLimit[1]) spaceUpperLimit[1] = this.bodyPositions[idx + 1];
            if (this.bodyPositions[idx + 2] > spaceUpperLimit[2]) spaceUpperLimit[2] = this.bodyPositions[idx + 2];
            if (this.bodyPositions[idx + 0] < spaceLowerLimit[0]) spaceLowerLimit[0] = this.bodyPositions[idx + 0];
            if (this.bodyPositions[idx + 1] < spaceLowerLimit[1]) spaceLowerLimit[1] = this.bodyPositions[idx + 1];
            if (this.bodyPositions[idx + 2] < spaceLowerLimit[2]) spaceLowerLimit[2] = this.bodyPositions[idx + 2];
        }

        // squareify region
        let maxDiff = Math.max(spaceUpperLimit[0] - spaceLowerLimit[0], spaceUpperLimit[1] - spaceLowerLimit[1], spaceUpperLimit[2] - spaceLowerLimit[2]);
        spaceUpperLimit[0] = spaceLowerLimit[0] + maxDiff + 1; 
        spaceUpperLimit[1] = spaceLowerLimit[1] + maxDiff + 1;
        spaceUpperLimit[2] = spaceLowerLimit[2] + maxDiff + 1;

        // === Step 2: Build BH Tree ===
        let root = this.createNode(spaceUpperLimit, spaceLowerLimit);
        for (let i = 0; i < this.N; i++) {
            this.assignBody(root, i);
        }
    }

    public processSimulationStep() {
        // Delete all nodes
        this.nodeCount = 0;

        // read data from simulation
        this.bodyPositions = this.simulation.bodies.map(x => [x.position.x, x.position.y, x.position.z]).flat();
        this.bodyMasses = this.simulation.bodies.map(x => x.mass);
        this.N = this.bodyMasses.length;

        // allocate more memory if needed
        if (this.maxNodes < this.N * this.nodeMemoryMultiplier) {
            this.allocateMemory(this.N * this.nodeMemoryMultiplier);
        }

        // Build the BH tree
        this.preProcess();

        // Walk like an egyptian
        let t0 = performance.now();
        let searchOrder: Int32Array = new Int32Array(this.nodeCount);
        let siblingShortcuts: Int32Array = new Int32Array(this.nodeCount);
        let i = 0;
        let walk = (node) => {
            searchOrder[i] = node;
            siblingShortcuts[i] = -1;
            i++;
            if (this.nodeBodyIds[node] !== -1) {
                return i - 1;
            } else {
                let lastChildSearchPos = -1;
                for (let i = 0; i< 8; i++) {
                    if (lastChildSearchPos !== -1) {
                        siblingShortcuts[lastChildSearchPos] = walk(this.nodeChildren[node * 8 + i]);
                        lastChildSearchPos = siblingShortcuts[lastChildSearchPos];
                    } else {
                        lastChildSearchPos = walk(this.nodeChildren[node * 8 + i]);
                    }
                }
                return i - 1;
            }
        }
        let t1 = performance.now();
        //console.log("walk time: " + (t1 - t0));

        // Build GPU kernel if needed
        if (!this._kernel || this._kernel.output[0] !== this.N) {
            this._kernel = this.gpu.createKernel(function(nodeBodyIds: number[], nodeCoMs: number[], nodeMasses: number[], searchOrder: number[], siblingShortcuts: number[], nodeWidths: number[], nodeCount: number, bodyPositions: number[], bodyMasses: number[]) {
                let netForce = [0.0, 0.0, 0.0] as Tuple3;
                let bPos = extractV3(bodyPositions, this.thread.x);
                for (let i = 0; i<nodeCount; i++) {
                    let node = searchOrder[i];

                    if (nodeMasses[node] !== 0) { // Ignore empty nodes
                        if (nodeBodyIds[node] !== -1) {
                            // External Node (that is not the current body)
                            if (nodeBodyIds[node] !== this.thread.x) {
                                let nPos = extractV3(nodeCoMs as any, node);
                                let p2pVect = vectorSubtract(nPos, bPos);
                                let distance = vectorMagnitude(p2pVect);
                                let m = (6.67408e-11 * nodeMasses[node] * bodyMasses[this.thread.x]) / Math.pow(distance, 3);
                                netForce[0] += p2pVect[0] * m;
                                netForce[1] += p2pVect[1] * m;
                                netForce[2] += p2pVect[2] * m;
                            }
                        } else {
                            let nPos = extractV3(nodeCoMs as any, node);
                            let p2pVect = vectorSubtract(nPos, bPos);
                            let distance = vectorMagnitude(p2pVect);
    
                            let sd = nodeWidths[node] / distance;
                            if (sd < this.constants.theta) { // this.constants.theta
                                let m = (6.67408e-11 * nodeMasses[node] * bodyMasses[this.thread.x]) / Math.pow(distance, 3);
                                netForce[0] += p2pVect[0] * m;
                                netForce[1] += p2pVect[1] * m;
                                netForce[2] += p2pVect[2] * m;
                                
                                // Use shortcut to get to next sibling
                                i = floatToInt(siblingShortcuts[i]) - 1;
                            }
                        }
                    }
                }
                /*function walk(node: number) {
                    if (nodeMasses[node] === 0) 
                        return; // Ignore empty nodes
                    if (nodeBodyIds[node] !== -1) {
                        // External Node (that is not the current body)
                        if (nodeBodyIds[node] !== this.thread.x) {
                            let nPos = extractV3(nodeCoMs as any, node);
                            let p2pVect = vectorSubtract(nPos, bPos);
                            let distance = vectorMagnitude(p2pVect);
                            let m = (6.67408e-11 * nodeMasses[node] * bodyMasses[this.thread.x]) / Math.pow(distance, 3);
                            netForce[0] += p2pVect[0] * m;
                            netForce[1] += p2pVect[1] * m;
                            netForce[2] += p2pVect[2] * m;
                        }
                    } else {
                        let nPos = extractV3(nodeCoMs as any, node);
                        let p2pVect = vectorSubtract(nPos, bPos);
                        let distance = vectorMagnitude(p2pVect);

                        let sd = nodeWidths[node] / distance;
                        if (sd < 0.5) { // this.constants.theta
                            let m = (6.67408e-11 * nodeMasses[node] * bodyMasses[this.thread.x]) / Math.pow(distance, 3);
                            netForce[0] += p2pVect[0] * m;
                            netForce[1] += p2pVect[1] * m;
                            netForce[2] += p2pVect[2] * m;
                        } else if (nodeChildren[node * 8 + 7] !== 0) {
                            for (let i = 0; i < 8; i++) {
                                walk(nodeChildren[node * 8 + i]);
                            }
                        }
                    }
                }
                walk(0);*/
                return netForce;
            }, {
                output: [this.N],
                tactic: "precision",
                precision: "single",
                constants: {theta: 0},
                dynamicArguments: true
            });
        }

        // Run GPU kernel
        let result = null;
        result = this._kernel(
            this.nodeBodyIds as any,
            this.nodeCoMs as any,
            this.nodeMasses as any,
            searchOrder as any,
            siblingShortcuts as any,
            this.nodeWidths as any,
            this.nodeCount,
            this.bodyPositions,
            this.bodyMasses
        ) as Tuple3[];

        return result;
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
function floatToInt(float: number) {
    return float;
}
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