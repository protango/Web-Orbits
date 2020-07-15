import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation from "../simulation";
import NewObjectWindow from "./newObjectWindow";
import Body from "../../models/Body";
import HTMLRepeater from "../../models/HTMLRepeater";

export default class ObjectBrowserWindow extends InfoWindow {
    private static _instance: ObjectBrowserWindow
    public static get instance() : ObjectBrowserWindow {
        return this._instance ?? (this._instance = new ObjectBrowserWindow());
    }

    private simulation: Simulation;
    private updateQueued: boolean;
    private deleteBtn: HTMLButtonElement;
    public suspendUpdates: boolean;

    private constructor() {
        super("Object Browser", `
            <div class="objectBrowser">
                <div class="tableScroll">
                    <table class="objectTable">
                        <thead>
                            <tr>
                                <th style="width: 30px;"><input type="checkbox" class="selectAll" /></th>
                                <th style="width: 30px;">Id</th>
                                <th>Name</th>
                                <th>Mass (kg)</th>
                                <th>Diameter (m)</th>
                                <th style="width: 30px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
                <div class="actions">
                    <button disabled class="left deleteBtn"><i class="fas fa-trash"></i>Delete selected</button>
                    <button class="right newBtn"><i class="fas fa-plus"></i>Add new</button>
                </div>
            </div>`);
        this.resize(350, 180);
        this.minSize = {width: 240, height: 180};
        (this.elem.querySelector(".selectAll") as HTMLInputElement).onchange = (e) => this.updateSelect(e.target as HTMLInputElement);
        this.updateQueued = false;
        this.suspendUpdates = false;

        // Button event handlers
        this.deleteBtn = (this.elem.querySelector(".deleteBtn") as HTMLButtonElement);
        this.deleteBtn.onclick = () => this.deleteSelected();
        (this.elem.querySelector(".newBtn") as HTMLButtonElement).onclick = 
            () => NewObjectWindow.instance.open();
    }

    public attachSimulation(sim: Simulation) { 
        this.simulation = sim;

        // Repeater for table rows
        let tbody = this.elem.querySelector(".objectTable tbody") as HTMLTableSectionElement;
        let repeater = new HTMLRepeater<Body>((body) => {
            let newRow = document.createElement("tr");
            newRow.id = "BodyRow" + body.id;
            newRow.innerHTML = `
                <td><input class="bodyCheck" type="checkbox" /></td>
                <td>${body.id}</td>
                <td>${body.name}</td>
                <td>${body.mass}</td>
                <td>${body.diameter}</td>
                <td class="infoBtnCell"><i class="fas fa-info-circle"></i></td>
            `;
            let bodyCheck = newRow.querySelector(".bodyCheck") as HTMLInputElement;
            bodyCheck.onchange = (e) => this.updateSelect(e.target as HTMLInputElement);
            bodyCheck.onclick = (e) => e.stopPropagation();
            newRow.onclick = () => { this.simulation.target(body) };
            return newRow;
        }, tbody, sim.bodies);
        this.simulation.onAddBodies.addHandler(b => {repeater.notifyObjsAdded(b); this.updateSelect(null);});
        this.simulation.onRemoveBodies.addHandler(b => {repeater.notifyObjsRemoved(b); this.updateSelect(null);});
        this.simulation.onTargetChange.addHandler(b => this.onTargetChange(b));
    }

    private onTargetChange(body: Body) {
        let rows = this.elem.querySelectorAll(".objectTable tbody tr.highlight") as NodeListOf<HTMLTableRowElement>;
        rows.forEach(x => x.classList.remove("highlight"));

        let row = this.elem.querySelector(".objectTable tbody tr#BodyRow" + body.id);
        if (row) row.classList.add("highlight");
    }

    private updateSelect(checkBox: HTMLInputElement) {
        let selectAll = this.elem.querySelector("input.selectAll") as HTMLInputElement;
        let checkBoxes = this.elem.querySelectorAll("input.bodyCheck") as NodeListOf<HTMLInputElement>;

        if (checkBox === selectAll) {
            checkBoxes.forEach(x => x.checked = selectAll.checked);
        } else if (checkBox) {
            if (selectAll.checked && !checkBox.checked) selectAll.checked = false;
        } else {
            if (selectAll.checked && ([...checkBoxes].some(x => !x.checked) || !checkBoxes.length))
                selectAll.checked = false;
        }

        if (checkBoxes.length && [...checkBoxes].some(x => x.checked)) {
            this.deleteBtn.disabled = false;
        } else {
            this.deleteBtn.disabled = true;
        }
    }

    private deleteSelected() {
        let checkBoxes = this.elem.querySelectorAll("input.bodyCheck") as NodeListOf<HTMLInputElement>;
        let bodiesToRemove: Body[] = [];
        for (let i = 0; i<checkBoxes.length; i++) {
            if (checkBoxes[i].checked)
                bodiesToRemove.push(this.simulation.bodies[i]);
        }
        this.simulation.removeBodies(bodiesToRemove);
    }
}