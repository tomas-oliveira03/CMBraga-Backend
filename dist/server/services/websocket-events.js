"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketEvent = void 0;
exports.userConnectedToWebsocket = userConnectedToWebsocket;
const websocket_1 = require("./websocket");
var WebSocketEvent;
(function (WebSocketEvent) {
    WebSocketEvent["NEW_MESSAGE"] = "newMessage";
    WebSocketEvent["NEW_NOTIFICATION"] = "newNotification";
    WebSocketEvent["CONNECTION_STATUS"] = "connectionStatus";
})(WebSocketEvent || (exports.WebSocketEvent = WebSocketEvent = {}));
// Send message when user connects to WebSocket
function userConnectedToWebsocket(userId) {
    websocket_1.webSocketManager.sendToUser(userId, {
        event: WebSocketEvent.CONNECTION_STATUS,
        data: {
            status: 'connected',
            message: 'WebSocket connection established successfully',
        },
        timestamp: new Date()
    });
}
