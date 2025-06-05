class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.backgroundMusic = null;
        this.settings = {
            masterVolume: 0.5,
            musicVolume: 0.3,
            sfxVolume: 0.7
        };
    }

    async init() {
        // preload default sounds if needed
    }

    async loadSound(name, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(src);
            audio.addEventListener('canplaythrough', () => resolve(), {once: true});
            audio.addEventListener('error', () => reject(new Error('Failed to load sound')));
            this.sounds.set(name, audio);
        });
    }

    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.volume = this.settings.sfxVolume * this.settings.masterVolume;
            sound.currentTime = 0;
            sound.play();
        }
    }

    async loadBackgroundMusic(src) {
        this.backgroundMusic = new Audio(src);
        this.backgroundMusic.loop = true;
        await new Promise((resolve) => {
            this.backgroundMusic.addEventListener('canplaythrough', resolve, {once: true});
        });
    }

    playBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.settings.musicVolume * this.settings.masterVolume;
            this.backgroundMusic.play();
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    updateSettings(settings) {
        this.settings = {...this.settings, ...settings};
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.settings.musicVolume * this.settings.masterVolume;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
