import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class FileWindow extends InfoWindow {
    private static _instance: FileWindow
    public static get instance() : FileWindow {
        return this._instance ?? (this._instance = new FileWindow());
    }

    private constructor() {
        super("File", `<div class="fileWindow"></div>`);
    }
}

// To allow for saving and loading of system presets