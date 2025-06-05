export class StorageManager {
    private prefix = 'vietnam_war_game_'
    private keys = {
        TOKEN: 'auth_token',
        SETTINGS: 'game_settings',
        PROGRESS: 'game_progress'
    }

    private getKey(key: string): string {
        return this.prefix + key
    }

    setItem(key: string, value: any): void {
        localStorage.setItem(this.getKey(key), JSON.stringify(value))
    }

    getItem<T>(key: string): T | null {
        const raw = localStorage.getItem(this.getKey(key))
        return raw ? (JSON.parse(raw) as T) : null
    }

    removeItem(key: string): void {
        localStorage.removeItem(this.getKey(key))
    }
}
