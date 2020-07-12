export default class HTMLRepeater<T> {
    private elems: Map<T, HTMLElement> = new Map<T, HTMLElement>();
    private elementFactory: (obj: T) => HTMLElement;
    private container: HTMLElement;

    constructor(elementFactory: (obj: T) => HTMLElement, container: HTMLElement, items: T[]) {
        this.elementFactory = elementFactory;
        this.container = container;

        this.notifyObjsAdded(items);
    }

    public notifyObjsUpdated(objs: T[]) {
        for (let obj of objs) {
            let elem = this.elems.get(obj);
            if (elem) {
                let newElem = this.elementFactory(obj)
                elem.replaceWith(newElem);
                this.elems.set(obj, newElem);
            }
        }
    }

    public notifyObjsAdded(objs: T[]) {
        for (let obj of objs) {
            let newElem = this.elementFactory(obj)
            this.container.appendChild(newElem);
            this.elems.set(obj, newElem);
        }
    }

    public notifyObjsRemoved(objs: T[]) {
        for (let obj of objs) {
            let elem = this.elems.get(obj);
            if (elem) {
                elem.remove();
                this.elems.delete(obj);
            }
        }
    }
}