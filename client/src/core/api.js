import {appState, mutations} from "../stores/store.js";
import {EVENT_TYPES} from "shared/api/events.js";
import {debug, parseMessage, serializeMessage} from "shared/api/utils.js";
import {DiscordSDK} from "@discord/embedded-app-sdk";

const events_i = Object.values(EVENT_TYPES).reduce((acc, type) => {
    acc[type] = [];
    return acc;
}, {});

export async function connectToAPI() {
    await mutations.initBackend();
    await mutations.initWS();
    appState.ws.onmessage = (message) => {
        const parsedMessage = parseMessage(message.data);
        debug(parsedMessage);
        events_i[parsedMessage.type].forEach(callback => {
            callback(parsedMessage.payload);
        });
    }
}

export async function connectToDiscord() {
    const sdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
    await sdk.ready();
    const {code} = await sdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: [
            "identify",
            "guilds",
            "applications.commands"
        ],
    })
    const response = await fetch("/.proxy/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
        }),
    });
    const { access_token } = await response.json();
    const auth = await sdk.commands.authenticate({
        access_token,
    });
    if (!auth) {
        throw new Error("Authenticate command failed");
    }
    console.log("Discord SDK initialized");
    return {sdk, userId: auth.user.username.toString(), roomId: sdk.instanceId};
}

export function cleanupAPI() {
    appState.ws.close();
}

export function subscribe(event, callback) {
    if (!event || !events_i[event]) {
        console.error('Unknown event:', event);
        return;
    }
    events_i[event].push(callback);
}

export function send(message) {
    appState.ws.send(serializeMessage(message));
}
