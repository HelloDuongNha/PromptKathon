export class AudioManager {
    private sounds: Map<string, HTMLAudioElement> = new Map()
    private backgroundMusic: HTMLAudioElement | null = null

    async init(): Promise<void> {
        // preload if needed
    }

    async loadSound(name: string, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const audio = new Audio(src)
            audio.addEventListener('canplaythrough', () => resolve(), { once: true })
            audio.addEventListener('error', () => reject(new Error('Failed to load sound')))
            this.sounds.set(name, audio)
        })
    }

    play(name: string): void {
        const audio = this.sounds.get(name)
        if (audio) {
            audio.currentTime = 0
            audio.play().catch(() => {})
        }
    }

    playMusic(src: string): void {
        if (this.backgroundMusic?.src === src) return
        this.backgroundMusic?.pause()
        this.backgroundMusic = new Audio(src)
        this.backgroundMusic.loop = true
        this.backgroundMusic.volume = 0.3
        this.backgroundMusic.play().catch(() => {})
    }
}
