import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';
import '@fortawesome/fontawesome-free/scss/brands.scss';
import '@fortawesome/fontawesome-free/scss/fontawesome.scss';
import './site.scss';
import Simulation from "./components/simulation";
import htmlToElement from "./utilities/htmlToElement";
import MenuBar from './components/menuBar';
import moneyShotPng from '../assets/money-shot.png';

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
document.body.appendChild(
    htmlToElement(`
        <div id="licences" style="display: none">
            <p>This project is licenced under the <a href="https://opensource.org/licenses/AGPL-3.0">GNU Affero General Public License version 3</a></p>
            <p>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> and <a href="https://fontawesome.com/">Font Awesome</a></p>
            <span class="close">Close</span>
        </div>
    `)
);
document.body.appendChild(
    htmlToElement(`<span id="licenceslink">Licence and credits</span>`)
);
(document.body.querySelector("#licences .close") as HTMLSpanElement).onclick = e => {
    document.getElementById('licences').style.display = 'none';
}
(document.body.querySelector("#licenceslink") as HTMLSpanElement).onclick = e => {
    document.getElementById('licences').style.display = 'unset';
}

var main = new Simulation();
var menuBar = new MenuBar();

export function getSimulation() {
    return main;
};

export function getMenuBar() {
    return menuBar;
};