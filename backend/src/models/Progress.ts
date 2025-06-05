export interface PlayerStats {
    health: number;
    maxHealth: number;
    experience: number;
    level: number;
    score: number;
}

export interface Weapon {
    id: string;
    name: string;
    type: string;
    damage: number;
    ammo: number;
    upgrades?: {
        level: number;
        damageBonus: number;
        ammoBonus: number;
    };
}

export interface Item {
    id: string;
    name: string;
    type: string;
    quantity: number;
    description?: string;
    effect?: {
        type: string;
        value: number;
    };
}

export interface Inventory {
    rice: number;
    wood: number;
    medals: number;
    weapons: Weapon[];
    items: Item[];
}

export interface Hero {
    id: string;
    name: string;
    type: string;
    level: number;
    experience: number;
    skills: string[];
    isActive: boolean;
    stats?: {
        attack: number;
        defense: number;
        special: number;
    };
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
    progress?: number;
    maxProgress?: number;
}

export interface Progress {
    id: string;
    playerId: string;
    currentLevel: number;
    currentStage: string;
    playerStats: PlayerStats;
    inventory: Inventory;
    heroes: Hero[];
    completedLevels: string[];
    achievements: Achievement[];
    gameTime: number;
    lastSaved: string;
    gameSettings?: {
        difficulty: 'easy' | 'normal' | 'hard';
        soundEnabled: boolean;
        musicEnabled: boolean;
        language: string;
    };
}

export class ProgressModel {
    id: string;
    playerId: string;
    currentLevel: number;
    currentStage: string;
    playerStats: PlayerStats;
    inventory: Inventory;
    heroes: Hero[];
    completedLevels: string[];
    achievements: Achievement[];
    gameTime: number;
    lastSaved: string;
    gameSettings: {
        difficulty: 'easy' | 'normal' | 'hard';
        soundEnabled: boolean;
        musicEnabled: boolean;
        language: string;
    };

    constructor(data: Partial<Progress>) {
        this.id = data.id || this.generateId();
        this.playerId = data.playerId || '';
        this.currentLevel = data.currentLevel || 1;
        this.currentStage = data.currentStage || 'hanoi';
        this.gameTime = data.gameTime || 0;
        this.lastSaved = data.lastSaved || new Date().toISOString();
        this.completedLevels = data.completedLevels || [];
        this.achievements = data.achievements || [];
        this.heroes = data.heroes || [];

        this.playerStats = {
            health: 100,
            maxHealth: 100,
            experience: 0,
            level: 1,
            score: 0,
            ...data.playerStats
        };

        this.inventory = {
            rice: 10,
            wood: 5,
            medals: 0,
            weapons: [{
                id: 'basic_rifle',
                name: 'Súng Trường Cơ Bản',
                type: 'rifle',
                damage: 25,
                ammo: 30
            }],
            items: [{
                id: 'health_potion',
                name: 'Thuốc Cứu Thương',
                type: 'consumable',
                quantity: 3
            }],
            ...data.inventory
        };

        this.gameSettings = {
            difficulty: 'normal',
            soundEnabled: true,
            musicEnabled: true,
            language: 'vi',
            ...data.gameSettings
        };
    }

    private generateId(): string {
        return 'progress_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Update player stats
    updatePlayerStats(updates: Partial<PlayerStats>): void {
        this.playerStats = { ...this.playerStats, ...updates };
        this.updateLastSaved();
    }

    // Add resources to inventory
    addResources(resources: { rice?: number; wood?: number; medals?: number }): void {
        if (resources.rice) this.inventory.rice += resources.rice;
        if (resources.wood) this.inventory.wood += resources.wood;
        if (resources.medals) this.inventory.medals += resources.medals;
        this.updateLastSaved();
    }

    // Use resources from inventory
    useResources(resources: { rice?: number; wood?: number; medals?: number }): boolean {
        // Check if player has enough resources
        if (resources.rice && this.inventory.rice < resources.rice) return false;
        if (resources.wood && this.inventory.wood < resources.wood) return false;
        if (resources.medals && this.inventory.medals < resources.medals) return false;

        // Deduct resources
        if (resources.rice) this.inventory.rice -= resources.rice;
        if (resources.wood) this.inventory.wood -= resources.wood;
        if (resources.medals) this.inventory.medals -= resources.medals;

        this.updateLastSaved();
        return true;
    }

    // Add weapon to inventory
    addWeapon(weapon: Weapon): void {
        const existingWeapon = this.inventory.weapons.find(w => w.id === weapon.id);
        if (existingWeapon) {
            // If weapon exists, increase ammo
            existingWeapon.ammo += weapon.ammo;
        } else {
            this.inventory.weapons.push(weapon);
        }
        this.updateLastSaved();
    }

    // Add item to inventory
    addItem(item: Item): void {
        const existingItem = this.inventory.items.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.inventory.items.push(item);
        }
        this.updateLastSaved();
    }

    // Use item from inventory
    useItem(itemId: string, quantity: number = 1): boolean {
        const item = this.inventory.items.find(i => i.id === itemId);
        if (!item || item.quantity < quantity) return false;

        item.quantity -= quantity;
        if (item.quantity <= 0) {
            this.inventory.items = this.inventory.items.filter(i => i.id !== itemId);
        }

        // Apply item effect
        this.applyItemEffect(itemId, quantity);
        this.updateLastSaved();
        return true;
    }

    // Apply item effect
    private applyItemEffect(itemId: string, quantity: number): void {
        switch (itemId) {
            case 'health_potion':
                const healAmount = 30 * quantity;
                this.playerStats.health = Math.min(
                    this.playerStats.maxHealth,
                    this.playerStats.health + healAmount
                );
                break;
            case 'experience_scroll':
                this.playerStats.experience += 50 * quantity;
                break;
            case 'ammo_pack':
                // Refill ammo for all weapons
                this.inventory.weapons.forEach(weapon => {
                    weapon.ammo += 10 * quantity;
                });
                break;
        }
    }

    // Add hero to team
    addHero(hero: Hero): boolean {
        if (this.heroes.length >= 3) return false; // Max 3 heroes

        const existingHero = this.heroes.find(h => h.type === hero.type);
        if (existingHero) return false; // Hero already recruited

        this.heroes.push(hero);
        this.updateLastSaved();
        return true;
    }

    // Level up hero
    levelUpHero(heroId: string): boolean {
        const hero = this.heroes.find(h => h.id === heroId);
        if (!hero) return false;

        const expNeeded = this.calculateHeroExpNeeded(hero.level);
        if (hero.experience < expNeeded) return false;

        hero.level++;
        hero.experience -= expNeeded;

        // Increase hero stats
        if (hero.stats) {
            hero.stats.attack += 5;
            hero.stats.defense += 3;
            hero.stats.special += 2;
        }

        this.updateLastSaved();
        return true;
    }

    // Calculate experience needed for hero level up
    private calculateHeroExpNeeded(level: number): number {
        return Math.floor(100 * Math.pow(1.3, level - 1));
    }

    // Complete level
    completeLevel(levelKey: string, rewards: any): void {
        if (!this.completedLevels.includes(levelKey)) {
            this.completedLevels.push(levelKey);
        }

        // Add rewards
        this.addResources(rewards);
        if (rewards.experience) {
            this.playerStats.experience += rewards.experience;
            this.checkLevelUp();
        }

        this.updateLastSaved();
    }

    // Check if player levels up
    private checkLevelUp(): void {
        const expNeeded = this.calculateExpNeeded(this.playerStats.level);
        if (this.playerStats.experience >= expNeeded) {
            this.playerStats.level++;
            this.playerStats.experience -= expNeeded;
            this.playerStats.maxHealth += 10;
            this.playerStats.health = this.playerStats.maxHealth; // Full heal on level up
        }
    }

    // Calculate experience needed for next level
    private calculateExpNeeded(level: number): number {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // Unlock achievement
    unlockAchievement(achievementId: string, name: string, description: string): boolean {
        const existingAchievement = this.achievements.find(a => a.id === achievementId);
        if (existingAchievement) return false;

        const achievement: Achievement = {
            id: achievementId,
            name,
            description,
            unlockedAt: new Date().toISOString()
        };

        this.achievements.push(achievement);
        this.updateLastSaved();
        return true;
    }

    // Update game time
    updateGameTime(additionalTime: number): void {
        this.gameTime += additionalTime;
        this.updateLastSaved();
    }

    // Update last saved timestamp
    private updateLastSaved(): void {
        this.lastSaved = new Date().toISOString();
    }

    // Get completion percentage
    getCompletionPercentage(): number {
        const totalLevels = 75; // Total levels across all stages
        const completedCount = this.completedLevels.length;
        return Math.round((completedCount / totalLevels) * 100);
    }

    // Get current stage info
    getCurrentStageInfo(): {
        stage: string;
        level: number;
        displayName: string;
    } {
        const stageNames = {
            hanoi: 'Hà Nội - 12 Ngày Đêm Lịch Sử',
            hatinh: 'Mặt Trận Đường 9 - Khe Sanh',
            quangtri: 'Huế - Khúc Ca Mậu Thân',
            taynguyen: 'Địa Đạo Củ Chi - Cuộc Chiến Trong Lòng Đất',
            saigon: 'Sài Gòn - Mùa Xuân Đại Thắng'
        };

        return {
            stage: this.currentStage,
            level: this.currentLevel,
            displayName: stageNames[this.currentStage as keyof typeof stageNames] || this.currentStage
        };
    }

    // Convert to JSON for database storage
    toJSON(): Progress {
        return {
            id: this.id,
            playerId: this.playerId,
            currentLevel: this.currentLevel,
            currentStage: this.currentStage,
            playerStats: this.playerStats,
            inventory: this.inventory,
            heroes: this.heroes,
            completedLevels: this.completedLevels,
            achievements: this.achievements,
            gameTime: this.gameTime,
            lastSaved: this.lastSaved,
            gameSettings: this.gameSettings
        };
    }

    // Create from JSON data
    static fromJSON(data: Progress): ProgressModel {
        return new ProgressModel(data);
    }

    // Reset progress (new game)
    reset(): void {
        this.currentLevel = 1;
        this.currentStage = 'hanoi';
        this.gameTime = 0;
        this.completedLevels = [];
        this.achievements = [];
        this.heroes = [];

        this.playerStats = {
            health: 100,
            maxHealth: 100,
            experience: 0,
            level: 1,
            score: 0
        };

        this.inventory = {
            rice: 10,
            wood: 5,
            medals: 0,
            weapons: [{
                id: 'basic_rifle',
                name: 'Súng Trường Cơ Bản',
                type: 'rifle',
                damage: 25,
                ammo: 30
            }],
            items: [{
                id: 'health_potion',
                name: 'Thuốc Cứu Thương',
                type: 'consumable',
                quantity: 3
            }]
        };

        this.updateLastSaved();
    }
}
