declare module 'cybe-socket' {
    import { EventEmitter } from 'events';
    import WebSocket from 'ws';

    export interface SocketManagerOptions {
        port?: number;
        [key: string]: any;
    }

    export interface ClientData {
        ws: WebSocket;
        publicKey: string;
    }

    export class SocketManager extends EventEmitter {
        constructor(options?: SocketManagerOptions);

        options: SocketManagerOptions;
        wss: WebSocket.Server | null;
        clients: Map<string, ClientData>;
        privateKey: string | null;
        publicKey: string | null;

        generateKeys(): void;
        encrypt(data: any, clientPublicKey: string): string;
        decrypt(encryptedBase64: string): any;
        setup(): void;
        handleMessage(ws: WebSocket, clientId: string, rawMessage: WebSocket.Data): void;
        sendSecureMessage(data: any, clientId: string): boolean;
        broadcast(data: any, excludeClientId?: string | null): void;
        shutdown(): void;

        // Events
        on(event: 'ready', listener: (port: number) => void): this;
        on(event: 'client_connected', listener: (clientId: string) => void): this;
        on(event: 'client_disconnected', listener: (clientId: string) => void): this;
        on(event: 'message', listener: (data: any, clientId: string) => void): this;
        on(event: 'error', listener: (error: Error, clientId?: string) => void): this;
        on(event: 'shutdown', listener: () => void): this;
        on(event: string, listener: (...args: any[]) => void): this;

        once(event: 'ready', listener: (port: number) => void): this;
        once(event: 'client_connected', listener: (clientId: string) => void): this;
        once(event: 'client_disconnected', listener: (clientId: string) => void): this;
        once(event: 'message', listener: (data: any, clientId: string) => void): this;
        once(event: 'error', listener: (error: Error, clientId?: string) => void): this;
        once(event: 'shutdown', listener: () => void): this;
        once(event: string, listener: (...args: any[]) => void): this;

        emit(event: 'ready', port: number): boolean;
        emit(event: 'client_connected', clientId: string): boolean;
        emit(event: 'client_disconnected', clientId: string): boolean;
        emit(event: 'message', data: any, clientId: string): boolean;
        emit(event: 'error', error: Error, clientId?: string): boolean;
        emit(event: 'shutdown'): boolean;
        emit(event: string, ...args: any[]): boolean;
    }
}