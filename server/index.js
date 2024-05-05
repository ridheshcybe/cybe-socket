"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketManager = void 0;
var node_events_1 = require("node:events");
/**
 * 3000 Wrong Protocol
 * 3001 Parsing error
 * 3002 Invalid ID
 * 3003 send Protocol error (invalid properties (different properties))
 */
var SocketManager = /** @class */ (function (_super) {
    __extends(SocketManager, _super);
    function SocketManager(socket, options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var opt = Object.assign({
            nameFunc: function () { return crypto.randomUUID(); },
            onerror: function (ev) { return console.error("Error Socket: ".concat((ev.message))); },
            onclose: function (ev) { return console.log("Socket closed: ".concat(ev.reason, " | ").concat(ev.code, " | ").concat(ev.wasClean)); },
        }, options);
        _this.name = opt.nameFunc() || crypto.randomUUID();
        _this.socket = socket;
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
            socket.addEventListener("message", function (ev) {
                var dataIN = (ev.data).toString();
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
                    self.emit(method, (data));
                }
                catch (error) {
                    console.warn("socket emit error");
                    socket.close(3000, 'use protocol ERROR: ' + error.message);
                }
            });
        });
        return _this;
    }
    SocketManager.prototype.send = function (method, data) {
        this.socket.send("".concat(method, "(SocketSplit)").concat((data)));
    };
    return SocketManager;
}(node_events_1.EventEmitter));
exports.SocketManager = SocketManager;
exports.default = SocketManager;
//# sourceMappingURL=index.js.map