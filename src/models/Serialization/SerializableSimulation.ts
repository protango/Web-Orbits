import SerializableBody from "./SerializableBody";
import Simulation from "../../components/simulation";
import TimeControlWindow from "../../components/windows/timeControlWindow";

export default class SerializableSimulation {
    public globalLightEnabled: boolean;
    public axesVisible: boolean;
    public dt: number;
    public bodies: SerializableBody[];

    constructor(og: Simulation) {
        this.globalLightEnabled = og.globalLightEnabled;
        this.axesVisible = og.axesVisible;
        this.bodies = og.bodies.map(x => new SerializableBody(x));
        this.dt = TimeControlWindow.instance.speedValue;
    }
}