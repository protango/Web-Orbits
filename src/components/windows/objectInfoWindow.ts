import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class ObjectInfoWindow extends InfoWindow {
    private static _instance: ObjectInfoWindow
    public static get instance() : ObjectInfoWindow {
        return this._instance ?? (this._instance = new ObjectInfoWindow());
    }

    private constructor() {
        let content = htmlToElement(
            `<div>
            </div>`
        ) as HTMLDivElement;
        super("Object Info", content);
        content.classList.add("objectInfo");
    }
}

// Viewing object details