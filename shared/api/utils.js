import {EVENT_TYPES} from "./events.js";

export function message(type, payload) {
    return {
        type: type,
        payload: payload,
    }
}

export function serializeMessage(message) {
    return JSON.stringify(message);
}

export function parseMessage(message) {
    return JSON.parse(message);
}

export function debug(message) {
    const type = Object.keys(EVENT_TYPES).find(key => EVENT_TYPES[key] === message.type);
    console.log('TYPE:', `"${type}"`, 'PAYLOAD:', message.payload);
}
