import {message} from "./utils.js";

export const INPUT_EVENTS = {
    MOVE_LEFT: 0,
    MOVE_RIGHT: 1,
    ROTATE_RIGHT: 2,
    ROTATE_LEFT: 3,
    MOVE_DOWN: 4,
}

export const EVENT_TYPES = {
    HELLO: 0,
    FULL_STATE: 1,
    INPUT_STATE: 2,
    SEED: 3,
    DISCONNECTED: 4,
    ROOM_STATE: 5,
    USER_STATE: 6,
}

export function hello(playerId, roomId) {
    return message(EVENT_TYPES.HELLO, {
        playerId,
        roomId,
    });
}

export function fullState(roomId, playerId, state) {
    return message(EVENT_TYPES.FULL_STATE, {
        roomId,
        playerId,
        state,
    });
}

export function inputState(roomId, playerId, input) {
    return message(EVENT_TYPES.INPUT_STATE, {
        roomId,
        playerId,
        input,
    });
}

export function roomState(roomId, state, oldState) {
    return message(EVENT_TYPES.ROOM_STATE, {
        roomId,
        state,
        oldState,
    });
}

export function userState(roomId, playerId, state) {
    return message(EVENT_TYPES.USER_STATE, {
        roomId,
        playerId,
        state,
    });
}

export function seed(seed) {
    return message(EVENT_TYPES.SEED, {
        seed,
    });
}

export function disconnected(playerId) {
    return message(EVENT_TYPES.DISCONNECTED, {
        playerId,
    });
}
