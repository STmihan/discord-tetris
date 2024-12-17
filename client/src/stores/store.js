import {reactive} from 'vue';
import {GameState} from "shared/api/gameState.js";
import {connectToDiscord} from "../core/api.js";
import {User} from "shared/api/user.js";

export let discordSdk = null;

export const gameState = reactive({
    games: {},
    seed: 0,
    players: [],
});

export const appState = reactive({
    state: 'waiting', // waiting, playing, gameover, paused
    localPlayerId: "",
    roomId: "",
    ws: null,
    initialized: false,
});

export const gameInstances = reactive({
    instances: {},
})

export const mutations = {
    createNewGame(playerId) {
        gameState.games[playerId] = new GameState();
    },
    setInstance(playerId, instance) {
        gameInstances.instances[playerId] = instance;
    },

    updateBoard(playerId, newBoard) {
        gameState.games[playerId].board = newBoard;
    },
    incrementScore(playerId, amount) {
        gameState.games[playerId].score += amount;
    },
    setGameOver(playerId, status) {
        gameState.games[playerId].isGameOver = status;
    },
    setCurrentPiece(playerId, piece) {
        gameState.games[playerId].currentPiece = piece;
    },
    setNextPiece(playerId, piece) {
        gameState.games[playerId].nextPiece = piece;
    },
    setCurrentPos(playerId, x, y) {
        gameState.games[playerId].currentPos = {x, y};
    },
    clearLines(playerId, lines) {
        gameState.games[playerId].linesCleared += lines;
    },
    setLevel(playerId, level) {
        gameState.games[playerId].level = level;
    },

    changeGameState(newState) {
        appState.state = newState;
    },

    setRandomSeed(seed) {
        gameState.seed = seed;
    },
    setFullState(playerId, state) {
        gameState.games[playerId] = state;
        if (gameInstances.instances[playerId]) {
            gameInstances.instances[playerId].onFullState(state);
        }
    },
    removeUser(playerId) {
        gameState.games[playerId] = null;
        gameInstances.instances[playerId] = null;
        gameState.players = gameState.players.filter((player) => player.id !== playerId);
    },
    setUserState(playerId, state) {
        const userNotExists = !gameState.players.find(player => player.id === playerId);
        if (userNotExists) {
            gameState.players = [...gameState.players, new User(playerId)];
        }
        const user = gameState.players.find(player => player.id === playerId);
        user.userState = state;
        gameState.players = [...gameState.players];
    },

    async initBackend() {
        try {
            const {sdk, userId, roomId} = await connectToDiscord();
            discordSdk = sdk;
            appState.localPlayerId = userId;
            appState.roomId = roomId;
        } catch (e) {
            console.error(JSON.stringify(e));
            console.error("Failed to initialize Discord SDK, falling back to local mode");
            discordSdk = null;
            appState.localPlayerId = "local" + Math.random().toString(36).substring(7);
            appState.roomId = "local";
        }
    },

    async initWS() {
        return new Promise((resolve) => {
            let url;
            if (discordSdk) {
                url = `wss://${window.location.host}/.proxy/ws`;
            } else {
                if (window.location.protocol === 'http:') {
                    url = `ws://${window.location.host}/ws`;
                } else {
                    url = `wss://${window.location.host}/ws`;
                }
            }
            console.log('Connecting to:', url);
            appState.ws = new WebSocket(url);
            appState.ws.onopen = () => {
                resolve();
            }
        })
    }
};
