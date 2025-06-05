class Menu {
    constructor(game) {
        this.game = game;
    }

    show() {
        document.getElementById('main-menu').classList.remove('hidden');
    }

    hide() {
        document.getElementById('main-menu').classList.add('hidden');
    }
}

if (typeof window !== 'undefined') {
    window.Menu = Menu;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Menu;
}
