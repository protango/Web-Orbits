import InfoWindow from "./infoWindow";
import Simulation from "../simulation";
import SerializableBody from "../../models/Serialization/SerializableBody";
import SerializableSimulation from "../../models/Serialization/SerializableSimulation";
import FileWindow from "./fileWindow";
import { GPU } from 'gpu.js';

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
                <div>
                    <div class="termScroll" style="overflow-y: auto; overflow-x: hidden; height: calc(100% - 21px);">
                        <span style="display: block;white-space: nowrap;" class="termOutput"></span>
                    </div>
                    <input type="text" class="termInput" style="width: 100%;box-sizing: border-box;font-family: monospace;height: 21px; background: black; color: white; border: none" />
                </div>`);
        this.termScroll = this.elem.querySelector(".termScroll");
        this.termOutput = this.elem.querySelector(".termOutput");
        this.termInput = this.elem.querySelector(".termInput");

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
            func(...parts.slice(1).map(x => Number(x)));
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
        for (let x = lb; x<=ub; x++)
        for (let y = lb; y<=ub; y++)
        for (let z = lb; z<=ub; z++) {
            bodies.push({
                position: {x: x*5, y: y*5, z: z*5},
                velocity: {x: Math.random() / 1e5, y: Math.random() / 1e5, z: Math.random() / 1e5},
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
    }

    private fullLoad() {
        let data = new Array<number>(10000);
        for (let i = 0; i < 100000; i++) {
            data[i] = Math.floor(Math.random() * 10) + 1;
        }

        let gpu = new GPU();
        let kernel = gpu.createKernel(function (a: number[]) {
            let sum = a[this.thread.x];
            for (let i = 0; i<100000; i++) {
                if (i !== this.thread.x) {
                    sum += a[i];
                }
            }
            return sum;
        }).setOutput([100000]);
        
        console.log(kernel(data));
    }
}