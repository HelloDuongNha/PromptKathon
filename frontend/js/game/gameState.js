class GameState {
    constructor() {
        this.player = new Player();
        this.currentLevel = 1;
        this.isPaused = false;
        this.api = new APIClient();
    }

    async startNewGame() {
        this.player = new Player();
        this.currentLevel = 1;
        await this.api.resetProgress();
    }

    async loadSavedGame() {
        const res = await this.api.loadProgress();
        if (res.success && res.data) {
            this.currentLevel = res.data.level || 1;
        }
    }

    async saveGame() {
        await this.api.saveProgress({ level: this.currentLevel });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    playerAttack() {
        const evt = new CustomEvent('playerAttack', { detail: { damage: this.player.attackPower } });
        window.dispatchEvent(evt);
    }

    playerDefend() {
        // simple placeholder
    }
}

if (typeof window !== 'undefined') {
    window.GameState = GameState;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
