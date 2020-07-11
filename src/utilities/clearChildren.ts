export default function clearChildren(elem: HTMLElement): void {
    let child: ChildNode;
    while (child = elem.firstChild) {
        child.remove();
    }
}