"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketTester = void 0;
const ws_1 = __importDefault(require("ws"));
const config_1 = require("../config");
class WebSocketTester {
    ws = null;
    websocketURL = null;
    // Login and get JWT token
    async login(email, password) {
        const response = await fetch(`${config_1.envs.BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }
        const data = await response.json();
        this.websocketURL = data.websocketURL;
        if (!this.websocketURL) {
            throw new Error('WebSocket URL is null');
        }
        console.log('✅ Login successful');
        return this.websocketURL;
    }
    // Connect to WebSocket
    async connect() {
        if (!this.websocketURL) {
            throw new Error('Must login first');
        }
        return new Promise((resolve, reject) => {
            this.ws = new ws_1.default(this.websocketURL);
            this.ws.on('open', () => {
                console.log('✅ WebSocket connected');
                resolve();
            });
            this.ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                console.log('📨 Received message:');
                console.log(JSON.stringify(message, null, 2));
            });
            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error.message);
                reject(error);
            });
            this.ws.on('close', (code, reason) => {
                console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
            });
        });
    }
    // Send test message
    send(data) {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            console.error('❌ WebSocket not connected');
            return;
        }
        this.ws.send(JSON.stringify(data));
        console.log('📤 Sent:', data);
    }
    // Disconnect
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    // Test scenario: Instructor connects and receives notifications
    static async testInstructorConnection() {
        console.log('\n🧪 Testing Instructor WebSocket Connection\n');
        const tester = new WebSocketTester();
        try {
            // Login as instructor
            await tester.login('inst1@cmbraga.pt', '1234');
            // Connect to WebSocket
            await tester.connect();
            // Keep connection open to receive messages
            console.log('\n⏳ Listening for messages... (Press Ctrl+C to exit)\n');
            // Keep process alive
            process.on('SIGINT', () => {
                console.log('\n\n👋 Disconnecting...');
                tester.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            console.error('❌ Test failed:', error);
            tester.disconnect();
            process.exit(1);
        }
    }
    // Test scenario: Multiple connections (should close previous one)
    static async testSingleConnectionRule() {
        console.log('\n🧪 Testing Single Connection Rule\n');
        const tester1 = new WebSocketTester();
        const tester2 = new WebSocketTester();
        try {
            // Login once
            const wsUrl = await tester1.login('inst1@cmbraga.pt', '1234');
            // First connection
            console.log('\n📡 Establishing first connection...');
            await tester1.connect();
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Second connection with same URL (should close first)
            console.log('\n📡 Establishing second connection with same user...');
            tester2.websocketURL = wsUrl;
            await tester2.connect();
            console.log('\n⏳ Both connections established. First should be closed...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
            tester1.disconnect();
            tester2.disconnect();
            console.log('✅ Test completed');
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Test failed:', error);
            tester1.disconnect();
            tester2.disconnect();
            process.exit(1);
        }
    }
}
exports.WebSocketTester = WebSocketTester;
// Run tests
if (require.main === module) {
    const testType = process.argv[2] || 'connect';
    switch (testType) {
        case 'connect':
            WebSocketTester.testInstructorConnection();
            break;
        case 'single':
            WebSocketTester.testSingleConnectionRule();
            break;
        default:
            console.log('Usage: npm run test:ws [connect|single]');
            console.log('  connect - Test basic connection and message receiving');
            console.log('  single  - Test single connection per user rule');
    }
}
