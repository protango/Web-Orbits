import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class ObjectInfoWindow extends InfoWindow {
    private static _instance: ObjectInfoWindow
    public static get instance() : ObjectInfoWindow {
        return this._instance ?? (this._instance = new ObjectInfoWindow());
    }

    private constructor() {
        super("Object Info", `
            <div class="objectInfo">
                <canvas id="velPlot"></canvas>
            </div>`);
    }
}

// Viewing object details