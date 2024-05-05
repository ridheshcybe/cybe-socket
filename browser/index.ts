function indexOf(haystack, needle) {
    var i = 0, length = haystack.length, idx = -1, found = false;

    while (i < length && !found) {
        if (haystack[i] === needle) {
            idx = i;
            found = true;
        }

        i++;
    }

    return idx;
};


/* Polyfill EventEmitter. */
class EventEmitter {
    events: {
        [x: string]: any[]
    }
    constructor() {
        this.events = {};
    };
    on(event: string, listener) {
        if (typeof this.events[event] !== 'object') {
            this.events[event] = [];
        }

        this.events[event].push(listener);
    }
    removeListener(event, listener) {
        var idx;

        if (typeof this.events[event] === 'object') {
            idx = indexOf(this.events[event], listener);

            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    }
    emit(event, ...args) {
        var i, listeners, length;

        if (typeof this.events[event] === 'object') {
            listeners = this.events[event].slice();
            length = listeners.length;

            for (i = 0; i < length; i++) {
                listeners[i].apply(this, args);
            }
        }
    }
    once(event, listener) {
        this.on(event, function g() {
            this.removeListener(event, g);
            listener.apply(this, arguments);
        });
    }
}

export class SocketManager extends EventEmitter {
    socket: WebSocket;
    name: string;
    /**
     * Socket manager
     */
    constructor(socket: WebSocket) {
        super();
        const self = this;
        this.socket = socket;

        socket.onopen = () => {
            socket.send("ready");
        }

        socket.onerror = (ev) => {
            console.log(`Error Socket: ${JSON.stringify(ev)}`)
        }

        socket.onclose = (ev) => {
            console.log(`Socket closed: ${ev.reason} | ${ev.code} | ${ev.wasClean}`)
        }

        socket.onmessage = (ev) => {
            const dataIN = (ev.data)
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
                self.emit(method, data);
            } catch (error) {
                console.warn("CLOSED SOCKET SOCKETSPLIT NOT INCLUDED")
                socket.close(3000, 'use protocol ERROR: ' + error.message);
            }
        }

        self.once("name", (name) => {
            self.name = name;
            self.emit("ready", name)
        });
    }
    send(method, data) {
        this.socket.send(`${method}(SocketSplit)${(data)}`);
    }
}

export default SocketManager;

if (global) global.SocketManager = SocketManager;