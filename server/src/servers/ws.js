import {WebSocketServer} from "ws";
import {debug, parseMessage, serializeMessage} from "shared/api/utils.js";
import {EVENT_TYPES} from "shared/api/events.js";
import {rooms, wss_clients} from "../store.js";
import {helloHandler} from "../handlers/helloHandler.js";
import {fullStateHandler} from "../handlers/fullStateHandler.js";
import {disconnectHandler} from "../handlers/disconnectHandler.js";
import {roomStateHandler} from "../handlers/roomStateHandler.js";
import {inputStateHandler} from "../handlers/inputStateHandler.js";
import {userStateHandler} from "../handlers/userStateHandler.js";

export function wsServer() {
    const wss = new WebSocketServer({noServer: true});

    wss.on('connection', (ws) => {
        console.log('New client connected');
        ws.on('message', (message) => {
            const event = parseMessage(message);
            switch (event.type) {
                case EVENT_TYPES.HELLO:
                    helloHandler(ws, event.payload);
                    break;
                case EVENT_TYPES.FULL_STATE:
                    fullStateHandler(ws, event.payload);
                    break;
                case EVENT_TYPES.ROOM_STATE:
                    roomStateHandler(ws, event.payload);
                    break;
                case EVENT_TYPES.INPUT_STATE:
                    inputStateHandler(ws, event.payload);
                    break;
                case EVENT_TYPES.USER_STATE:
                    userStateHandler(ws, event.payload);
                    break;
                default:
                    console.error('Unknown event type');
                    debug(event);
                    break;
            }
        });

        ws.on('close', (event) => {
            disconnectHandler(ws, event);
        });
    });

    return wss;
}

export function sendToUser(roomId, userId, message) {
    console.log('Sending message to user:', userId, 'in room:', roomId);
    const ws = rooms[roomId].wss_clients[userId];
    ws.send(serializeMessage(message));
}

export function sendToAllUsers(roomId, message) {
    if (!rooms[roomId]) {
        console.error('Room does not exist');
        return;
    }
    const users = rooms[roomId].users;
    users.forEach(user => {
        sendToUser(roomId, user.id, message);
    });
}

export function sendToAllUsersExcept(roomId, userId, message) {
    const users = rooms[roomId].users;
    users.forEach(user => {
        if (user.id !== userId) {
            sendToUser(roomId, user.id, message);
        }
    });
}
