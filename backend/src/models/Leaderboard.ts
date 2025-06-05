export interface LeaderboardEntry {
    id: string;
    playerId: string;
    playerName: string;
    score: number;
    level: number;
    completedLevels: string[];
    achievements: number;
    gameTime: number;
    rank?: number;
    createdAt: string;
    updatedAt: string;
}

export interface WeeklyStats {
    week: string;
    topPlayers: LeaderboardEntry[];
    totalPlayers: number;
    averageScore: number;
    highestScore: number;
}

export interface LevelStats {
    levelName: string;
    completionRate: number;
    averageScore: number;
    fastestCompletion: number;
    totalAttempts: number;
}

export class LeaderboardModel {
    id: string;
    playerId: string;
    playerName: string;
    score: number;
    level: number;
    completedLevels: string[];
    achievements: number;
    gameTime: number;
    rank: number;
    createdAt: string;
    updatedAt: string;

    constructor(data: Partial<LeaderboardEntry>) {
        this.id = data.id || this.generateId();
        this.playerId = data.playerId || '';
        this.playerName = data.playerName || '';
        this.score = data.score || 0;
        this.level = data.level || 1;
        this.completedLevels = data.completedLevels || [];
        this.achievements = data.achievements || 0;
        this.gameTime = data.gameTime || 0;
        this.rank = data.rank || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    private generateId(): string {
        return 'leaderboard_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Update leaderboard entry
    update(data: Partial<LeaderboardEntry>): void {
        if (data.score !== undefined) this.score = data.score;
        if (data.level !== undefined) this.level = data.level;
        if (data.completedLevels !== undefined) this.completedLevels = data.completedLevels;
        if (data.achievements !== undefined) this.achievements = data.achievements;
        if (data.gameTime !== undefined) this.gameTime = data.gameTime;
        if (data.playerName !== undefined) this.playerName = data.playerName;

        this.updatedAt = new Date().toISOString();
    }

    // Calculate total completion percentage
    getCompletionPercentage(): number {
        const totalLevels = 75; // Total available levels
        return Math.round((this.completedLevels.length / totalLevels) * 100);
    }

    // Calculate score per minute
    getScorePerMinute(): number {
        if (this.gameTime === 0) return 0;
        return Math.round(this.score / (this.gameTime / 60));
    }

    // Get efficiency rating (score vs time vs completion)
    getEfficiencyRating(): number {
        const completionBonus = this.getCompletionPercentage() / 100;
        const timeEfficiency = this.getScorePerMinute() / 1000; // Normalize
        const achievementBonus = this.achievements / 20; // Assuming 20 total achievements

        return Math.round((completionBonus + timeEfficiency + achievementBonus) * 100);
    }

    // Format game time for display
    getFormattedGameTime(): string {
        const hours = Math.floor(this.gameTime / 3600);
        const minutes = Math.floor((this.gameTime % 3600) / 60);
        const seconds = this.gameTime % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Get player tier based on score
    getPlayerTier(): {
        tier: string;
        name: string;
        color: string;
        minScore: number;
    } {
        if (this.score >= 50000) {
            return { tier: 'legendary', name: 'Huyền Thoại', color: '#FFD700', minScore: 50000 };
        } else if (this.score >= 30000) {
            return { tier: 'master', name: 'Bậc Thầy', color: '#FF6B6B', minScore: 30000 };
        } else if (this.score >= 20000) {
            return { tier: 'expert', name: 'Chuyên Gia', color: '#4ECDC4', minScore: 20000 };
        } else if (this.score >= 10000) {
            return { tier: 'advanced', name: 'Tiến Bộ', color: '#45B7D1', minScore: 10000 };
        } else if (this.score >= 5000) {
            return { tier: 'intermediate', name: 'Trung Bình', color: '#96CEB4', minScore: 5000 };
        } else {
            return { tier: 'beginner', name: 'Mới Bắt Đầu', color: '#FFEAA7', minScore: 0 };
        }
    }

    // Check if entry qualifies for weekly leaderboard
    isInCurrentWeek(): boolean {
        const now = new Date();
        const entryDate = new Date(this.updatedAt);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
        weekStart.setHours(0, 0, 0, 0);

        return entryDate >= weekStart;
    }

    // Convert to JSON for database storage
    toJSON(): LeaderboardEntry {
        return {
            id: this.id,
            playerId: this.playerId,
            playerName: this.playerName,
            score: this.score,
            level: this.level,
            completedLevels: this.completedLevels,
            achievements: this.achievements,
            gameTime: this.gameTime,
            rank: this.rank,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Create from JSON data
    static fromJSON(data: LeaderboardEntry): LeaderboardModel {
        return new LeaderboardModel(data);
    }

    // Sort leaderboard entries by score (descending)
    static sortByScore(entries: LeaderboardEntry[]): LeaderboardEntry[] {
        return entries.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.level !== a.level) return b.level - a.level;
            if (b.completedLevels.length !== a.completedLevels.length) {
                return b.completedLevels.length - a.completedLevels.length;
            }
            return b.achievements - a.achievements;
        });
    }

    // Filter entries for current week
    static getWeeklyEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        return entries.filter(entry => {
            const entryDate = new Date(entry.updatedAt);
            return entryDate >= weekStart;
        });
    }

    // Calculate weekly stats
    static calculateWeeklyStats(entries: LeaderboardEntry[]): WeeklyStats {
        const weeklyEntries = this.getWeeklyEntries(entries);
        const sortedEntries = this.sortByScore(weeklyEntries);

        const totalScore = weeklyEntries.reduce((sum, entry) => sum + entry.score, 0);
        const averageScore = weeklyEntries.length > 0 ? Math.round(totalScore / weeklyEntries.length) : 0;
        const highestScore = sortedEntries.length > 0 && sortedEntries[0] ? sortedEntries[0].score : 0;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());

        return {
            week: weekStart.toISOString().split('T')[0] || weekStart.toISOString(),
            topPlayers: sortedEntries.slice(0, 10),
            totalPlayers: weeklyEntries.length,
            averageScore,
            highestScore
        };
    }

    // Validate leaderboard entry data
    static validate(data: Partial<LeaderboardEntry>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.playerId) {
            errors.push('Player ID is required');
        }

        if (!data.playerName || data.playerName.length < 3) {
            errors.push('Player name must be at least 3 characters long');
        }

        if (data.score !== undefined && (typeof data.score !== 'number' || data.score < 0)) {
            errors.push('Score must be a non-negative number');
        }

        if (data.level !== undefined && (typeof data.level !== 'number' || data.level < 1)) {
            errors.push('Level must be a positive number');
        }

        if (data.gameTime !== undefined && (typeof data.gameTime !== 'number' || data.gameTime < 0)) {
            errors.push('Game time must be a non-negative number');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
