import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer } from "babylonjs";
import { IPhysicsObject } from "./IPhysicsObject";
import EventEmitter from "../EventEmitter";
import Simulation, { BodyAppearance } from "../../components/simulation";
import { IBody } from "./IBody";

class Body3D implements IBody {
    // Private fields
    private _mesh : Mesh;
    private _light : PointLight = null;
    private currentDiamater: number;
    private scale: number = 1;
    private originalDiamater: number;
    

    // Public API
    public id: number;
    public mass: number;
    public velocity: Vector3 = new Vector3(0, 0, 0);
    public get mesh() : Mesh { return this._mesh; }
    public get light() : PointLight { return this._light; }
    public get lightRange(): number { return this._light ? this._light.range : 0; }
    public set lightRange(v: number) { if (this._light) this._light.range = v; }
    public get position() : Vector3 { return this._mesh.position; }
    public set position(v: Vector3) { 
        this._mesh.position = v; 
        if (this._light) this._light.position = v; 
    }
    public get name() : string { return this.mesh.name };
    public set name(s: string) { this.mesh.name = s };
    public get diameter() { return this.currentDiamater; }
    public set diameter(val: number) { 
        this.currentDiamater = val;
        this.scale = val / this.originalDiamater;
        this.mesh.scaling.x = this.scale;
        this.mesh.scaling.y = this.scale;
        this.mesh.scaling.z = this.scale;
    }
    public appearance: BodyAppearance;

    public dispose(): void {
        this.mesh.dispose();
        if (this.light) this.light.dispose();
    }

    constructor(name: string, mass: number, position: Vector3, diameter: number, appearance: BodyAppearance, sim: Simulation, velocity: Vector3 = null, lightRange: number = null) {
        this._mesh = MeshBuilder.CreateSphere(name, { diameter: diameter }, sim.scene);
        this._mesh.material = sim.materials[appearance];

        this.position = position;
        if (lightRange != null && lightRange > 0)
        {
            this._light = new PointLight(name+"Light", position, sim.scene);
            this.lightRange = lightRange;
        }

        if (velocity) this.velocity = velocity;
        this.mass = mass;
        this.originalDiamater = this.currentDiamater = diameter;
        this.appearance = appearance;
    }

    public static copyFrom(body: IBody, sim: Simulation): Body3D {
        return new this(
            body.name,
            body.mass,
            body.position,
            body.diameter,
            body.appearance,
            sim,
            body.velocity,
            body.lightRange
        );
    }
}

export default Body3D;