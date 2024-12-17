import {appState, gameState, mutations} from '../stores/store.js';
import {getRandomNumber} from "../utils.js";
import {send} from "./api.js";
import {fullState, INPUT_EVENTS, inputState} from "shared/api/events.js";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 20;
const TETROMINOS = {
    I: [
        [1, 1, 1, 1]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [1, 1, 1],
        [0, 1, 0]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1]
    ],
};

const SEND_EVERY_TICK = 5;
const START_DROP_INTERVAL = 400;
const MIN_DROP_INTERVAL = 50;

const themes = {
    light: {
        background: '#f9f9f9',
        fallingBlock: 'red',
        settledBlock: 'blue',
        border: '#f9f9f9',
        nextBlock: 'green',
    },
    dark: {
        background: '#1e1e2f',
        fallingBlock: '#ff4444',
        settledBlock: '#5555ff',
        border: '#1e1e2f',
        nextBlock: '#44ff44',
    },
};

export class Tetris {
    constructor(ctx, nextCtx, playerId, isDarkTheme) {
        this.ctx = ctx;
        this.nextCtx = nextCtx;
        this.dropInterval = 1000;
        this.dropTimer = null;
        this.pieces = Object.keys(TETROMINOS);
        this.playerId = playerId;
        this.isDarkTheme = isDarkTheme;
        this.random = getRandomNumber(gameState.seed);
        this.ticksToNextSend = SEND_EVERY_TICK;
    }

    getRandomPiece() {
        const rand = this.pieces[Math.floor(this.random() * this.pieces.length)];
        return TETROMINOS[rand].map(row => row.slice());
    }

    getThemeColors() {
        return this.isDarkTheme ? themes.dark : themes.light;
    }

    checkCollision(piece, pos) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x] !== 0) {
                    // Проверка границ
                    if (pos.x + x < 0 || pos.x + x >= COLS || pos.y + y >= ROWS) {
                        return true;
                    }
                    // Проверка занятости клетки
                    if (pos.y + y >= 0 && gameState.games[this.playerId].board[pos.y + y][pos.x + x] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    drawBlock(x, y, color) {
        const theme = this.getThemeColors();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        this.ctx.strokeStyle = theme.border;
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }

    drawBoard() {
        const theme = this.getThemeColors();
        this.ctx.clearRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        // Отрисовка заднего фона
        this.ctx.fillStyle = theme.background;
        this.ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

        // Отрисовка упавших фигур
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (gameState.games[this.playerId].board[y][x] !== 0) {
                    this.drawBlock(x, y, theme.settledBlock);
                }
            }
        }

        // Отрисовка текущей фигуры
        if (gameState.games[this.playerId].currentPiece) {
            for (let y = 0; y < gameState.games[this.playerId].currentPiece.length; y++) {
                for (let x = 0; x < gameState.games[this.playerId].currentPiece[y].length; x++) {
                    if (gameState.games[this.playerId].currentPiece[y][x] !== 0) {
                        this.drawBlock(
                            gameState.games[this.playerId].currentPos.x + x,
                            gameState.games[this.playerId].currentPos.y + y,
                            theme.fallingBlock
                        );
                    }
                }
            }
        }
    }

    mergePiece() {
        const piece = gameState.games[this.playerId].currentPiece;
        const pos = gameState.games[this.playerId].currentPos;
        const newBoard = gameState.games[this.playerId].board.map(row => row.slice());
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x] !== 0 && pos.y + y >= 0) {
                    newBoard[pos.y + y][pos.x + x] = 1;
                }
            }
        }
        mutations.updateBoard(this.playerId, newBoard);
    }

    clearLines() {
        let cleared = 0;
        const newBoard = gameState.games[this.playerId].board.filter(row => {
            if (row.every(cell => cell !== 0)) {
                cleared++;
                return false;
            }
            return true;
        });

        while (newBoard.length < ROWS) {
            newBoard.unshift(Array(COLS).fill(0));
        }

        if (cleared > 0) {
            const scoresFormula = (lines) => {
                const a = 100;
                const r = 1.5;

                if (lines <= 0) return 0;

                if (r === 1) {
                    return a * lines;
                }

                return a * (Math.pow(r, lines) - 1) / (r - 1);
            }
            mutations.clearLines(this.playerId, cleared);
            mutations.incrementScore(this.playerId, scoresFormula(cleared));
            mutations.setLevel(this.playerId, this.calculateLevelPerLines(gameState.games[this.playerId].linesCleared));
            mutations.updateBoard(this.playerId, newBoard);
        }
    }

    newPiece() {
        if (!gameState.games[this.playerId].nextPiece) {
            mutations.setNextPiece(this.playerId, this.getRandomPiece());
        }

        mutations.setCurrentPiece(this.playerId, gameState.games[this.playerId].nextPiece);
        mutations.setCurrentPos(this.playerId, 3, 0);
        mutations.setNextPiece(this.playerId, this.getRandomPiece());

        // Проверяем, можно ли поместить текущую фигуру
        if (this.checkCollision(gameState.games[this.playerId].currentPiece, gameState.games[this.playerId].currentPos)) {
            mutations.setGameOver(this.playerId, true);
        }
        
        if (this.isLocal()) {
            this.sendFullState();
        }
    }

    drawNextPiece() {
        const theme = this.getThemeColors();
        this.nextCtx.clearRect(0, 0, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);
        if (!gameState.games[this.playerId].nextPiece) return;

        const piece = gameState.games[this.playerId].nextPiece;
        const w = piece[0].length;
        const h = piece.length;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (piece[y][x] !== 0) {
                    this.nextCtx.fillStyle = theme.nextBlock;
                    this.nextCtx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    this.nextCtx.strokeStyle = theme.border;
                    this.nextCtx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }

    moveDown() {
        const newPos = {
            x: gameState.games[this.playerId].currentPos.x,
            y: gameState.games[this.playerId].currentPos.y + 1
        };
        if (!this.checkCollision(gameState.games[this.playerId].currentPiece, newPos)) {
            mutations.setCurrentPos(this.playerId, newPos.x, newPos.y);
        } else {
            this.mergePiece();
            this.clearLines();
            this.newPiece();
        }
    }

    moveLeft() {
        const newPos = {
            x: gameState.games[this.playerId].currentPos.x - 1,
            y: gameState.games[this.playerId].currentPos.y
        };
        if (!this.checkCollision(gameState.games[this.playerId].currentPiece, newPos)) {
            mutations.setCurrentPos(this.playerId, newPos.x, newPos.y);
        }
    }

    moveRight() {
        const newPos = {
            x: gameState.games[this.playerId].currentPos.x + 1,
            y: gameState.games[this.playerId].currentPos.y
        };
        if (!this.checkCollision(gameState.games[this.playerId].currentPiece, newPos)) {
            mutations.setCurrentPos(this.playerId, newPos.x, newPos.y);
        }
    }

    rotatePiece(right = true) {
        const piece = gameState.games[this.playerId].currentPiece;
        const oldPiece = piece;

        if (right) {
            // Поворот по часовой стрелке
            const rotated = piece[0].map((_, i) => piece.map(row => row[i])).reverse();
            mutations.setCurrentPiece(this.playerId, rotated);
            if (this.checkCollision(rotated, gameState.games[this.playerId].currentPos)) {
                mutations.setCurrentPiece(this.playerId, oldPiece);
            }
        } else {
            // Поворот против часовой стрелки
            let rotated = piece[0].map((_, i) => piece.map(row => row[i]));
            // Для поворота против часовой стрелки реверсируем не строки, а столбцы.
            rotated = rotated.map(row => row.reverse());
            mutations.setCurrentPiece(this.playerId, rotated);
            if (this.checkCollision(rotated, gameState.games[this.playerId].currentPos)) {
                mutations.setCurrentPiece(this.playerId, oldPiece);
            }
        }
    }

    gameLoop() {
        this.ticksToNextSend -= 1;
        if (this.ticksToNextSend <= 0) {
            this.ticksToNextSend = SEND_EVERY_TICK;
            if (this.isLocal()) {
                this.sendFullState();
            }
        }
        if (gameState.games[this.playerId].isGameOver || this.isPaused()) {
            this.dropTimer = setTimeout(() => this.gameLoop(), this.calculateDropInterval(gameState.games[this.playerId].level));
            return;
        }
        
        this.moveDown();
        this.drawBoard();
        this.drawNextPiece();
        this.dropTimer = setTimeout(() => this.gameLoop(), this.calculateDropInterval(gameState.games[this.playerId].level));
    }

    start() {
        mutations.setGameOver(this.playerId, false);
        mutations.updateBoard(this.playerId, Array.from({length: ROWS}, () => Array(COLS).fill(0)));
        mutations.incrementScore(this.playerId, -gameState.games[this.playerId].score); // сброс счета
        mutations.clearLines(this.playerId, -gameState.games[this.playerId].linesCleared);
        mutations.setCurrentPos(this.playerId, 3, 0);
        mutations.setCurrentPiece(this.playerId, null);
        mutations.setNextPiece(this.playerId, null);

        this.newPiece();
        this.drawBoard();
        this.drawNextPiece();
        this.gameLoop();

        if (this.isLocal()) {
            this.sendFullState();
        }
    }

    keyHandler(e) {
        if (gameState.games[this.playerId].isGameOver || this.isPaused()) return;

        let input = -1;

        switch (e.key) {
            case 'a':
            case 'ArrowLeft':
                input = INPUT_EVENTS.MOVE_LEFT;
                break;
            case 'd':
            case 'ArrowRight':
                input = INPUT_EVENTS.MOVE_RIGHT;
                break;
            case 's':
            case 'ArrowDown':
                input = INPUT_EVENTS.MOVE_DOWN;
                break;
            case 'w':
            case 'e':
            case 'ArrowUp':
                input = INPUT_EVENTS.ROTATE_LEFT;
                break;
            case 'q':
                input = INPUT_EVENTS.ROTATE_RIGHT;
                break;
        }

        this.onInput(input);
        if (this.isLocal()) {
            this.sendInputState(input);
        }
    }

    onInput(input) {
        if (gameState.games[this.playerId].isGameOver || this.isPaused()) return;

        switch (input) {
            case INPUT_EVENTS.MOVE_LEFT:
                this.moveLeft();
                break;
            case INPUT_EVENTS.MOVE_RIGHT:
                this.moveRight();
                break;
            case INPUT_EVENTS.MOVE_DOWN:
                this.moveDown();
                break;
            case INPUT_EVENTS.ROTATE_LEFT:
                this.rotatePiece(false);
                break;
            case INPUT_EVENTS.ROTATE_RIGHT:
                this.rotatePiece();
                break;
        }

        this.drawBoard();
        this.drawNextPiece();
    }

    onFullState(playerId) {
        if (playerId === this.playerId) {
            this.drawBoard();
            this.drawNextPiece();
        }
    }

    addKeyListener() {
        // once
        if (this._keyListener) {
            window.removeEventListener('keydown', this._keyListener);
        }
        this._keyListener = this.keyHandler.bind(this);
        window.addEventListener('keydown', this._keyListener);
    }

    removeKeyListener() {
        if (this._keyListener) {
            window.removeEventListener('keydown', this._keyListener);
        }
    }

    stopGameLoop() {
        if (this.dropTimer) clearTimeout(this.dropTimer);
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        this.drawBoard();
        this.drawNextPiece();
    }

    isLocal() {
        return this.playerId === appState.localPlayerId;
    }
    
    isPaused() {
        return appState.state === 'paused';
    }

    sendFullState() {
        send(fullState(appState.roomId, this.playerId, gameState.games[this.playerId]));
    }

    sendInputState(input) {
        send(inputState(appState.roomId, this.playerId, input));
    }

    calculateDropInterval(level) {
        const dropInterval = START_DROP_INTERVAL * Math.pow(0.9, level - 1);
        return Math.max(dropInterval, MIN_DROP_INTERVAL);
    }
    
    calculateLevelPerLines(lines) {
        return Math.floor(lines / 10) + 1;
    }
}
