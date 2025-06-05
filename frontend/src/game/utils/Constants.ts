// Game Constants - Các hằng số của game
export const GAME_CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,

    // Game settings
    FPS: 60,
    DEBUG_MODE: true,

    // Player settings
    PLAYER_SPEED: 5,
    PLAYER_HEALTH: 100,
    PLAYER_DAMAGE: 25,

    // Enemy settings
    ENEMY_SPEED: 2,
    ENEMY_HEALTH: 50,
    ENEMY_DAMAGE: 10,

    // Resource settings
    INITIAL_RICE: 100,
    INITIAL_WOOD: 50,
    INITIAL_MEDALS: 10,

    // Level settings
    LEVEL_COMPLETION_SCORE: 1000,

    // Audio settings
    MASTER_VOLUME: 0.5,
    MUSIC_VOLUME: 0.3,
    SFX_VOLUME: 0.7
} as const;

export const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    LOGIN: 'login',
    REGISTER: 'register',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    SETTINGS: 'settings'
} as const;

export const ENTITY_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    BOSS: 'boss',
    HERO: 'hero',
    RESOURCE: 'resource',
    PROJECTILE: 'projectile'
} as const;

export const RESOURCE_TYPES = {
    RICE: 'rice',
    WOOD: 'wood',
    MEDALS: 'medals',
    HEALTH: 'health',
    AMMO: 'ammo'
} as const;

export const WEAPON_TYPES = {
    RIFLE: 'rifle',
    MACHINE_GUN: 'machine_gun',
    GRENADE: 'grenade',
    ROCKET: 'rocket'
} as const;

export const LEVEL_TYPES = {
    TUTORIAL: 'tutorial',
    VILLAGE_DEFENSE: 'village_defense',
    JUNGLE_PATROL: 'jungle_patrol',
    CITY_LIBERATION: 'city_liberation',
    BOSS_BATTLE: 'boss_battle'
} as const;

export const COLORS = {
    // UI Colors
    PRIMARY: '#d4af37',
    SECONDARY: '#2c1810',
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    ERROR: '#f44336',
    INFO: '#2196f3',

    // Game Colors
    PLAYER: '#00ff00',
    ENEMY: '#ff0000',
    NEUTRAL: '#ffff00',
    BACKGROUND: '#1a1a1a',
    TEXT: '#ffffff'
} as const;

export const KEYBINDINGS = {
    // Movement
    MOVE_UP: ['KeyW', 'ArrowUp'],
    MOVE_DOWN: ['KeyS', 'ArrowDown'],
    MOVE_LEFT: ['KeyA', 'ArrowLeft'],
    MOVE_RIGHT: ['KeyD', 'ArrowRight'],

    // Actions
    ATTACK: ['Space', 'MouseLeft'],
    DEFEND: ['KeyQ'],
    INTERACT: ['KeyE'],
    RELOAD: ['KeyR'],

    // UI
    PAUSE: ['Escape', 'KeyP'],
    INVENTORY: ['KeyI'],
    MAP: ['KeyM'],
    MENU: ['Escape']
} as const;

export const ANIMATIONS = {
    PLAYER: {
        IDLE: 'player_idle',
        WALK: 'player_walk',
        ATTACK: 'player_attack',
        DEATH: 'player_death'
    },
    ENEMY: {
        IDLE: 'enemy_idle',
        WALK: 'enemy_walk',
        ATTACK: 'enemy_attack',
        DEATH: 'enemy_death'
    },
    EFFECTS: {
        EXPLOSION: 'explosion',
        MUZZLE_FLASH: 'muzzle_flash',
        BLOOD: 'blood_splatter'
    }
} as const;

export const AUDIO_FILES = {
    MUSIC: {
        MENU: 'audio/music/menu.mp3',
        GAME: 'audio/music/game.mp3',
        VICTORY: 'audio/music/victory.mp3',
        DEFEAT: 'audio/music/defeat.mp3'
    },
    SFX: {
        BUTTON_CLICK: 'audio/sfx/button_click.wav',
        GUNSHOT: 'audio/sfx/gunshot.wav',
        EXPLOSION: 'audio/sfx/explosion.wav',
        RELOAD: 'audio/sfx/reload.wav',
        PICKUP: 'audio/sfx/pickup.wav',
        DEATH: 'audio/sfx/death.wav'
    }
} as const;

export const SPRITE_FILES = {
    PLAYER: 'images/sprites/player.png',
    ENEMIES: 'images/sprites/enemies.png',
    WEAPONS: 'images/sprites/weapons.png',
    EFFECTS: 'images/sprites/effects.png',
    UI: 'images/ui/ui_elements.png',
    BACKGROUNDS: {
        JUNGLE: 'images/backgrounds/jungle.jpg',
        VILLAGE: 'images/backgrounds/village.jpg',
        CITY: 'images/backgrounds/city.jpg'
    }
} as const;

// Type definitions
export type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];
export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];
export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];
export type WeaponType = typeof WEAPON_TYPES[keyof typeof WEAPON_TYPES];
export type LevelType = typeof LEVEL_TYPES[keyof typeof LEVEL_TYPES];

// Interfaces
export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Rectangle extends Position, Size { }

export interface GameEntity {
    id: string;
    type: EntityType;
    position: Position;
    size: Size;
    health: number;
    maxHealth: number;
    active: boolean;
}

export interface PlayerStats {
    level: number;
    score: number;
    kills: number;
    deaths: number;
    accuracy: number;
    playTime: number;
}

export interface GameSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    graphicsQuality: 'low' | 'medium' | 'high';
    particlesEnabled: boolean;
    keybindings: Record<string, string[]>;
}
