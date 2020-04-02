import earthTexture from 'assets/earth.jpg';
import earthCloudsTexture from 'assets/earth_clouds.jpg';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial } from "babylonjs";
import * as $ from "jquery";

class Simulation {
    private elem : HTMLCanvasElement;
    constructor() {
        this.elem = document.createElement("canvas");
        this.elem.id = "renderCanvas";
        document.body.appendChild(this.elem);

        var engine: Engine = new Engine(this.elem, true);

        var scene: Scene = new Scene(engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(this.elem, true);

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

        var myMaterial = new StandardMaterial("earthMaterial", scene);

        myMaterial.diffuseTexture = new Texture(earthTexture, scene);
        //myMaterial.specularTexture = new Texture(earthCloudsTexture, scene);
        //myMaterial.emissiveTexture = new Texture(earthCloudsTexture, scene);
        //myMaterial.ambientTexture = new Texture(earthCloudsTexture, scene);

        sphere.material = myMaterial

        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener("resize", function(){engine.resize();});
    }
}

export default Simulation;