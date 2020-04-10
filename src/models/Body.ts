import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer } from "babylonjs";

class Body {
    // Private fields
    private _mesh : Mesh;
    private _light : PointLight = null;
    private _velocity: Vector3 = new Vector3(0, 0, 0);

    // Public API
    public get mesh() : Mesh { return this._mesh; }
    public get light() : PointLight { return this._light; }
    public get position() : Vector3 { return this._mesh.position; }
    public get velocity() : Vector3 { return this._velocity; }

    constructor(mesh: Mesh, velocity: Vector3, light: PointLight = null) {
        this._mesh = mesh;
        this._velocity = velocity;
        this._light = light;
    }
}