import { calcNetForce, accelerationFromForce, integrateMotion } from "../../../models/PhysicsEngine";
import TimeControlWindow from "../timeControlWindow";

addEventListener('message', (message) => {
    let timeControlWindow = TimeControlWindow.instance;
    while(true) {
        for (let b of message.data) {
            let nf = calcNetForce(b, this.bodies);
            let a = accelerationFromForce(nf, b.mass);
            b.position = integrateMotion(b.velocity, b.position, timeControlWindow.speedValue);
            b.velocity = integrateMotion(a, b.velocity, timeControlWindow.speedValue);
        }
    }
});