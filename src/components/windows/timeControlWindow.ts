import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class TimeControlWindow extends InfoWindow {
    private static _instance: TimeControlWindow
    public static get instance() : TimeControlWindow {
        return this._instance ?? (this._instance = new TimeControlWindow());
    }
    
    public speedValue: number;
    public onSpeedChange: (speedValue: number) => any;

    private constructor() {
        let content = htmlToElement(
            `<div>
                <input type="range" min="1" max="100" value="20" class="timeRange" />
                <p>&#x0394;t=<span class="dtDisplay"></span>s</p>
            </div>`
        ) as HTMLDivElement;
        super("Time Controls", content);
        content.classList.add("timeControl");
        let timeInput = this.elem.querySelector(".timeRange") as HTMLInputElement;
        let dtDisplay = this.elem.querySelector(".dtDisplay") as HTMLSpanElement;
        timeInput.oninput = () => {
            this.speedValue = timeInput.valueAsNumber * 100;
            dtDisplay.innerHTML = this.speedValue.toString();
            if (this.onSpeedChange) this.onSpeedChange(this.speedValue);
        };
        timeInput.oninput(null);
    }
}