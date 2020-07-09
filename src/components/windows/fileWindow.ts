import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class FileWindow extends InfoWindow {
    private static _instance: FileWindow
    public static get instance() : FileWindow {
        return this._instance ?? (this._instance = new FileWindow());
    }

    private constructor() {
        let content = htmlToElement(
            `<div>
            </div>`
        ) as HTMLDivElement;
        super("File", content);
        content.classList.add("fileWindow");
    }
}

// To allow for saving and loading of system presets