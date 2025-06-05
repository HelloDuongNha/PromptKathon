// Configuration related types
export interface LevelConfig {
    id: string;
    name: string;
    stage: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    requirements: {
        level: number;
        heroes?: string[];
        items?: string[];
        completedLevels?: string[];
    };
    map: {
        width: number;
        height: number;
        tileset: string;
        backgroundMusic: string;
        background: string;
    };
    objectives: {
        primary: string[];
        secondary?: string[];
    };
    enemies: {
        type: string;
        count: number;
        spawnPoints: {
            x: number;
            y: number;
        }[];
        difficulty: number;
    }[];
    bosses?: {
        type: string;
        spawnPoint: {
            x: number;
            y: number;
        };
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
        items?: {
            id: string;
            quantity: number;
        }[];
    };
    timeLimit?: number;
    weather?: 'sunny' | 'rainy' | 'foggy' | 'night';
}

export interface HeroConfig {
    id: string;
    name: string;
    type: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    baseStats: {
        health: number;
        damage: number;
        defense: number;
        speed: number;
        range: number;
    };
    skills: {
        id: string;
        name: string;
        description: string;
        type: 'active' | 'passive';
        cooldown?: number;
        manaCost?: number;
        effects: {
            type: string;
            value: number;
            duration?: number;
        }[];
    }[];
    levelUpStats: {
        healthPerLevel: number;
        damagePerLevel: number;
        defensePerLevel: number;
        speedPerLevel: number;
    };
    recruitmentCost: {
        rice?: number;
        wood?: number;
        medals?: number;
    };
    sprite: {
        idle: string;
        walk: string;
        attack: string;
        skill: string;
        portrait: string;
    };
}

export interface EnemyConfig {
    id: string;
    name: string;
    type: string;
    description: string;
    baseStats: {
        health: number;
        damage: number;
        defense: number;
        speed: number;
        range: number;
    };
    behavior: {
        type: 'aggressive' | 'defensive' | 'patrol' | 'guard';
        detectionRange: number;
        attackRange: number;
        movementSpeed: number;
    };
    abilities?: {
        id: string;
        name: string;
        cooldown: number;
        effects: {
            type: string;
            value: number;
            duration?: number;
        }[];
    }[];
    loot: {
        experience: number;
        resources: {
            rice?: number;
            wood?: number;
            medals?: number;
        };
        items?: {
            id: string;
            dropRate: number;
        }[];
    };
    sprite: {
        idle: string;
        walk: string;
        attack: string;
        death: string;
    };
}

export interface ItemConfig {
    id: string;
    name: string;
    description: string;
    type: 'weapon' | 'consumable' | 'material' | 'quest';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    stackable: boolean;
    maxStack?: number;
    effects?: {
        type: string;
        value: number;
        duration?: number;
    }[];
    requirements?: {
        level?: number;
        heroes?: string[];
    };
    craftingRecipe?: {
        materials: {
            id: string;
            quantity: number;
        }[];
        cost: {
            rice?: number;
            wood?: number;
            medals?: number;
        };
    };
    sellPrice?: {
        rice?: number;
        wood?: number;
        medals?: number;
    };
    sprite: string;
}

export interface GameBalanceConfig {
    player: {
        baseHealth: number;
        baseExperience: number;
        experiencePerLevel: number;
        healthPerLevel: number;
        maxLevel: number;
    };
    combat: {
        baseDamage: number;
        criticalChance: number;
        criticalMultiplier: number;
        dodgeChance: number;
        blockChance: number;
    };
    resources: {
        startingRice: number;
        startingWood: number;
        startingMedals: number;
        maxInventorySize: number;
    };
    progression: {
        scoreMultiplier: number;
        timeBonus: number;
        perfectClearBonus: number;
        difficultyMultiplier: {
            easy: number;
            medium: number;
            hard: number;
            expert: number;
        };
    };
    economy: {
        shopRefreshCost: number;
        upgradeBaseCost: number;
        upgradeCostMultiplier: number;
        sellPriceMultiplier: number;
    };
}

export interface StageConfig {
    id: string;
    name: string;
    description: string;
    theme: string;
    unlockRequirements: {
        level: number;
        completedStages?: string[];
        score?: number;
    };
    levels: string[];
    backgroundMusic: string;
    environment: {
        weather: 'sunny' | 'rainy' | 'foggy' | 'night';
        temperature: 'hot' | 'cold' | 'normal';
        terrain: 'urban' | 'rural' | 'forest' | 'mountain' | 'desert';
    };
    specialRules?: {
        type: string;
        description: string;
        effects: any;
    }[];
}

export interface WeaponConfig extends ItemConfig {
    weaponStats: {
        damage: number;
        range: number;
        fireRate: number;
        accuracy: number;
        ammoCapacity: number;
        reloadTime: number;
    };
    weaponType: 'rifle' | 'pistol' | 'shotgun' | 'sniper' | 'melee';
    upgradeTree?: {
        level: number;
        cost: {
            rice?: number;
            wood?: number;
            medals?: number;
        };
        improvements: {
            stat: string;
            value: number;
        }[];
    }[];
}

export interface AchievementConfig {
    id: string;
    name: string;
    description: string;
    type: 'combat' | 'exploration' | 'collection' | 'story' | 'time' | 'score';
    category: 'bronze' | 'silver' | 'gold' | 'platinum';
    requirements: {
        type: string;
        target: number;
        conditions?: any;
    };
    rewards: {
        experience: number;
        score: number;
        title?: string;
        resources?: {
            rice?: number;
            wood?: number;
            medals?: number;
        };
        items?: {
            id: string;
            quantity: number;
        }[];
    };
    hidden: boolean;
    icon: string;
}

export interface GameConfig {
    version: string;
    stages: StageConfig[];
    levels: LevelConfig[];
    heroes: HeroConfig[];
    enemies: EnemyConfig[];
    items: ItemConfig[];
    weapons: WeaponConfig[];
    achievements: AchievementConfig[];
    balance: GameBalanceConfig;
    settings: {
        maxSaveSlots: number;
        autoSaveInterval: number;
        defaultDifficulty: string;
        enableTutorial: boolean;
        enableCheats: boolean;
    };
}

// Utility types for configuration validation
export type ConfigType = 'level' | 'hero' | 'enemy' | 'item' | 'weapon' | 'achievement' | 'stage' | 'balance';

export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface ConfigManager {
    loadConfig<T>(type: ConfigType, id: string): Promise<T>;
    saveConfig<T>(type: ConfigType, id: string, config: T): Promise<boolean>;
    validateConfig<T>(type: ConfigType, config: T): ConfigValidationResult;
    getAllConfigs<T>(type: ConfigType): Promise<T[]>;
}
