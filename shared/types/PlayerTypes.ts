import { GameData, Achievement } from './GameTypes';

// Player related types
export interface Player {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    isActive: boolean;
}

export interface PlayerProfile extends Player {
    totalPlayTime: number;
    currentLevel: number;
    totalScore: number;
    achievements: string[];
    rank: string;
}

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    score: number;
    level: number;
    completedMissions: string[];
    achievements: number;
    totalPlayTime: number;
    rank: number;
    updatedAt: Date;
}

// Database related types
export interface Progress {
    id: string;
    playerId: string;
    level: number;
    score: number;
    completedMissions: string[];
    achievements: Achievement[];
    totalPlayTime: number;
    gameData: GameData;
    createdAt: Date;
    updatedAt: Date;
}

export interface DatabasePlayer {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
    isActive: boolean;
}

export interface DatabaseProgress {
    id: string;
    playerId: string;
    level: number;
    score: number;
    completedMissions: string;
    achievements: string;
    totalPlayTime: number;
    gameData: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DatabaseLeaderboard {
    id: string;
    playerId: string;
    playerName: string;
    score: number;
    level: number;
    completedMissions: string;
    achievements: number;
    totalPlayTime: number;
    rank: number;
    updatedAt: Date;
}

// Auth related
export interface AuthRequest {
    playerId?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    player: Player;
}

// Progress related
export interface SaveProgressRequest {
    level?: number;
    score?: number;
    completedMissions?: string[];
    achievements?: Achievement[];
    totalPlayTime?: number;
    gameData?: any;
}

// Leaderboard related
export interface LeaderboardQuery {
    limit?: number;
    offset?: number;
    sortBy?: 'score' | 'level' | 'achievements' | 'totalPlayTime';
    order?: 'asc' | 'desc';
}
