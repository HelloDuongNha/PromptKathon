import { GameEntity, Position, GAME_CONFIG, ENTITY_TYPES, ANIMATIONS } from '../utils/Constants';
import { AnimationHelper } from '../utils/AnimationHelper';

export interface PlayerStats {
    level: number;
    experience: number;
    experienceToNext: number;
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    accuracy: number;
    kills: number;
    deaths: number;
}

export interface PlayerWeapon {
    type: string;
    damage: number;
    fireRate: number;
    range: number;
    ammo: number;
    maxAmmo: number;
    reloadTime: number;
}

export class Player implements GameEntity {
    public id: string;
    public type = ENTITY_TYPES.PLAYER;
    public position: Position;
    public size = { width: 32, height: 48 };
    public health: number;
    public maxHealth: number;
    public active: boolean = true;

    // Player specific properties
    public stats: PlayerStats;
    public weapon: PlayerWeapon;
    public velocity: Position = { x: 0, y: 0 };
    public facing: 'left' | 'right' = 'right';
    public isMoving: boolean = false;
    public isAttacking: boolean = false;
    public lastAttackTime: number = 0;
    public isReloading: boolean = false;
    public reloadStartTime: number = 0;

    private animationHelper: AnimationHelper;
    private inputState: Record<string, boolean> = {};

    constructor(x: number, y: number) {
        this.id = `player_${Date.now()}`;
        this.position = { x, y };
        this.health = GAME_CONFIG.PLAYER_HEALTH;
        this.maxHealth = GAME_CONFIG.PLAYER_HEALTH;

        this.stats = {
            level: 1,
            experience: 0,
            experienceToNext: 100,
            health: this.health,
            maxHealth: this.maxHealth,
            damage: GAME_CONFIG.PLAYER_DAMAGE,
            speed: GAME_CONFIG.PLAYER_SPEED,
            accuracy: 0.8,
            kills: 0,
            deaths: 0
        };

        this.weapon = {
            type: 'rifle',
            damage: 25,
            fireRate: 300, // ms between shots
            range: 200,
            ammo: 30,
            maxAmmo: 30,
            reloadTime: 2000 // ms
        };

        this.animationHelper = new AnimationHelper();
        this.initializeAnimations();
    }

    private initializeAnimations(): void {
        // Player animations are already initialized in AnimationHelper
        this.animationHelper.playAnimation(ANIMATIONS.PLAYER.IDLE);
    }

    update(deltaTime: number): void {
        if (!this.active) return;

        this.handleMovement(deltaTime);
        this.handleCombat(deltaTime);
        this.updateAnimations(deltaTime);
        this.updateReloading(deltaTime);

        // Update position
        this.position.x += this.velocity.x * deltaTime / 16.67; // Normalize to 60fps
        this.position.y += this.velocity.y * deltaTime / 16.67;

        // Keep player in bounds
        this.constrainToBounds();
    }

    private handleMovement(deltaTime: number): void {
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

        // Diagonal movement normalization
        if (this.velocity.x !== 0 && this.velocity.y !== 0) {
            const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            this.velocity.x = (this.velocity.x / magnitude) * this.stats.speed;
            this.velocity.y = (this.velocity.y / magnitude) * this.stats.speed;
        }
    }

    private handleCombat(deltaTime: number): void {
        const currentTime = Date.now();

        if (this.inputState['attack'] && !this.isReloading) {
            if (currentTime - this.lastAttackTime >= this.weapon.fireRate && this.weapon.ammo > 0) {
                this.attack();
                this.lastAttackTime = currentTime;
            }
        }

        if (this.inputState['reload'] && !this.isReloading && this.weapon.ammo < this.weapon.maxAmmo) {
            this.startReload();
        }
    }

    private updateAnimations(deltaTime: number): void {
        this.animationHelper.update(deltaTime);

        // Determine which animation to play
        if (this.isAttacking) {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.PLAYER.ATTACK)) {
                this.animationHelper.playAnimation(ANIMATIONS.PLAYER.ATTACK);
            }
        } else if (this.isMoving) {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.PLAYER.WALK)) {
                this.animationHelper.playAnimation(ANIMATIONS.PLAYER.WALK);
            }
        } else {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.PLAYER.IDLE)) {
                this.animationHelper.playAnimation(ANIMATIONS.PLAYER.IDLE);
            }
        }

        // Reset attack flag if animation finished
        if (this.isAttacking && !this.animationHelper.isAnimationPlaying(ANIMATIONS.PLAYER.ATTACK)) {
            this.isAttacking = false;
        }
    }

    private updateReloading(deltaTime: number): void {
        if (this.isReloading) {
            const currentTime = Date.now();
            if (currentTime - this.reloadStartTime >= this.weapon.reloadTime) {
                this.finishReload();
            }
        }
    }

    private constrainToBounds(): void {
        const bounds = {
            left: 0,
            right: GAME_CONFIG.CANVAS_WIDTH - this.size.width,
            top: 0,
            bottom: GAME_CONFIG.CANVAS_HEIGHT - this.size.height
        };

        this.position.x = Math.max(bounds.left, Math.min(bounds.right, this.position.x));
        this.position.y = Math.max(bounds.top, Math.min(bounds.bottom, this.position.y));
    }

    // Combat methods
    attack(): boolean {
        if (this.isReloading || this.weapon.ammo <= 0) {
            return false;
        }

        this.weapon.ammo--;
        this.isAttacking = true;

        // Trigger attack animation
        this.animationHelper.playAnimation(ANIMATIONS.PLAYER.ATTACK, true);

        // Dispatch attack event
        this.dispatchAttackEvent();

        return true;
    }

    private dispatchAttackEvent(): void {
        const attackEvent = new CustomEvent('playerAttack', {
            detail: {
                playerId: this.id,
                position: { ...this.position },
                direction: this.facing,
                damage: this.weapon.damage,
                range: this.weapon.range
            }
        });
        window.dispatchEvent(attackEvent);
    }

    startReload(): void {
        if (this.isReloading || this.weapon.ammo >= this.weapon.maxAmmo) {
            return;
        }

        this.isReloading = true;
        this.reloadStartTime = Date.now();

        // Dispatch reload start event
        const reloadEvent = new CustomEvent('playerReloadStart', {
            detail: { playerId: this.id, reloadTime: this.weapon.reloadTime }
        });
        window.dispatchEvent(reloadEvent);
    }

    private finishReload(): void {
        this.weapon.ammo = this.weapon.maxAmmo;
        this.isReloading = false;

        // Dispatch reload complete event
        const reloadEvent = new CustomEvent('playerReloadComplete', {
            detail: { playerId: this.id }
        });
        window.dispatchEvent(reloadEvent);
    }

    // Input handling
    setInput(action: string, pressed: boolean): void {
        this.inputState[action] = pressed;
    }

    // Damage and health
    takeDamage(damage: number): boolean {
        if (!this.active) return false;

        this.health -= damage;
        this.stats.health = this.health;

        if (this.health <= 0) {
            this.health = 0;
            this.die();
            return true; // Player died
        }

        // Dispatch damage event
        const damageEvent = new CustomEvent('playerDamaged', {
            detail: { playerId: this.id, damage, currentHealth: this.health }
        });
        window.dispatchEvent(damageEvent);

        return false;
    }

    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.stats.health = this.health;

        const healEvent = new CustomEvent('playerHealed', {
            detail: { playerId: this.id, amount, currentHealth: this.health }
        });
        window.dispatchEvent(healEvent);
    }

    private die(): void {
        this.active = false;
        this.stats.deaths++;

        // Play death animation
        this.animationHelper.playAnimation(ANIMATIONS.PLAYER.DEATH);

        // Dispatch death event
        const deathEvent = new CustomEvent('playerDeath', {
            detail: { playerId: this.id, position: { ...this.position } }
        });
        window.dispatchEvent(deathEvent);
    }

    // Experience and leveling
    gainExperience(amount: number): void {
        this.stats.experience += amount;

        while (this.stats.experience >= this.stats.experienceToNext) {
            this.levelUp();
        }
    }

    private levelUp(): void {
        this.stats.experience -= this.stats.experienceToNext;
        this.stats.level++;
        this.stats.experienceToNext = Math.floor(this.stats.experienceToNext * 1.2);

        // Increase stats
        this.stats.maxHealth += 10;
        this.stats.damage += 2;
        this.stats.speed += 0.2;

        // Heal to full
        this.health = this.stats.maxHealth;
        this.maxHealth = this.stats.maxHealth;

        const levelUpEvent = new CustomEvent('playerLevelUp', {
            detail: {
                playerId: this.id,
                level: this.stats.level,
                stats: { ...this.stats }
            }
        });
        window.dispatchEvent(levelUpEvent);
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

        // Draw sprite
        ctx.drawImage(
            spriteSheet,
            frame.x, frame.y, frame.width, frame.height,
            0, 0, this.size.width, this.size.height
        );

        ctx.restore();

        // Draw health bar
        this.renderHealthBar(ctx);

        // Draw debug info if enabled
        if (GAME_CONFIG.DEBUG_MODE) {
            this.renderDebugInfo(ctx);
        }
    }

    private renderHealthBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.size.width;
        const barHeight = 4;
        const barY = this.position.y - 10;

        // Background
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.position.x, barY, barWidth, barHeight);

        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.position.x, barY, barWidth * healthPercent, barHeight);
    }

    private renderDebugInfo(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`HP: ${this.health}/${this.maxHealth}`, this.position.x, this.position.y - 15);
        ctx.fillText(`Ammo: ${this.weapon.ammo}/${this.weapon.maxAmmo}`, this.position.x, this.position.y - 30);
        ctx.fillText(`Level: ${this.stats.level}`, this.position.x, this.position.y - 45);
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

    getStats(): PlayerStats {
        return { ...this.stats };
    }

    getWeapon(): PlayerWeapon {
        return { ...this.weapon };
    }

    isAlive(): boolean {
        return this.active && this.health > 0;
    }

    // Serialization for save/load
    serialize(): any {
        return {
            id: this.id,
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            stats: this.stats,
            weapon: this.weapon,
            facing: this.facing
        };
    }

    static deserialize(data: any): Player {
        const player = new Player(data.position.x, data.position.y);
        player.id = data.id;
        player.health = data.health;
        player.maxHealth = data.maxHealth;
        player.stats = data.stats;
        player.weapon = data.weapon;
        player.facing = data.facing;
        return player;
    }
}
