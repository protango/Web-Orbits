import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class DialogWindow extends InfoWindow {
    private parent: InfoWindow;

    constructor(message: string, title: string, parent: InfoWindow) {

        super(title, `
            <div class="dialog">
                <span>${message}</span>
                <div style="margin-top: 15px; text-align: center">
                    <button class="ok">OK</button>
                </div>
            </div>`);
        this.parent = parent;
        this.top = this.parent.top;
        this.left = this.parent.left;

        if (this.parent.childWin) this.parent.childWin.close();
        this.parent.childWin = this;

        this.otherWindows = parent.otherWindows;
        this.otherWindows.push(this);

        let span = this.elem.querySelector("span");
        this.open();
        this.resize(210, span.offsetHeight + 79);
        (this.elem.querySelector(".ok") as HTMLButtonElement).onclick = () => this.close();
        this.onClose = () => {
            this.destroy();
            this.parent.childWin = null;
        }
    }
}