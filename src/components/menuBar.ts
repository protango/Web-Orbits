import htmlToElement from "../utilities/htmlToElement";
import InfoWindow from "./windows/infoWindow";
import TimeControlWindow from "./windows/timeControlWindow";

export class MenuBarItem {
    public elem : HTMLDivElement;
    private window: InfoWindow;
    constructor(text: string, icon: string, window: InfoWindow) {
        this.window = window;
        this.elem = htmlToElement(
            `<div class='menuBarItem'>
                <i class="${icon}"></i>
                <span class="text">${text}</span>
            </div>`
        ) as HTMLDivElement;
        this.elem.onclick = () => {
            this.window.open();
        }
    }
}

export default class MenuBar {
    private elem : HTMLDivElement;
    private items: MenuBarItem[] = [];
    constructor() {
        this.elem = htmlToElement("<div class='menuBar'></div>") as HTMLDivElement;
        document.body.appendChild(this.elem);
        this.AddItem(new MenuBarItem("Time Controls", "fas fa-forward", TimeControlWindow.instance));
    }

    public AddItem(item: MenuBarItem) {
        this.items.push(item);
        this.elem.appendChild(item.elem);
    }
}