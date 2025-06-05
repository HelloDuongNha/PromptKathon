export interface PlayerStats {
    gamesPlayed: number;
    totalScore: number;
    totalPlayTime: number;
    levelsCompleted: number;
    achievementsUnlocked: number;
    heroesRecruited: number;
    resourcesCollected: number;
    enemiesDefeated: number;
}

export interface Player {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    lastLogin?: string;
    stats: PlayerStats;
    isGuest?: boolean;
    isActive: boolean;
}

export class PlayerModel {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    lastLogin?: string;
    stats: PlayerStats;
    isGuest: boolean;
    isActive: boolean;

    constructor(data: Partial<Player>) {
        this.id = data.id || this.generateId();
        this.username = data.username || '';
        this.email = data.email || '';
        this.passwordHash = data.passwordHash || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        // ✅ Sửa lỗi 1: Chỉ gán khi có giá trị, không gán undefined
        if (data.lastLogin !== undefined) {
            this.lastLogin = data.lastLogin;
        }
        // Nếu không có data.lastLogin, this.lastLogin sẽ tự động là undefined
        
        this.isGuest = data.isGuest || false;
        this.isActive = data.isActive !== undefined ? data.isActive : true;

        this.stats = {
            gamesPlayed: 0,
            totalScore: 0,
            totalPlayTime: 0,
            levelsCompleted: 0,
            achievementsUnlocked: 0,
            heroesRecruited: 0,
            resourcesCollected: 0,
            enemiesDefeated: 0,
            ...data.stats
        };
    }

    private generateId(): string {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Update player statistics
    updateStats(updates: Partial<PlayerStats>): void {
        this.stats = { ...this.stats, ...updates };
    }

    // Update last login time
    updateLastLogin(): void {
        this.lastLogin = new Date().toISOString();
        this.stats.gamesPlayed += 1;
    }

    // ✅ Sửa lỗi 2: Tạo object từng bước để xử lý optional properties
    getPublicInfo(): Omit<Player, 'passwordHash' | 'email'> {
        const publicInfo: Omit<Player, 'passwordHash' | 'email'> = {
            id: this.id,
            username: this.username,
            createdAt: this.createdAt,
            stats: this.stats,
            isGuest: this.isGuest,
            isActive: this.isActive
        };

        // Chỉ thêm lastLogin nếu nó có giá trị
        if (this.lastLogin !== undefined) {
            publicInfo.lastLogin = this.lastLogin;
        }

        return publicInfo;
    }

    // Thêm method riêng để get masked email nếu cần
    getMaskedEmail(): string {
        return this.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    }

    // Check if player is active
    isPlayerActive(): boolean {
        return this.isActive;
    }

    // Deactivate player account
    deactivate(): void {
        this.isActive = false;
    }

    // Activate player account
    activate(): void {
        this.isActive = true;
    }

    // Get player rank based on total score
    calculateRank(allPlayers: Player[]): number {
        const sortedPlayers = allPlayers
            .filter(p => p.isActive)
            .sort((a, b) => b.stats.totalScore - a.stats.totalScore);

        return sortedPlayers.findIndex(p => p.id === this.id) + 1;
    }

    // Get achievements progress
    getAchievementsProgress(): {
        total: number;
        unlocked: number;
        percentage: number;
    } {
        const totalAchievements = 20; // Total available achievements
        return {
            total: totalAchievements,
            unlocked: this.stats.achievementsUnlocked,
            percentage: Math.round((this.stats.achievementsUnlocked / totalAchievements) * 100)
        };
    }

    // Convert to JSON for database storage
    toJSON(): Player {
        const result: Player = {
            id: this.id,
            username: this.username,
            email: this.email,
            passwordHash: this.passwordHash,
            createdAt: this.createdAt,
            stats: this.stats,
            isActive: this.isActive
        };

        // Chỉ thêm optional properties nếu chúng có giá trị
        if (this.lastLogin !== undefined) {
            result.lastLogin = this.lastLogin;
        }
        
        if (this.isGuest !== false) { // Chỉ thêm nếu khác giá trị mặc định
            result.isGuest = this.isGuest;
        }

        return result;
    }

    // Create from JSON data
    static fromJSON(data: Player): PlayerModel {
        return new PlayerModel(data);
    }

    // Validate player data
    static validate(data: Partial<Player>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.username || data.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Valid email is required');
        }

        if (!data.passwordHash) {
            errors.push('Password hash is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
