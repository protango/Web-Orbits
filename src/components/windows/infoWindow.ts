import htmlToElement from "../../utilities/htmlToElement";

export default abstract class InfoWindow {
    protected elem: HTMLDivElement;
    constructor(content: HTMLDivElement) {
        this.elem = htmlToElement(
            `<div class="infoWindow">
                <div class="topBar">
                    <i class="close fas fa-times"></i>
                </div>
            </div>`
        ) as HTMLDivElement;
        content.classList.add("content");
        this.close();
        this.elem.appendChild(content);
        (this.elem.querySelector(".close") as HTMLElement).onclick = () => this.close();
        document.body.appendChild(this.elem);
    }

    public open() {
        this.elem.style.display = "block";
    }

    public close() {
        this.elem.style.display = "none";
    }
}