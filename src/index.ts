import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';
import '@fortawesome/fontawesome-free/scss/fontawesome.scss';
import './site.scss';
import Simulation from "./components/simulation";
import htmlToElement from "./utilities/htmlToElement";
import MenuBar from './components/menuBar';

document.body.appendChild(
    htmlToElement("<h1 id='titleMain'>Web-Orbits</h1>")
);
document.body.appendChild(
    htmlToElement("<p id='fpsCounter'>60.0 FPS</p>")
);

var main = new Simulation();
var menuBar = new MenuBar();

export function getSimulation() {
    return main;
};

export function getMenuBar() {
    return menuBar;
};