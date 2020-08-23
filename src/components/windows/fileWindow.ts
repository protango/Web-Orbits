import InfoWindow from "./infoWindow";
import Simulation from "../simulation";
import SerializableSimulation from "../../models/Serialization/SerializableSimulation";
import { saveAs } from 'file-saver';
import htmlToElement from "../../utilities/htmlToElement";
import openFileDialog from "../../utilities/openFileDialog";
import DialogWindow from "./dialogWindow";
import { Vector3 } from "babylonjs";

export default class FileWindow extends InfoWindow {
    private static _instance: FileWindow
    public static get instance() : FileWindow {
        return this._instance ?? (this._instance = new FileWindow());
    }

    private simulation: Simulation;

    private constructor() {
        super("File", `
            <div class="fileWindow">
                <div style="text-align: center">
                    <button class="saveBtn"><i class="fas fa-save"></i>Save as</button>
                    <button class="openBtn"><i class="fas fa-folder-open"></i>Open</button>
                </div>
            </div>`);
        (this.elem.querySelector(".saveBtn") as HTMLButtonElement).onclick = () => this.saveAs();
        (this.elem.querySelector(".openBtn") as HTMLButtonElement).onclick = () => this.openFile();
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;
    }

    private saveAs() {
        let sim = new SerializableSimulation(this.simulation);
        var blob = new Blob([JSON.stringify(sim)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "Web-Orbits.json");
    }

    private async openFile() {
        let files = await openFileDialog(".json", false);
        if (files) {
            let file = files.item(0);
            if (file.type !== "application/json") {
                new DialogWindow("File just be a JSON file", "Error", this);
                return;
            }

            let ssim = JSON.parse(await file.text()) as SerializableSimulation;
            this.loadIntoSimulation(ssim);
        }
    }

    public loadIntoSimulation(ssim: SerializableSimulation) {
        try {
            let showAxes = document.querySelector(".simpPropWindow #showAxes") as HTMLInputElement
            showAxes.checked = ssim.axesVisible;
            showAxes.onchange(null);

            let globalLight = document.querySelector(".simpPropWindow #globalLight") as HTMLInputElement
            globalLight.checked = ssim.globalLightEnabled;
            globalLight.onchange(null);

            this.simulation.clearBodies();
            let bodies = ssim.bodies.map(b => 
                this.simulation.createBody(
                    b.name, 
                    b.mass, 
                    new Vector3(b.position.x, b.position.y, b.position.z), 
                    b.diameter, 
                    b.appearance, 
                    new Vector3(b.velocity.x, b.velocity.y, b.velocity.z), 
                    b.lightRange
                )
            );
            this.simulation.addBodies(bodies);
        } catch {
            new DialogWindow("Corrupt save file", "Error", this);
        }
    }
}

// To allow for saving and loading of system presets