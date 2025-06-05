import { GameManager } from './managers/GameManager'
import { APIClient } from '../utils/APIClient'

export class VietnamWarGame {
    private gameManager = GameManager.getInstance()
    private api = new APIClient()

    initialize(canvas: HTMLCanvasElement): void {
        this.gameManager.initializeCanvas(canvas)
    }

    startNewGame(): void {
        this.gameManager.startGame()
    }

    async loadSavedGame(): Promise<void> {
        try {
            const data = await this.api.loadProgress()
            if (data.success && data.progress) {
                this.gameManager.loadGame(data.progress)
            }
        } catch (err) {
            console.warn('Failed to load saved game, starting new')
        }
        this.gameManager.startGame()
    }

    getManager(): GameManager {
        return this.gameManager
    }
}
