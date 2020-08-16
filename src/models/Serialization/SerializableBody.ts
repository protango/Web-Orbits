import SerializableVector3 from "./SerializableVector3";
import { BodyAppearance } from "../../components/simulation";
import Body3D from "../Body/Body3D";

export default class SerializableBody {
    public position: SerializableVector3;
    public velocity: SerializableVector3;
    public diameter: number;
    public lightRange: number;
    public name: string;
    public mass: number;
    public appearance: BodyAppearance;

    constructor(og: Body3D) {
        this.position = new SerializableVector3(og.position);
        this.velocity = new SerializableVector3(og.velocity);
        this.diameter = og.diameter;
        this.lightRange = og.light ? og.light.range : 0;
        this.name = og.name;
        this.mass = og.mass;
        this.appearance = og.appearance;
    }
}