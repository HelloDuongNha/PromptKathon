class Weapon {
    constructor(name = 'rifle', damage = 10, range = 100) {
        this.name = name;
        this.damage = damage;
        this.range = range;
    }
}

if (typeof window !== 'undefined') {
    window.Weapon = Weapon;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Weapon;
}
