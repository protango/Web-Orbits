import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class SimulationPropertiesWindow extends InfoWindow {
    private static _instance: SimulationPropertiesWindow
    public static get instance() : SimulationPropertiesWindow {
        return this._instance ?? (this._instance = new SimulationPropertiesWindow());
    }

    private constructor() {
        let content = htmlToElement(
            `<div>
            </div>`
        ) as HTMLDivElement;
        super("Simulation Properties", content);
        content.classList.add("simpPropWindow");
    }
}

// Changing simulation properties, such as buffer size and background colour