import {sendToAllUsers, sendToAllUsersExcept} from "../servers/ws.js";
import {rooms} from "../store.js";
import {fullState, roomState} from "shared/api/events.js";
import {USER_STATES} from "shared/api/user.js";

export function fullStateHandler(ws, payload) {
    const room = rooms[payload.roomId];
    room.states[payload.playerId] = payload.state;
    
    sendToAllUsersExcept(payload.roomId, payload.playerId, fullState(payload.roomId, payload.playerId, room.states[payload.playerId]));

    const isAllPlayersGameOver = Object.values(room.states).every(state => {
        if (!state) return true;
        return state.isGameOver;
    });
    if (isAllPlayersGameOver && room.roomState !== "gameover") {
        sendToAllUsers(payload.roomId, roomState(payload.roomId, "gameover"));
    }
    
    const isAllPlayersSpectatorsWhenPlaying = room.users.every(user => {
        return user.userState === USER_STATES.SPECTATOR
    }) && room.roomState === "playing";
    
    if (isAllPlayersSpectatorsWhenPlaying) {
        sendToAllUsers(payload.roomId, roomState(payload.roomId, "waiting"));
    }
}

