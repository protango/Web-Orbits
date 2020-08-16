import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer, Sprite, SpriteManager } from "babylonjs";
import { IPhysicsObject } from "./IPhysicsObject";
import EventEmitter from "../EventEmitter";
import Simulation, { BodyAppearance } from "../../components/simulation";
import { IBody } from "./IBody";
import whiteCircleSrc from 'assets/WhiteCircle.png';

class Body2D implements IBody {
    // Private fields
    private _sprite : Sprite;
    

    // Public API
    public id: number;
    public mass: number;
    public velocity: Vector3 = new Vector3(0, 0, 0);
    public get mesh() : Sprite { return this._sprite; }
    public get position() : Vector3 { 
        return this._sprite.position;
    }
    public set position(v: Vector3) { 
        this._sprite.position = v;
    }
    public get name() : string { return this.mesh.name };
    public set name(s: string) { this.mesh.name = s };
    public get diameter() { 
        return this._sprite.width;
    }
    public set diameter(val: number) { 
        this._sprite.height = val;
        this._sprite.width = val;
    }
    public appearance: BodyAppearance;
    public lightRange: number = 0;
    public get sprite() { return this._sprite; }

    public dispose(): void {
        this.sprite.dispose();
    }

    private static manager: SpriteManager = null;

    constructor(name: string, mass: number, position: Vector3, diameter: number, appearance: BodyAppearance, sim: Simulation, velocity: Vector3 = null, lightRange: number = null) {
        this._sprite = new Sprite(name, sim.spriteManager);
        this._sprite.isPickable = true;
        this.position = position;
        this.diameter = diameter;
        this.appearance = appearance;
        this.mass = mass;
        if (lightRange) this.lightRange = lightRange;
        if (velocity) this.velocity = velocity;
    }

    public static copyFrom(body: IBody, sim: Simulation): Body2D {
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

export default Body2D;