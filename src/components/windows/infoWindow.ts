import htmlToElement from "../../utilities/htmlToElement";

export default abstract class InfoWindow {
    protected elem: HTMLDivElement;
    public title: string;
    public isOpen: boolean = false;

    constructor(title: string, content: HTMLDivElement) {
        this.title = title;
        this.elem = htmlToElement(
            `<div class="infoWindow">
                <div class="topBar">
                    <h1>${title}</h1>
                    <i class="close fas fa-times"></i>
                </div>
                <div class="horizontal">
                    <!-- content goes here -->
                    <div class="rightDragHandle"></div>
                </div>
                <div class="btmDragHandle"></div>
                <div class="btmlftDragHandle"></div>
            </div>`
        ) as HTMLDivElement;
        content.classList.add("content");
        this.close();
        this.elem.querySelector(".horizontal").insertBefore(content, this.elem.querySelector(".rightDragHandle"));
        (this.elem.querySelector(".close") as HTMLElement).onclick = () => this.close();
        document.body.appendChild(this.elem);

        // Top bar dragging stuff
        this.attachDragControl(this.elem.querySelector(".topBar") as HTMLDivElement);

        // Resizing Stuff
        this.attachResizeControl(
            this.elem.querySelector(".rightDragHandle") as HTMLDivElement,
            this.elem.querySelector(".btmDragHandle") as HTMLDivElement,
            this.elem.querySelector(".btmlftDragHandle") as HTMLDivElement
        );
    }

    private attachResizeControl(rightHandle: HTMLDivElement, btmHandle: HTMLDivElement, btmLftHandle: HTMLDivElement) {
        let self = this;

        let activeHandle: HTMLDivElement = null;

        let mouseMoveHandler = (e: MouseEvent) => {
            switch (activeHandle)
            {
                case rightHandle:
                    self.elem.style.width = (e.pageX - self.elem.offsetLeft) + "px";
                    break;
                case btmHandle:
                    self.elem.style.height = (e.pageY - self.elem.offsetTop) + "px";
                    break;
                case btmLftHandle:
                    self.elem.style.width = (e.pageX - self.elem.offsetLeft) + "px";
                    self.elem.style.height = (e.pageY - self.elem.offsetTop) + "px";
                    break;
            }
        }
        let mouseUpHandler = (e: MouseEvent) => {
            if (activeHandle != null) {
                activeHandle = null;
                document.body.removeEventListener("mouseup", mouseUpHandler);
                document.body.removeEventListener("mousemove", mouseMoveHandler);
            }
        }
        let mouseDownHandler = (e) => {
            if (activeHandle == null) {
                activeHandle = e.target as HTMLDivElement;
                document.body.addEventListener("mouseup", mouseUpHandler);
                document.body.addEventListener("mousemove", mouseMoveHandler);
            }
        };

        rightHandle.onmousedown = mouseDownHandler;
        btmHandle.onmousedown = mouseDownHandler;
        btmLftHandle.onmousedown = mouseDownHandler;
    }

    private attachDragControl(topBarElem: HTMLDivElement) {
        let self = this;
        let dragOffset: number[] = null;
        let mouseMoveHandler = (e: MouseEvent) => {
            self.elem.style.left = (e.pageX - dragOffset[0]) + "px";
            self.elem.style.top = (e.pageY - dragOffset[1]) + "px";
        }
        let mouseUpHandler = (e: MouseEvent) => {
            if (dragOffset != null) {
                dragOffset = null;
                document.body.removeEventListener("mouseup", mouseUpHandler);
                document.body.removeEventListener("mousemove", mouseMoveHandler);
            }
        }
        topBarElem.onmousedown = (e) => {
            if (dragOffset == null) {
                dragOffset = [e.offsetX, e.offsetY];
                document.body.addEventListener("mouseup", mouseUpHandler);
                document.body.addEventListener("mousemove", mouseMoveHandler);
            }
        }
    }

    public open() {
        this.isOpen = true;
        this.elem.style.display = null;
    }

    public close() {
        this.isOpen = false;
        this.elem.style.display = "none";
    }
}