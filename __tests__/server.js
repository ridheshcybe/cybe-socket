const assert = require("assert");
const { WebSocketServer, WebSocket } = require("websocket-mockup");
const SocketManager = {
    server: require("../server/index").SocketManager,
    client: require("../browser/index").SocketManager
}

try {
    const serverinit = new SocketManager.server(new WebSocketServer());
} catch (error) {
    console.error(error);
}