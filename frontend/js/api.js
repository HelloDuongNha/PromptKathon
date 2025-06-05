// API Client for communicating with backend
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (result.success && result.token) {
            this.setToken(result.token);
        }

        return result;
    }

    async logout() {
        const result = await this.request('/auth/logout', {
            method: 'POST'
        });

        if (result.success) {
            this.setToken(null);
        }

        return result;
    }

    async getPlayerProfile() {
        return this.request('/auth/profile');
    }

    // Progress endpoints
    async getProgress() {
        return this.request('/progress');
    }

    async saveProgress(progressData) {
        return this.request('/progress/save', {
            method: 'POST',
            body: JSON.stringify(progressData)
        });
    }

    async loadProgress() {
        return this.request('/progress/load');
    }

    async resetProgress() {
        return this.request('/progress/reset', {
            method: 'POST'
        });
    }

    async completeLevel(levelData) {
        return this.request('/progress/complete-level', {
            method: 'POST',
            body: JSON.stringify(levelData)
        });
    }

    async collectResource(resourceData) {
        return this.request('/progress/collect-resource', {
            method: 'POST',
            body: JSON.stringify(resourceData)
        });
    }

    async recruitHero(heroData) {
        return this.request('/progress/recruit-hero', {
            method: 'POST',
            body: JSON.stringify(heroData)
        });
    }

    async getPlayerStats() {
        return this.request('/progress/stats');
    }

    // Leaderboard endpoints
    async getLeaderboard(type = 'global') {
        return this.request(`/leaderboard?type=${type}`);
    }

    async getPlayerRank() {
        return this.request('/leaderboard/rank');
    }

    // Game data endpoints
    async getGameConfig() {
        return this.request('/game/config');
    }

    async reportScore(scoreData) {
        return this.request('/game/report-score', {
            method: 'POST',
            body: JSON.stringify(scoreData)
        });
    }

    // Utility methods
    async ping() {
        return this.request('/health');
    }

    async getServerStatus() {
        return this.request('/status');
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.APIClient = APIClient;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
