import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class ErrorWindow extends InfoWindow {
    private constructor(message: string) {
        let content = htmlToElement(
            `<div class="error">
                <span>${message}</span><br>
                <button>OK</button>
            </div>`
        ) as HTMLDivElement;
        super("Error", content);
    }
}