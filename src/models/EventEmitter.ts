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
        if (this.isSuspended) {
            this.suspendEvents = true;
            if (this.suspendReducer) {
                this.suspendAggregate = this.suspendReducer(this.suspendAggregate, e);
            }
        } else {
            this.handlers.forEach(x => x(e));
        }
    }

    // Suspension stuff
    private suspendTimeoutId: number;
    private suspendAggregate: T = null;
    private suspendReducer: (accumulator: T, item: T) => T = null;
    private suspendEvents: boolean = false;
    public isSuspended: boolean = false;

    /**
     * Suspends the event emitter so that it will not emit any events for the specified timeout, or until unsuspend is called.
     * If a compile function is specified, all emitted events during the suspension period will be compiled into a single event that is fired once the suspension period is over
     * @param timeout The maximum length of the suspension period
     * @param reducer Reducer function used to aggregate each event parameter
     * @param initial Initial value for the event reducer
     */
    public suspend(timeout: number = 1000, reducer: (accumulator: T, item: T) => T = null, initial: T = null) {
        this.isSuspended = true;
        this.suspendTimeoutId = setTimeout(() => this.unSuspend(), timeout);
        this.suspendAggregate = initial;
        this.suspendReducer = reducer;
        this.suspendEvents = false;
    }

    public unSuspend() {
        this.isSuspended = false;
        clearTimeout(this.suspendTimeoutId);
        this.suspendTimeoutId = null;
        if (this.suspendEvents && this.suspendAggregate) {
            this.trigger(this.suspendAggregate);
        }
        this.suspendAggregate = null;
        this.suspendEvents = false;
    }
}