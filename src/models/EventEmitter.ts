export default class EventEmitter<T> {
    private handlers: Set<(e: T) => void> = new Set<(e: T) => void>();

    constructor() {
    }

    public addHandler(handler: (e: T) => void) {
        this.handlers.add(handler);
    }

    public removeHandler(handler: (e: T) => void) {
        this.handlers.delete(handler);
    }

    public trigger(e: T) {
        this.handlers.forEach(x => x(e));
    }
}