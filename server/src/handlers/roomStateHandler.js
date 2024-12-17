import {sendToAllUsers} from "../servers/ws.js";
import {fullState, roomState} from "shared/api/events.js";
import {rooms} from "../store.js";

export function roomStateHandler(ws, payload) {
    const room = rooms[payload.roomId];
    const oldState = room.roomState;
    room.roomState = payload.state;
    sendToAllUsers(payload.roomId, roomState(payload.roomId, payload.state, oldState));
    if (payload.state === "paused") {
        for (const userId in room.states) {
            if (room.states[userId]) {
                sendToAllUsers(payload.roomId, fullState(payload.roomId, userId, room.states[userId]));
            }
        }
    }
}