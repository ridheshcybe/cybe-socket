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
export class SocketManager extends EventEmitter {
    name: string;
    socket: WebSocket;
    constructor(socket: WebSocket, options: Partial<Options>) {
        super();
        const self = this;

        const opt = Object.assign({
            nameFunc: () => crypto.randomUUID(),
            onerror: (ev) => console.error(`Error Socket: ${(ev.message)}`),
            onclose: (ev) => console.log(`Socket closed: ${ev.reason} | ${ev.code} | ${ev.wasClean}`),
        }, options);

        this.name = opt.nameFunc() || crypto.randomUUID();
        this.socket = socket;

        socket.addEventListener("error", opt.onerror);
        socket.addEventListener("close", opt.onerror);
        socket.addEventListener("message", function wrap(Wrapper) {
            if (Wrapper.data !== 'ready') {
                console.warn("ready not fired");
                return socket.close(3000, "use protocol");
            }
            self.send("name", self.name);
            self.emit("ready", self.name);

            socket.removeEventListener("message", wrap);
            socket.addEventListener("message", (ev) => {
                const dataIN = (ev.data).toString()
                if (!dataIN.includes('(SocketSplit)')) {
                    console.warn("CLOSED SOCKET SOCKETSPLIT NOT INCLUDED")
                    return socket.close(3000, "use protocol")
                };
                const [method, data] = dataIN.split('(SocketSplit)');
                if (!method || !data) {
                    console.warn("CLOSED SOCKET METHOD || DATA IS FALSY")
                    return socket.close(3000, 'use protocol');
                }

                try {
                    self.emit(method, (data));
                } catch (error) {
                    console.warn("socket emit error")
                    socket.close(3000, 'use protocol ERROR: ' + error.message);
                }
            })
        })
    }
    send(method: string, data: any) {
        this.socket.send(`${method}(SocketSplit)${(data)}`);
    }
}

export default SocketManager;