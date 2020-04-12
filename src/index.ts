import './site.scss';
import Simulation from "./components/simulation";
import htmlToElement from "./utilities/htmlToElement";

document.body.appendChild(
    htmlToElement("<h1 id='titleMain'>Web-Orbits</h1>")
);
document.body.appendChild(
    htmlToElement("<p id='fpsCounter'>60.0 FPS</p>")
);
var main = new Simulation();