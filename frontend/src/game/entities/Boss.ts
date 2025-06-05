import { GameEntity, Position, ENTITY_TYPES, ANIMATIONS } from '../utils/Constants';
import { AnimationHelper } from '../utils/AnimationHelper';
import { PathfindingHelper } from '../utils/PathfindingHelper';

export interface BossStats {
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    attackRange: number;
    detectionRange: number;
    phaseThresholds: number[];
}

export class Boss implements GameEntity {
    public id: string;
    public type = ENTITY_TYPES.BOSS;
    public position: Position;
    public size = { width: 64, height: 96 };
    public health: number;
    public maxHealth: number;
    public active = true;

    public stats: BossStats;
    public currentPhase = 0;
    public velocity: Position = { x: 0, y: 0 };
    public facing: 'left' | 'right' = 'left';

    private animationHelper: AnimationHelper;
    private pathfinding: PathfindingHelper | null = null;
    private lastAttackTime = 0;
    private bossType: 'commander' | 'tank' | 'helicopter';

    constructor(x: number, y: number, type: 'commander' | 'tank' | 'helicopter' = 'commander') {
        this.id = `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.position = { x, y };
        this.bossType = type;
        this.stats = this.getStatsForType(type);
        this.health = this.stats.health;
        this.maxHealth = this.stats.maxHealth;
        this.animationHelper = new AnimationHelper();
        this.animationHelper.playAnimation(ANIMATIONS.ENEMY.IDLE);
    }

    private getStatsForType(type: 'commander' | 'tank' | 'helicopter'): BossStats {
        switch (type) {
            case 'tank':
                return { health: 400, maxHealth: 400, damage: 30, speed: 1, attackRange: 80, detectionRange: 250, phaseThresholds: [0.75, 0.5, 0.25] };
            case 'helicopter':
                return { health: 300, maxHealth: 300, damage: 25, speed: 2, attackRange: 200, detectionRange: 300, phaseThresholds: [0.75, 0.5, 0.25] };
            default:
                return { health: 250, maxHealth: 250, damage: 20, speed: 1.5, attackRange: 100, detectionRange: 200, phaseThresholds: [0.75, 0.5, 0.25] };
        }
    }

    public setPathfinding(helper: PathfindingHelper): void {
        this.pathfinding = helper;
    }

    private moveTowards(target: Position, deltaTime: number): void {
        if (!this.pathfinding) return;
        const dir = { x: target.x - this.position.x, y: target.y - this.position.y };
        const dist = Math.hypot(dir.x, dir.y);
        if (dist === 0) return;
        this.velocity.x = (dir.x / dist) * this.stats.speed;
        this.velocity.y = (dir.y / dist) * this.stats.speed;
        this.position.x += this.velocity.x * deltaTime / 16.67;
        this.position.y += this.velocity.y * deltaTime / 16.67;
        this.facing = this.velocity.x < 0 ? 'left' : 'right';
    }

    public update(deltaTime: number, playerPos: Position): void {
        if (!this.active) return;
        if (this.health <= 0) {
            this.active = false;
            const deathEvent = new CustomEvent('bossDeath', { detail: { bossId: this.id } });
            window.dispatchEvent(deathEvent);
            return;
        }

        this.moveTowards(playerPos, deltaTime);

        const now = Date.now();
        if (now - this.lastAttackTime > 1500 && this.inAttackRange(playerPos)) {
            this.attackPlayer();
            this.lastAttackTime = now;
        }

        this.checkPhase();
    }

    private inAttackRange(target: Position): boolean {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        return Math.hypot(dx, dy) <= this.stats.attackRange;
    }

    private attackPlayer(): void {
        const evt = new CustomEvent('bossAttack', { detail: { bossId: this.id, damage: this.stats.damage } });
        window.dispatchEvent(evt);
    }

    private checkPhase(): void {
        const healthRatio = this.health / this.maxHealth;
        const nextPhase = this.stats.phaseThresholds.findIndex(threshold => healthRatio <= threshold);
        if (nextPhase !== -1 && nextPhase + 1 > this.currentPhase) {
            this.currentPhase = nextPhase + 1;
            const evt = new CustomEvent('bossPhaseChange', { detail: { bossId: this.id, phase: this.currentPhase } });
            window.dispatchEvent(evt);
        }
    }

    public render(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement): void {
        const frame = this.animationHelper.getCurrentFrame();
        if (!frame) return;

        ctx.save();
        if (this.facing === 'left') {
            ctx.scale(-1, 1);
            ctx.translate(-this.position.x - this.size.width, this.position.y);
        } else {
            ctx.translate(this.position.x, this.position.y);
        }

        ctx.drawImage(sprite, frame.x, frame.y, frame.width, frame.height, 0, 0, this.size.width, this.size.height);
        ctx.restore();
        this.renderHealthBar(ctx);
    }

    private renderHealthBar(ctx: CanvasRenderingContext2D): void {
        const barWidth = this.size.width;
        const barHeight = 6;
        const barY = this.position.y - 15;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.position.x, barY, barWidth, barHeight);
        const pct = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.position.x, barY, barWidth * pct, barHeight);
    }

    public takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
    }

    public isAlive(): boolean {
        return this.active && this.health > 0;
    }

    public serialize(): any {
        return {
            id: this.id,
            bossType: this.bossType,
            position: this.position,
            health: this.health,
            maxHealth: this.maxHealth,
            currentPhase: this.currentPhase
        };
    }

    static deserialize(data: any): Boss {
        const boss = new Boss(data.position.x, data.position.y, data.bossType);
        boss.id = data.id;
        boss.health = data.health;
        boss.maxHealth = data.maxHealth;
        boss.currentPhase = data.currentPhase || 0;
        return boss;
    }
}
