import InfoWindow from "./infoWindow";
import Simulation, { BodyAppearance } from "../simulation";
import SerializableBody from "../../models/Serialization/SerializableBody";
import SerializableSimulation from "../../models/Serialization/SerializableSimulation";
import FileWindow from "./fileWindow";
import { GPU } from 'gpu.js';
import randomNormal from 'random-normal';
import DialogWindow from "./dialogWindow";
import { Vector3 } from "babylonjs";
import { vectorAdd, vectorMultiply } from "../../models/PhysicsEngine";
import TimeControlWindow from "./timeControlWindow";

/** Gravitational constant */
const G = 6.67408e-11;
export default class TerminalWindow extends InfoWindow {
    private static _instance: TerminalWindow
    public static get instance() : TerminalWindow {
        return this._instance ?? (this._instance = new TerminalWindow());
    }

    private simulation: Simulation;
    private termScroll: HTMLDivElement;
    private termOutput: HTMLSpanElement;
    private termInput: HTMLInputElement;

    private constructor() {
        super("Debug Terminal", `
                <div style="font-family: monospace">
                    <div class="termScroll" style="overflow-y: auto; overflow-x: hidden; height: calc(100% - 21px);">
                        <span style="display: block;white-space: nowrap;" class="termOutput">Debug terminal ready</span>
                    </div>
                    <span style="line-height: 21px;">></span>
                    <textarea class="termInput" style="width: calc(100% - 20px);box-sizing: border-box;height: 21px; background: none; color: #c4c4c4; border: none; font-family: monospace; margin: 0; line-height:21px; resize: none;" /></textarea>
                </div>`);
        this.termScroll = this.elem.querySelector(".termScroll");
        this.termOutput = this.elem.querySelector(".termOutput");
        this.termInput = this.elem.querySelector(".termInput");
        this.resize(400,140);
        this.onFocus = () => {
            this.termInput.focus();
        }

        this.termInput.onkeydown = (e) => {
            if (e.key === "Enter") {
                this.processInput(this.termInput.value);
                this.termInput.value = null;
                return false;
            }
        }
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;
    }

    private processInput(input: string) {
        let calls = input.split(/\r?\n/).filter(x => x);
        for (let call of calls) 
        {
            let parts = call.split(" ");
            let func = this[parts[0]];
            let args = parts.slice(1).map(x => isNaN(Number(x)) ? x : Number(x));
            if (func && typeof func === "function") {
                this[parts[0]](...args);
            } else {
                this.writeLine("No such function \""+parts[0]+"\"");
            }
        }
    }

    private writeLine(output: string) {
        this.termOutput.innerText += "\n" + output;
        this.termScroll.scrollTop = this.termScroll.scrollHeight;
    }

    private generate(n: number) {
        let lb = -Math.floor(n / 2);
        let ub = -lb;
        let idx = 0;
        let bodies: SerializableBody[] = [];
        let density = 1;
        for (let x = lb; x<=ub; x++)
        for (let y = lb; y<=ub; y++)
        for (let z = lb; z<=ub; z++) {
            //let mass = Math.abs(randomNormal({mean: 100, dev: 100}));
            bodies.push({
                position: {x: x*5, y: y*5, z: z*5},
                velocity: {x: Math.random() / 1e5, y: Math.random() / 1e5, z: Math.random() / 1e5},
                //diameter: Math.sqrt(4 * mass * density / Math.PI),
                diameter: 1,
                lightRange: 0,
                name: "Object " + (++idx),
                mass: 1,
                appearance: "Blank"
            } as SerializableBody);
        }
        let ssim = {
            globalLightEnabled: true,
            axesVisible: true,
            bodies: bodies
        } as SerializableSimulation;

        FileWindow.instance.loadIntoSimulation(ssim);
        this.writeLine("Generated " + Math.pow(ub * 2 + 1, 3) + " bodies");
    }

    private forcemode(mode: string) {
        let mdUp = mode.toUpperCase();
        if (mdUp === "CPU" || mdUp === "GPU") {
            this.simulation.forceMode = mdUp;
            this.writeLine("Forcing " + mdUp + " computation");
        } else if (mdUp === "AUTO") {
            this.simulation.forceMode = null;
            this.writeLine("Computation mode set to auto");
        } else {
            this.writeLine("Invalid mode, must be CPU, GPU or Auto");
        }

    }

    private clear() {
        this.simulation.clearBodies();
    }

    private pause() {
        if (!TimeControlWindow.instance.isPaused)
            TimeControlWindow.instance.togglePause();
    }

    private testDialog(this: TerminalWindow) {
        let errorWin = new DialogWindow("TEST MESSAGE", "DIALOG WINDOW TITLE", this);
    }

    /**
     * All will be relative to the eliptic
     * @param name name of the body to be created
     * @param soi name of the body that this body will orbit
     * @param M the mass of this body
     * @param radius the radius of this body (not orbit)
     * @param a semi-major axis of the orbit
     * @param e eccentricity of the orbit
     * @param i inclination of the orbit
     * @param omega Longitude of ascending node
     */
    private orbChar(name: string, soi: string, M: number, radius: number, lightRange: number, appearance: string, a: number, e: number, i: number, Ω: number) {
        let soiBody = soi ? this.simulation.bodies.find(x => x.name === soi) : null;
        let pos: Vector3, v: Vector3;
        if (soiBody) {
            /** Apoapsis */
            let Ra = a * (1 + e);
            /** Periapsis */
            let Rp = a * (1 - e);
            /** Standard gravitational parameter */
            let μ = G * soiBody.mass;

            // just start everything at the periapsis
            /** Current distance between body and soi */ // just start everything at the periapsis
            let r = Rp;

            /** current velocity */
            v = vectorMultiply(new Vector3(0,0,1), Math.sqrt(μ*(2/r - 1/a)));
            v = vectorAdd(v, soiBody.velocity);
            
            pos = new Vector3(r, 0, 0);
            pos = vectorAdd(pos, soiBody.position);
        } else {
            pos = Vector3.Zero();
            v = Vector3.Zero();
        }

        if(!Object.keys(BodyAppearance).includes(appearance)) appearance = BodyAppearance.Blank;
        this.simulation.addBody(
            name,
            M,
            pos,
            radius*2,
            appearance as BodyAppearance,
            v,
            lightRange
        );
    }
}