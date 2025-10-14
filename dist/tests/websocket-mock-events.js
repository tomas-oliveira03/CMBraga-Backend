"use strict";
// import { webSocketManager, WebSocketEvent } from '../server/services/websocket';
// import { logger } from '../lib/logger';
// export class WebSocketMockEvents {
//     // Mock: Instructor starts an activity
//     static mockActivityStarted(instructorId: string, activitySessionId: string): void {
//         console.log(`\n🎬 MOCK: Activity ${activitySessionId} started by ${instructorId}\n`);
//         // Notify the instructor
//         webSocketManager.emitActivityStatusChanged([instructorId], {
//             activitySessionId,
//             status: 'started',
//             message: 'Activity session has been started'
//         });
//     }
//     // Mock: New message in conversation
//     static mockNewMessage(recipientId: string, senderId: string, senderName: string): void {
//         console.log(`\n💬 MOCK: New message from ${senderName} to ${recipientId}\n`);
//         webSocketManager.emitNewMessage(recipientId, {
//             conversationId: 'conv-123',
//             message: 'Hello! This is a test message.',
//             senderId,
//             senderName
//         });
//     }
//     // Mock: System notification
//     static mockSystemNotification(userId: string, type: 'info' | 'warning' | 'error' | 'success'): void {
//         console.log(`\n🔔 MOCK: Sending ${type} notification to ${userId}\n`);
//         webSocketManager.emitNewNotification(userId, {
//             title: 'System Notification',
//             message: `This is a ${type} notification for testing purposes`,
//             type
//         });
//     }
//     // Mock: Activity finished
//     static mockActivityFinished(instructorIds: string[], activitySessionId: string): void {
//         console.log(`\n🏁 MOCK: Activity ${activitySessionId} finished\n`);
//         webSocketManager.emitActivityStatusChanged(instructorIds, {
//             activitySessionId,
//             status: 'finished',
//             message: 'Activity session has been completed'
//         });
//     }
//     // Mock: Broadcast to all connected users
//     static mockBroadcastNotification(): void {
//         console.log('\n📢 MOCK: Broadcasting to all connected users\n');
//         const connectedUsers = webSocketManager.getConnectedUserIds();
//         console.log(`Connected users: ${connectedUsers.join(', ')}`);
//         connectedUsers.forEach(userId => {
//             webSocketManager.emitNewNotification(userId, {
//                 title: 'Broadcast Message',
//                 message: 'This message is sent to all connected users',
//                 type: 'info'
//             });
//         });
//     }
//     // Interactive CLI for testing
//     static async startInteractiveTesting(): Promise<void> {
//         const readline = require('readline').createInterface({
//             input: process.stdin,
//             output: process.stdout
//         });
//         const ask = (question: string): Promise<string> => {
//             return new Promise((resolve) => {
//                 readline.question(question, (answer: string) => {
//                     resolve(answer);
//                 });
//             });
//         };
//         console.log('\n🎮 WebSocket Mock Events - Interactive Testing\n');
//         console.log('Commands:');
//         console.log('  1 - Mock activity started');
//         console.log('  2 - Mock new message');
//         console.log('  3 - Mock system notification');
//         console.log('  4 - Mock activity finished');
//         console.log('  5 - Mock broadcast notification');
//         console.log('  6 - Show connected users');
//         console.log('  0 - Exit\n');
//         let running = true;
//         while (running) {
//             const command = await ask('Enter command: ');
//             switch (command.trim()) {
//                 case '1': {
//                     const instructorId = await ask('Instructor ID: ');
//                     const activityId = await ask('Activity Session ID: ');
//                     this.mockActivityStarted(instructorId, activityId);
//                     break;
//                 }
//                 case '2': {
//                     const recipientId = await ask('Recipient ID: ');
//                     const senderId = await ask('Sender ID: ');
//                     const senderName = await ask('Sender Name: ');
//                     this.mockNewMessage(recipientId, senderId, senderName);
//                     break;
//                 }
//                 case '3': {
//                     const userId = await ask('User ID: ');
//                     const type = await ask('Type (info/warning/error/success): ') as any;
//                     this.mockSystemNotification(userId, type || 'info');
//                     break;
//                 }
//                 case '4': {
//                     const instructorIds = (await ask('Instructor IDs (comma-separated): ')).split(',').map(s => s.trim());
//                     const activityId = await ask('Activity Session ID: ');
//                     this.mockActivityFinished(instructorIds, activityId);
//                     break;
//                 }
//                 case '5':
//                     this.mockBroadcastNotification();
//                     break;
//                 case '6':
//                     console.log('\n👥 Connected Users:');
//                     console.log(webSocketManager.getConnectedUserIds());
//                     console.log(`Total: ${webSocketManager.getConnectedUsersCount()}\n`);
//                     break;
//                 case '0':
//                     running = false;
//                     break;
//                 default:
//                     console.log('❌ Invalid command\n');
//             }
//         }
//         readline.close();
//         console.log('\n👋 Goodbye!\n');
//         process.exit(0);
//     }
// }
// // Run interactive testing if executed directly
// if (require.main === module) {
//     // Import server setup to initialize WebSocket
//     import('../server').then(() => {
//         setTimeout(() => {
//             WebSocketMockEvents.startInteractiveTesting();
//         }, 2000);
//     });
// }
