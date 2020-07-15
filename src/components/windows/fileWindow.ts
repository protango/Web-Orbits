import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation from "../simulation";

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

    }

    private openFile() {

    }
}

// To allow for saving and loading of system presets