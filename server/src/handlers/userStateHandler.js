import {rooms} from "../store.js";
import {sendToAllUsers} from "../servers/ws.js";
import {userState} from "shared/api/events.js";

export function userStateHandler(ws, payload) {
    const room = rooms[payload.roomId];
    const user = room.users.find(user => user.id === payload.playerId);
    user.userState = payload.state;
    sendToAllUsers(payload.roomId, userState(payload.roomId, payload.playerId, payload.state));
}