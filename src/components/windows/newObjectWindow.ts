import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation, { BodyAppearance } from "../simulation";
import clearChildren from "../../utilities/clearChildren";

export default class NewObjectWindow extends InfoWindow {
    private static _instance: NewObjectWindow
    public static get instance() : NewObjectWindow {
        return this._instance ?? (this._instance = new NewObjectWindow());
    }

    private simulation: Simulation;

    private constructor() {
        let content = htmlToElement(
            `<div>
                <form>
                    <h1 class="subSection" style="margin-top: 0;">Properties</h1>
                    <label>Name:</label>
                    <input type="text" id="name" class="wholeLine" value="New Object" />
                    <div style="margin-top: 5px;">
                        <div style="width: calc(50% - 4px); float: left">
                            <label>Mass (kg):</label>
                            <input type="number" id="mass" class="wholeLine" value="1" />
                        </div>
                        <div style="width: calc(50% - 4px); float: left; margin-left: 8px">
                            <label>Diameter (m):</label>
                            <input type="number" id="diameter" class="wholeLine" value="1" />
                        </div>
                        <div style="clear: both;"></div> 
                    </div>
                    <label style="margin-top: 5px; display: block;">Appearance:</label>
                    <select class="wholeLine" id="appearance">
                        ${Object.keys(BodyAppearance).map(x => `<option value="${x}">${x}</option>`).join("")}
                    </select>
                    <h1 class="subSection">Position</h1>
                    <div class="posRelative">
                        <label>Reference object:</label>
                        <select class="wholeLine" id="refObj">
                            <option value="origin">Origin</option>
                        </select>
                        <div style="margin-top: 5px;">
                            <div style="width: calc(33% - 5px); float: left">
                                <label>r (m):</label>
                                <input type="number" id="posR" class="wholeLine" value="0" />
                            </div>
                            <div style="width: calc(33% - 5px); float: left; margin-left: 8px; margin-right: 8px;">
                                <label>θ (°):</label>
                                <input type="number" id="posTheta" class="wholeLine" value="0" />
                            </div>
                            <div style="width: calc(33% - 5px); float: left">
                                <label>φ (°):</label>
                                <input type="number" id="posPhi" class="wholeLine" value="0" />
                            </div>
                            <div style="clear: both;"></div> 
                        </div>
                        <span class="wholeLine" style="font-style: italic">See <a href="https://en.wikipedia.org/wiki/Spherical_coordinate_system" target="blank">spherical coordinate system</a></span>
                    </div>
                    <h1 class="subSection">Velocity</h1>
                    <div style="margin-top: 5px;">
                        <div style="width: calc(33% - 5px); float: left">
                            <label>r (m/s):</label>
                            <input type="number" id="velR" class="wholeLine" value="0" />
                        </div>
                        <div style="width: calc(33% - 5px); float: left; margin-left: 8px; margin-right: 8px;">
                            <label>θ (°):</label>
                            <input type="number" id="velTheta" class="wholeLine" value="0" />
                        </div>
                        <div style="width: calc(33% - 5px); float: left">
                            <label>φ (°):</label>
                            <input type="number" id="velPhi" class="wholeLine" value="0" />
                        </div>
                        <div style="clear: both;"></div> 
                    </div>
                </form>
                <div class="actions">
                    <button class="right addBtn"><i class="fas fa-plus"></i>Create</button>
                    <button class="right rstBtn"><i class="fas fa-sync-alt"></i>Reset</button>
                </div>
            </div>`
        ) as HTMLDivElement;
        super("New Object", content);
        content.classList.add("newObject");
        this.resize(275, 481);
        this.minSize = {width: 230, height: 120};
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;
    }
}

// Creating new objects