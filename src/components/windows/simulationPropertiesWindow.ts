import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation from "../simulation";

export default class SimulationPropertiesWindow extends InfoWindow {
    private static _instance: SimulationPropertiesWindow
    public static get instance() : SimulationPropertiesWindow {
        return this._instance ?? (this._instance = new SimulationPropertiesWindow());
    }

    private simulation: Simulation;

    private constructor() {
        super("Simulation Properties", `
            <div class="simpPropWindow">
                <input type="checkbox" id="showAxes" />
                <label for="showAxes">Show global axes</label>
            </div>`);
        let showAxesCheck = this.elem.querySelector("#showAxes") as HTMLInputElement;
        showAxesCheck.onchange = () => {
            if (showAxesCheck.checked) this.simulation.showAxes(100);
            else this.simulation.hideAxes();
        }
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;
    }
}

// Changing simulation properties, such as buffer size and background colour