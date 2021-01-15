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
                <form>
                    <h1 class="subSection" style="margin-top: 0;">Display</h1>
                    <input type="checkbox" id="showAxes" />
                    <label for="showAxes">Show global axes</label><br>
                    <input type="checkbox" id="globalLight" />
                    <label for="globalLight">Global light</label><br>
                    <input type="checkbox" id="skybox" checked />
                    <label for="skybox">Enable background</label>
                    <h1 class="subSection">Graphics</h1>
                    <input type="checkbox" id="gpuacceleration" checked />
                    <label for="gpuacceleration">Enable GPU Acceleration</label>
                    <div style="margin-top: 5px;">
                        <label for="renderModeSelect">Render Mode:</label>
                        <select id="renderModeSelect" class="wholeLine">
                            <option value="3D">Fancy (3D, lighting & textures)</option>
                            <option value="2D">Fast (2D, No lighting or textures)</option>
                        </select>
                    </div>
                </form>
            </div>`);
            this.resize(235,219);
        let showAxesCheck = this.elem.querySelector("#showAxes") as HTMLInputElement;
        let globalLightCheck = this.elem.querySelector("#globalLight") as HTMLInputElement;
        let skyBoxCheck = this.elem.querySelector("#skybox") as HTMLInputElement;
        let renderModeSelect = this.elem.querySelector("#renderModeSelect") as HTMLSelectElement;
        let gpuaccelerationCheck = this.elem.querySelector("#gpuacceleration") as HTMLInputElement;
        showAxesCheck.onchange = () => {
            if (showAxesCheck.checked) this.simulation.showAxes(100);
            else this.simulation.hideAxes();
        }
        globalLightCheck.onchange = () => {
            if (globalLightCheck.checked) this.simulation.enableGlobalLight();
            else this.simulation.disableGlobalLight();
        }
        renderModeSelect.onchange = () => {
            this.simulation.setRenderMode(renderModeSelect.value as any);
        }
        skyBoxCheck.onchange = () => {
            this.simulation.skyBox.setEnabled(skyBoxCheck.checked);
        }
        gpuaccelerationCheck.onchange = () => {
            this.simulation.forceMode = gpuaccelerationCheck.checked ? null : "CPU";
        }
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;

        //TESTING ONLY - show axes by default
        //let showAxesCheck = this.elem.querySelector("#showAxes") as HTMLInputElement;
        //showAxesCheck.checked = true;
        //showAxesCheck.onchange(null);
    }
}

// Changing simulation properties, such as buffer size and background colour