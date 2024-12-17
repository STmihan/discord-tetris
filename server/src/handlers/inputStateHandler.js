import {sendToAllUsersExcept} from "../servers/ws.js";
import {inputState} from "shared/api/events.js";

export function inputStateHandler(ws, payload) {
    sendToAllUsersExcept(payload.roomId, payload.playerId, inputState(payload.roomId, payload.playerId, payload.input));
}