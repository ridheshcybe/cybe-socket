/// <reference types="node" />
import { EventEmitter } from 'node:events';
interface Options {
    onerror: Event;
    onclose: CloseEvent;
    nameFunc: VoidFunction;
}
/**
 * 3000 Wrong Protocol
 * 3001 Parsing error
 * 3002 Invalid ID
 * 3003 send Protocol error (invalid properties (different properties))
 */
export declare class SocketManager extends EventEmitter {
    name: string;
    socket: WebSocket;
    constructor(socket: WebSocket, options: Partial<Options>);
    send(method: string, data: any): void;
}
export default SocketManager;
