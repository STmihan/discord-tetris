<template>
  <div :class="['tetris', isDarkTheme ? 'dark' : 'light']">
    <div :class="['locker-panel', appState.state]">
      <span>{{ gameStateLabel }}</span>
    </div>
    <div class="tetris-container">
      <div class="left-panel">
        <canvas
            class="game-canvas"
            ref="game-canvas"
            width="200"
            height="400"
        ></canvas>
      </div>
      <div class="right-panel">
        <div class="info-panel">
          <h2 class="title">{{ playerId }}</h2>
          <div class="score-block">
            <div class="info-item">
              <span class="label">Score:</span>
              <span class="value">{{ gameState.games[playerId]?.score || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">Lines:</span>
              <span class="value">{{ gameState.games[playerId]?.linesCleared || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="label">Level:</span>
              <span class="value">{{ gameState.games[playerId]?.level || 1 }}</span>
            </div>
          </div>
          <div class="next-block">
            <div class="next-title">Next block:</div>
            <canvas
                class="next-block-canvas"
                ref="next-block-canvas"
                width="80"
                height="80"
            ></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import {computed, onBeforeUnmount, onMounted, useTemplateRef, watch} from 'vue';
import {appState, gameInstances, gameState, mutations} from '../stores/store.js';
import {Tetris} from '../core/game.js';
import {EVENT_TYPES} from "shared/api/events.js";
import {subscribe} from "../core/api.js";

const {isDarkTheme, playerId} = defineProps({
  isDarkTheme: {
    type: Boolean,
    required: true,
  },
  playerId: {
    type: String,
    required: true,
  },
});

const canvas = useTemplateRef('game-canvas');
const nextBlockCanvas = useTemplateRef('next-block-canvas');


function startGame(fromPause = false) {
  if (!fromPause) {
    const ctx = canvas.value.getContext('2d');
    const nextCtx = nextBlockCanvas.value.getContext('2d');

    mutations.createNewGame(playerId);
    mutations.setInstance(playerId, new Tetris(ctx, nextCtx, playerId, isDarkTheme));

    gameInstances.instances[playerId].start();
    if (playerId === appState.localPlayerId) {
      gameInstances.instances[playerId].removeKeyListener();
      gameInstances.instances[playerId].addKeyListener();
    }
  }
}

function clearGame() {
  const ctx = canvas.value.getContext('2d');
  const nextCtx = nextBlockCanvas.value.getContext('2d');


  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  nextCtx.clearRect(0, 0, nextBlockCanvas.value.width, nextBlockCanvas.value.height);
  gameInstances.instances[playerId].removeKeyListener();
  mutations.createNewGame(playerId);
}

onMounted(() => {
  subscribe(EVENT_TYPES.ROOM_STATE, ({state, oldState}) => {
    if (state === 'playing') {
      startGame(oldState === 'paused');
    } else if (state === 'waiting') {
      clearGame();
    }
  })
  if (appState.state === 'playing') {
    startGame();
  }
});

onBeforeUnmount(() => {
  if (gameInstances.instances[playerId]) {
    gameInstances.instances[playerId].stopGameLoop();
  }
});

const gameStateLabel = computed(() => {
  switch (appState.state) {
    case 'waiting':
      return 'Waiting for players\nPress "Space" to continue';
    case 'gameover':
      return 'Game Over\nPress "Space" to restart';
    case 'paused':
      return 'Paused\nPress "Esc" to continue';
    default:
      return '';
  }
});
</script>

<style scoped>

.tetris {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Arial', sans-serif;
  transition: background 0.3s;
}

.tetris-container {
  display: flex;
  background: var(--container-light);
  border-radius: 12px;
  box-shadow: 0 8px 24px var(--shadow-light);
  padding: 12px;
  gap: 8px;
  transition: background 0.3s, box-shadow 0.3s;
}

.tetris.dark .tetris-container {
  background: var(--container-dark);
  box-shadow: 0 8px 24px var(--shadow-dark);
}

.game-canvas {
  background-color: var(--canvas-light);
  border: 2px solid var(--border-light);
  border-radius: 8px;
  box-shadow: inset 0 0 10px var(--shadow-light);
  transition: background-color 0.3s, border 0.3s, box-shadow 0.3s;
  padding: 1px;
}

.tetris.dark .game-canvas {
  background-color: var(--canvas-dark);
  border: 2px solid var(--border-dark);
  box-shadow: inset 0 0 10px var(--shadow-dark);
}

.info-panel {
  display: flex;
  flex-direction: column;
  background: var(--canvas-light);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px var(--shadow-light);
  transition: background 0.3s, border 0.3s, box-shadow 0.3s;
}

.tetris.dark .info-panel {
  background: var(--canvas-dark);
  border: 1px solid var(--border-dark);
  box-shadow: 0 4px 12px var(--shadow-dark);
}

.title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 15px;
  color: var(--text-light);
  transition: color 0.3s;
}

.tetris.dark .title {
  color: var(--text-dark);
}

.label,
.value {
  color: var(--text-light);
  transition: color 0.3s;
}

.tetris.dark .label,
.tetris.dark .value {
  color: var(--text-dark);
}

.tetris.dark .theme-switcher button {
  background-color: var(--container-dark);
  color: var(--text-dark);
}

.locker-panel {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;

  width: 100%;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  background: var(--background-dark);
  opacity: 0.9;
  border-radius: 12px;

  transition: background 0.3s, opacity 0.3s;
}

.locker-panel span {
  font-size: 24px;
  color: var(--text-dark);
  transition: color 0.3s;
  white-space: pre-line;
  text-align: center;
}

.tetris.dark .locker-panel {
  background: var(--canvas-dark);
}

.locker-panel.playing {
  opacity: 0;
}

.next-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.next-title {
  font-size: 20px;
  color: var(--text-light);
  transition: color 0.3s;
  margin-bottom: 12px;
}

.tetris.dark .next-title {
  color: var(--text-dark);
}

</style>
