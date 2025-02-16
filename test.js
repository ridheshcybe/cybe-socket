const path = require("path");
const express = require("express");

const app = express();

const { SocketManager } = require('./server');

// Create a new socket manager
const manager = new SocketManager({ port: 1000 });

// Set up event handlers
manager.on('ready', (port) => {
    console.log(`Secure WebSocket server running on port ${port}`);
});

manager.on('client_connected', (clientId) => {
    console.log(`Client connected: ${clientId}`);
    manager.sendSecureMessage({ type: 'welcome', text: 'Welcome to the secure server!' }, clientId);
});

manager.on('message', (data, clientId) => {
    console.log(`Received from client ${clientId}:`, data);
    // Echo back to the client
    manager.sendSecureMessage(data, clientId);
});

// Start the server
manager.setup();

app.get('/', (req, res) => {
    res.sendFile(path.resolve("./test/index.html"))
});

app.get('/browser.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, './browser.js'))
})

app.listen(8080);