import { IBody } from "../../models/Body/IBody";
import SphericalVector from "../../models/SphericalVector";
import htmlToElement from "../../utilities/htmlToElement";
import { BodyAppearance } from "../simulation";
import NewObjectWindow from "./newObjectWindow";
import ObjectInfoWindow from "./objectInfoWindow";
import TimeControlWindow from "./timeControlWindow";

export default class EditObjectWindow extends NewObjectWindow {
    private static _editObjWinInstance: EditObjectWindow;
    public static get instance() : EditObjectWindow {
        return this._editObjWinInstance ?? (this._editObjWinInstance = new EditObjectWindow());
    }

    private body: IBody = null;

    private constructor() {
        super();
        this.changeTitle("Edit Object");

        let newActions = htmlToElement(`
            <div class="actions">
                <button class="right saveBtn"><i class="far fa-check-circle"></i>OK</button>
                <button class="right applyBtn"><i class="fas fa-check"></i>Apply</button>
                <button class="right refreshBtn"><i class="fas fa-sync"></i>Refresh</button>
                <button class="right cnclBtn"><i class="fas fa-ban"></i>Cancel</button>
            </div>
        `);
        this.resize(332, 481);
        this.minSize = {width: 332, height: 120};

        this.elem.querySelector(".content > .actions").replaceWith(newActions);
        (this.elem.querySelector(".saveBtn") as HTMLButtonElement).onclick = () => {this.save(); this.close();};
        (this.elem.querySelector(".applyBtn") as HTMLButtonElement).onclick = () => this.save();
        (this.elem.querySelector(".refreshBtn") as HTMLButtonElement).onclick = () => this.setBody(this.body);
        (this.elem.querySelector(".cnclBtn") as HTMLButtonElement).onclick = () => this.close();
    }

    public setBodyAndOpen(body: IBody) {
        this.setBody(body);
        this.open();
    }

    public setBody(body: IBody) 
    {
        const roundingFactor = 1e10;
        this.body = body;

        this.formFields.name.value = body.name;
        this.formFields.mass.valueAsNumber = body.mass;
        this.formFields.diameter.valueAsNumber = body.diameter;
        this.formFields.appearance.value = body.appearance;
        this.formFields.lightRange.valueAsNumber = body.lightRange;

        this.formFields.refObj.value = "Origin";
        let sphericalPos = SphericalVector.fromCartesian(body.position);
        this.formFields.posR.valueAsNumber = Math.round(sphericalPos.radius * roundingFactor) / roundingFactor;
        this.formFields.posTheta.valueAsNumber = Math.round(sphericalPos.inclination * roundingFactor) / roundingFactor;
        this.formFields.posPhi.valueAsNumber = Math.round(sphericalPos.azimuth * roundingFactor) / roundingFactor;

        let sphericalVel = SphericalVector.fromCartesian(body.velocity);
        this.formFields.velR.valueAsNumber = Math.round(sphericalVel.radius * roundingFactor) / roundingFactor;
        this.formFields.velTheta.valueAsNumber = Math.round(sphericalVel.inclination * roundingFactor) / roundingFactor;
        this.formFields.velPhi.valueAsNumber = Math.round(sphericalVel.azimuth * roundingFactor) / roundingFactor;
    }

    private save() {
        this.body.name = this.formFields.name.value;
        this.body.mass = this.formFields.mass.valueAsNumber;
        this.body.diameter = this.formFields.diameter.valueAsNumber;
        this.body.appearance = this.formFields.appearance.value as BodyAppearance;
        this.body.lightRange = this.formFields.lightRange.valueAsNumber;

        let sphericalPos = new SphericalVector(this.formFields.posR.valueAsNumber, this.formFields.posTheta.valueAsNumber, this.formFields.posPhi.valueAsNumber);
        this.body.position = sphericalPos.toCartesian();

        let sphericalVel = new SphericalVector(this.formFields.velR.valueAsNumber, this.formFields.velTheta.valueAsNumber, this.formFields.velPhi.valueAsNumber);
        this.body.velocity = sphericalVel.toCartesian();
    }

    public close() {
        this.body = null;
        super.close();
    }

    public open() {
        if (this.body)
            super.open();
        else
            throw "Edit object window cannot be opened without first setting body to edit.";
    }
}