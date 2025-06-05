import { GameEntity, Position, GAME_CONFIG, ENTITY_TYPES, ANIMATIONS } from '../utils/Constants';
import { AnimationHelper } from '../utils/AnimationHelper';
import { PathfindingHelper } from '../utils/PathfindingHelper';

export interface EnemyStats {
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    attackRange: number;
    detectionRange: number;
    attackCooldown: number;
    experienceReward: number;
}

export interface EnemyAI {
    state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
    target: Position | null;
    lastKnownPlayerPosition: Position | null;
    patrolPoints: Position[];
    currentPatrolIndex: number;
    alertLevel: number;
    lastAttackTime: number;
}

export class Enemy implements GameEntity {
    public id: string;
    public type = ENTITY_TYPES.ENEMY;
    public position: Position;
    public size = { width: 32, height: 48 };
    public health: number;
    public maxHealth: number;
    public active: boolean = true;

    // Enemy specific properties
    public stats: EnemyStats;
    public ai: EnemyAI;
    public velocity: Position = { x: 0, y: 0 };
    public facing: 'left' | 'right' = 'right';
    public enemyType: 'soldier' | 'officer' | 'sniper' | 'heavy';

    private animationHelper: AnimationHelper;
    private pathfinding: PathfindingHelper | null = null;
    private currentPath: Position[] = [];
    private pathIndex: number = 0;
    private stuckTimer: number = 0;
    private lastPosition: Position;

    constructor(x: number, y: number, enemyType: 'soldier' | 'officer' | 'sniper' | 'heavy' = 'soldier') {
        this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.position = { x, y };
        this.lastPosition = { x, y };
        this.enemyType = enemyType;

        this.initializeStats();
        this.initializeAI();

        this.health = this.stats.health;
        this.maxHealth = this.stats.maxHealth;

        this.animationHelper = new AnimationHelper();
        this.animationHelper.playAnimation(ANIMATIONS.ENEMY.IDLE);
    }

    private initializeStats(): void {
        // Different stats based on enemy type
        switch (this.enemyType) {
            case 'soldier':
                this.stats = {
                    health: 50,
                    maxHealth: 50,
                    damage: 15,
                    speed: 2,
                    attackRange: 80,
                    detectionRange: 150,
                    attackCooldown: 1000,
                    experienceReward: 10
                };
                break;

            case 'officer':
                this.stats = {
                    health: 80,
                    maxHealth: 80,
                    damage: 20,
                    speed: 2.5,
                    attackRange: 100,
                    detectionRange: 200,
                    attackCooldown: 800,
                    experienceReward: 25
                };
                break;

            case 'sniper':
                this.stats = {
                    health: 40,
                    maxHealth: 40,
                    damage: 35,
                    speed: 1.5,
                    attackRange: 250,
                    detectionRange: 300,
                    attackCooldown: 2000,
                    experienceReward: 20
                };
                break;

            case 'heavy':
                this.stats = {
                    health: 120,
                    maxHealth: 120,
                    damage: 30,
                    speed: 1,
                    attackRange: 60,
                    detectionRange: 120,
                    attackCooldown: 1500,
                    experienceReward: 40
                };
                break;
        }
    }

    private initializeAI(): void {
        this.ai = {
            state: 'patrol',
            target: null,
            lastKnownPlayerPosition: null,
            patrolPoints: this.generatePatrolPoints(),
            currentPatrolIndex: 0,
            alertLevel: 0,
            lastAttackTime: 0
        };
    }

    private generatePatrolPoints(): Position[] {
        const points: Position[] = [];
        const numPoints = 3 + Math.floor(Math.random() * 3); // 3-5 patrol points

        for (let i = 0; i < numPoints; i++) {
            points.push({
                x: this.position.x + (Math.random() - 0.5) * 200,
                y: this.position.y + (Math.random() - 0.5) * 200
            });
        }

        return points;
    }

    setPathfinding(pathfinding: PathfindingHelper): void {
        this.pathfinding = pathfinding;
    }

    update(deltaTime: number, playerPosition: Position | null): void {
        if (!this.active || this.ai.state === 'dead') return;

        this.updateAI(playerPosition);
        this.updateMovement(deltaTime);
        this.updateAnimations(deltaTime);
        this.updateStuckDetection();

        // Update position
        this.position.x += this.velocity.x * deltaTime / 16.67;
        this.position.y += this.velocity.y * deltaTime / 16.67;

        // Keep enemy in bounds
        this.constrainToBounds();
    }

    private updateAI(playerPosition: Position | null): void {
        const currentTime = Date.now();

        // Check for player detection
        if (playerPosition && this.canDetectPlayer(playerPosition)) {
            this.ai.lastKnownPlayerPosition = { ...playerPosition };
            this.ai.alertLevel = Math.min(100, this.ai.alertLevel + 2);

            const distanceToPlayer = this.getDistanceTo(playerPosition);

            if (distanceToPlayer <= this.stats.attackRange) {
                this.ai.state = 'attack';
                this.ai.target = null;
            } else {
                this.ai.state = 'chase';
                this.ai.target = { ...playerPosition };
            }
        } else {
            // Lose alert over time
            this.ai.alertLevel = Math.max(0, this.ai.alertLevel - 0.5);

            if (this.ai.alertLevel <= 0 && this.ai.state === 'chase') {
                this.ai.state = 'patrol';
                this.ai.target = null;
            }
        }

        // State-specific behavior
        switch (this.ai.state) {
            case 'idle':
                this.handleIdleState();
                break;
            case 'patrol':
                this.handlePatrolState();
                break;
            case 'chase':
                this.handleChaseState();
                break;
            case 'attack':
                this.handleAttackState(currentTime);
                break;
        }
    }

    private handleIdleState(): void {
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Randomly switch to patrol
        if (Math.random() < 0.01) {
            this.ai.state = 'patrol';
        }
    }

    private handlePatrolState(): void {
        if (this.ai.patrolPoints.length === 0) {
            this.ai.state = 'idle';
            return;
        }

        const targetPoint = this.ai.patrolPoints[this.ai.currentPatrolIndex];
        const distance = this.getDistanceTo(targetPoint);

        if (distance < 20) {
            // Reached patrol point, move to next
            this.ai.currentPatrolIndex = (this.ai.currentPatrolIndex + 1) % this.ai.patrolPoints.length;

            // Pause briefly at patrol point
            this.velocity.x = 0;
            this.velocity.y = 0;
            return;
        }

        this.moveTowards(targetPoint);
    }

    private handleChaseState(): void {
        if (!this.ai.target) {
            this.ai.state = 'patrol';
            return;
        }

        const distance = this.getDistanceTo(this.ai.target);

        if (distance < 10) {
            // Lost the player, search around last known position
            this.ai.target = {
                x: this.ai.target.x + (Math.random() - 0.5) * 100,
                y: this.ai.target.y + (Math.random() - 0.5) * 100
            };
        }

        this.moveTowards(this.ai.target);
    }

    private handleAttackState(currentTime: number): void {
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (currentTime - this.ai.lastAttackTime >= this.stats.attackCooldown) {
            this.attack();
            this.ai.lastAttackTime = currentTime;
        }
    }

    private moveTowards(target: Position): void {
        // Try pathfinding first
        if (this.pathfinding && this.shouldRecalculatePath(target)) {
            this.currentPath = this.pathfinding.findPath(this.position, target);
            this.pathIndex = 0;
        }

        // Follow path if available
        if (this.currentPath.length > 0 && this.pathIndex < this.currentPath.length) {
            const nextWaypoint = this.currentPath[this.pathIndex];
            const distance = this.getDistanceTo(nextWaypoint);

            if (distance < 15) {
                this.pathIndex++;
                return;
            }

            this.moveDirectlyTowards(nextWaypoint);
        } else {
            // Direct movement as fallback
            this.moveDirectlyTowards(target);
        }
    }

    private moveDirectlyTowards(target: Position): void {
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.velocity.x = (dx / distance) * this.stats.speed;
            this.velocity.y = (dy / distance) * this.stats.speed;

            // Update facing direction
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    private shouldRecalculatePath(target: Position): boolean {
        // Recalculate if no path, or target moved significantly
        if (this.currentPath.length === 0) return true;

        const lastTarget = this.currentPath[this.currentPath.length - 1];
        const targetMoved = this.getDistanceTo(target, lastTarget) > 50;

        return targetMoved || this.pathIndex >= this.currentPath.length;
    }

    private canDetectPlayer(playerPosition: Position): boolean {
        const distance = this.getDistanceTo(playerPosition);

        if (distance > this.stats.detectionRange) {
            return false;
        }

        // Line of sight check
        if (this.pathfinding) {
            return this.pathfinding.hasLineOfSight(this.position, playerPosition);
        }

        return true;
    }

    private updateMovement(deltaTime: number): void {
        // Apply movement with some randomness for more natural behavior
        const randomFactor = 0.1;
        this.velocity.x += (Math.random() - 0.5) * randomFactor;
        this.velocity.y += (Math.random() - 0.5) * randomFactor;
    }

    private updateAnimations(deltaTime: number): void {
        this.animationHelper.update(deltaTime);

        const isMoving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1;

        if (this.ai.state === 'attack') {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.ENEMY.ATTACK)) {
                this.animationHelper.playAnimation(ANIMATIONS.ENEMY.ATTACK);
            }
        } else if (isMoving) {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.ENEMY.WALK)) {
                this.animationHelper.playAnimation(ANIMATIONS.ENEMY.WALK);
            }
        } else {
            if (!this.animationHelper.isAnimationPlaying(ANIMATIONS.ENEMY.IDLE)) {
                this.animationHelper.playAnimation(ANIMATIONS.ENEMY.IDLE);
            }
        }
    }

    private updateStuckDetection(): void {
        const moved = this.getDistanceTo(this.lastPosition) > 1;

        if (!moved && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1)) {
            this.stuckTimer += 16.67; // Assume 60fps

            if (this.stuckTimer > 2000) { // Stuck for 2 seconds
                this.handleStuckSituation();
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }

        this.lastPosition = { ...this.position };
    }

    private handleStuckSituation(): void {
        // Try to get unstuck by moving in a random direction
        const angle = Math.random() * Math.PI * 2;
        this.velocity.x = Math.cos(angle) * this.stats.speed;
        this.velocity.y = Math.sin(angle) * this.stats.speed;

        // Clear current path to force recalculation
        this.currentPath = [];
        this.pathIndex = 0;
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
    attack(): void {
        // Dispatch attack event
        const attackEvent = new CustomEvent('enemyAttack', {
            detail: {
                enemyId: this.id,
                position: { ...this.position },
                damage: this.stats.damage,
                range: this.stats.attackRange,
                enemyType: this.enemyType
            }
        });
        window.dispatchEvent(attackEvent);
    }

    takeDamage(damage: number): boolean {
        if (!this.active || this.ai.state === 'dead') return false;

        this.health -= damage;

        // Become alert when damaged
        this.ai.alertLevel = 100;

        if (this.health <= 0) {
            this.health = 0;
            this.die();
            return true; // Enemy died
        }

        // Dispatch damage event
        const damageEvent = new CustomEvent('enemyDamaged', {
            detail: {
                enemyId: this.id,
                damage,
                currentHealth: this.health,
                enemyType: this.enemyType
            }
        });
        window.dispatchEvent(damageEvent);

        return false;
    }

    private die(): void {
        this.active = false;
        this.ai.state = 'dead';
        this.velocity.x = 0;
        this.velocity.y = 0;

        // Dispatch death event
        const deathEvent = new CustomEvent('enemyDeath', {
            detail: {
                enemyId: this.id,
                position: { ...this.position },
                experienceReward: this.stats.experienceReward,
                enemyType: this.enemyType
            }
        });
        window.dispatchEvent(deathEvent);
    }

    // Utility methods
    private getDistanceTo(target: Position, from?: Position): number {
        const fromPos = from || this.position;
        const dx = target.x - fromPos.x;
        const dy = target.y - fromPos.y;
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

        // Draw sprite
        ctx.drawImage(
            spriteSheet,
            frame.x, frame.y, frame.width, frame.height,
            0, 0, this.size.width, this.size.height
        );

        ctx.restore();

        // Draw health bar
        this.renderHealthBar(ctx);

        // Draw AI state indicator
        if (GAME_CONFIG.DEBUG_MODE) {
            this.renderDebugInfo(ctx);
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
        ctx.fillStyle = healthPercent > 0.5 ? '#ff4444' : '#ff8888';
        ctx.fillRect(this.position.x, barY, barWidth * healthPercent, barHeight);
    }

    private renderDebugInfo(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ffff00';
        ctx.font = '10px Arial';
        ctx.fillText(`${this.ai.state}`, this.position.x, this.position.y - 12);
        ctx.fillText(`Alert: ${Math.floor(this.ai.alertLevel)}`, this.position.x, this.position.y - 25);

        // Draw detection range
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.width / 2,
            this.position.y + this.size.height / 2,
            this.stats.detectionRange,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        // Draw attack range
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.width / 2,
            this.position.y + this.size.height / 2,
            this.stats.attackRange,
            0,
            Math.PI * 2
        );
        ctx.stroke();
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

    getAIState(): string {
        return this.ai.state;
    }

    getAlertLevel(): number {
        return this.ai.alertLevel;
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
            enemyType: this.enemyType,
            stats: this.stats,
            ai: {
                ...this.ai,
                // Don't serialize complex objects
                target: this.ai.target,
                lastKnownPlayerPosition: this.ai.lastKnownPlayerPosition
            },
            facing: this.facing
        };
    }

    static deserialize(data: any): Enemy {
        const enemy = new Enemy(data.position.x, data.position.y, data.enemyType);
        enemy.id = data.id;
        enemy.health = data.health;
        enemy.maxHealth = data.maxHealth;
        enemy.stats = data.stats;
        enemy.ai = { ...enemy.ai, ...data.ai };
        enemy.facing = data.facing;
        return enemy;
    }
}
