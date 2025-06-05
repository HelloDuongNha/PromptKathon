import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Hero } from '../entities/Hero';
import { PathfindingHelper } from '../utils/PathfindingHelper';
import { GAME_CONFIG, GAME_STATES, GameState, Position } from '../utils/Constants';

export interface GameStats {
    score: number;
    kills: number;
    deaths: number;
    level: number;
    playTime: number;
    accuracy: number;
    shotsHit: number;
    shotsFired: number;
}

export interface GameResources {
    rice: number;
    wood: number;
    medals: number;
}

export interface LevelObjective {
    id: string;
    description: string;
    type: 'kill' | 'survive' | 'rescue' | 'collect' | 'reach';
    target: number;
    current: number;
    completed: boolean;
}

export class GameManager {
    private static instance: GameManager;

    // Game state
    private gameState: GameState = GAME_STATES.LOADING;
    private isPaused: boolean = false;
    private gameStartTime: number = 0;

    // Entities
    private player: Player | null = null;
    private enemies: Map<string, Enemy> = new Map();
    private bosses: Map<string, Boss> = new Map();
    private heroes: Map<string, Hero> = new Map();

    // Game systems
    private pathfinding: PathfindingHelper;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    // Game data
    private gameStats: GameStats;
    private gameResources: GameResources;
    private currentLevel: number = 1;
    private levelObjectives: LevelObjective[] = [];

    // Event handlers
    private eventListeners: Map<string, Function[]> = new Map();

    // Timing
    private lastUpdateTime: number = 0;
    private deltaTime: number = 0;

    // Spawn timers
    private lastEnemySpawn: number = 0;
    private enemySpawnInterval: number = 5000; // 5 seconds

    private constructor() {
        this.initializeGame();
        this.setupEventListeners();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    private initializeGame(): void {
        this.gameStats = {
            score: 0,
            kills: 0,
            deaths: 0,
            level: 1,
            playTime: 0,
            accuracy: 0,
            shotsHit: 0,
            shotsFired: 0
        };

        this.gameResources = {
            rice: GAME_CONFIG.INITIAL_RICE,
            wood: GAME_CONFIG.INITIAL_WOOD,
            medals: GAME_CONFIG.INITIAL_MEDALS
        };

        this.pathfinding = new PathfindingHelper(
            GAME_CONFIG.CANVAS_WIDTH,
            GAME_CONFIG.CANVAS_HEIGHT
        );
    }

    private setupEventListeners(): void {
        // Player events
        window.addEventListener('playerAttack', this.handlePlayerAttack.bind(this));
        window.addEventListener('playerDamaged', this.handlePlayerDamaged.bind(this));
        window.addEventListener('playerDeath', this.handlePlayerDeath.bind(this));
        window.addEventListener('playerLevelUp', this.handlePlayerLevelUp.bind(this));

        // Enemy events
        window.addEventListener('enemyAttack', this.handleEnemyAttack.bind(this));
        window.addEventListener('enemyDeath', this.handleEnemyDeath.bind(this));

        // Boss events
        window.addEventListener('bossPhaseChange', this.handleBossPhaseChange.bind(this));
        window.addEventListener('bossEnrage', this.handleBossEnrage.bind(this));
        window.addEventListener('bossAbilityUsed', this.handleBossAbilityUsed.bind(this));

        // Hero events
        window.addEventListener('heroAbilityUsed', this.handleHeroAbilityUsed.bind(this));
        window.addEventListener('heroDeath', this.handleHeroDeath.bind(this));

        // Game events
        window.addEventListener('spawnReinforcements', this.handleSpawnReinforcements.bind(this));
    }

    // Initialization methods
    public initializeCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }

        // Set canvas size
        canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    }

    public startGame(): void {
        if (this.gameState !== GAME_STATES.MENU && this.gameState !== GAME_STATES.LOADING) {
            console.warn('Cannot start game from current state:', this.gameState);
            return;
        }

        this.gameState = GAME_STATES.PLAYING;
        this.gameStartTime = Date.now();
        this.lastUpdateTime = Date.now();

        // Create player
        this.createPlayer(100, 100);

        // Load initial level
        this.loadLevel(this.currentLevel);

        // Start game loop
        this.gameLoop();

        this.dispatchEvent('gameStarted', { level: this.currentLevel });
    }

    public pauseGame(): void {
        if (this.gameState === GAME_STATES.PLAYING) {
            this.gameState = GAME_STATES.PAUSED;
            this.isPaused = true;
            this.dispatchEvent('gamePaused', {});
        }
    }

    public resumeGame(): void {
        if (this.gameState === GAME_STATES.PAUSED) {
            this.gameState = GAME_STATES.PLAYING;
            this.isPaused = false;
            this.lastUpdateTime = Date.now(); // Reset timing
            this.dispatchEvent('gameResumed', {});
        }
    }

    public endGame(victory: boolean = false): void {
        this.gameState = victory ? GAME_STATES.VICTORY : GAME_STATES.GAME_OVER;
        this.calculateFinalStats();
        this.dispatchEvent('gameEnded', { victory, stats: this.gameStats });
    }

    // Game loop
    private gameLoop(): void {
        if (this.gameState !== GAME_STATES.PLAYING) {
            return;
        }

        const currentTime = Date.now();
        this.deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Update game
        this.update(this.deltaTime);

        // Render game
        this.render();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(deltaTime: number): void {
        // Update play time
        this.gameStats.playTime = Date.now() - this.gameStartTime;

        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }

        // Update enemies
        const playerPosition = this.player?.getPosition() || null;
        this.enemies.forEach(enemy => {
            enemy.setPathfinding(this.pathfinding);
            enemy.update(deltaTime, playerPosition);
        });

        // Update bosses
        this.bosses.forEach(boss => {
            boss.setPathfinding(this.pathfinding);
            boss.update(deltaTime, playerPosition);
        });

        // Update heroes
        this.heroes.forEach(hero => {
            hero.update(deltaTime, playerPosition);
        });

        // Spawn enemies
        this.updateEnemySpawning();

        // Check objectives
        this.checkObjectives();

        // Check win/lose conditions
        this.checkGameConditions();

        // Clean up dead entities
        this.cleanupDeadEntities();
    }

    private render(): void {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render background
        this.renderBackground();

        // Render entities
        this.renderEntities();

        // Render UI
        this.renderUI();
    }

    private renderBackground(): void {
        if (!this.ctx) return;

        // Simple background for now
        this.ctx.fillStyle = '#2d4a2b';
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // Add some texture
        this.ctx.fillStyle = '#1a2e1a';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            const y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    private renderEntities(): void {
        if (!this.ctx) return;

        // Would load sprite sheets here
        const dummySprite = new Image(); // Placeholder

        // Render heroes first (background layer)
        this.heroes.forEach(hero => {
            hero.render(this.ctx!, dummySprite);
        });

        // Render enemies
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx!, dummySprite);
        });

        // Render bosses
        this.bosses.forEach(boss => {
            boss.render(this.ctx!, dummySprite);
        });

        // Render player last (foreground)
        if (this.player) {
            this.player.render(this.ctx, dummySprite);
        }
    }

    private renderUI(): void {
        if (!this.ctx) return;

        // Health bar
        this.renderPlayerHealth();

        // Resources
        this.renderResources();

        // Objectives
        this.renderObjectives();

        // Game stats
        this.renderGameStats();
    }

    private renderPlayerHealth(): void {
        if (!this.ctx || !this.player) return;

        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = 20;

        // Background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Health
        const healthPercent = this.player.health / this.player.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
        this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Health: ${this.player.health}/${this.player.maxHealth}`, x, y - 5);
    }

    private renderResources(): void {
        if (!this.ctx) return;

        const x = GAME_CONFIG.CANVAS_WIDTH - 200;
        const y = 20;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Rice: ${this.gameResources.rice}`, x, y);
        this.ctx.fillText(`Wood: ${this.gameResources.wood}`, x, y + 20);
        this.ctx.fillText(`Medals: ${this.gameResources.medals}`, x, y + 40);
    }

    private renderObjectives(): void {
        if (!this.ctx) return;

        const x = 20;
        let y = 80;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Objectives:', x, y);
        y += 20;

        this.levelObjectives.forEach(objective => {
            const color = objective.completed ? '#00ff00' : '#ffffff';
            this.ctx.fillStyle = color;
            const progress = `${objective.current}/${objective.target}`;
            this.ctx.fillText(`${objective.description} (${progress})`, x, y);
            y += 15;
        });
    }

    private renderGameStats(): void {
        if (!this.ctx) return;

        const x = GAME_CONFIG.CANVAS_WIDTH - 200;
        const y = 100;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Score: ${this.gameStats.score}`, x, y);
        this.ctx.fillText(`Kills: ${this.gameStats.kills}`, x, y + 15);
        this.ctx.fillText(`Level: ${this.currentLevel}`, x, y + 30);

        const playTimeSeconds = Math.floor(this.gameStats.playTime / 1000);
        this.ctx.fillText(`Time: ${playTimeSeconds}s`, x, y + 45);
    }

    // Entity management
    private createPlayer(x: number, y: number): void {
        this.player = new Player(x, y);
    }

    public spawnEnemy(x: number, y: number, type: 'soldier' | 'officer' | 'sniper' | 'heavy' = 'soldier'): Enemy {
        const enemy = new Enemy(x, y, type);
        this.enemies.set(enemy.id, enemy);
        return enemy;
    }

    public spawnBoss(x: number, y: number, type: 'commander' | 'tank' | 'helicopter'): Boss {
        const boss = new Boss(x, y, type);
        this.bosses.set(boss.id, boss);
        return boss;
    }

    public spawnHero(x: number, y: number, type: 'medic' | 'sniper' | 'engineer' | 'commander'): Hero {
        const hero = new Hero(x, y, type);
        this.heroes.set(hero.id, hero);
        return hero;
    }

    private updateEnemySpawning(): void {
        const currentTime = Date.now();

        if (currentTime - this.lastEnemySpawn > this.enemySpawnInterval) {
            if (this.enemies.size < 10) { // Max 10 enemies
                const x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
                const y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
                this.spawnEnemy(x, y);
                this.lastEnemySpawn = currentTime;
            }
        }
    }

    private cleanupDeadEntities(): void {
        // Remove dead enemies
        this.enemies.forEach((enemy, id) => {
            if (!enemy.isAlive()) {
                this.enemies.delete(id);
            }
        });

        // Remove dead bosses
        this.bosses.forEach((boss, id) => {
            if (!boss.isAlive()) {
                this.bosses.delete(id);
            }
        });

        // Remove dead heroes
        this.heroes.forEach((hero, id) => {
            if (!hero.isAlive()) {
                this.heroes.delete(id);
            }
        });
    }

    // Level management
    private loadLevel(levelNumber: number): void {
        this.currentLevel = levelNumber;
        this.levelObjectives = this.generateLevelObjectives(levelNumber);

        // Spawn initial enemies based on level
        const enemyCount = Math.min(5 + levelNumber, 15);
        for (let i = 0; i < enemyCount; i++) {
            const x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            const y = Math.random() * GAME_CONFIG.CANVAS_HEIGHT;
            this.spawnEnemy(x, y);
        }

        // Spawn boss every 5 levels
        if (levelNumber % 5 === 0) {
            const bossTypes: ('commander' | 'tank' | 'helicopter')[] = ['commander', 'tank', 'helicopter'];
            const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            this.spawnBoss(
                GAME_CONFIG.CANVAS_WIDTH / 2,
                GAME_CONFIG.CANVAS_HEIGHT / 2,
                bossType
            );
        }

        // Spawn heroes occasionally
        if (levelNumber > 2 && Math.random() < 0.3) {
            const heroTypes: ('medic' | 'sniper' | 'engineer' | 'commander')[] = ['medic', 'sniper', 'engineer', 'commander'];
            const heroType = heroTypes[Math.floor(Math.random() * heroTypes.length)];
            this.spawnHero(50, 50, heroType);
        }
    }

    private generateLevelObjectives(levelNumber: number): LevelObjective[] {
        const objectives: LevelObjective[] = [];

        // Kill objective
        objectives.push({
            id: 'kill_enemies',
            description: 'Eliminate enemies',
            type: 'kill',
            target: 5 + levelNumber * 2,
            current: 0,
            completed: false
        });

        // Survival objective
        objectives.push({
            id: 'survive',
            description: 'Survive for 2 minutes',
            type: 'survive',
            target: 120, // seconds
            current: 0,
            completed: false
        });

        // Boss objective for boss levels
        if (levelNumber % 5 === 0) {
            objectives.push({
                id: 'defeat_boss',
                description: 'Defeat the boss',
                type: 'kill',
                target: 1,
                current: 0,
                completed: false
            });
        }

        return objectives;
    }

    // Event handlers
    private handlePlayerAttack(event: CustomEvent): void {
        this.gameStats.shotsFired++;

        const { damage, position, range } = event.detail;

        // Check hits against enemies
        this.enemies.forEach(enemy => {
            const distance = this.getDistance(position, enemy.getPosition());
            if (distance <= range) {
                const killed = enemy.takeDamage(damage);
                if (killed) {
                    this.gameStats.shotsHit++;
                }
            }
        });

        // Check hits against bosses
        this.bosses.forEach(boss => {
            const distance = this.getDistance(position, boss.getPosition());
            if (distance <= range) {
                const killed = boss.takeDamage(damage);
                if (killed) {
                    this.gameStats.shotsHit++;
                }
            }
        });

        // Update accuracy
        this.gameStats.accuracy = (this.gameStats.shotsHit / this.gameStats.shotsFired) * 100;
    }

    private handlePlayerDamaged(event: CustomEvent): void {
        // Player took damage - could trigger effects, sound, etc.
    }

    private handlePlayerDeath(event: CustomEvent): void {
        this.gameStats.deaths++;
        this.endGame(false);
    }

    private handlePlayerLevelUp(event: CustomEvent): void {
        this.gameStats.level = event.detail.level;
        this.gameStats.score += 100;
    }

    private handleEnemyAttack(event: CustomEvent): void {
        const { damage, position, range } = event.detail;

        if (this.player) {
            const distance = this.getDistance(position, this.player.getPosition());
            if (distance <= range) {
                this.player.takeDamage(damage);
            }
        }
    }

    private handleEnemyDeath(event: CustomEvent): void {
        this.gameStats.kills++;
        this.gameStats.score += 10;

        // Update kill objectives
        this.levelObjectives.forEach(objective => {
            if (objective.type === 'kill' && !objective.completed) {
                objective.current++;
                if (objective.current >= objective.target) {
                    objective.completed = true;
                }
            }
        });
    }

    private handleBossPhaseChange(event: CustomEvent): void {
        // Boss entered new phase - could trigger special effects
    }

    private handleBossEnrage(event: CustomEvent): void {
        // Boss became enraged - could trigger warning UI
    }

    private handleBossAbilityUsed(event: CustomEvent): void {
        // Boss used ability - could trigger visual/audio effects
    }

    private handleHeroAbilityUsed(event: CustomEvent): void {
        // Hero used ability - could trigger effects
    }

    private handleHeroDeath(event: CustomEvent): void {
        // Hero died - could affect morale, trigger events
    }

    private handleSpawnReinforcements(event: CustomEvent): void {
        const { position, count, enemyType } = event.detail;

        for (let i = 0; i < count; i++) {
            const spawnX = position.x + (Math.random() - 0.5) * 100;
            const spawnY = position.y + (Math.random() - 0.5) * 100;
            this.spawnEnemy(spawnX, spawnY, enemyType);
        }
    }

    // Game condition checks
    private checkObjectives(): void {
        // Update survival objective
        const survivalObjective = this.levelObjectives.find(obj => obj.type === 'survive');
        if (survivalObjective && !survivalObjective.completed) {
            survivalObjective.current = Math.floor(this.gameStats.playTime / 1000);
            if (survivalObjective.current >= survivalObjective.target) {
                survivalObjective.completed = true;
            }
        }
    }

    private checkGameConditions(): void {
        // Check if all objectives completed
        const allCompleted = this.levelObjectives.every(obj => obj.completed);
        if (allCompleted) {
            this.nextLevel();
        }

        // Check if player is dead
        if (this.player && !this.player.isAlive()) {
            this.endGame(false);
        }
    }

    private nextLevel(): void {
        this.currentLevel++;
        this.gameStats.score += 200; // Level completion bonus
        this.loadLevel(this.currentLevel);

        this.dispatchEvent('levelCompleted', {
            level: this.currentLevel - 1,
            nextLevel: this.currentLevel
        });
    }

    private calculateFinalStats(): void {
        // Calculate final score, achievements, etc.
        this.gameStats.score += Math.floor(this.gameStats.playTime / 1000); // Time bonus
    }

    // Utility methods
    private getDistance(pos1: Position, pos2: Position): number {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private dispatchEvent(eventName: string, data: any): void {
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }

    // Public getters
    public getGameState(): GameState {
        return this.gameState;
    }

    public getGameStats(): GameStats {
        return { ...this.gameStats };
    }

    public getGameResources(): GameResources {
        return { ...this.gameResources };
    }

    public getPlayer(): Player | null {
        return this.player;
    }

    public getEnemies(): Enemy[] {
        return Array.from(this.enemies.values());
    }

    public getBosses(): Boss[] {
        return Array.from(this.bosses.values());
    }

    public getHeroes(): Hero[] {
        return Array.from(this.heroes.values());
    }

    public getLevelObjectives(): LevelObjective[] {
        return [...this.levelObjectives];
    }

    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    // Input handling
    public handleInput(action: string, pressed: boolean): void {
        if (this.player) {
            this.player.setInput(action, pressed);
        }

        // Handle hero input if player is controlling a hero
        this.heroes.forEach(hero => {
            if (hero.isPlayerControlled) {
                hero.setInput(action, pressed);
            }
        });
    }

    // Resource management
    public addResources(rice: number = 0, wood: number = 0, medals: number = 0): void {
        this.gameResources.rice += rice;
        this.gameResources.wood += wood;
        this.gameResources.medals += medals;
    }

    public spendResources(rice: number = 0, wood: number = 0, medals: number = 0): boolean {
        if (this.gameResources.rice >= rice &&
            this.gameResources.wood >= wood &&
            this.gameResources.medals >= medals) {

            this.gameResources.rice -= rice;
            this.gameResources.wood -= wood;
            this.gameResources.medals -= medals;
            return true;
        }
        return false;
    }

    // Save/Load
    public saveGame(): any {
        return {
            gameStats: this.gameStats,
            gameResources: this.gameResources,
            currentLevel: this.currentLevel,
            levelObjectives: this.levelObjectives,
            player: this.player?.serialize(),
            enemies: Array.from(this.enemies.values()).map(e => e.serialize()),
            bosses: Array.from(this.bosses.values()).map(b => b.serialize()),
            heroes: Array.from(this.heroes.values()).map(h => h.serialize())
        };
    }

    public loadGame(saveData: any): void {
        this.gameStats = saveData.gameStats;
        this.gameResources = saveData.gameResources;
        this.currentLevel = saveData.currentLevel;
        this.levelObjectives = saveData.levelObjectives;

        // Clear existing entities
        this.enemies.clear();
        this.bosses.clear();
        this.heroes.clear();

        // Load player
        if (saveData.player) {
            this.player = Player.deserialize(saveData.player);
        }

        // Load enemies
        saveData.enemies?.forEach((enemyData: any) => {
            const enemy = Enemy.deserialize(enemyData);
            this.enemies.set(enemy.id, enemy);
        });

        // Load bosses
        saveData.bosses?.forEach((bossData: any) => {
            const boss = Boss.deserialize(bossData);
            this.bosses.set(boss.id, boss);
        });

        // Load heroes
        saveData.heroes?.forEach((heroData: any) => {
            const hero = Hero.deserialize(heroData);
            this.heroes.set(hero.id, hero);
        });
    }
}
