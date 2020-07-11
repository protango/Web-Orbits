import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation from "../simulation";
import NewObjectWindow from "./newObjectWindow";
import Body from "../../models/Body";

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
        let content = htmlToElement(
            `<div class="objectBrowser">
                <div class="tableScroll">
                    <table class="objectTable">
                        <thead>
                            <tr>
                                <th style="width: 30px;"><input type="checkbox" class="selectAll" /></th>
                                <th style="width: 30px;">#</th>
                                <th>Name</th>
                                <th>Mass (kg)</th>
                                <th style="width: 30px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
                <div class="actions">
                    <button class="left deleteBtn"><i class="fas fa-trash"></i>Delete selected</button>
                    <button class="right newBtn"><i class="fas fa-plus"></i>Add new</button>
                </div>
            </div>`
        ) as HTMLDivElement;
        super("Object Browser", content);
        this.resize(350, 180);
        this.minSize = {width: 240, height: 180};
        (content.querySelector(".selectAll") as HTMLInputElement).onchange = (e) => this.updateSelect(e.target as HTMLInputElement);
        this.updateQueued = false;
        this.suspendUpdates = false;
        this.onOpen = () => {if (this.updateQueued) {this.updateTable()}};

        // Button event handlers
        this.deleteBtn = (this.elem.querySelector(".deleteBtn") as HTMLButtonElement);
        this.deleteBtn.onclick = () => this.deleteSelected();
        (this.elem.querySelector(".newBtn") as HTMLButtonElement).onclick = 
            () => NewObjectWindow.instance.open();
    }

    public attachSimulation(sim: Simulation) { this.simulation = sim; this.updateTable(); }

    public updateTable() {
        if (!this.isOpen || this.suspendUpdates) {
            this.updateQueued = true;
            return;
        }
        this.updateQueued = false;
        let tbody = this.elem.querySelector(".objectTable tbody") as HTMLTableSectionElement;
        [...tbody.childNodes].forEach(x => x.remove());
        for (let i = 0; i<this.simulation.bodies.length; i++) {
            let body = this.simulation.bodies[i];
            let newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td><input class="bodyCheck" type="checkbox" /></td>
                <td>${i+1}</td>
                <td>${body.name}</td>
                <td>${body.mass}</td>
                <td class="infoBtnCell"><i class="fas fa-info-circle"></i></td>
            `;
            tbody.appendChild(newRow);
            (newRow.querySelector(".bodyCheck") as HTMLInputElement).onchange = (e) => this.updateSelect(e.target as HTMLInputElement);
        }
        this.updateSelect(null);
    }

    private updateSelect(checkBox: HTMLInputElement) {
        let selectAll = this.elem.querySelector("input.selectAll") as HTMLInputElement;
        let checkBoxes = this.elem.querySelectorAll("input.bodyCheck") as NodeListOf<HTMLInputElement>;

        if (checkBox === selectAll) {
            checkBoxes.forEach(x => x.checked = selectAll.checked);
        } else if (checkBox) {
            if (selectAll.checked && !checkBox.checked) selectAll.checked = false;
        } else {
            if (selectAll.checked && [...checkBoxes].some(x => !x.checked))
                selectAll.checked = false;
        }

        if (checkBoxes.length && [...checkBoxes].some(x => x.checked)) {
            this.deleteBtn.classList.remove("disabled");
        } else {
            this.deleteBtn.classList.add("disabled");
        }
    }

    private deleteSelected() {
        let checkBoxes = this.elem.querySelectorAll("input.bodyCheck") as NodeListOf<HTMLInputElement>;
        let bodiesToRemove: Body[] = [];
        for (let i = 0; i<checkBoxes.length; i++) {
            if (checkBoxes[i].checked)
                bodiesToRemove.push(this.simulation.bodies[i]);
        }
        this.suspendUpdates = true;
        for (let b of bodiesToRemove) {
            this.simulation.removeBody(b);
        }
        this.suspendUpdates = false;
        this.updateTable();
    }
}