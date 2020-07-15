import InfoWindow from "./infoWindow";
import Simulation from "../simulation";
import SerializableSimulation from "../../models/Serialization/SerializableSimulation";
import { saveAs } from 'file-saver';
import htmlToElement from "../../utilities/htmlToElement";
import openFileDialog from "../../utilities/openFileDialog";
import ErrorWindow from "./errorWindow";
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
                new ErrorWindow("File just be a JSON file", this);
                return;
            }

            let ssim = JSON.parse(await file.text()) as SerializableSimulation;
            this.loadIntoSimulation(ssim);
        }
    }

    private loadIntoSimulation(ssim: SerializableSimulation) {
        try {
            if (ssim.globalLightEnabled) this.simulation.enableGlobalLight();
            else this.simulation.disableGlobalLight();

            if (ssim.axesVisible) this.simulation.showAxes(100);
            else this.simulation.hideAxes();

            this.simulation.removeBodies([...this.simulation.bodies]);
            for (let b of ssim.bodies) {
                this.simulation.addBody(
                    b.name, 
                    b.mass, 
                    new Vector3(b.position.x, b.position.y, b.position.z), 
                    b.diameter, 
                    b.appearance, 
                    new Vector3(b.velocity.x, b.velocity.y, b.velocity.z), 
                    b.lightRange
                );
            }
        } catch {
            new ErrorWindow("Corrupt save file", this);
        }
    }
}

// To allow for saving and loading of system presets