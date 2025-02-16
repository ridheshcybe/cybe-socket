// ====== CLIENT SIDE ======

// Utility functions for encoding/decoding
const arrayBufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
};

const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// PEM format conversion utilities
const spkiToPem = (spkiBuffer) => {
    const base64 = arrayBufferToBase64(spkiBuffer);
    // Insert newlines every 64 characters
    let pemContents = base64.replace(/(.{64})/g, '$1\n');
    return `-----BEGIN PUBLIC KEY-----\n${pemContents}\n-----END PUBLIC KEY-----`;
};

const pemToArrayBuffer = (pem) => {
    const base64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '')
        .trim();
    return base64ToArrayBuffer(base64);
};

// Modern EventEmitter implementation
class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(eventName, callback) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        this._events[eventName].push(callback);
        return this;
    }

    off(eventName, callback) {
        if (!this._events[eventName]) return this;

        const index = this._events[eventName].indexOf(callback);
        if (index !== -1) {
            this._events[eventName].splice(index, 1);
        }
        return this;
    }

    emit(eventName, ...args) {
        if (!this._events[eventName]) return false;

        this._events[eventName].forEach(callback => {
            callback.apply(this, args);
        });
        return true;
    }

    once(eventName, callback) {
        const onceWrapper = (...args) => {
            callback.apply(this, args);
            this.off(eventName, onceWrapper);
        };
        return this.on(eventName, onceWrapper);
    }
}

// SecureClient class for encrypted WebSocket communication
class SecureClient extends EventEmitter {
    constructor(url) {
        super();
        this.url = url;
        this.socket = null;
        this.privateKey = null;
        this.publicKey = null;
        this.serverPublicKey = null;
        this.connected = false;
    }

    async init() {
        try {
            // Generate RSA-OAEP key pair
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            this.privateKey = keyPair.privateKey;
            this.publicKey = keyPair.publicKey;

            // Export public key for sending to server
            const exportedPublicKey = await window.crypto.subtle.exportKey(
                "spki",
                this.publicKey
            );

            return spkiToPem(exportedPublicKey);
        } catch (error) {
            console.error("Error initializing secure client:", error);
            this.emit('error', error);
            throw error;
        }
    }

    async connect() {
        if (!this.publicKey || !this.privateKey) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.url);

                this.socket.onopen = async () => {
                    const exportedPublicKey = await window.crypto.subtle.exportKey(
                        "spki",
                        this.publicKey
                    );
                    const publicKeyPem = spkiToPem(exportedPublicKey);

                    // Send client's public key to server
                    this.socket.send(JSON.stringify({
                        type: 'key_exchange',
                        publicKey: publicKeyPem
                    }));
                };

                this.socket.onmessage = async (event) => {
                    await this.handleMessage(event.data);
                };

                this.socket.onerror = (error) => {
                    this.emit('error', error);
                    reject(error);
                };

                this.socket.onclose = () => {
                    this.connected = false;
                    this.emit('disconnected');
                };

                // Resolve once we've successfully connected and exchanged keys
                this.once('connected', () => resolve());
            } catch (error) {
                console.error("Error connecting to server:", error);
                this.emit('error', error);
                reject(error);
            }
        });
    }

    async handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'key_exchange_response':
                    // Import server's public key
                    const serverKeyArrayBuffer = pemToArrayBuffer(message.publicKey);
                    this.serverPublicKey = await window.crypto.subtle.importKey(
                        "spki",
                        serverKeyArrayBuffer,
                        {
                            name: "RSA-OAEP",
                            hash: "SHA-256"
                        },
                        true,
                        ["encrypt"]
                    );

                    this.connected = true;
                    this.emit('connected');
                    break;

                case 'encrypted_message':
                    const decryptedData = await this.decryptMessage(message.data);
                    this.emit('message', decryptedData);
                    break;

                default:
                    console.warn("Unknown message type:", message.type);
            }
        } catch (error) {
            console.error("Error handling message:", error);
            this.emit('error', error);
        }
    }

    async sendSecureMessage(data) {
        if (!this.connected || !this.serverPublicKey) {
            throw new Error("Not connected to server or server public key not available");
        }

        try {
            const dataString = JSON.stringify(data);
            const encodedData = new TextEncoder().encode(dataString);

            // Encrypt the data with the server's public key
            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP"
                },
                this.serverPublicKey,
                encodedData
            );

            const base64EncryptedData = arrayBufferToBase64(encryptedData);

            // Send the encrypted message
            this.socket.send(JSON.stringify({
                type: 'encrypted_message',
                data: base64EncryptedData
            }));

            return true;
        } catch (error) {
            console.error("Error sending secure message:", error);
            this.emit('error', error);
            return false;
        }
    }

    async decryptMessage(encryptedBase64) {
        try {
            const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);

            // Decrypt using our private key
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP"
                },
                this.privateKey,
                encryptedBuffer
            );

            const decryptedString = new TextDecoder().decode(decryptedBuffer);
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error("Error decrypting message:", error);
            this.emit('error', error);
            throw error;
        }
    }

    disconnect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
        this.connected = false;
    }
}

// Export for browser environment
if (typeof window !== 'undefined') {
    window.SecureClient = SecureClient;
}