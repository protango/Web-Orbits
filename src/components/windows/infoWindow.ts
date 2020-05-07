import htmlToElement from "../../utilities/htmlToElement";

export default abstract class InfoWindow {
    protected elem: HTMLDivElement;
    private dragOffset: number[] = null;
    public title: string;

    constructor(title: string, content: HTMLDivElement) {
        this.title = title;
        this.elem = htmlToElement(
            `<div class="infoWindow">
                <div class="topBar">
                    <h1>${title}</h1>
                    <i class="close fas fa-times"></i>
                </div>
            </div>`
        ) as HTMLDivElement;
        content.classList.add("content");
        this.close();
        this.elem.appendChild(content);
        (this.elem.querySelector(".close") as HTMLElement).onclick = () => this.close();
        document.body.appendChild(this.elem);

        let topBarElem = this.elem.querySelector(".topBar") as HTMLDivElement;
        
        let self = this;
        let mouseMoveHandler = (e: MouseEvent) => {
            self.elem.style.left = (e.pageX - self.dragOffset[0]) + "px";
            self.elem.style.top = (e.pageY - self.dragOffset[1]) + "px";
        }
        let mouseUpHandler = (e: MouseEvent) => {
            if (self.dragOffset != null) {
                self.dragOffset = null;
                document.body.removeEventListener("mouseup", mouseUpHandler);
                document.body.removeEventListener("mousemove", mouseMoveHandler);
            }
        }
        topBarElem.onmousedown = (e) => {
            if (this.dragOffset == null) {
                this.dragOffset = [e.offsetX, e.offsetY];
                document.body.addEventListener("mouseup", mouseUpHandler);
                document.body.addEventListener("mousemove", mouseMoveHandler);
            }
        }
    }

    public open() {
        this.elem.style.display = "block";
    }

    public close() {
        this.elem.style.display = "none";
    }
}