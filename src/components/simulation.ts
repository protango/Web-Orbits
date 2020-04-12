import earthTextureSrc from 'assets/earth.jpg';
import sunTextureSrc from 'assets/sun.jpg';
import mercuryTextureSrc from 'assets/mercury.jpg';
import earthCloudsTexture from 'assets/earth_clouds.jpg';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer } from "babylonjs";
import * as $ from "jquery";
import Body from "../models/Body";
import { calcNetForce, integrateMotion, accelerationFromForce } from '../models/PhysicsEngine';

class Simulation {
    private _bodies: Body[] = [];
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
        //sunLight.specular = new Color3(0,0,0);
        //var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        // meshes
        var mercuryMesh: Mesh = MeshBuilder.CreateSphere("mercury", { diameter: 1 }, scene);
        mercuryMesh.position = new Vector3(5, 0, 0);
        var sunMesh: Mesh = MeshBuilder.CreateSphere("sun", { diameter: 3 }, scene);

        // materials
        var mercuryMaterial = new StandardMaterial("mercuryMaterial", scene);
        var sunMaterial = new StandardMaterial("sunMaterial", scene);

        mercuryMaterial.diffuseTexture = new Texture(mercuryTextureSrc, scene);
        mercuryMaterial.specularColor = Color3.Black();
        sunMaterial.diffuseTexture = new Texture(sunTextureSrc, scene);
        sunMaterial.emissiveColor = new Color3(241, 135, 39);
        //myMaterial.specularTexture = new Texture(earthCloudsTexture, scene);
        //myMaterial.emissiveTexture = new Texture(earthCloudsTexture, scene);
        //myMaterial.ambientTexture = new Texture(earthCloudsTexture, scene);

        mercuryMesh.material = mercuryMaterial
        sunMesh.material = sunMaterial

        // glow layer for sun
        var gl = new GlowLayer("glow", scene, { 
            mainTextureRatio: 0.1
        });
        gl.intensity = 0.6;

        // register bodies
        this._bodies.push(new Body(mercuryMesh, 1, new Vector3(0, 0.00003, 0)));
        this._bodies.push(new Body(sunMesh, 100, null, sunLight));

        let fpsLabel = document.getElementById("fpsCounter");
        let c = 0;
        let dt: number = 2000; // second(s)
        engine.runRenderLoop(() => {
            for (let b of this._bodies) {
                b.position = integrateMotion(b.velocity, b.position, dt);
                let netForce = calcNetForce(b, this._bodies);
                b.velocity = integrateMotion(accelerationFromForce(netForce, b.mass), b.velocity, dt);
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

    private name() {
        
    }
}

export default Simulation;