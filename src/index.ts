import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';
import '@fortawesome/fontawesome-free/scss/brands.scss';
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
document.body.appendChild(
    htmlToElement(`
        <p id='byLine'>
            <span>Made with <i class="fas fa-heart"></i> by <a href="https://github.com/protango">Protango</a></span>
            <span id="viewOnGH"><i class="fab fa-github"></i> <a href="https://github.com/protango/Web-Orbits">View source on GitHub!</a></span>
        </p>
    `)
);

var main = new Simulation();
var menuBar = new MenuBar();

export function getSimulation() {
    return main;
};

export function getMenuBar() {
    return menuBar;
};