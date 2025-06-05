class Enemy {
    constructor(type = 'soldier', health = 20, damage = 5) {
        this.type = type;
        this.health = health;
        this.damage = damage;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health === 0;
    }
}

if (typeof window !== 'undefined') {
    window.Enemy = Enemy;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Enemy;
}
