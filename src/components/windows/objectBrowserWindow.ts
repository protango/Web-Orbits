import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";
import Simulation from "../simulation";

export default class ObjectBrowserWindow extends InfoWindow {
    private static _instance: ObjectBrowserWindow
    public static get instance() : ObjectBrowserWindow {
        return this._instance ?? (this._instance = new ObjectBrowserWindow());
    }

    private simulation: Simulation;
    private updateQueued: boolean;

    private constructor() {
        let content = htmlToElement(
            `<div class="objectBrowser">
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
            </div>`
        ) as HTMLDivElement;
        super("Object Browser", content);
        this.resize(350, 180);
        (content.querySelector(".selectAll") as HTMLInputElement).onchange = (e) => this.updateSelect(e.target as HTMLInputElement);
        this.updateQueued = false;
        this.onOpen = () => {if (this.updateQueued) {this.updateQueued = false; this.updateTable();}};
    }

    public registerSimulation(sim: Simulation) { this.simulation = sim; this.updateTable(); }

    public updateTable() {
        if (!this.isOpen) {
            this.updateQueued = true;
            return;
        }
        let tbody = this.elem.querySelector(".objectTable tbody") as HTMLTableSectionElement;
        tbody.childNodes.forEach(x => x.remove());
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
    }

    private updateSelect(checkBox: HTMLInputElement) {
        if (checkBox.classList.contains("selectAll")) {
            this.elem.querySelectorAll(".bodyCheck").forEach((x : HTMLInputElement) => x.checked = checkBox.checked);
        } else {
            let selectAll = this.elem.querySelector(".selectAll") as HTMLInputElement;
            if (selectAll.checked && !checkBox.checked) selectAll.checked = false;
        }
    }
}