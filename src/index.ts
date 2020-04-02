import './site.scss';
import MainComponent from "./components/main/main";
import htmlToElement from "./modules/htmlToElement";

document.body.appendChild(
    htmlToElement("<h1 id='titleMain'>Web-Orbits</h1>")
);
var main = new MainComponent();