import earthTextureSrc from 'assets/earth.jpg';
import sunTextureSrc from 'assets/sun.jpg';
import mercuryTextureSrc from 'assets/mercury.jpg';
import earthCloudsTexture from 'assets/earth_clouds.jpg';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh, Texture, StandardMaterial, PointLight, Color3, Color4, GlowLayer, Material, PickingInfo, PointerEventTypes } from "babylonjs";
import * as $ from "jquery";
import Body from "../models/Body";
import { calcNetForce, integrateMotion, accelerationFromForce } from '../models/PhysicsEngine';
import TimeControlWindow from './windows/timeControlWindow';
import ObjectBrowserWindow from './windows/objectBrowserWindow';

enum BodyAppearance {
    Sun, Earth, Mercury, Blank
}

class Simulation {
    public bodies: Body[] = [];
    public elem : HTMLCanvasElement;
    public scene: Scene;
    public camera: ArcRotateCamera;

    public get bgColor(): Color4 { return this.scene.clearColor; }
    public set bgColor(c: Color4) { this.scene.clearColor = c; }

    private materials : {[key in BodyAppearance]: Material};

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

        // register bodies
        this.addBody("Sun", 100000, Vector3.Zero(), 30, BodyAppearance.Sun, Vector3.Zero(), 1000);
        this.addBody("Earth", 200, new Vector3(-60, 0, 0), 10, BodyAppearance.Earth, new Vector3(0, 0.0002, 0.0002));
        this.addBody("Mercury", 100, new Vector3(50, 0, 0), 10, BodyAppearance.Mercury, new Vector3(0, 0.0003, 0));

        this.camera.setTarget(this.bodies[0].mesh);

        // Register event handlers
        scene.onPointerUp = (evt, pickInfo, type) => this.pointerUpHandler(evt, pickInfo, type);

        // Register simulation with windows that need it
        ObjectBrowserWindow.instance.registerSimulation(this);

        // Render loop
        let fpsLabel = document.getElementById("fpsCounter");
        let c = 0;
        let timeControlWindow = TimeControlWindow.instance;
        engine.runRenderLoop(() => {
            for (let b of this.bodies) {
                b.position = integrateMotion(b.velocity, b.position, timeControlWindow.speedValue);
                let netForce = calcNetForce(b, this.bodies);
                b.velocity = integrateMotion(accelerationFromForce(netForce, b.mass), b.velocity, timeControlWindow.speedValue);
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

    public addBody(name: string, mass: number, position: Vector3, diameter: number, appearance: BodyAppearance, velocity: Vector3 = null, lightRange: number = null): Body {
        let mesh: Mesh = MeshBuilder.CreateSphere(name, { diameter: diameter }, this.scene);
        mesh.position = position;
        mesh.material = this.materials[appearance];
        let light: PointLight = null;
        if (lightRange != null)
        {
            light = new PointLight(name+"Light", position, this.scene);
            light.range = lightRange;
        }

        let body = new Body(mesh, mass, velocity, light);
        this.bodies.push(body);

        return body;
    }

    private pointerUpHandler(evt: PointerEvent, pickInfo: PickingInfo, type: PointerEventTypes) {
        if (pickInfo.hit)
            this.camera.setTarget(pickInfo.pickedMesh);
    }
}

export default Simulation;