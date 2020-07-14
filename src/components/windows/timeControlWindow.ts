import htmlToElement from "../../utilities/htmlToElement";
import InfoWindow from "./infoWindow";

export default class TimeControlWindow extends InfoWindow {
    private static _instance: TimeControlWindow
    public static get instance() : TimeControlWindow {
        return this._instance ?? (this._instance = new TimeControlWindow());
    }
    
    public onSpeedChange: (speedValue: number) => any;
    public get speedValue() { return this._speedValue };
    public set speedValue(val: number) {
        this._speedValue = val;
        this.formFields.timeInput.valueAsNumber = val / 100;
        this.formFields.dtDisplay.valueAsNumber = val;
        this.formFields.setBtn.disabled = true;
        if (this.prePauseSpeed != null && val > 0) {
            this.prePauseSpeed = null;
            this.formFields.pauseBtn.classList.remove("toggleOn");
        }
        if (this.onSpeedChange) this.onSpeedChange(this.speedValue);
    };
    public get isPaused() { return this.prePauseSpeed != null; }

    private prePauseSpeed: number;
    private _speedValue: number;
    private formFields: {
        timeInput: HTMLInputElement,
        dtDisplay: HTMLInputElement,
        setBtn: HTMLButtonElement,
        pauseBtn: HTMLButtonElement
    };

    private constructor() {
        super("Time Controls", `
            <div class="timeControl">
                <form>
                    <div class="horizontal" style="margin-bottom: 8px;">
                        <input type="range" min="-20" max="100" value="20" class="timeRange" />
                        <button class="iconOnly pause"><i class="fas fa-pause"></i></button>
                    </div>
                    <div class="horizontal spaced">
                        <span style="line-height: 24px; width: 23px">&#x0394;t=</span>
                        <input type="number" step="1e-10" class="dtDisplay" style="width: calc(100% - 77px)">
                        <button disabled class="setBtn" style="width: 38px">Set</button>
                    </div>
                </form>
            </div>`);
        this.formFields = {
            timeInput: this.elem.querySelector(".timeRange"),
            dtDisplay: this.elem.querySelector(".dtDisplay"),
            setBtn: this.elem.querySelector(".setBtn"),
            pauseBtn: this.elem.querySelector(".pause"),
        }
        this.formFields.timeInput.oninput = (e) => {
            this.speedValue = this.formFields.timeInput.valueAsNumber * 100;
        };
        this.formFields.dtDisplay.oninput = () => {
            if (!isNaN(this.formFields.dtDisplay.valueAsNumber) && this.formFields.dtDisplay.valueAsNumber !== this.speedValue) {
                this.formFields.setBtn.disabled = false;
            } else {
                this.formFields.setBtn.disabled = true;
            }
        };
        this.formFields.setBtn.onclick = (e) => {
            if (!this.formFields.setBtn.disabled) {
                this.speedValue = this.formFields.dtDisplay.valueAsNumber;
            }
            e.preventDefault();
        };
        this.formFields.pauseBtn.onclick = (e) => {
            this.togglePause();
            e.preventDefault();
        };

        this.formFields.timeInput.oninput(null);
    }

    public togglePause() {
        if (this.prePauseSpeed != null) {
            this.speedValue = this.prePauseSpeed;
            this.prePauseSpeed = null;
            this.formFields.pauseBtn.classList.remove("toggleOn");
        } else {
            this.prePauseSpeed = this.speedValue;
            this.speedValue = 0;
            this.formFields.pauseBtn.classList.add("toggleOn");
        }
    }
}