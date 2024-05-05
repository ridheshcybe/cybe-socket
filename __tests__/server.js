const WS = require("jest-websocket-mock").WS;
const SocketManager = {
    server: require("../server/index").SocketManager,
    client: require("../browser/index").SocketManager
}

it('should connect to each other', async () => {
    const server = new WS("ws//localhost:1284");
    server.on("connection", async (web) => {
        const Manager = new SocketManager.server(web);
        const client = new SocketManager.client(new WebSocket("ws://localhost:1284"));
        server.connected.then(() => {
            Manager.on("hello", (doc) => {
                WS.clean();
                expect(doc).toBe("hi");
            });
            client.send("hello", "hi");
        });
    })
});
