import htmlToElement from "../../../utilities/htmlToElement";
import InfoWindow from "../infoWindow";
import { Vector3 } from "babylonjs";
import { PhysicsObject } from "../../../models/PhysicsObject";
import { calcNetForce, accelerationFromForce, integrateMotion } from "../../../models/PhysicsEngine";
import TimeControlWindow from "../timeControlWindow";
import workerPath from "file-loader?name=[name].js!./vanillaWorker";

export default class TechDemoWindow extends InfoWindow {
    private static _instance: TechDemoWindow
    public static get instance() : TechDemoWindow {
        return this._instance ?? (this._instance = new TechDemoWindow());
    }
    
    private bodies:DemoBody[] = [];
    private EmuConsole:HTMLTextAreaElement;

    private constructor() {
        super("Tech Demo", htmlToElement(
            `<div class="techDemoWindow">
                <div class="runBtns">
                    <button id="vanillaRun">Vanilla JS</button>
                    <button id="gpuRun">GPU.JS</button>
                    <button id="wasmRun">WebAssembly</button>
                </div>
                <button id="cancel" style="display: none">Cancel</button>
                <h5>Input Configuration:</h5>
                <table class="demoBodyTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Position</th>
                            <th>Mass</th>
                            <th>Velocity</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="addRow">
                            <td>New</td>
                            <td class="pos"><input type="number" /><input type="number" /><input type="number" /></td>
                            <td class="mas"><input type="number" /></td>
                            <td class="vel"><input type="number" /><input type="number" /><input type="number" /></td>
                            <td><button class="add"><i class="fas fa-plus"></i></button></td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin: 10px 0 10px 0">
                    <h5>Random Configuration:</h5>
                    n=<input class="randomN" type="number" style="width: 40px" value="5" />
                    <button class="randomise">Randomise</button>
                </div>
                <h5>Output Console:</h5>
                <textarea readonly class="outputConsole"></textarea>
            </div>`
        ) as HTMLDivElement);
        this.elem.style.width = "500px";
        this.elem.style.height = "500px";

        var addBtn:HTMLButtonElement = this.elem.querySelector(".addRow .add");
        addBtn.addEventListener("click", () => this.addBtnHandler());

        var randomiseaBtn:HTMLButtonElement = this.elem.querySelector(".randomise");
        randomiseaBtn.addEventListener("click", () => this.randomiseConfig());

        var cancelBtn:HTMLButtonElement = this.elem.querySelector("#cancel");
        var vanillaBtn:HTMLButtonElement = this.elem.querySelector("#vanillaRun");
        var gpuBtn:HTMLButtonElement = this.elem.querySelector("#gpuRun");
        var wasmBtn:HTMLButtonElement = this.elem.querySelector("#wasmRun");
        this.EmuConsole = this.elem.querySelector("textarea");
        cancelBtn.addEventListener("click", () => {
            cancelBtn.style.display="none"; 
            for (let b of [vanillaBtn, gpuBtn, wasmBtn]) {
                b.style.backgroundColor = null;
                b.disabled = false;
            }
            this.cancelOperation = true;
        });

        function disableBtns() {
            for (let b of [vanillaBtn, gpuBtn, wasmBtn]) b.disabled = true;
        }
        
        vanillaBtn.addEventListener("click", () => {
            cancelBtn.style.display="inline"; 
            vanillaBtn.style.backgroundColor = "lightgreen";
            disableBtns();
            this.runVanilla();
        });
    }

    private addBtnHandler() {
        let newBody = new DemoBody();
        let addRow = (this.elem.querySelector(".addRow") as HTMLTableRowElement);
        newBody.position = new Vector3(
            (addRow.querySelector(".pos input:nth-child(1)") as HTMLInputElement).valueAsNumber,
            (addRow.querySelector(".pos input:nth-child(2)") as HTMLInputElement).valueAsNumber,
            (addRow.querySelector(".pos input:nth-child(3)") as HTMLInputElement).valueAsNumber,
        );
        newBody.velocity = new Vector3(
            (addRow.querySelector(".vel input:nth-child(1)") as HTMLInputElement).valueAsNumber,
            (addRow.querySelector(".vel input:nth-child(2)") as HTMLInputElement).valueAsNumber,
            (addRow.querySelector(".vel input:nth-child(3)") as HTMLInputElement).valueAsNumber,
        );
        newBody.mass = (addRow.querySelector(".mas input") as HTMLInputElement).valueAsNumber
        this.addBody(newBody);
    }

    private addBody(newBody: DemoBody) {
        newBody.id = Math.max(0, ...this.bodies.map(x => x.id)) + 1;
        let addRow = (this.elem.querySelector(".addRow") as HTMLTableRowElement);
        let newRow = addRow.cloneNode(true) as HTMLTableRowElement;
        newBody.row = newRow;
        newRow.className ="body"+newBody.id;
        let removeBtn = htmlToElement(`<button class="remove"><i class="fas fa-trash"></i></button>`);
        removeBtn.onclick = () => {this.bodies.splice(this.bodies.indexOf(newBody), 1); newRow.remove();}
        newRow.querySelector("td:last-child").innerHTML = "";
        newRow.querySelector("td:last-child").appendChild(removeBtn);
        newRow.querySelector("td:first-child").innerHTML = newBody.id.toString();
        this.elem.querySelector(".demoBodyTable tbody").insertBefore(newRow, addRow);
        this.bodies.push(newBody);
    }

    private cancelOperation = false;
    private running= false;
    private async runVanilla() {
        let timeControlWindow = TimeControlWindow.instance;
        if (this.running) return;
        this.ConsoleLog("Running simulation in vanilla JS");
        this.running = true;
        let startTime = performance.now();
        let iterations = 0;
        while(!this.cancelOperation) {
            for (let b of this.bodies) {
                let nf = calcNetForce(b, this.bodies);
                let a = accelerationFromForce(nf, b.mass);
                b.position = integrateMotion(b.velocity, b.position, timeControlWindow.speedValue);
                b.velocity = integrateMotion(a, b.velocity, timeControlWindow.speedValue);
            }
            iterations++;
            let now = performance.now();
            let elapsed = now - startTime;
            if (elapsed > 500) {
                this.ConsoleLog(`Completed ${iterations} iterations in ${elapsed}ms`);
                for (let b of this.bodies) {
                    b.updateRow();
                }
                // Sleep for a bit to let the app breathe
                await new Promise((r) => setTimeout(r, 1));
                iterations = 0;
                startTime = performance.now();
            }
        }
        this.running = false;
        this.cancelOperation = false;
        this.ConsoleLog("Stopped simulation in vanilla JS");
    }

    private ConsoleLog(s:string) {
        if (this.EmuConsole.value.length > 1000) {
            this.EmuConsole.value = this.EmuConsole.value.substr(this.EmuConsole.value.length - 1000);
        }
        this.EmuConsole.value += s + "\n";
        this.EmuConsole.scrollTop = this.EmuConsole.scrollHeight; 
    }

    private randomiseConfig() {
        for (let b of this.bodies) b.row.remove();
        this.bodies = [];
        let randNInput = this.elem.querySelector(".randomN") as HTMLInputElement;
        for (let i = 0; i<randNInput.valueAsNumber; i++) {
            let newBody = new DemoBody();
            newBody.position = new Vector3(this.randomInt(-100, 100), this.randomInt(-100, 100), this.randomInt(-100, 100));
            newBody.velocity = new Vector3(this.randomInt(-100, 100), this.randomInt(-100, 100), this.randomInt(-100, 100));
            newBody.mass = this.randomInt(1, 100);
            this.addBody(newBody);
        }
    }

    private randomInt(min:number, max:number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}

export class DemoBody implements PhysicsObject {
    public position:Vector3;
    public velocity:Vector3;
    public mass:number;
    public id:number;

    private _row:HTMLTableRowElement;
    private velInputs:HTMLInputElement[];
    private posInputs:HTMLInputElement[];
    private masInput:HTMLInputElement;
    public set row(v : HTMLTableRowElement) {
        if (v) {
            this.velInputs = [...v.querySelectorAll(".vel input")] as HTMLInputElement[];
            this.posInputs = [...v.querySelectorAll(".pos input")] as HTMLInputElement[];
            this.masInput = v.querySelector(".mas input") as HTMLInputElement;
            this.updateRow();
        } else {
            this.velInputs = null;
            this.posInputs = null;
            this.masInput = null;
        }

        this._row = v;
    }
    public get row() {
        return this._row;
    }

    public updateRow() {
        let vel = this.velocity.asArray();
        let pos = this.position.asArray();
        for (let i = 0; i<3; i++) {
            this.velInputs[i].valueAsNumber = Math.round(vel[i]);
            this.posInputs[i].valueAsNumber = Math.round(pos[i]);
        }
        this.masInput.valueAsNumber = this.mass;
    }
}