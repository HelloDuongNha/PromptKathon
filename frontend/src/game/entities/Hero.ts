import { GameEntity, Position, ENTITY_TYPES, ANIMATIONS } from '../utils/Constants';
import { AnimationHelper } from '../utils/AnimationHelper';

export interface HeroStats {
    level: number;
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    specialAbilityCooldown: number;
    experienceReward: number;
}

export interface HeroAbility {
    name: string;
    description: string;
    cooldown: number;
    lastUsed: number;
    manaCost?: number;
}

export class Hero implements GameEntity {
    public id: string;
    public type = ENTITY_TYPES.HERO;
    public position: Position;
    public size = { width: 32, height: 48 };
    public health: number;
    public maxHealth: number;
    public active: boolean = true;

    // Hero specific properties
    public heroType: 'medic' | 'sniper' | 'engineer' | 'commander';
    public stats: HeroStats;
    public abilities: HeroAbility[] = [];
    public isPlayerControlled: boolean = false;
    public loyalty: number = 100; // 0-100, affects AI behavior
    public morale: number = 100; // 0-100, affects combat effectiveness

    // Movement and combat
    public velocity: Position = { x: 0, y: 0 };
    public facing: 'left' | 'right' = 'right';
    public isMoving: boolean = false;
    public targetPosition: Position | null = null;
    public followTarget: string | null = null; // Entity ID to follow

    private animationHelper: AnimationHelper;
    private inputState: Record<string, boolean> = {};
    private lastRegenTime: number = 0;

    constructor(x: number, y: number, heroType: 'medic' | 'sniper' | 'engineer' | 'commander') {
        this.id = `hero_${heroType}_${Date.now()}`;
        this.position = { x, y };
        this.heroType = heroType;

        this.initializeStats();
        this.initializeAbilities();

        this.health = this.stats.health;
        this.maxHealth = this.stats.maxHealth;

        this.animationHelper = new AnimationHelper();
        this.animationHelper.playAnimation(ANIMATIONS.PLAYER.IDLE);
    }

    private initializeStats(): void {
        switch (this.heroType) {
            case 'medic':
                this.stats = {
                    level: 1,
                    health: 80,
                    maxHealth: 80,
                    damage: 15,
                    speed: 2.5,
                    specialAbilityCooldown: 8000,
                    experienceReward: 50
                };
                break;

            case 'sniper':
                this.stats = {
                    level: 1,
                    health: 60,
                    maxHealth: 60,
                    damage: 40,
                    speed: 2,
                    specialAbilityCooldown: 5000,
                    experienceReward: 40
                };
                break;

            case 'engineer':
                this.stats = {
                    level: 1,
                    health: 90,
                    maxHealth: 90,
                    damage: 20,
                    speed: 2,
                    specialAbilityCooldown: 12000,
                    experienceReward: 45
                };
                break;

            case 'commander':
                this.stats = {
                    level: 1,
                    health: 100,
                    maxHealth: 100,
                    damage: 25,
                    speed: 2.2,
                    specialAbilityCooldown: 15000,
                    experienceReward: 60
                };
                break;
        }
    }

    private initializeAbilities(): void {
        switch (this.heroType) {
            case 'medic':
                this.abilities = [
                    {
                        name: 'Heal',
                        description: 'Restores health to target ally',
                        cooldown: 3000,
                        lastUsed: 0
                    },
                    {
                        name: 'First Aid Kit',
                        description: 'Instantly heals self and nearby allies',
                        cooldown: 8000,
                        lastUsed: 0
                    },
                    {
                        name: 'Medical Training',
                        description: 'Passive: Slowly regenerates health over time',
                        cooldown: 0,
                        lastUsed: 0
                    }
                ];
                break;

            case 'sniper':
                this.abilities = [
                    {
                        name: 'Precision Shot',
                        description: 'High damage, long range shot',
                        cooldown: 5000,
                        lastUsed: 0
                    },
                    {
                        name: 'Overwatch',
                        description: 'Increases accuracy and detection range',
                        cooldown: 10000,
                        lastUsed: 0
                    },
                    {
                        name: 'Camouflage',
                        description: 'Becomes harder to detect by enemies',
                        cooldown: 15000,
                        lastUsed: 0
                    }
                ];
                break;

            case 'engineer':
                this.abilities = [
                    {
                        name: 'Build Turret',
                        description: 'Constructs an automated defense turret',
                        cooldown: 12000,
                        lastUsed: 0
                    },
                    {
                        name: 'Repair',
                        description: 'Fixes damaged structures and vehicles',
                        cooldown: 5000,
                        lastUsed: 0
                    },
                    {
                        name: 'Explosive Trap',
                        description: 'Places a hidden explosive device',
                        cooldown: 8000,
                        lastUsed: 0
                    }
                ];
                break;

            case 'commander':
                this.abilities = [
                    {
                        name: 'Rally',
                        description: 'Boosts morale and combat effectiveness of nearby allies',
                        cooldown: 15000,
                        lastUsed: 0
                    },
                    {
                        name: 'Tactical Strike',
                        description: 'Calls in artillery support',
                        cooldown: 20000,
                        lastUsed: 0
                    },
                    {
                        name: 'Leadership',
                        description: 'Passive: Nearby allies gain combat bonuses',
                        cooldown: 0,
                        lastUsed: 0
                    }
                ];
                break;
        }
    }

    update(deltaTime: number, playerPosition?: Position): void {
        if (!this.active) return;

        this.updateMovement(deltaTime);
        this.updateAI(playerPosition);
        this.updateAnimations(deltaTime);
        this.updateAbilities(deltaTime);
        this.updateMoraleAndLoyalty();
        this.updatePassiveAbilities(deltaTime);

        // Apply movement
        this.position.x += this.velocity.x * deltaTime / 16.67;
        this.position.y += this.velocity.y * deltaTime / 16.67;
    }

    private updateMovement(deltaTime: number): void {
        if (this.isPlayerControlled) {
            this.handlePlayerInput();
        } else {
            this.handleAIMovement();
        }
    }

    private handlePlayerInput(): void {
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.isMoving = false;

        if (this.inputState['move_up']) {
            this.velocity.y = -this.stats.speed;
            this.isMoving = true;
        }
        if (this.inputState['move_down']) {
            this.velocity.y = this.stats.speed;
            this.isMoving = true;
        }
        if (this.inputState['move_left']) {
            this.velocity.x = -this.stats.speed;
            this.facing = 'left';
            this.isMoving = true;
        }
        if (this.inputState['move_right']) {
            this.velocity.x = this.stats.speed;
            this.facing = 'right';
            this.isMoving = true;
        }

        // Normalize diagonal movement
        if (this.velocity.x !== 0 && this.velocity.y !== 0) {
            const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            this.velocity.x = (this.velocity.x / magnitude) * this.stats.speed;
            this.velocity.y = (this.velocity.y / magnitude) * this.stats.speed;
        }
    }

    private handleAIMovement(): void {
        // Follow player or move to target position
        if (this.followTarget && this.targetPosition) {
            const distance = this.getDistanceTo(this.targetPosition);

            if (distance > 50) { // Follow at distance
                this.moveTowards(this.targetPosition);
            } else {
                this.velocity.x = 0;
                this.velocity.y = 0;
                this.isMoving = false;
            }
        } else if (this.targetPosition) {
            const distance = this.getDistanceTo(this.targetPosition);

            if (distance > 10) {
                this.moveTowards(this.targetPosition);
            } else {
                this.targetPosition = null;
                this.velocity.x = 0;
                this.velocity.y = 0;
                this.isMoving = false;
            }
        } else {
            // Idle behavior - small random movements
            if (Math.random() < 0.01) {
                this.targetPosition = {
                    x: this.position.x + (Math.random() - 0.5) * 100,
                    y: this.position.y + (Math.random() - 0.5) * 100
                };
            }
        }
    }

    private moveTowards(target: Position): void {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.velocity.x = (dx / distance) * this.stats.speed;
            this.velocity.y = (dy / distance) * this.stats.speed;
            this.facing = dx > 0 ? 'right' : 'left';
            this.isMoving = true;
        }
    }

    private updateAI(playerPosition?: Position): void {
        // Set follow target to player if not player controlled
        if (!this.isPlayerControlled && playerPosition) {
            this.targetPosition = { ...playerPosition };
            this.followTarget = 'player';
        }

        // Use abilities based on situation
        this.considerUsingAbilities();
    }

    private considerUsingAbilities(): void {
        const currentTime = Date.now();

        for (const ability of this.abilities) {
            if (currentTime - ability.lastUsed >= ability.cooldown) {
                if (this.shouldUseAbility(ability)) {
                    this.useAbility(ability.name);
                }
            }
        }
    }

    private shouldUseAbility(ability: HeroAbility): boolean {
        switch (ability.name) {
            case 'Heal':
            case 'First Aid Kit':
                return this.health < this.maxHealth * 0.7;

            case 'Precision Shot':
                return Math.random() < 0.1; // 10% chance when available

            case 'Build Turret':
                return Math.random() < 0.05; // 5% chance when available

            case 'Rally':
                return this.morale < 70;

            default:
                return Math.random() < 0.08;
        }
    }

    private updateAnimations(deltaTime: number): void {
        this.animationHelper.update(deltaTime);

        if (this.isMoving) {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.PLAYER.WALK)) {
                this.animationHelper.playAnimation(ANIMATIONS.PLAYER.WALK);
            }
        } else {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.PLAYER.IDLE)) {
                this.animationHelper.playAnimation(ANIMATIONS.PLAYER.IDLE);
            }
        }
    }

    private updateAbilities(deltaTime: number): void {
        // Update ability cooldowns and effects
        // This would be expanded based on specific ability implementations
    }

    private updateMoraleAndLoyalty(): void {
        // Morale and loyalty slowly decay over time and are affected by events
        this.morale = Math.max(0, this.morale - 0.01);
        this.loyalty = Math.max(0, this.loyalty - 0.005);
    }

    private updatePassiveAbilities(deltaTime: number): void {
        const currentTime = Date.now();

        // Medical Training - slow health regeneration for medic
        if (this.heroType === 'medic' && currentTime - this.lastRegenTime > 2000) {
            if (this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + 5);
                this.lastRegenTime = currentTime;
            }
        }
    }

    // Public methods
    useAbility(abilityName: string): boolean {
        const ability = this.abilities.find(a => a.name === abilityName);
        if (!ability) return false;

        const currentTime = Date.now();
        if (currentTime - ability.lastUsed < ability.cooldown) {
            return false; // Still on cooldown
        }

        ability.lastUsed = currentTime;

        // Dispatch ability use event
        const abilityEvent = new CustomEvent('heroAbilityUsed', {
            detail: {
                heroId: this.id,
                heroType: this.heroType,
                abilityName: ability.name,
                position: { ...this.position }
            }
        });
        window.dispatchEvent(abilityEvent);

        // Execute specific ability effects
        this.executeAbility(ability);
        return true;
    }

    private executeAbility(ability: HeroAbility): void {
        switch (ability.name) {
            case 'Heal':
                this.heal(30);
                break;

            case 'First Aid Kit':
                this.heal(50);
                // Also heal nearby allies (would need game context)
                break;

            case 'Precision Shot':
                // Would trigger a special attack event
                break;

            case 'Rally':
                this.morale = Math.min(100, this.morale + 30);
                break;

            // Add other ability implementations
        }
    }

    setInput(action: string, pressed: boolean): void {
        this.inputState[action] = pressed;
    }

    takeDamage(damage: number): boolean {
        if (!this.active) return false;

        // Morale affects damage taken
        const moraleMultiplier = this.morale / 100;
        const actualDamage = damage * (2 - moraleMultiplier); // Higher morale = less damage

        this.health -= actualDamage;
        this.morale = Math.max(0, this.morale - 5); // Taking damage reduces morale

        if (this.health <= 0) {
            this.health = 0;
            this.die();
            return true;
        }

        // Dispatch damage event
        const damageEvent = new CustomEvent('heroDamaged', {
            detail: {
                heroId: this.id,
                damage: actualDamage,
                currentHealth: this.health,
                heroType: this.heroType
            }
        });
        window.dispatchEvent(damageEvent);

        return false;
    }

    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.morale = Math.min(100, this.morale + 2); // Healing boosts morale

        const healEvent = new CustomEvent('heroHealed', {
            detail: {
                heroId: this.id,
                amount,
                currentHealth: this.health,
                heroType: this.heroType
            }
        });
        window.dispatchEvent(healEvent);
    }

    private die(): void {
        this.active = false;
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Dispatch death event
        const deathEvent = new CustomEvent('heroDeath', {
            detail: {
                heroId: this.id,
                position: { ...this.position },
                heroType: this.heroType
            }
        });
        window.dispatchEvent(deathEvent);
    }

    // Utility methods
    private getDistanceTo(target: Position): number {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Rendering
    render(ctx: CanvasRenderingContext2D, spriteSheet: HTMLImageElement): void {
        if (!this.active) return;

        const frame = this.animationHelper.getCurrentFrame();
        if (!frame) return;

        ctx.save();

        // Flip sprite if facing left
        if (this.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.translate(-this.position.x - this.size.width, this.position.y);
        } else {
            ctx.translate(this.position.x, this.position.y);
        }

        // Tint based on hero type
        const tint = this.getHeroTint();
        if (tint) {
            ctx.fillStyle = tint;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillRect(0, 0, this.size.width, this.size.height);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Draw sprite
        ctx.drawImage(
            spriteSheet,
            frame.x, frame.y, frame.width, frame.height,
            0, 0, this.size.width, this.size.height
        );

        ctx.restore();

        // Draw health bar and hero info
        this.renderHealthBar(ctx);
        this.renderHeroInfo(ctx);
    }

    private getHeroTint(): string | null {
        switch (this.heroType) {
            case 'medic': return '#00ff88';
            case 'sniper': return '#8888ff';
            case 'engineer': return '#ffaa00';
            case 'commander': return '#ff8800';
            default: return null;
        }
    }

    private renderHealthBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.size.width;
        const barHeight = 3;
        const barY = this.position.y - 8;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.position.x, barY, barWidth, barHeight);

        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.position.x, barY, barWidth * healthPercent, barHeight);
    }

    private renderHeroInfo(ctx: CanvasRenderingContext2D): void {
        // Hero type indicator
        ctx.fillStyle = this.getHeroTint() || '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(this.heroType.charAt(0).toUpperCase(), this.position.x, this.position.y - 12);

        // Morale indicator
        if (this.morale < 50) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('!', this.position.x + this.size.width - 8, this.position.y - 12);
        }
    }

    // Getters
    getPosition(): Position {
        return { ...this.position };
    }

    getBounds(): { x: number; y: number; width: number; height: number } {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
    }

    getStats(): HeroStats {
        return { ...this.stats };
    }

    getAbilities(): HeroAbility[] {
        return [...this.abilities];
    }

    isAlive(): boolean {
        return this.active && this.health > 0;
    }

    // Serialization
    serialize(): any {
        return {
            id: this.id,
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            heroType: this.heroType,
            stats: this.stats,
            abilities: this.abilities,
            loyalty: this.loyalty,
            morale: this.morale,
            isPlayerControlled: this.isPlayerControlled,
            facing: this.facing
        };
    }

    static deserialize(data: any): Hero {
        const hero = new Hero(data.position.x, data.position.y, data.heroType);
        hero.id = data.id;
        hero.health = data.health;
        hero.maxHealth = data.maxHealth;
        hero.stats = data.stats;
        hero.abilities = data.abilities;
        hero.loyalty = data.loyalty;
        hero.morale = data.morale;
        hero.isPlayerControlled = data.isPlayerControlled;
        hero.facing = data.facing;
        return hero;
    }
}
