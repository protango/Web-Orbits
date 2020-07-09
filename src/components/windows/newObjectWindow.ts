import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class NewObjectWindow extends InfoWindow {
    private static _instance: NewObjectWindow
    public static get instance() : NewObjectWindow {
        return this._instance ?? (this._instance = new NewObjectWindow());
    }

    private constructor() {
        let content = htmlToElement(
            `<div>
            </div>`
        ) as HTMLDivElement;
        super("New Object", content);
        content.classList.add("newObject");
    }
}

// Creating new objects