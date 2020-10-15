export default class HTMLRepeater<T> {
    private elems: Map<T, Element> = new Map<T, Element>();
    private elementFactory: (obj: T) => Element;
    private container: Element;

    constructor(elementFactory: (obj: T) => Element, container: Element, items: T[]) {
        this.elementFactory = elementFactory;
        this.container = container;

        this.notifyObjsAdded(items);
    }

    public clear() {
        this.elems.clear();
        var cNode = this.container.cloneNode(false);
        this.container.parentNode.replaceChild(cNode, this.container);
    }

    public regenerate(objs: T[]) {
        this.clear();
        this.notifyObjsAdded(objs);
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