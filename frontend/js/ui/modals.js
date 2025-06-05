class Modals {
    static show(id) {
        document.getElementById(id).classList.remove('hidden');
    }

    static hide(id) {
        document.getElementById(id).classList.add('hidden');
    }
}

if (typeof window !== 'undefined') {
    window.Modals = Modals;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modals;
}
