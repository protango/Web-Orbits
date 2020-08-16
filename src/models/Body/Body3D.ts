import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer } from "babylonjs";
import { IPhysicsObject } from "./IPhysicsObject";
import EventEmitter from "../EventEmitter";
import { BodyAppearance } from "../../components/simulation";
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


    constructor(mesh: Mesh, mass: number, diameter: number, velocity: Vector3 = null, light: PointLight = null, appearance: BodyAppearance = null) {
        this._mesh = mesh;
        this.velocity = velocity === null ? new Vector3(0, 0, 0) : velocity;
        this._light = light;
        this.mass = mass;
        this.originalDiamater = this.currentDiamater = diameter;
        this.appearance = appearance;
    }

    //Events
    public onChange = new EventEmitter<{}>();
}

export default Body3D;