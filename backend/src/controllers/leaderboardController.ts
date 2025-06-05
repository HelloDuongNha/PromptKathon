import { Request, Response } from 'express';
import { 
    getLeaderboard,
    findPlayerById,
    updateLeaderboard,
    LeaderboardEntry
} from '../utils/database';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
    playerId?: string;
}

class LeaderboardController {
    // Get top players leaderboard
    async getLeaderboard(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query['limit'] as string) || 10;
            const leaderboard = await getLeaderboard(limit);

            res.json({
                success: true,
                data: leaderboard,
                message: 'Leaderboard retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting leaderboard:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get leaderboard'
            });
        }
    }

    // Get specific player ranking
    async getPlayerRanking(req: Request, res: Response) {
        try {
            const { playerId } = req.params;
            const leaderboard = await getLeaderboard(1000); // Get more entries to find ranking

            const playerIndex = leaderboard.findIndex(entry => entry.playerId === playerId);

            if (playerIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Player not found in leaderboard'
                });
            }

            const playerEntry = leaderboard[playerIndex];
            const ranking = {
                ...playerEntry,
                rank: playerIndex + 1,
                totalPlayers: leaderboard.length
            };

            res.json({
                success: true,
                data: ranking,
                message: 'Player ranking retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting player ranking:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get player ranking'
            });
        }
    }

    // Submit score to leaderboard
    async submitScore(req: AuthRequest, res: Response) {
        try {
            const playerId = req.playerId!;
            const player = await findPlayerById(playerId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Player not found'
                });
            }

            await updateLeaderboard(playerId);

            // Get updated ranking
            const leaderboard = await getLeaderboard(1000);
            const rank = leaderboard.findIndex(entry => entry.playerId === playerId) + 1;
            const playerEntry = leaderboard.find(entry => entry.playerId === playerId);

            if (!playerEntry) {
                return res.status(404).json({
                    success: false,
                    error: 'Player not found in leaderboard'
                });
            }

            res.json({
                success: true,
                data: {
                    ...playerEntry,
                    rank,
                    totalPlayers: leaderboard.length
                },
                message: 'Score submitted successfully'
            });
        } catch (error) {
            logger.error('Error submitting score:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit score'
            });
        }
    }

    // Get weekly leaderboard
    async getWeeklyLeaderboard(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query['limit'] as string) || 10;
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const allEntries = await getLeaderboard(1000);
            const weeklyEntries = allEntries.filter(entry => {
                const entryDate = new Date(entry.lastUpdated);
                return entryDate >= oneWeekAgo;
            }).slice(0, limit);

            res.json({
                success: true,
                data: weeklyEntries,
                message: 'Weekly leaderboard retrieved successfully'
            });
        } catch (error) {
            logger.error('Error getting weekly leaderboard:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get weekly leaderboard'
            });
        }
    }

    // Get leaderboard for specific level
    async getLevelLeaderboard(req: Request, res: Response) {
        try {
            const { levelName } = req.params;
            if (!levelName) {
                return res.status(400).json({
                    success: false,
                    error: 'Level name is required'
                });
            }

            const limit = parseInt(req.query['limit'] as string) || 10;
            const levelNumber = parseInt(levelName);

            if (isNaN(levelNumber)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid level name'
                });
            }

            const allEntries = await getLeaderboard(1000);
            const levelEntries = allEntries.filter(entry => entry.level === levelNumber)
                .slice(0, limit);

            res.json({
                success: true,
                data: levelEntries,
                message: `Leaderboard for level ${levelNumber} retrieved successfully`
            });
        } catch (error) {
            logger.error('Error getting level leaderboard:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get level leaderboard'
            });
        }
    }
}

export const leaderboardController = new LeaderboardController();
