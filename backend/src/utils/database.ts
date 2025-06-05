import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

// Types
export interface Player {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    lastLogin?: Date; // ✅ Sửa lỗi 1: Thêm ? để cho phép undefined
    isActive: boolean;
}

export interface Progress {
    id: string;
    playerId: string;
    level: number;
    score: number;
    completedMissions: string[];
    achievements: string[];
    totalPlayTime: number; // in minutes
    lastPlayed: Date;
    gameData: {
        currentStage: number;
        unlockedLevels: number[];
        inventory: any[];
        playerStats: {
            health: number;
            strength: number;
            defense: number;
            speed: number;
        };
    };
}

export interface LeaderboardEntry {
    id: string;
    playerId: string;
    username: string;
    score: number;
    level: number;
    rank: number;
    achievementCount: number;
    totalPlayTime: number;
    lastUpdated: Date;
}

export interface DatabaseSchema {
    players: Player[];
    progress: Progress[];
    leaderboard: LeaderboardEntry[];
    metadata: {
        version: string;
        lastBackup: Date;
        totalPlayers: number;
    };
}

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'database.json');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

// In-memory database cache
let database: DatabaseSchema = {
    players: [],
    progress: [],
    leaderboard: [],
    metadata: {
        version: '1.0.0',
        lastBackup: new Date(),
        totalPlayers: 0
    }
};

// Utility function to generate unique IDs
function generateId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${randomStr}`;
}

// Initialize database
export async function initDatabase(): Promise<void> {
    try {
        // Ensure data directory exists
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.mkdir(BACKUP_DIR, { recursive: true });

        // Try to load existing database
        try {
            const data = await fs.readFile(DB_PATH, 'utf-8');
            database = JSON.parse(data);
            
            // ✅ Sửa lỗi 1: Convert date strings back to Date objects với type assertion
            database.players = database.players.map(player => ({
                ...player,
                createdAt: new Date(player.createdAt),
                lastLogin: player.lastLogin ? new Date(player.lastLogin) : undefined
            })) as Player[];
            
            database.progress = database.progress.map(progress => ({
                ...progress,
                lastPlayed: new Date(progress.lastPlayed)
            }));
            
            database.leaderboard = database.leaderboard.map(entry => ({
                ...entry,
                lastUpdated: new Date(entry.lastUpdated)
            }));
            
            database.metadata.lastBackup = new Date(database.metadata.lastBackup);
            
            logger.info('Database loaded successfully');
        } catch (error) {
            // If file doesn't exist, create new database
            logger.info('Creating new database...');
            await saveDatabase();
        }
    } catch (error) {
        logger.error('Failed to initialize database:', error);
        throw error;
    }
}

// Save database to file
export async function saveDatabase(): Promise<void> {
    try {
        const dataToSave = {
            ...database,
            metadata: {
                ...database.metadata,
                totalPlayers: database.players.length,
                lastBackup: new Date()
            }
        };
        
        await fs.writeFile(DB_PATH, JSON.stringify(dataToSave, null, 2));
        logger.info('Database saved successfully');
    } catch (error) {
        logger.error('Failed to save database:', error);
        throw error;
    }
}

// Backup database
export async function backupDatabase(): Promise<void> {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
        
        await fs.copyFile(DB_PATH, backupPath);
        logger.info(`Database backed up to: ${backupPath}`);
        
        // Clean old backups (keep only last 10)
        const backupFiles = await fs.readdir(BACKUP_DIR);
        const sortedBackups = backupFiles
            .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
            .sort()
            .reverse();
            
        if (sortedBackups.length > 10) {
            const filesToDelete = sortedBackups.slice(10);
            for (const file of filesToDelete) {
                await fs.unlink(path.join(BACKUP_DIR, file));
            }
            logger.info(`Cleaned ${filesToDelete.length} old backup files`);
        }
    } catch (error) {
        logger.error('Failed to backup database:', error);
        throw error;
    }
}

// Player operations
export async function createPlayer(username: string, email: string, password: string): Promise<Player> {
    const newPlayer: Player = {
        id: generateId(),
        username,
        email,
        password,
        createdAt: new Date(),
        isActive: true
        // lastLogin không cần thiết lập vì nó optional
    };
    
    database.players.push(newPlayer);
    await saveDatabase();
    
    logger.info(`New player created: ${username} (${email})`);
    return newPlayer;
}

export async function findPlayerByEmail(email: string): Promise<Player | null> {
    return database.players.find(player => player.email === email) || null;
}

export async function findPlayerByUsername(username: string): Promise<Player | null> {
    return database.players.find(player => player.username === username) || null;
}

export async function findPlayerById(id: string): Promise<Player | null> {
    return database.players.find(player => player.id === id) || null;
}

export async function updatePlayerLastLogin(playerId: string): Promise<void> {
    const player = database.players.find(p => p.id === playerId);
    if (player) {
        player.lastLogin = new Date();
        await saveDatabase();
    }
}

// Progress operations
export async function createProgress(playerId: string): Promise<Progress> {
    const newProgress: Progress = {
        id: generateId(),
        playerId,
        level: 1,
        score: 0,
        completedMissions: [],
        achievements: [],
        totalPlayTime: 0,
        lastPlayed: new Date(),
        gameData: {
            currentStage: 1,
            unlockedLevels: [1],
            inventory: [],
            playerStats: {
                health: 100,
                strength: 10,
                defense: 10,
                speed: 10
            }
        }
    };
    
    database.progress.push(newProgress);
    await saveDatabase();
    
    logger.info(`Progress created for player: ${playerId}`);
    return newProgress;
}

export async function findProgressByPlayerId(playerId: string): Promise<Progress | null> {
    return database.progress.find(progress => progress.playerId === playerId) || null;
}

export async function updateProgress(playerId: string, progressData: Partial<Progress>): Promise<Progress | null> {
    const progressIndex = database.progress.findIndex(p => p.playerId === playerId);
    if (progressIndex === -1) return null;
    
    // ✅ Sửa lỗi: Thêm type assertion để đảm bảo TypeScript hiểu kết quả là Progress hợp lệ
    const currentProgress = database.progress[progressIndex];
    database.progress[progressIndex] = {
        ...currentProgress, // Giữ nguyên tất cả thuộc tính hiện tại (đảm bảo có đủ thuộc tính bắt buộc)
        ...progressData,   // Override với dữ liệu mới (Partial<Progress>)
        lastPlayed: new Date() // Luôn cập nhật lastPlayed
    } as Progress; // ✅ Type assertion: đảm bảo TypeScript hiểu đây là Progress đầy đủ
    
    await saveDatabase();
    await updateLeaderboard(playerId);
    
    return database.progress[progressIndex] || null;
}


// Leaderboard operations
export async function updateLeaderboard(playerId: string): Promise<void> {
    const player = await findPlayerById(playerId);
    const progress = await findProgressByPlayerId(playerId);
    
    if (!player || !progress) return;
    
    const existingEntryIndex = database.leaderboard.findIndex(entry => entry.playerId === playerId);
    
    // ✅ Sửa lỗi 4: Sử dụng optional chaining và kiểm tra an toàn
    const existingEntry = existingEntryIndex >= 0 ? database.leaderboard[existingEntryIndex] : null;
    
    const leaderboardEntry: LeaderboardEntry = {
        id: existingEntry?.id || generateId(), // Sử dụng optional chaining
        playerId,
        username: player.username,
        score: progress.score,
        level: progress.level,
        rank: 0, // Will be calculated after sorting
        achievementCount: progress.achievements.length,
        totalPlayTime: progress.totalPlayTime,
        lastUpdated: new Date()
    };
    
    if (existingEntryIndex >= 0) {
        database.leaderboard[existingEntryIndex] = leaderboardEntry;
    } else {
        database.leaderboard.push(leaderboardEntry);
    }
    
    // Sort leaderboard by score (descending) and update ranks
    database.leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.level !== a.level) return b.level - a.level;
        return b.achievementCount - a.achievementCount;
    });
    
    // Update ranks
    database.leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    
    await saveDatabase();
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    return database.leaderboard.slice(0, limit);
}

export async function getPlayerRank(playerId: string): Promise<number | null> {
    const entry = database.leaderboard.find(entry => entry.playerId === playerId);
    return entry ? entry.rank : null;
}

// Statistics
export async function getDatabaseStats(): Promise<{
    totalPlayers: number;
    activePlayers: number;
    totalProgress: number;
    averageLevel: number;
    topScore: number;
}> {
    const activePlayers = database.players.filter(p => p.isActive).length;
    const averageLevel = database.progress.length > 0 
        ? database.progress.reduce((sum, p) => sum + p.level, 0) / database.progress.length 
        : 0;
    const topScore = database.leaderboard.length > 0 
        ? Math.max(...database.leaderboard.map(entry => entry.score))
        : 0;
    
    return {
        totalPlayers: database.players.length,
        activePlayers,
        totalProgress: database.progress.length,
        averageLevel: Math.round(averageLevel * 100) / 100,
        topScore
    };
}

// Auto-backup every hour
setInterval(async () => {
    try {
        await backupDatabase();
    } catch (error) {
        logger.error('Auto-backup failed:', error);
    }
}, 60 * 60 * 1000); // 1 hour

export { database };
