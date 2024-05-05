declare class EventEmitter {
    events: {
        [x: string]: any[];
    };
    constructor();
    on(event: string, listener: any): void;
    removeListener(event: any, listener: any): void;
    emit(event: any, ...args: any[]): void;
    once(event: any, listener: any): void;
}
export declare class SocketManager extends EventEmitter {
    socket: WebSocket;
    name: string;
    /**
     * Socket manager
     */
    constructor(socket: WebSocket);
    send(method: any, data: any): void;
}
export default SocketManager;
