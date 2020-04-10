import earthTextureSrc from 'assets/earth.jpg';
import sunTextureSrc from 'assets/sun.jpg';
import earthCloudsTexture from 'assets/earth_clouds.jpg';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer } from "babylonjs";
import * as $ from "jquery";

class Simulation {
    private elem : HTMLCanvasElement;
    constructor() {
        this.elem = document.createElement("canvas");
        this.elem.id = "renderCanvas";
        document.body.appendChild(this.elem);

        var engine: Engine = new Engine(this.elem, true);

        // scene setup
        var scene: Scene = new Scene(engine);
        scene.clearColor = new Color4(0.1, 0.1, 0.1); // background colour

        // camera
        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 6, Vector3.Zero(), scene);
        camera.attachControl(this.elem, true);

        // lights
        var sunLight = new PointLight("sunLight", new Vector3(0, 0, 0), scene);
        sunLight.range = 100;
        //var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        // meshes
        var earthMesh: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        earthMesh.position = new Vector3(5, 0, 0);
        var sunMesh: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 3 }, scene);

        // materials
        var earthMaterial = new StandardMaterial("earthMaterial", scene);
        var sunMaterial = new StandardMaterial("sunMaterial", scene);

        earthMaterial.diffuseTexture = new Texture(earthTextureSrc, scene);
        sunMaterial.diffuseTexture = new Texture(sunTextureSrc, scene);
        sunMaterial.emissiveColor = new Color3(241, 135, 39);
        //myMaterial.specularTexture = new Texture(earthCloudsTexture, scene);
        //myMaterial.emissiveTexture = new Texture(earthCloudsTexture, scene);
        //myMaterial.ambientTexture = new Texture(earthCloudsTexture, scene);

        earthMesh.material = earthMaterial
        sunMesh.material = sunMaterial

        // glow layer for sun
        var gl = new GlowLayer("glow", scene, { 
            mainTextureRatio: 0.1
        });
        gl.intensity = 0.6;

        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener("resize", function(){engine.resize();});
    }
}

export default Simulation;