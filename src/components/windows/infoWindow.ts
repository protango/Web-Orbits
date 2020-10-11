import htmlToElement from "../../utilities/htmlToElement";

export default abstract class InfoWindow {
    protected minSize = {width: 200, height: 100};
    protected elem: HTMLDivElement;
    protected onOpen: () => void;
    protected onClose: () => void;
    protected onFocus: () => void;
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
    public get top() { return this.elem.offsetTop; }
    public set top(val: number) { this.elem.style.top = val + "px"; }
    public get left() { return this.elem.offsetLeft; }
    public set left(val: number) { this.elem.style.left = val + "px";  }

    private topBarElem :HTMLDivElement;
    public childWin: InfoWindow = null;

    constructor(title: string, htmlContent: string) {
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
        let content = htmlToElement(htmlContent) as HTMLElement;
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
        if (this.onClose) this.onClose();
    }

    public focus() {
        if (this.childWin) {
            this.childWin.focus();
            return;
        }

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
        if (this.onFocus) this.onFocus();
    }

    public resize(width: number, height: number)
    {
        if (width != null) this.elem.style.width = width + "px";
        if (height != null) this.elem.style.height = height + "px";
    }

    public destroy() {
        this.elem.remove();
        let idx = this.otherWindows.indexOf(this);
        if (idx !== -1) {
            this.otherWindows.splice(idx, 1);
        }
    }

    protected changeTitle(title: string) {
        this.title = title;
        (this.elem.querySelector(".topBar h1") as HTMLHeadingElement).innerText = title;
    }
}