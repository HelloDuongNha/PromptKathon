import { Request, Response } from 'express';
import {
    Progress,
    findProgressByPlayerId,
    updateProgress,
    createProgress,
    findPlayerById,
    updateLeaderboard
} from '../utils/database';
import { logger } from '../utils/logger';

// ✅ Định nghĩa types local thay vì import từ shared
interface AuthRequest extends Request {
    playerId?: string;
    body: any;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

interface Hero {
    id: string;
    name: string;
    type: string;
    level: number;
    experience: number;
    skills: string[];
    isActive: boolean;
}

interface PlayerStats {
    health: number;
    strength: number;
    defense: number;
    speed: number;
}

interface InventoryItem {
    id: string;
    name: string;
    type: string;
    quantity?: number;
    damage?: number;
    ammo?: number;
}

interface Inventory {
    rice: number;
    wood: number;
    medals: number;
    weapons: InventoryItem[];
    items: InventoryItem[];
}

interface GameData {
    currentStage: number;
    unlockedLevels: number[];
    playerStats: PlayerStats;
    inventory: any[];
}

interface CompleteLevel {
    levelName: string;
    score: number;
    rewards?: {
        rice?: number;
        wood?: number;
        medals?: number;
        experience?: number;
    };
}

interface CollectResource {
    resourceType: 'rice' | 'wood' | 'medals';
    amount: number;
}

interface RecruitHero {
    heroType: string;
    heroName: string;
}

// ✅ Định nghĩa Progress interface để khớp với database
interface ProgressData extends Progress {
    gameData: GameData;
    lastSaved?: Date;
}

// Thêm type guard để kiểm tra inventory
function isInventory(obj: any): obj is Inventory {
    return obj &&
        typeof obj.rice === 'number' &&
        typeof obj.wood === 'number' &&
        typeof obj.medals === 'number' &&
        Array.isArray(obj.weapons) &&
        Array.isArray(obj.items);
}

function isHeroes(obj: any): obj is Hero[] {
    return Array.isArray(obj) && obj.every(hero =>
        typeof hero.id === 'string' &&
        typeof hero.name === 'string' &&
        typeof hero.type === 'string' &&
        typeof hero.level === 'number' &&
        typeof hero.experience === 'number' &&
        Array.isArray(hero.skills) &&
        typeof hero.isActive === 'boolean'
    );
}

class ProgressController {
    // Get player's current progress
    async getProgress(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const progress = await findProgressByPlayerId(playerId);

            if (!progress) {
                const initialProgress = await this.createInitialProgress(playerId);
                return res.json({
                    success: true,
                    data: initialProgress,
                    message: 'New game progress created'
                });
            }

            res.json({
                success: true,
                data: progress,
                message: 'Progress loaded successfully'
            });
        } catch (error) {
            logger.error('Error getting progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get progress'
            });
        }
    }

    // Save player progress
    async saveProgress(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const progressData = req.body;

            const updatedProgress = await updateProgress(playerId, {
                ...progressData,
                totalPlayTime: progressData.totalPlayTime || 0
            });

            if (!updatedProgress) {
                return res.status(404).json({
                    success: false,
                    error: 'Progress not found'
                });
            }

            // Update leaderboard if score improved
            if (progressData.score) {
                const player = await findPlayerById(playerId);
                if (player) {
                    await updateLeaderboard(playerId);
                }
            }

            res.json({
                success: true,
                data: updatedProgress,
                message: 'Progress saved successfully'
            });
        } catch (error) {
            logger.error('Error saving progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save progress'
            });
        }
    }

    // Load player progress
    async loadProgress(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const progress = await findProgressByPlayerId(playerId);

            if (!progress) {
                return res.status(404).json({
                    success: false,
                    error: 'No saved progress found'
                });
            }

            res.json({
                success: true,
                data: progress,
                message: 'Progress loaded successfully'
            });
        } catch (error) {
            logger.error('Error loading progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load progress'
            });
        }
    }

    // Update specific progress data
    async updateProgressData(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const updateData = req.body;

            const updatedProgress = await updateProgress(playerId, updateData);

            if (!updatedProgress) {
                return res.status(404).json({
                    success: false,
                    error: 'Progress not found'
                });
            }

            res.json({
                success: true,
                data: updatedProgress,
                message: 'Progress updated successfully'
            });
        } catch (error) {
            logger.error('Error updating progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update progress'
            });
        }
    }

    // Reset player progress
    async resetProgress(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const initialData = this.createInitialGameData();

            const resetProgress = await updateProgress(playerId, {
                level: 1,
                score: 0,
                completedMissions: [],
                achievements: [],
                totalPlayTime: 0,
                gameData: initialData
            });

            if (!resetProgress) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to reset progress'
                });
            }

            res.json({
                success: true,
                data: resetProgress,
                message: 'Progress reset successfully'
            });
        } catch (error) {
            logger.error('Error resetting progress:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reset progress'
            });
        }
    }

    // Get player statistics
    async getPlayerStats(req: AuthRequest, res: Response<ApiResponse<any>>) {
        try {
            const playerId = req.playerId!;
            const progress = await findProgressByPlayerId(playerId);
            const player = await findPlayerById(playerId);

            if (!progress || !player) {
                return res.status(404).json({
                    success: false,
                    error: 'Player data not found'
                });
            }

            const gameData = progress.gameData;
            const playerStats = gameData.playerStats;

            const stats = {
                playerInfo: {
                    username: player.username,
                    level: progress.level,
                    score: progress.score
                },
                gameProgress: {
                    currentLevel: progress.level,
                    currentStage: gameData.currentStage,
                    completedMissions: progress.completedMissions,
                    achievements: progress.achievements
                },
                inventory: isInventory(gameData.inventory) ? gameData.inventory : { rice: 0, wood: 0, medals: 0, weapons: [], items: [] },
                totalGameTime: progress.totalPlayTime,
                lastPlayed: progress.lastPlayed
            };

            res.json({
                success: true,
                data: stats,
                message: 'Player stats retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting player stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get player stats'
            });
        }
    }

    // Mark level as completed
    async completeLevel(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const { levelName, score, rewards }: CompleteLevel = req.body;

            const progress = await findProgressByPlayerId(playerId);
            if (!progress) {
                return res.status(404).json({
                    success: false,
                    error: 'Progress not found'
                });
            }

            // Add level to completed missions if not already completed
            if (!progress.completedMissions.includes(levelName)) {
                progress.completedMissions.push(levelName);
            }

            // Update score
            progress.score += score || 0;

            // Add rewards
            if (rewards && progress.gameData) {
                const gameData = progress.gameData;
                const inventory = gameData.inventory as unknown as Inventory;

                if (isInventory(inventory)) {
                    if (rewards.rice) inventory.rice += rewards.rice;
                    if (rewards.wood) inventory.wood += rewards.wood;
                    if (rewards.medals) inventory.medals += rewards.medals;
                }
            }

            const updatedProgress = await updateProgress(playerId, progress);

            if (!updatedProgress) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update progress'
                });
            }

            res.json({
                success: true,
                data: updatedProgress,
                message: `Level ${levelName} completed successfully`
            });
        } catch (error) {
            logger.error('Error completing level:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to complete level'
            });
        }
    }

    // Collect resource
    async collectResource(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const { resourceType, amount }: CollectResource = req.body;

            const progress = await findProgressByPlayerId(playerId);
            if (!progress) {
                return res.status(404).json({
                    success: false,
                    error: 'Progress not found'
                });
            }

            const gameData = progress.gameData;
            const inventory = gameData.inventory as unknown as Inventory;

            if (!isInventory(inventory)) {
                gameData.inventory = { rice: 0, wood: 0, medals: 0, weapons: [], items: [] } as unknown as any[];
            }

            switch (resourceType) {
                case 'rice':
                    inventory.rice += amount;
                    break;
                case 'wood':
                    inventory.wood += amount;
                    break;
                case 'medals':
                    inventory.medals += amount;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid resource type'
                    });
            }

            const updatedProgress = await updateProgress(playerId, progress);

            if (!updatedProgress) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update progress'
                });
            }

            res.json({
                success: true,
                data: updatedProgress,
                message: `Collected ${amount} ${resourceType}`
            });
        } catch (error) {
            logger.error('Error collecting resource:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to collect resource'
            });
        }
    }

    // Recruit hero
    async recruitHero(req: AuthRequest, res: Response<ApiResponse<Progress>>) {
        try {
            const playerId = req.playerId!;
            const { heroType, heroName }: RecruitHero = req.body;

            const progress = await findProgressByPlayerId(playerId);
            if (!progress) {
                return res.status(404).json({
                    success: false,
                    error: 'Progress not found'
                });
            }

            const gameData = progress.gameData;
            const inventory = gameData.inventory as unknown as Inventory;
            const recruitmentCost = this.getHeroRecruitmentCost(heroType);

            if (!isInventory(inventory)) {
                gameData.inventory = { rice: 0, wood: 0, medals: 0, weapons: [], items: [] } as unknown as any[];
            }

            if (inventory.rice < recruitmentCost.rice ||
                inventory.wood < recruitmentCost.wood ||
                inventory.medals < recruitmentCost.medals) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient resources for recruitment'
                });
            }

            // Deduct recruitment cost
            inventory.rice -= recruitmentCost.rice;
            inventory.wood -= recruitmentCost.wood;
            inventory.medals -= recruitmentCost.medals;

            // Add new hero to inventory
            const newHero: Hero = {
                id: Date.now().toString(),
                name: heroName,
                type: heroType,
                level: 1,
                experience: 0,
                skills: this.getInitialHeroSkills(heroType),
                isActive: true
            };

            inventory.weapons.push(newHero);

            const updatedProgress = await updateProgress(playerId, progress);

            if (!updatedProgress) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update progress'
                });
            }

            res.json({
                success: true,
                data: updatedProgress,
                message: `Hero ${heroName} recruited successfully`
            });
        } catch (error) {
            logger.error('Error recruiting hero:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to recruit hero'
            });
        }
    }

    // Helper method to create initial progress
    private async createInitialProgress(playerId: string): Promise<Progress> {
        const basicProgress = await createProgress(playerId);

        const initialGameData = this.createInitialGameData();

        const updatedProgress = await updateProgress(playerId, {
            level: 1,
            score: 0,
            completedMissions: [],
            achievements: [],
            totalPlayTime: 0,
            gameData: initialGameData
        });

        return updatedProgress || basicProgress;
    }

    // Helper method to create initial game data
    private createInitialGameData(): GameData {
        return {
            currentStage: 1,
            unlockedLevels: [1],
            playerStats: {
                health: 100,
                strength: 10,
                defense: 5,
                speed: 8
            },
            inventory: []
        };
    }

    // Helper method to get hero recruitment cost
    private getHeroRecruitmentCost(heroType: string): { rice: number; wood: number; medals: number } {
        switch (heroType) {
            case 'vo_nguyen_giap':
                return { rice: 100, wood: 50, medals: 10 };
            case 'nguyen_thi_dinh':
                return { rice: 80, wood: 40, medals: 8 };
            case 'pham_tuan':
                return { rice: 120, wood: 60, medals: 12 };
            default:
                return { rice: 50, wood: 25, medals: 5 };
        }
    }

    // Helper method to get initial hero skills
    private getInitialHeroSkills(heroType: string): string[] {
        switch (heroType) {
            case 'vo_nguyen_giap':
                return ['strategic_planning', 'troop_morale'];
            case 'nguyen_thi_dinh':
                return ['guerrilla_tactics', 'stealth_attack'];
            case 'pham_tuan':
                return ['air_support', 'precision_strike'];
            default:
                return ['basic_combat'];
        }
    }
}

export const progressController = new ProgressController();
