import earthTextureSrc from 'assets/earth.jpg';
import sunTextureSrc from 'assets/sun.jpg';
import mercuryTextureSrc from 'assets/mercury.jpg';
import earthCloudsTexture from 'assets/earth_clouds.jpg';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer, Material, PickingInfo, PointerEventTypes, LinesMesh, Light, SpriteManager } from "babylonjs";
import * as $ from "jquery";
import Body3D from "../models/Body/Body3D";
import { calcNetForce, integrateMotion, accelerationFromForce, vectorMagnitude, vectorDivide } from '../models/PhysicsEngine';
import TimeControlWindow from './windows/timeControlWindow';
import ObjectBrowserWindow from './windows/objectBrowserWindow';
import NewObjectWindow from './windows/newObjectWindow';
import EventEmitter from '../models/EventEmitter';
import SimulationPropertiesWindow from './windows/simulationPropertiesWindow';
import FileWindow from './windows/fileWindow';
import { GPU, IKernelRunShortcut } from 'gpu.js';
import TerminalWindow from './windows/terminalWindow';
import FastAverageColor from 'fast-average-color';
import { IBody } from '../models/Body/IBody';
import Body2D from '../models/Body/Body2D';
import whiteCircleSrc from 'assets/WhiteCircle.png';
import { GPUPhysicsEngine } from '../models/GPUPhysicsEngine';
import { GPUPhysicsEngine2 } from '../models/GPUPhysicsEngine2';

export enum BodyAppearance {
    Blank = "Blank",
    Sun = "Sun", 
    Earth = "Earth", 
    Mercury = "Mercury"
}

type Point3DTuple = [number, number, number];

class Simulation {
    public bodies: IBody[] = [];
    public elem : HTMLCanvasElement;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public targetBody: IBody;

    public get bgColor(): Color4 { return this.scene.clearColor; }
    public set bgColor(c: Color4) { this.scene.clearColor = c; }
    public forceMode: "GPU" | "CPU" | "GPU-BH" = null;
    public renderMode: "2D" | "3D" = "3D";
    public spriteManagers: SpriteManager[] = [];

    public materials : {[key in BodyAppearance]: Material};
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

        this.setTarget(sunBody);

        // Register event handlers
        scene.onPointerUp = (evt, pickInfo, type) => this.pointerUpHandler(evt, pickInfo, type);

        // Render loop
        let fpsLabel = document.getElementById("fpsCounter");
        let c = 0;
        let timeControlWindow = TimeControlWindow.instance;
        let gpu2 = new GPUPhysicsEngine2(this);
        engine.runRenderLoop(() => {
            if (timeControlWindow.speedValue !== 0 && this.bodies.length) {
                let netForces: Vector3[];
                if ((this.bodies.length > 200 && !this.forceMode) || this.forceMode === "GPU") {
                    let gpuOuput = this.getGpuKernel()(
                        this.bodies.map(x => [x.position.x, x.position.y, x.position.z]).flat(),
                        this.bodies.map(x => x.mass)) as Point3DTuple[];
                    netForces = gpuOuput.map(x => new Vector3(x[0], x[1], x[2]));
                } else if (this.forceMode === "GPU-BH") {
                    let gpuOuput = gpu2.processSimulationStep();
                    netForces = gpuOuput.map(x => new Vector3(x[0], x[1], x[2]));
                } else {
                    netForces = this.bodies.map(x => calcNetForce(x, this.bodies));
                }

                for (let i = 0; i<this.bodies.length; i++) {
                    let b = this.bodies[i];
                    b.velocity = integrateMotion(vectorDivide(netForces[i], b.mass), b.velocity, timeControlWindow.speedValue);
                    b.position = integrateMotion(b.velocity, b.position, timeControlWindow.speedValue);
                }

                if (this.targetBody instanceof Body2D) {
                    this.camera.setTarget(this.targetBody.position);
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

    public createBody(name: string, mass: number, position: Vector3, diameter: number, appearance: BodyAppearance, velocity: Vector3 = null, lightRange: number = null) : IBody {
        if (this.renderMode === "2D") 
            return new Body2D(name, mass, position, diameter, appearance, this, velocity, lightRange);
        else if (this.renderMode === "3D")
            return new Body3D(name, mass, position, diameter, appearance, this, velocity, lightRange);
        return null;
    }

    public addBody(name: string, mass: number, position: Vector3, diameter: number, appearance: BodyAppearance, velocity: Vector3 = null, lightRange: number = null): IBody {
        let body = this.createBody(name, mass, position, diameter, appearance, velocity, lightRange);
        this.addBodies([body]);

        return body;
    }

    public addBodies(bodies: IBody[]) {
        let i = this.bodies.length ? this.bodies[this.bodies.length - 1].id + 1 : 1;
        for (let b of bodies) {
            b.id = i;
            i++;
        }
        this.bodies.push(...bodies);
        this.onAddBodies.trigger(bodies);
    }

    public removeBody(b: IBody) {
        this.removeBodies([b]);
    }

    public removeBodies(bodies: IBody[]) {
        for (let b of bodies) {
            let idx = this.bodies.indexOf(b);
            if (idx !== -1) {
                this.bodies.splice(idx, 1);
                b.dispose();
            }
        }
        this.onRemoveBodies.trigger(bodies);
    }

    public clearBodies() {
        for (let b of this.bodies) {
            b.dispose();
        }
        this.onRemoveBodies.trigger(this.bodies);
        this.bodies = [];
    }

    public setTarget(b: IBody) {
        if (!b || this.targetBody === b) return;
        this.targetBody = b;
        if (b instanceof Body3D) {
            this.camera.setTarget(b.mesh);
        } else {
            this.camera.setTarget(b.position);
        }

        this.camera.radius = b.diameter * 5;
        this.onTargetChange.trigger(b);
    }

    private pointerUpHandler(evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) {
        if (pickInfo.hit) {
            let b = this.bodies.find(x => {
                if (x instanceof Body3D) 
                    return x.mesh === pickInfo.pickedMesh;
                else
                    return false;
            });
            this.setTarget(b);
        } else {
            let pickResult = this.scene.pickSprite(evt.x, evt.y);
            if (pickResult.hit) {
                let b = this.bodies.find(x => {
                    if (x instanceof Body2D) 
                        return x.mesh === pickResult.pickedSprite;
                    else
                        return false;
                });
                this.setTarget(b);
            }
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
    private gpuEngine: GPUPhysicsEngine = new GPUPhysicsEngine();
    private getGpuKernel() {
        return this.gpuEngine.getKernel(this.bodies.length);
    }

    private cullSpriteManagers() {
        for (let i = 0; i<this.spriteManagers.length; i++) {
            let manager = this.spriteManagers[i];
            if (manager.sprites.length === 0) {
                manager.dispose();
                this.spriteManagers.splice(i, 1);
                i--;
            }
        }
    }

    public cullSpriteManager(manager: SpriteManager) {
        if (manager.sprites.length === 0) {
            let idx  = this.spriteManagers.indexOf(manager);
            if (idx >= 0) {
                manager.dispose();
                this.spriteManagers.splice(idx, 1);
            }
        }
    }

    public getAvailableSpriteManager() {
        if (this.spriteManagers.length) {
            let candidate = this.spriteManagers[this.spriteManagers.length - 1];
            if (candidate.sprites.length < 20000) return candidate;
        }
        let newSpriteManager = new SpriteManager("bodySpriteManager" + (this.spriteManagers.length + 1), whiteCircleSrc, 20000, 512, this.scene);
        newSpriteManager.isPickable = true;
        this.spriteManagers.push(newSpriteManager);
        return this.spriteManagers[this.spriteManagers.length - 1];
    }

    public setRenderMode(mode: "2D"|"3D") {
        let newBodies: IBody[] = null;
        if (this.renderMode === "2D" && mode === "3D") {
            newBodies = this.bodies.map(x => Body3D.copyFrom(x, this));
        } else if (this.renderMode === "3D" && mode === "2D") {
            newBodies = this.bodies.map(x => Body2D.copyFrom(x, this));
        }
        if (newBodies !== null) {
            this.clearBodies();
            this.addBodies(newBodies)
        }
        this.renderMode = mode;
    }

    // Event Stuff
    public onAddBodies = new EventEmitter<IBody[]>();
    public onRemoveBodies = new EventEmitter<IBody[]>();
    public onTargetChange = new EventEmitter<IBody>();
}

export default Simulation;