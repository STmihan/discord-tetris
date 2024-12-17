const START_DROP_INTERVAL = 380;
const MIN_DROP_INTERVAL = 50;

export function calculateDropInterval(level) {
    const dropInterval = START_DROP_INTERVAL * Math.pow(0.9, level - 1);
    return Math.max(dropInterval, MIN_DROP_INTERVAL);
}

export function calculateLevelPerLines(lines) {
    return Math.floor(lines / 4) + 1;
}

export function scoresFormula(lines) {
    const a = 100;
    const r = 1.5;

    if (lines <= 0) return 0;

    if (r === 1) {
        return a * lines;
    }

    return a * (Math.pow(r, lines) - 1) / (r - 1);
}
