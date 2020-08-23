import InfoWindow from "./infoWindow";
import Simulation from "../simulation";
import SerializableBody from "../../models/Serialization/SerializableBody";
import SerializableSimulation from "../../models/Serialization/SerializableSimulation";
import FileWindow from "./fileWindow";
import { GPU } from 'gpu.js';
import randomNormal from 'random-normal';

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
                    <input type="text" class="termInput" style="width: calc(100% - 20px);box-sizing: border-box;height: 21px; background: black; color: #c4c4c4; border: none; font-family: monospace" />
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
            }
        }
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;
    }

    private processInput(input: string) {
        let parts = input.split(" ");
        let func = this[parts[0]];
        if (func && typeof func === "function") {
            func(...parts.slice(1), this);
        }
    }

    private writeLine(output: string) {
        this.termOutput.innerText += "\n" + output;
        this.termScroll.scrollTop = this.termScroll.scrollHeight;
    }

    private generate(n: string, self: TerminalWindow) {
        let lb = -Math.floor(Number(n) / 2);
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
        self.writeLine("Generated " + Math.pow(ub * 2 + 1, 3) + " bodies");
    }

    private forcemode(mode: string, self: TerminalWindow) {
        let mdUp = mode.toUpperCase();
        if (mdUp === "CPU" || mdUp === "GPU") {
            self.simulation.forceMode = mdUp;
            self.writeLine("Forcing " + mdUp + " computation");
        } else if (mdUp === "AUTO") {
            self.simulation.forceMode = null;
            self.writeLine("Computation mode set to auto");
        } else {
            self.writeLine("Invalid mode, must be CPU, GPU or Auto");
        }

    }
}