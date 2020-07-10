import htmlToElement from "../../utilities/htmlToElement";

export default abstract class InfoWindow {
    protected minSize = {width: 200, height: 100};
    protected elem: HTMLDivElement;
    protected onOpen: () => void;
    public title: string;
    public isOpen: boolean = false;
    public isFocussed: boolean = false;
    public otherWindows: InfoWindow[] = [];
    
    public get zIndex() : number {
        return Number(this.elem.style.zIndex || 0);
    }
    public set zIndex(val: number) {
        this.elem.style.zIndex = val.toString();
    }
    public get width() : number {
        return Number(this.elem.style.width || 0);
    }
    public set position(val: number) {
        this.elem.style.zIndex = val.toString();
    }

    private topBarElem :HTMLDivElement;
    

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
        (this.elem.querySelector(".close") as HTMLElement).onclick = (e) => this.close();
        (this.elem.querySelector(".close") as HTMLElement).onmousedown = (e) => e.stopPropagation();
        document.body.appendChild(this.elem);
        this.topBarElem = this.elem.querySelector(".topBar");

        // Top bar dragging stuff
        this.attachDragControl(this.topBarElem);

        // Resizing Stuff
        this.attachResizeControl(
            this.elem.querySelector(".rightDragHandle") as HTMLDivElement,
            this.elem.querySelector(".btmDragHandle") as HTMLDivElement,
            this.elem.querySelector(".btmlftDragHandle") as HTMLDivElement
        );

        this.elem.addEventListener("mousedown", () => this.focus());
    }

    private attachResizeControl(rightHandle: HTMLDivElement, btmHandle: HTMLDivElement, btmLftHandle: HTMLDivElement) {
        let self = this;

        let activeHandle: HTMLDivElement = null;

        let mouseMoveHandler = (e: MouseEvent) => {
            let width: number, height: number;
            switch (activeHandle)
            {
                case rightHandle:
                    width = (e.pageX - self.elem.offsetLeft);
                    break;
                case btmHandle:
                    height = (e.pageY - self.elem.offsetTop);
                    break;
                case btmLftHandle:
                    width = (e.pageX - self.elem.offsetLeft);
                    height = (e.pageY - self.elem.offsetTop);
                    break;
            }

            if (width != null)
                if (width >= self.minSize.width) self.elem.style.width = width + "px";
                else self.elem.style.width = self.minSize.width + "px";
            if (height != null)
                if (height >= self.minSize.height) self.elem.style.height = height + "px";
                else self.elem.style.height = self.minSize.height + "px";
        }
        let mouseUpHandler = (e: MouseEvent) => {
            if (activeHandle != null) {
                activeHandle = null;
                this.elem.style.userSelect = null;
                document.body.removeEventListener("mouseup", mouseUpHandler);
                document.body.removeEventListener("mousemove", mouseMoveHandler);
            }
        }
        let mouseDownHandler = (e) => {
            if (activeHandle == null) {
                activeHandle = e.target as HTMLDivElement;
                this.elem.style.userSelect = "none";
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
                this.elem.style.userSelect = null;
                document.body.removeEventListener("mouseup", mouseUpHandler);
                document.body.removeEventListener("mousemove", mouseMoveHandler);
            }
        }
        topBarElem.onmousedown = (e) => {
            if (dragOffset == null) {
                dragOffset = [e.offsetX, e.offsetY];
                this.elem.style.userSelect = "none";
                document.body.addEventListener("mouseup", mouseUpHandler);
                document.body.addEventListener("mousemove", mouseMoveHandler);
            }
        }
    }

    public open() {
        this.isOpen = true;
        this.elem.style.display = null;
        this.focus();
        if (this.onOpen) this.onOpen();
    }

    public close() {
        this.isOpen = false;
        this.elem.style.display = "none";
    }

    public focus() {
        if (this.isFocussed) return;

        if (!this.isOpen) this.open();

        let ordered = this.otherWindows.sort((x, y) => x.zIndex - y.zIndex);
        ordered.splice(ordered.indexOf(this), 1);
        ordered.push(this);

        for (let i = 0; i<ordered.length - 1; i++)
        {
            let win = ordered[i];
            win.zIndex = i + 1;
            win.isFocussed = false;
            win.elem.classList.remove("focus");
        }
        this.zIndex = ordered.length;
        this.isFocussed = true;
        this.elem.classList.add("focus");
    }

    public resize(width: number, height: number)
    {
        if (width != null) this.elem.style.width = width + "px";
        if (height != null) this.elem.style.height = height + "px";
    }
}