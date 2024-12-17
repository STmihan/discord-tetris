export class GameState {
    constructor() {
        this.board = Array.from({length: 20}, () => Array(10).fill(0));
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.isGameOver = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.currentPos = {x: 3, y: 0};
    }
}
