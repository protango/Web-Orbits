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
        super("Time Controls", `
            <div class="timeControl">
                <input type="range" min="-2000" max="10000" value="2000" class="timeRange" />
                <p>&#x0394;t=<span class="dtDisplay"></span>s</p>
            </div>`);
        let timeInput = this.elem.querySelector(".timeRange") as HTMLInputElement;
        let dtDisplay = this.elem.querySelector(".dtDisplay") as HTMLSpanElement;
        timeInput.oninput = () => {
            this.speedValue = timeInput.valueAsNumber;
            dtDisplay.innerHTML = this.speedValue.toString();
            if (this.onSpeedChange) this.onSpeedChange(this.speedValue);
        };
        timeInput.oninput(null);
    }
}