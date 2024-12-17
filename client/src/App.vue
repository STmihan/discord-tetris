<template>
  <div :class="['background', isDarkTheme ? 'dark' : 'light']">
    <div class="app">
      <div class="theme-switcher btn">
        <button @click="toggleTheme">
          ☀
        </button>
      </div>
      <div class="is-initialized" v-if="!appState.initialized">
        <span>Loading...</span>
      </div>
      <Tetris
          v-if="appState.initialized"
          v-for="playerId in playerIds"
          :key="playerId"
          :isDarkTheme="isDarkTheme"
          :player-id="playerId"
      />
      <div class="make-player btn"
           v-if="appState.initialized && isLocalPlayerSpectator && playerIds.length < 2 && appState.state === 'waiting'">
        <button @click="joinAsPlayer">
          <span>➕</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import Tetris from "./components/Tetris.vue";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {appState, gameInstances, gameState, mutations} from "./stores/store.js";
import {cleanupAPI, connectToAPI, send, subscribe} from "./core/api.js";
import {EVENT_TYPES, hello, roomState, userState} from "shared/api/events.js";
import {USER_STATES} from "shared/api/user.js";

const isDarkTheme = ref((localStorage.getItem("theme") || "dark") === "dark");

const playerIds = computed(() => {
  return gameState.players.filter((player) => player.userState === USER_STATES.PLAYER)
      .map((player) => player.id)
});

const isLocalPlayerSpectator = computed(() => {
  if (!appState.localPlayerId) {
    return false;
  }
  if (!gameState.players) {
    return false;
  }
  const localPlayer = gameState.players.find((p) => p.id === appState.localPlayerId);
  if (!localPlayer) {
    return false;
  }
  return localPlayer.userState === USER_STATES.SPECTATOR;
});

const setup = async () => {
  await connectToAPI();
  subscribe(EVENT_TYPES.SEED, ({seed}) => {
    mutations.setRandomSeed(seed);
  });
  subscribe(EVENT_TYPES.FULL_STATE, ({playerId, state}) => {
    if (playerId === appState.localPlayerId) {
      return;
    }
    mutations.setFullState(playerId, state);
  });
  subscribe(EVENT_TYPES.INPUT_STATE, ({playerId, input}) => {
    const gameInstance = gameInstances.instances[playerId];
    if (!gameInstance) {
      return;
    }
    gameInstance.onInput(input);
  });
  subscribe(EVENT_TYPES.DISCONNECTED, ({playerId}) => {
    mutations.removeUser(playerId);
  });
  subscribe(EVENT_TYPES.ROOM_STATE, ({state}) => {
    mutations.changeGameState(state);
  });
  subscribe(EVENT_TYPES.USER_STATE, ({roomId, playerId, state}) => {
    mutations.setUserState(playerId, state);
  });
  send(hello(appState.localPlayerId, appState.roomId));

  appState.initialized = true;
}

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  localStorage.setItem("theme", isDarkTheme.value ? "dark" : "light");
  for (const instanceKey in gameInstances.instances) {
    gameInstances.instances[instanceKey].toggleTheme();
  }
};

const joinAsPlayer = () => {
  send(userState(appState.roomId, appState.localPlayerId, USER_STATES.PLAYER));
};

const onKeydown = (e) => {
  if (e.key === "t") {
    toggleTheme();
  }

  if (!appState.initialized) {
    return;
  }

  if (isLocalPlayerSpectator.value) {
    return;
  }

  if (e.key === " ") {
    if (appState.state === "waiting") {
      send(roomState(appState.roomId, "playing", appState.state));
      mutations.changeGameState("playing");
    }
    if (appState.state === "gameover") {
      send(roomState(appState.roomId, "waiting", appState.state));
    }
  }

  if (e.key === "Escape") {
    if (appState.state === "playing") {
      send(roomState(appState.roomId, "paused", appState.state));
    } else if (appState.state === "paused") {
      send(roomState(appState.roomId, "playing", appState.state));
    }
  }
};

onMounted(() => {
  window.removeEventListener("keydown", onKeydown);
  window.addEventListener("keydown", onKeydown);
  setup();
});

onBeforeUnmount(() => {
  cleanupAPI();
  window.removeEventListener("keydown", onKeydown);
});


</script>

<style>
.background {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--background-light);
  transition: background 0.3s;
}

.background.dark {
  background: var(--background-dark);
}

.app {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.theme-switcher {
  position: fixed;
  top: 20px;
  right: 20px;
}

.btn button {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  padding: 10px;
  border: none;
  cursor: pointer;
  background: var(--container-dark);
  transition: transform 0.3s;
  color: var(--text-dark);
}

.btn button span {
  color: transparent;
  text-shadow: 0 0 0 var(--text-dark);
}

.dark .btn button span {
  color: transparent;
  text-shadow: 0 0 0 var(--text-light);
}

.dark .btn button {
  background: var(--container-light);
  color: var(--text-light);
}

.btn button:hover {
  transform: scale(1.1) translateY(5px);
}

.is-initialized {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: var(--text-light);
}

.dark .is-initialized {
  color: var(--text-dark);
}

.make-player {
  position: fixed;
  bottom: 20px;
  right: 50%;
}

</style>
