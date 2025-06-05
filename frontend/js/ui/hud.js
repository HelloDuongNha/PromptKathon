class HUD {
    constructor(gameState) {
        this.gameState = gameState;
        this.riceEl = document.getElementById('rice-count');
        this.woodEl = document.getElementById('wood-count');
        this.medalEl = document.getElementById('medals-count');
        this.levelEl = document.getElementById('player-level');
        this.scoreEl = document.getElementById('player-score');
    }

    update() {
        this.levelEl.textContent = this.gameState.currentLevel;
        this.scoreEl.textContent = (this.gameState.score || 0);
    }
}

if (typeof window !== 'undefined') {
    window.HUD = HUD;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HUD;
}
