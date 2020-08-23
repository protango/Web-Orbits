import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class DialogWindow extends InfoWindow {
    private parent: InfoWindow;

    constructor(message: string, parent: InfoWindow) {

        super("Error", `
            <div class="dialog">
                <span>${message}</span>
                <div style="margin-top: 15px; text-align: center">
                    <button class="ok">OK</button>
                </div>
            </div>`);
        this.parent = parent;

        if (this.parent.errorWin) this.parent.errorWin.close();
        this.parent.errorWin = this;

        this.otherWindows = parent.otherWindows;
        this.otherWindows.push(this);

        let span = this.elem.querySelector("span");
        this.open();
        this.resize(210, span.offsetHeight + 79);
        (this.elem.querySelector(".ok") as HTMLButtonElement).onclick = () => this.close();
        this.onClose = () => {
            this.destroy();
            this.parent.errorWin = null;
        }
    }
}