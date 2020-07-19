import earthTextureSrc from 'assets/earth.jpg';
import sunTextureSrc from 'assets/sun.jpg';
import mercuryTextureSrc from 'assets/mercury.jpg';
import earthCloudsTexture from 'assets/earth_clouds.jpg';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer, Material, PickingInfo, PointerEventTypes, LinesMesh, Light } from "babylonjs";
import * as $ from "jquery";
import Body from "../models/Body";
import { calcNetForce, integrateMotion, accelerationFromForce, vectorMagnitude, vectorDivide } from '../models/PhysicsEngine';
import TimeControlWindow from './windows/timeControlWindow';
import ObjectBrowserWindow from './windows/objectBrowserWindow';
import NewObjectWindow from './windows/newObjectWindow';
import EventEmitter from '../models/EventEmitter';
import SimulationPropertiesWindow from './windows/simulationPropertiesWindow';
import FileWindow from './windows/fileWindow';
import { GPU, IKernelRunShortcut } from 'gpu.js';
import TerminalWindow from './windows/terminalWindow';

export enum BodyAppearance {
    Blank = "Blank",
    Sun = "Sun", 
    Earth = "Earth", 
    Mercury = "Mercury"
}

type Point3DTuple = [number, number, number];

class Simulation {
    public bodies: Body[] = [];
    public elem : HTMLCanvasElement;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public targetBody: Body;
    private nextId: number = 1;

    public get bgColor(): Color4 { return this.scene.clearColor; }
    public set bgColor(c: Color4) { this.scene.clearColor = c; }
    public forceMode: "GPU" | "CPU" = null;

    private materials : {[key in BodyAppearance]: Material};
    private gpuKernel: IKernelRunShortcut;

    constructor() {
        this.elem = document.createElement("canvas");
        this.elem.id = "renderCanvas";
        document.body.appendChild(this.elem);

        var engine: Engine = new Engine(this.elem, true);

        // scene setup
        var scene: Scene = new Scene(engine);
        this.scene = scene;
        scene.clearColor = new Color4(0.1, 0.1, 0.1); // background colour

        // camera
        this.camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 60, Vector3.Zero(), scene);
        this.camera.attachControl(this.elem, true);

        // materials
        var mercuryMaterial = new StandardMaterial("mercuryMaterial", scene);
        mercuryMaterial.diffuseTexture = new Texture(mercuryTextureSrc, scene);
        mercuryMaterial.specularColor = Color3.Black();

        var sunMaterial = new StandardMaterial("sunMaterial", scene);
        sunMaterial.diffuseTexture = new Texture(sunTextureSrc, scene);
        sunMaterial.emissiveColor = new Color3(241, 135, 39);

        var earthMaterial = new StandardMaterial("earthMaterial", scene);
        earthMaterial.diffuseTexture = new Texture(earthTextureSrc, scene);

        this.materials = {
            [BodyAppearance.Sun]: sunMaterial,
            [BodyAppearance.Mercury]: mercuryMaterial,
            [BodyAppearance.Earth]: earthMaterial,
            [BodyAppearance.Blank]: new StandardMaterial("blankMaterial", scene)
        };

        // glow layer for sun
        var gl = new GlowLayer("glow", scene, { 
            mainTextureRatio: 0.1
        });
        gl.intensity = 0.6;
        
        // Register simulation with windows that need it
        ObjectBrowserWindow.instance.attachSimulation(this);
        NewObjectWindow.instance.attachSimulation(this);
        SimulationPropertiesWindow.instance.attachSimulation(this);
        FileWindow.instance.attachSimulation(this);
        TerminalWindow.instance.attachSimulation(this);

        // register bodies
        let sunBody = this.addBody("Sun", 100000, Vector3.Zero(), 30, BodyAppearance.Sun, Vector3.Zero(), 1000);
        this.addBody("Earth", 200, new Vector3(-60, 0, 0), 10, BodyAppearance.Earth, new Vector3(0, 0.0002, 0.0002));
        this.addBody("Mercury", 100, new Vector3(50, 0, 0), 10, BodyAppearance.Mercury, new Vector3(0, 0.0003, 0));

        this.target(sunBody);

        // Register event handlers
        scene.onPointerUp = (evt, pickInfo, type) => this.pointerUpHandler(evt, pickInfo, type);

        // Render loop
        let fpsLabel = document.getElementById("fpsCounter");
        let c = 0;
        let timeControlWindow = TimeControlWindow.instance;
        engine.runRenderLoop(() => {
            if (timeControlWindow.speedValue !== 0 && this.bodies.length) {
                let netForces: Vector3[];
                if ((this.bodies.length > 200 && this.forceMode !== "CPU") || this.forceMode === "GPU") {
                    let gpuOuput = this.getGpuKernel()(
                        this.bodies.map(x => [x.position.x, x.position.y, x.position.z]).flat(),
                        this.bodies.map(x => x.mass)) as Point3DTuple[];
                    netForces = gpuOuput.map(x => new Vector3(x[0], x[1], x[2]));
                } else {
                    netForces = this.bodies.map(x => calcNetForce(x, this.bodies));
                }

                for (let i = 0; i<this.bodies.length; i++) {
                    let b = this.bodies[i];
                    b.velocity = integrateMotion(vectorDivide(netForces[i], b.mass), b.velocity, timeControlWindow.speedValue);
                    b.position = integrateMotion(b.velocity, b.position, timeControlWindow.speedValue);
                }

                /*for (let b of this.bodies) {
                    b.position = integrateMotion(b.velocity, b.position, timeControlWindow.speedValue);
                    let netForce = calcNetForce(b, this.bodies);
                    b.velocity = integrateMotion(accelerationFromForce(netForce, b.mass), b.velocity, timeControlWindow.speedValue);
                }*/
            }

            scene.render();
            c++;
            if (c === 5) {
                fpsLabel.innerHTML = engine.getFps().toFixed(1) + " FPS";
                c = 0;
            }
        });

        window.addEventListener("resize", function(){engine.resize();});
    }

    public addBody(name: string, mass: number, position: Vector3, diameter: number, appearance: BodyAppearance, velocity: Vector3 = null, lightRange: number = null): Body {
        let mesh: Mesh = MeshBuilder.CreateSphere(name, { diameter: diameter }, this.scene);
        mesh.position = position;
        mesh.material = this.materials[appearance];
        let light: PointLight = null;
        if (lightRange != null && lightRange > 0)
        {
            light = new PointLight(name+"Light", position, this.scene);
            light.range = lightRange;
        }

        let body = new Body(mesh, mass, diameter, velocity, light, appearance);
        this.addBodies([body]);

        return body;
    }

    public addBodies(bodies: Body[]) {
        for (let b of bodies) {
            b.id = this.nextId;
            this.bodies.push(b);
            this.nextId++;
        }
        this.onAddBodies.trigger(bodies);
    }

    public removeBody(b: Body) {
        this.removeBodies([b]);
    }

    public removeBodies(bodies: Body[]) {
        for (let b of bodies) {
            let idx = this.bodies.indexOf(b);
            if (idx !== -1) {
                this.bodies.splice(idx, 1);
                b.mesh.dispose();
                if (b.light) b.light.dispose();
            }
        }
        this.nextId = this.bodies.length ? this.bodies[this.bodies.length - 1].id + 1 : 1;
        this.onRemoveBodies.trigger(bodies);
    }

    public target(b: Body) {
        if (!b || this.targetBody === b) return;
        this.targetBody = b;
        this.camera.setTarget(b.mesh);
        this.camera.radius = b.diameter * 5;
        this.onTargetChange.trigger(b);
    }

    private pointerUpHandler(evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) {
        if (pickInfo.hit) {
            let b = this.bodies.find(x => x.mesh === pickInfo.pickedMesh);
            this.target(b);
        }
    }

    public get axesVisible() { return !!this.axesLines; }
    private axesLines: LinesMesh[] = null;
    public showAxes(size: number) {
        if (this.axesLines) this.hideAxes();

        var axisX = Mesh.CreateLines("axisX", [ 
            Vector3.Zero(), new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0), 
            new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
            ], this.scene);
        axisX.color = new Color3(1, 0, 0);
        var axisY = Mesh.CreateLines("axisY", [
            Vector3.Zero(), new Vector3(0, size, 0), new Vector3( -0.05 * size, size * 0.95, 0), 
            new Vector3(0, size, 0), new Vector3( 0.05 * size, size * 0.95, 0)
            ], this.scene);
        axisY.color = new Color3(0, 0, 1);
        var axisZ = Mesh.CreateLines("axisZ", [
            Vector3.Zero(), new Vector3(0, 0, size), new Vector3( 0 , -0.05 * size, size * 0.95),
            new Vector3(0, 0, size), new Vector3( 0, 0.05 * size, size * 0.95)
            ], this.scene);
        axisZ.color = new Color3(0, 1, 0);

        this.axesLines = [axisX, axisY, axisZ];
    }

    public hideAxes() {
        this.axesLines.forEach(x => x.dispose());
        this.axesLines = null;
    }

    public get globalLightEnabled() { return !!this.globalLights; }
    private globalLights: HemisphericLight[];
    public enableGlobalLight() {
        if (this.globalLights) return;
        this.globalLights = [
            new HemisphericLight("Global_Up",new Vector3(0, 0, 1), this.scene),
            new HemisphericLight("Global_Down",new Vector3(0, 0, -1), this.scene)
        ];
    }
    public disableGlobalLight() {
        if (!this.globalLights) return;
        this.globalLights.forEach(x => x.dispose());
        this.globalLights = null;
    }

    private gpu: GPU = new GPU();
    private initGPU() {
        let gpu = new GPU();
        function gpuVectorAdd(v1: Point3DTuple, v2: Point3DTuple): Point3DTuple { return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]; }
        function gpuVectorSubtract(v1: Point3DTuple, v2: Point3DTuple): Point3DTuple { return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]]; }
        function gpuVectorMultiply(v1: Point3DTuple, n: number): Point3DTuple { return [v1[0] * n, v1[1] * n, v1[2] * n]; }
        function gpuVectorDivide(v1: Point3DTuple, n: number): Point3DTuple { return [v1[0] / n, v1[1] / n, v1[2] / n]; }
        function gpuVectorMagnitude(v: Point3DTuple): number { return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2) + Math.pow(v[2], 2)); }
        function gpuIntegrateMotion(a: Point3DTuple, initial: Point3DTuple, dt: number): Point3DTuple { return gpuVectorAdd(gpuVectorMultiply(a, dt), initial); }
        gpu.addFunction(gpuVectorAdd, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Array(3)' });
        gpu.addFunction(gpuVectorSubtract, { argumentTypes: { v1: 'Array(3)', v2: 'Array(3)'}, returnType: 'Array(3)' });
        gpu.addFunction(gpuVectorMultiply, { argumentTypes: { v1: 'Array(3)', n: 'Float'}, returnType: 'Array(3)' });
        gpu.addFunction(gpuVectorDivide, { argumentTypes: { v1: 'Array(3)', n: 'Float'}, returnType: 'Array(3)' });
        gpu.addFunction(gpuVectorMagnitude, { argumentTypes: { v1: 'Array(3)' }, returnType: 'Float' });
        gpu.addFunction(gpuIntegrateMotion, { argumentTypes: { a: 'Array(3)', initial: 'Array(3)', dt: 'Float' }, returnType: 'Array(3)' });
    }
    private getGpuKernel() {
        if (!this.gpuKernel || this.gpuKernel.output[0] !== this.bodies.length) {
            this.gpuKernel = this.gpu.createKernel(function (posFlat: number[], masses: number[]) {
                let netForce = [0.0, 0.0, 0.0] as Point3DTuple;
                for (let i = 0; i < this.output.x; i++) {
                    if (i !== this.thread.x) {
                        let bp = [posFlat[this.thread.x * 3 + 0], posFlat[this.thread.x * 3 + 1], posFlat[this.thread.x * 3 + 2]];
                        let obp = [posFlat[i * 3 + 0], posFlat[i * 3 + 1], posFlat[i * 3 + 2]];
                        
                        let p2pVect = [obp[0] - bp[0], obp[1] - bp[1], obp[2] - bp[2]] as [number, number, number];
                        let distance = Math.sqrt(Math.pow(p2pVect[0], 2) + Math.pow(p2pVect[1], 2) + Math.pow(p2pVect[2], 2));
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
                output: [this.bodies.length],
                tactic: "precision",
                precision: "single"
            });
        }

        return this.gpuKernel;
    }

    // Event Stuff
    public onAddBodies = new EventEmitter<Body[]>();
    public onRemoveBodies = new EventEmitter<Body[]>();
    public onTargetChange = new EventEmitter<Body>();
}

export default Simulation;