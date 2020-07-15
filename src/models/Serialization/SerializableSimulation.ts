import SerializableBody from "./SerializableBody";
import Simulation from "../../components/simulation";

export default class SerializableSimulation {
    public globalLightEnabled: boolean;
    public axesVisible: boolean;
    public bodies: SerializableBody[];

    constructor(og: Simulation) {
        this.globalLightEnabled = og.globalLightEnabled;
        this.axesVisible = og.axesVisible;
        this.bodies = og.bodies.map(x => new SerializableBody(x));
    }
}