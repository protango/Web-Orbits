import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation, { BodyAppearance } from "../simulation";
import clearChildren from "../../utilities/clearChildren";
import { keys } from 'ts-transformer-keys';
import DialogWindow from "./dialogWindow";
import { Vector3 } from "babylonjs";
import SphericalVector from "../../models/SphericalVector";
import deg2rad from "../../utilities/deg2rad";
import HTMLRepeater from "../../models/HTMLRepeater";
import Body3D from "../../models/Body/Body3D";
import { IBody } from "../../models/Body/IBody";

interface FormFields {
    name: HTMLInputElement,
    mass: HTMLInputElement,
    diameter: HTMLInputElement,
    appearance: HTMLSelectElement,
    lightRange: HTMLInputElement,
    refObj: HTMLSelectElement,
    posR: HTMLInputElement,
    posTheta: HTMLInputElement,
    posPhi: HTMLInputElement,
    velR: HTMLInputElement,
    velTheta: HTMLInputElement,
    velPhi: HTMLInputElement
};

export default class NewObjectWindow extends InfoWindow {
    private static _instance: NewObjectWindow
    public static get instance() : NewObjectWindow {
        return this._instance ?? (this._instance = new NewObjectWindow());
    }

    private simulation: Simulation;
    private formFields: FormFields;

    private constructor() {
        super("New Object", `
            <div class="newObject">
                <form>
                    <h1 class="subSection" style="margin-top: 0;">Properties</h1>
                    <label>Name:</label>
                    <input type="text" id="name" class="wholeLine" value="New Object" />
                    <div style="margin-top: 5px;">
                        <div style="width: calc(50% - 4px); float: left">
                            <label>Mass (kg):</label>
                            <input type="number" id="mass" class="wholeLine" value="1" />

                            <label style="margin-top: 5px; display: block;">Appearance:</label>
                            <select class="wholeLine" id="appearance">
                                ${Object.keys(BodyAppearance).map(x => `<option value="${x}">${x}</option>`).join("")}
                            </select>
                        </div>
                        <div style="width: calc(50% - 4px); float: left; margin-left: 8px">
                            <label>Diameter (m):</label>
                            <input type="number" id="diameter" class="wholeLine" value="1" />

                            <label style="margin-top: 5px; display: block;">Light range (m):</label>
                            <input type="number" id="lightRange" class="wholeLine" value="0" />
                        </div>
                        <div style="clear: both;"></div> 
                    </div>
                    <h1 class="subSection">Position</h1>
                    <div class="posRelative">
                        <label>Reference object:</label>
                        <select class="wholeLine" id="refObj">
                            <option value="Origin">Origin</option>
                        </select>
                        <div style="margin-top: 5px;">
                            <div style="width: calc(33% - 5px); float: left">
                                <label>Radius (m):</label>
                                <input type="number" id="posR" class="wholeLine" value="0" step="1e-10" />
                            </div>
                            <div style="width: calc(33% - 5px); float: left; margin-left: 8px; margin-right: 8px;">
                                <label>Inclination (°):</label>
                                <input type="number" id="posTheta" class="wholeLine" value="0" step="1e-10" />
                            </div>
                            <div style="width: calc(33% - 5px); float: left">
                                <label>Azimuth (°):</label>
                                <input type="number" id="posPhi" class="wholeLine" value="0" step="1e-10" />
                            </div>
                            <div style="clear: both;"></div> 
                        </div>
                        <span class="wholeLine" style="font-style: italic">See <a href="https://en.wikipedia.org/wiki/Spherical_coordinate_system" target="blank">spherical coordinate system</a></span>
                    </div>
                    <h1 class="subSection">Velocity</h1>
                    <div style="margin-top: 5px;">
                        <div style="width: calc(33% - 5px); float: left">
                            <label>Radius (m/s):</label>
                            <input type="number" id="velR" class="wholeLine" value="0" step="1e-10" />
                        </div>
                        <div style="width: calc(33% - 5px); float: left; margin-left: 8px; margin-right: 8px;">
                            <label>Inclination (°):</label>
                            <input type="number" id="velTheta" class="wholeLine" value="0" step="1e-10" />
                        </div>
                        <div style="width: calc(33% - 5px); float: left">
                            <label>Azimuth (°):</label>
                            <input type="number" id="velPhi" class="wholeLine" value="0" step="1e-10" />
                        </div>
                        <div style="clear: both;"></div> 
                    </div>
                </form>
                <div class="actions">
                    <button class="right addBtn"><i class="fas fa-plus"></i>Create</button>
                    <button class="right rstBtn"><i class="fas fa-sync-alt"></i>Reset</button>
                </div>
            </div>`);
        this.resize(305, 481);
        this.minSize = {width: 305, height: 120};

        // Save form fields and attach onChange handler
        this.formFields = {} as FormFields;
        for (let id of keys<FormFields>()) {
            this.formFields[id] = this.elem.querySelector("#"+id);
            this.formFields[id].onchange = (e) => this.onFormChange(e);
        }

        // Attach buttons handlers
        (this.elem.querySelector(".addBtn") as HTMLButtonElement).onclick = () => this.create();
        (this.elem.querySelector(".rstBtn") as HTMLButtonElement).onclick = () => this.reset();
    }

    public attachSimulation(sim: Simulation) {
        this.simulation = sim;

        // Repeater for ref obj select box
        let refObjSelect = this.formFields.refObj;
        let repeater = new HTMLRepeater<IBody>((x) => htmlToElement(`<option value="${x.id}">${x.name}</option>`), refObjSelect, []);
        sim.onAddBodies.addHandler((b) => repeater.notifyObjsAdded(b));
        sim.onRemoveBodies.addHandler((b) => repeater.notifyObjsRemoved(b));
    }

    private create() {
        // Return if error window is present
        if (this.childWin) return;
        // Validate input
        if (!this.formFields.name.value) new DialogWindow("Object must have a name", "Error", this);

        // Add body
        this.simulation.addBody(
            this.formFields.name.value,
            this.formFields.mass.valueAsNumber,
            new SphericalVector(
                this.formFields.posR.valueAsNumber,
                deg2rad(this.formFields.posTheta.valueAsNumber),
                deg2rad(this.formFields.posPhi.valueAsNumber),
            ).toCartesian(),
            this.formFields.diameter.valueAsNumber,
            this.formFields.appearance.value as BodyAppearance,
            new SphericalVector(
                this.formFields.velR.valueAsNumber,
                deg2rad(this.formFields.velTheta.valueAsNumber),
                deg2rad(this.formFields.velPhi.valueAsNumber),
            ).toCartesian(),
            this.formFields.lightRange.valueAsNumber > 0 ? this.formFields.lightRange.valueAsNumber : null
        );
    }

    private reset() {
        this.formFields.name.value = "New Object";
        this.formFields.mass.value = "1";
        this.formFields.diameter.value = "1";
        this.formFields.appearance.value = "Blank";
        this.formFields.lightRange.value = "0";
        this.formFields.refObj.value = "Origin";
        this.formFields.posR.value = "0";
        this.formFields.posTheta.value = "0";
        this.formFields.posPhi.value = "0";
        this.formFields.velR.value = "0";
        this.formFields.velTheta.value = "0";
        this.formFields.velPhi.value = "0";
    }

    private onFormChange(evt?: Event) {

    }
}

// Creating new objects