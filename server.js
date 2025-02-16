// ====== SERVER SIDE (Node.js) ======

// Server implementation with modern Node.js features
const crypto = require('crypto');
const WebSocket = require('ws');
const EventEmitter = require("events").EventEmitter

class SocketManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            port: 1000,
            ...options
        };

        this.wss = null;
        this.clients = new Map(); // Map of client connections to their public keys
        this.privateKey = null;
        this.publicKey = null;
    }

    generateKeys() {
        // Generate RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    encrypt(data, clientPublicKey) {
        const dataString = JSON.stringify(data);
        const encryptedData = crypto.publicEncrypt(
            {
                key: clientPublicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(dataString)
        );

        return encryptedData.toString('base64');
    }

    decrypt(encryptedBase64) {
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

        const decryptedBuffer = crypto.privateDecrypt(
            {
                key: this.privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            encryptedBuffer
        );

        return JSON.parse(decryptedBuffer.toString());
    }

    setup() {
        if (!this.privateKey || !this.publicKey) {
            this.generateKeys();
        }

        this.wss = new WebSocket.Server({ port: this.options.port });

        this.wss.on('connection', (ws) => {
            const clientId = crypto.randomUUID();

            ws.on('message', (message) => {
                this.handleMessage(ws, clientId, message);
            });

            ws.on('close', () => {
                this.clients.delete(clientId);
                this.emit('client_disconnected', clientId);
            });

            ws.on('error', (error) => {
                console.error(`Client ${clientId} error:`, error);
                this.emit('error', error, clientId);
            });
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
            this.emit('error', error);
        });

        this.emit('ready', this.options.port);
    }

    handleMessage(ws, clientId, rawMessage) {
        try {
            const message = JSON.parse(rawMessage.toString());

            switch (message.type) {
                case 'key_exchange':
                    // Store client's public key
                    this.clients.set(clientId, {
                        ws,
                        publicKey: message.publicKey
                    });

                    // Send server's public key to client
                    ws.send(JSON.stringify({
                        type: 'key_exchange_response',
                        publicKey: this.publicKey
                    }));

                    this.emit('client_connected', clientId);
                    break;

                case 'encrypted_message':
                    if (!this.clients.has(clientId)) {
                        console.error(`Received message from unknown client: ${clientId}`);
                        return;
                    }

                    const decryptedData = this.decrypt(message.data);
                    this.emit('message', decryptedData, clientId);
                    break;

                default:
                    console.warn(`Unknown message type from client ${clientId}:`, message.type);
            }
        } catch (error) {
            console.error(`Error handling message from client ${clientId}:`, error);
            this.emit('error', error, clientId);
        }
    }

    sendSecureMessage(data, clientId) {
        if (!this.clients.has(clientId)) {
            console.error(`Cannot send message to unknown client: ${clientId}`);
            return false;
        }

        try {
            const { ws, publicKey } = this.clients.get(clientId);
            const encryptedData = this.encrypt(data, publicKey);

            ws.send(JSON.stringify({
                type: 'encrypted_message',
                data: encryptedData
            }));

            return true;
        } catch (error) {
            console.error(`Error sending secure message to client ${clientId}:`, error);
            this.emit('error', error, clientId);
            return false;
        }
    }

    broadcast(data, excludeClientId = null) {
        for (const [clientId, client] of this.clients.entries()) {
            if (clientId !== excludeClientId) {
                this.sendSecureMessage(data, clientId);
            }
        }
    }

    shutdown() {
        if (this.wss) {
            this.wss.close(() => {
                this.emit('shutdown');
            });
        }
    }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SocketManager };
}