var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SocketManager = void 0;
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
    }
    ;
    /* Polyfill EventEmitter. */
    var EventEmitter = /** @class */ (function () {
        function EventEmitter() {
            this.events = {};
        }
        ;
        EventEmitter.prototype.on = function (event, listener) {
            if (typeof this.events[event] !== 'object') {
                this.events[event] = [];
            }
            this.events[event].push(listener);
        };
        EventEmitter.prototype.removeListener = function (event, listener) {
            var idx;
            if (typeof this.events[event] === 'object') {
                idx = indexOf(this.events[event], listener);
                if (idx > -1) {
                    this.events[event].splice(idx, 1);
                }
            }
        };
        EventEmitter.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var i, listeners, length;
            if (typeof this.events[event] === 'object') {
                listeners = this.events[event].slice();
                length = listeners.length;
                for (i = 0; i < length; i++) {
                    listeners[i].apply(this, args);
                }
            }
        };
        EventEmitter.prototype.once = function (event, listener) {
            this.on(event, function g() {
                this.removeListener(event, g);
                listener.apply(this, arguments);
            });
        };
        return EventEmitter;
    }());
    var SocketManager = /** @class */ (function (_super) {
        __extends(SocketManager, _super);
        /**
         * Socket manager
         */
        function SocketManager(socket) {
            var _this = _super.call(this) || this;
            var self = _this;
            _this.socket = socket;
            socket.onopen = function () {
                socket.send("ready");
            };
            socket.onerror = function (ev) {
                console.log("Error Socket: ".concat(JSON.stringify(ev)));
            };
            socket.onclose = function (ev) {
                console.log("Socket closed: ".concat(ev.reason, " | ").concat(ev.code, " | ").concat(ev.wasClean));
            };
            socket.onmessage = function (ev) {
                var dataIN = (ev.data);
                if (!dataIN.includes('(SocketSplit)')) {
                    console.warn("CLOSED SOCKET SOCKETSPLIT NOT INCLUDED");
                    return socket.close(3000, "use protocol");
                }
                ;
                var _a = dataIN.split('(SocketSplit)'), method = _a[0], data = _a[1];
                if (!method || !data) {
                    console.warn("CLOSED SOCKET METHOD || DATA IS FALSY");
                    return socket.close(3000, 'use protocol');
                }
                try {
                    self.emit(method, data);
                }
                catch (error) {
                    console.warn("CLOSED SOCKET SOCKETSPLIT NOT INCLUDED");
                    socket.close(3000, 'use protocol ERROR: ' + error.message);
                }
            };
            self.once("name", function (name) {
                self.name = name;
                self.emit("ready", name);
            });
            return _this;
        }
        SocketManager.prototype.send = function (method, data) {
            this.socket.send("".concat(method, "(SocketSplit)").concat((data)));
        };
        return SocketManager;
    }(EventEmitter));
    exports.SocketManager = SocketManager;
    exports.default = SocketManager;
    if (global)
        global.SocketManager = SocketManager;
});
//# sourceMappingURL=index.js.map