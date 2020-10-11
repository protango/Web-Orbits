import { standardPixelShader } from "babylonjs/Shaders/standard.fragment";
import { IBody } from "../../models/Body/IBody";
import htmlToElement from "../../utilities/htmlToElement";
import Simulation from "../simulation";
import InfoWindow from "./infoWindow";

class Plot {
    public elem: HTMLCanvasElement;
    public data: number[] = [];
    private ctx: CanvasRenderingContext2D;

    // Settings
    public margins = [0, 0, 40, 75];
    public axesColor = "#c4c4c4";
    public lineColor = "#c4c4c4";
    public xLabel = "";
    public yLabel = "";
    public yLims = [0, 10];
    public xLims = [0, 10];
    public xTicks = 10;
    public yTicks = 10;
    public tickLen = 7;
    public fontSize = 12;
    public autoYLim = true;

    private get width() { return this.ctx.canvas.width; }
    private get height() { return this.ctx.canvas.height; }

    constructor(canvas: HTMLCanvasElement, data: number[]) {
        this.elem = canvas;
        this.ctx = canvas.getContext("2d");
        this.data = data;
    }

    public clear() {
        this.ctx.clearRect( 0, 0, this.width, this.height);
    }

    public clearData() {
        this.data.fill(null);
    }

    public render() {
        this.validateCanvasSize();
        this.clear();
        if (this.autoYLim)
            this.findYLims();
        this.drawAxes();
        this.drawPlotData();
    }

    public pushDataVal(val: number) {
        this.data.shift();
        this.data.push(val);
        this.render();
    }

    private drawAxes() {
        let btmGutter = this.height - this.margins[2] + this.margins[0];
        const fontSize = this.fontSize, tickLen = this.tickLen;
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.font = fontSize + "px Arial";
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "right";
        ctx.lineWidth = 1;
        ctx.moveTo(this.margins[3], 0);
        ctx.lineTo(this.margins[3], btmGutter);
        ctx.lineTo(this.width, btmGutter);
        ctx.stroke();

        let xTickValStep = (this.xLims[1] - this.xLims[0]) / (this.xTicks - 1);
        let xTickVal = this.xLims[0];
        let xTickPosStep = (this.width - this.margins[3] - this.margins[1]) / (this.xTicks - 1);
        let xTickPos = this.margins[3];
        ctx.beginPath();
        for (let i = 0; i<this.xTicks; i++) {
            ctx.moveTo(xTickPos, btmGutter);
            ctx.lineTo(xTickPos, btmGutter + tickLen);
            ctx.fillText((Math.round(xTickVal * 1e10) / 1e10).toPrecision(3), xTickPos, btmGutter + tickLen + fontSize);
            xTickPos += xTickPosStep;
            xTickVal += xTickValStep;
        }

        let yTickValStep = (this.yLims[1] - this.yLims[0]) / (this.yTicks - 1);
        let yTickVal = this.yLims[0];
        let yTickPosStep = (this.height - this.margins[0] - this.margins[2]) / (this.yTicks - 1);
        let yTickPos = btmGutter;
        for (let i = 0; i<this.yTicks; i++) {
            ctx.moveTo(this.margins[3], yTickPos);
            ctx.lineTo(this.margins[3] - tickLen, yTickPos);
            ctx.fillText((Math.round(yTickVal * 1e10) / 1e10).toExponential(2), this.margins[3] - tickLen, yTickPos + (i === 0 ? 0 : fontSize));
            yTickPos -= yTickPosStep;
            yTickVal += yTickValStep;
        }
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillText(this.xLabel, (this.width - this.margins[3] - this.margins[1]) / 2 + this.margins[3], btmGutter + tickLen + fontSize * 2 + 5);
        ctx.save();
        ctx.translate(this.margins[3] - tickLen - 55, (this.height - this.margins[0] - this.margins[2]) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(this.yLabel, 0, tickLen / 2);
        ctx.restore();
    }

    private validateCanvasSize() {
        let canvas = this.elem;
        if (canvas.clientHeight !== canvas.height)
            canvas.height = canvas.clientHeight;
        if (canvas.clientWidth !== canvas.width)
            canvas.width = canvas.clientWidth;
    }

    private findYLims() {
        let min = Infinity, max = -Infinity;
        const data = this.data;
        for(let val of data) {
            if (val === null) continue;
            if (val < min) min = val;
            if (val > max) max = val;
        }
        if (min === Infinity) min = -1;
        if (max === -Infinity) max = 1;

        let yRange = max - min;
        if (yRange === 0) {
            max+=1; min-=1; yRange = max-min;
        }
        this.yLims[0] = min;
        this.yLims[1] = max;
    }

    private drawPlotData() {
        const ctx = this.ctx;
        const data = this.data;
        const margins = this.margins;

        let width = ctx.canvas.width - margins[1] - margins[3], height = ctx.canvas.height - margins[0] - margins[2];
        let xSpacing = width / (data.length - 1);

        const min = this.yLims[0], max = this.yLims[1];
        let yRange = max - min;

        let firstPoint = true;
        ctx.beginPath();
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = 1;
        for (let i = 0; i<data.length; i++) {
            let val = data[i];
            if (val == null) continue;
            let pX = i * xSpacing + margins[3];
            let pY = (1 - ((val - min) / yRange)) * height + margins[0];

            if (firstPoint) {
                ctx.moveTo(pX, pY);
                firstPoint = false;
            } else {
                ctx.lineTo(pX, pY);
            }
        }
        ctx.stroke();
    }
}

export default class ObjectInfoWindow extends InfoWindow {
    private static _instance: ObjectInfoWindow
    public static get instance() : ObjectInfoWindow {
        return this._instance ?? (this._instance = new ObjectInfoWindow());
    }

    private velPlot: Plot;
    private accPlot: Plot;
    private simulation: Simulation;

    private constructor() {
        super("Real time statistics", `
            <div class="objectInfo">
                <h2 class="vel">Velocity over time</h2>
                <canvas style="width: 100%; height: 300px; display: block;" class="velPlot"></canvas>
                <h2 class="acc" style="margin-top: 10px;">Acceleration over time</h2>
                <canvas style="width: 100%; height: 300px; display: block;" class="accPlot"></canvas>
            </div>`);
        this.resize(462, 704);
        this.minSize = {width: 373, height: 289};
        let velCanvas = this.elem.querySelector(".velPlot") as HTMLCanvasElement;
        this.velPlot = new Plot(velCanvas, new Array(200).fill(null));
        this.velPlot.xLims = [-10, 0];
        this.velPlot.xLabel = "Real Time (s)";
        this.velPlot.yLabel = "Velocity (m/s)";

        let accCanvas = this.elem.querySelector(".accPlot") as HTMLCanvasElement;
        this.accPlot = new Plot(accCanvas, new Array(200).fill(null));
        this.accPlot.xLims = [-10, 0];
        this.accPlot.xLabel = "Real Time (s)";
        this.accPlot.yLabel = "Acceleration (m/s/s)";
    }

    private interval: number = null;
    public close() {
        if (this.interval !== null) {
            window.clearInterval(this.interval);
            this.interval = null;
        }
        super.close();
    }

    public open() {
        if (this.interval !== null) window.clearInterval(this.interval);
        this.velPlot.clearData();
        this.accPlot.clearData();
        this.interval = window.setInterval(() => {
            if (this.simulation.targetBody) {
                let b = this.simulation.targetBody;
                let vel = Math.sqrt(Math.pow(b.velocity.x, 2) + Math.pow(b.velocity.y, 2) +Math.pow(b.velocity.z, 2));
                let acc = Math.sqrt(Math.pow(b.acceleration.x, 2) + Math.pow(b.acceleration.y, 2) +Math.pow(b.acceleration.z, 2));
                this.velPlot.pushDataVal(vel);
                this.accPlot.pushDataVal(acc); 
            }
        }, 50);
        super.open();
    }

    attachSimulation(sim: Simulation) {
        this.simulation = sim;
        sim.onTargetChange.addHandler((b) => {
            let name = b ? b.name : "No Target";
            this.elem.querySelector("h2.vel").innerHTML = "Velocity over time: " + name;
            this.elem.querySelector("h2.acc").innerHTML = "Acceleration over time: " + name;
            this.velPlot.clearData();
            this.accPlot.clearData();
        });
    }

}

// Viewing object details