class Player {
    constructor() {
        this.health = 100;
        this.maxHealth = 100;
        this.attackPower = 10;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            const evt = new CustomEvent('playerDeath');
            window.dispatchEvent(evt);
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}

if (typeof window !== 'undefined') {
    window.Player = Player;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
