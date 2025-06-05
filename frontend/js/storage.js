// Local Storage Manager
class StorageManager {
    constructor() {
        this.prefix = 'vietnam_war_game_';
        this.keys = {
            TOKEN: 'auth_token',
            SETTINGS: 'game_settings',
            PROGRESS: 'game_progress',
            STATS: 'player_stats',
            CACHE: 'game_cache'
        };
    }

    // Private method to get full key name
    getKey(key) {
        return this.prefix + key;
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                this.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    // Authentication methods
    setToken(token) {
        return this.setItem(this.keys.TOKEN, token);
    }

    getToken() {
        return this.getItem(this.keys.TOKEN);
    }

    removeToken() {
        return this.removeItem(this.keys.TOKEN);
    }

    // Settings methods
    saveSettings(settings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        return this.setItem(this.keys.SETTINGS, updatedSettings);
    }

    getSettings() {
        return this.getItem(this.keys.SETTINGS, {
            masterVolume: 50,
            musicVolume: 30,
            sfxVolume: 70,
            graphicsQuality: 'medium',
            particlesEnabled: true,
            language: 'vi',
            autoSave: true,
            notifications: true
        });
    }

    resetSettings() {
        return this.removeItem(this.keys.SETTINGS);
    }

    // Progress methods
    saveProgress(progress) {
        const progressData = {
            ...progress,
            lastSaved: new Date().toISOString()
        };
        return this.setItem(this.keys.PROGRESS, progressData);
    }

    getProgress() {
        return this.getItem(this.keys.PROGRESS);
    }

    clearProgress() {
        return this.removeItem(this.keys.PROGRESS);
    }

    // Stats methods
    saveStats(stats) {
        const currentStats = this.getStats();
        const updatedStats = { ...currentStats, ...stats };
        return this.setItem(this.keys.STATS, updatedStats);
    }

    getStats() {
        return this.getItem(this.keys.STATS, {
            gamesPlayed: 0,
            totalPlayTime: 0,
            highScore: 0,
            levelsCompleted: 0,
            enemiesDefeated: 0,
            resourcesCollected: 0,
            achievementsUnlocked: 0
        });
    }

    updateStats(statUpdates) {
        const currentStats = this.getStats();
        const newStats = { ...currentStats };

        Object.keys(statUpdates).forEach(key => {
            if (typeof statUpdates[key] === 'number') {
                newStats[key] = (newStats[key] || 0) + statUpdates[key];
            } else {
                newStats[key] = statUpdates[key];
            }
        });

        return this.saveStats(newStats);
    }

    // Cache methods
    setCache(key, data, ttl = 3600000) { // Default TTL: 1 hour
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl
        };
        
        const cache = this.getItem(this.keys.CACHE, {});
        cache[key] = cacheData;
        
        return this.setItem(this.keys.CACHE, cache);
    }

    getCache(key) {
        const cache = this.getItem(this.keys.CACHE, {});
        const item = cache[key];

        if (!item) return null;

        // Check if cache has expired
        if (Date.now() - item.timestamp > item.ttl) {
            delete cache[key];
            this.setItem(this.keys.CACHE, cache);
            return null;
        }

        return item.data;
    }

    clearCache() {
        return this.removeItem(this.keys.CACHE);
    }

    // Utility methods
    getStorageSize() {
        let total = 0;
        Object.values(this.keys).forEach(key => {
            const item = localStorage.getItem(this.getKey(key));
            if (item) {
                total += item.length;
            }
        });
        return total;
    }

    exportData() {
        const data = {};
        Object.values(this.keys).forEach(key => {
            const item = this.getItem(key);
            if (item !== null) {
                data[key] = item;
            }
        });
        return data;
    }

    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                if (this.keys[key.toUpperCase()]) {
                    this.setItem(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Check if localStorage is available
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get storage usage info
    getStorageInfo() {
        if (!this.isAvailable()) {
            return { available: false };
        }

        const used = this.getStorageSize();
        const total = 5 * 1024 * 1024; // 5MB typical limit
        
        return {
            available: true,
            used,
            total,
            percentage: (used / total) * 100,
            remaining: total - used
        };
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
