import {Room, rooms} from "../store.js";
import {sendToAllUsers, sendToUser} from "../servers/ws.js";
import {fullState, roomState, seed, userState} from "shared/api/events.js";
import {GameState} from "shared/api/gameState.js";
import {User} from "shared/api/user.js";

export function helloHandler(ws, payload) {
    if (!rooms[payload.roomId]) {
        rooms[payload.roomId] = new Room(payload.roomId);
    }
    const room = rooms[payload.roomId];
    const userNotExists = !room.users.find(user => user.id === payload.playerId);
    if (userNotExists) {
        room.users.push(new User(payload.playerId));
    }
    const user = room.users.find(user => user.id === payload.playerId);

    room.wss_clients[user.id] = ws;
    room.states[user.id] = null;

    sendToUser(room.id, user.id, seed(room.seed));
    sendToUser(room.id, user.id, roomState(room.id, room.roomState));
    room.users.forEach(roomUser => {
        sendToAllUsers(room.id, userState(room.id, roomUser.id, roomUser.userState));
        setTimeout(() => {
            sendToAllUsers(room.id, fullState(room.id, roomUser.id, room.states[roomUser.id]));
        }, 1000);
    });
}

