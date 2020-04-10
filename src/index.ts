import './site.scss';
import Simulation from "./components/simulation";
import htmlToElement from "./utilities/htmlToElement";

document.body.appendChild(
    htmlToElement("<h1 id='titleMain'>Web-Orbits</h1>")
);
var main = new Simulation();