// Game related types
export interface Hero {
    id: string;
    name: string;
    type: string;
    level: number;
    experience: number;
    skills: string[];
    isActive: boolean;
}

export interface PlayerStats {
    health: number;
    maxHealth: number;
    experience: number;
    level: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    type: string;
    damage?: number;
    ammo?: number;
    quantity?: number;
}

export interface Inventory {
    rice: number;
    wood: number;
    medals: number;
    weapons: InventoryItem[];
    items: InventoryItem[];
}

export interface GameData {
    currentStage: string;
    unlockedLevels: string[];
    playerStats: PlayerStats;
    inventory: Inventory;
    heroes: Hero[];
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    type: 'combat' | 'exploration' | 'collection' | 'story';
    requirement: number;
    progress: number;
    completed: boolean;
    unlockedAt?: Date;
}

export interface Mission {
    id: string;
    name: string;
    description: string;
    type: 'main' | 'side' | 'daily';
    requirements: {
        level?: number;
        completedMissions?: string[];
    };
    rewards: {
        experience: number;
        score: number;
        rice?: number;
        wood?: number;
        medals?: number;
        items?: InventoryItem[];
    };
    isCompleted: boolean;
}

export interface GameLevel {
    id: string;
    name: string;
    stage: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    requirements: {
        level: number;
        heroes?: string[];
        items?: string[];
    };
    enemies: {
        type: string;
        count: number;
        difficulty: number;
    }[];
    rewards: {
        experience: number;
        score: number;
        resources: {
            rice?: number;
            wood?: number;
            medals?: number;
        };
    };
}

// API Request/Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface CompleteLevel {
    levelName: string;
    score: number;
    rewards: {
        rice?: number;
        wood?: number;
        medals?: number;
        experience?: number;
    };
}

export interface CollectResource {
    resourceType: 'rice' | 'wood' | 'medals';
    amount: number;
}

export interface RecruitHero {
    heroType: string;
    heroName: string;
}
