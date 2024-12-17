import {rooms} from "../store.js";
import {sendToAllUsers} from "../servers/ws.js";
import {disconnected} from "shared/api/events.js";

export function disconnectHandler(ws, payload) {
    let userId = '';
    let roomId = '';
    for (const wsRoomId in rooms) {
        for (const wsUserId in rooms[wsRoomId].wss_clients) {
            let wssClient = rooms[wsRoomId].wss_clients[wsUserId];
            if (wssClient === ws) {
                userId = wsUserId;
                roomId = wsRoomId;
                break;
            }
        }
    }

    console.log('User disconnected:', userId, 'in room:', roomId);
    if (!rooms[roomId]) {
        console.error('Room not found');
        return;
    }
    if (rooms[roomId].wss_clients[userId]) {
        delete rooms[roomId].wss_clients[userId];
    }
    if (rooms[roomId].states[userId]) {
        delete rooms[roomId].states[userId];
    }
    rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== userId);
    sendToAllUsers(roomId, disconnected(userId));
    
    if (rooms[roomId].users.length === 0) {
        console.log('Room is empty, deleting room:', roomId);
        delete rooms[roomId];
    }
}
