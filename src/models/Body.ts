import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer } from "babylonjs";

class Body {
    // Private fields
    private _mesh : Mesh;
    private _light : PointLight = null;
    

    // Public API
    public mass: number;
    public velocity: Vector3 = new Vector3(0, 0, 0);
    public get mesh() : Mesh { return this._mesh; }
    public get light() : PointLight { return this._light; }
    public get position() : Vector3 { return this._mesh.position; }
    public set position(v: Vector3) { this._mesh.position = v; }
    

    constructor(mesh: Mesh, mass: number, velocity: Vector3 = null, light: PointLight = null) {
        this._mesh = mesh;
        this.velocity = velocity === null ? new Vector3(0, 0, 0) : velocity;
        this._light = light;
        this.mass = mass;
    }
}

export default Body;