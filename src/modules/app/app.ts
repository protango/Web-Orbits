import html from './app.html';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh } from "babylonjs";

class Main {
    private elem : HTMLCanvasElement;
    constructor() {
        this.elem = document.createElement("canvas");
        document.body.appendChild(this.elem);

        var engine: Engine = new Engine(this.elem, true);

        var scene: Scene = new Scene(engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(this.elem, true);

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}


export default Main;