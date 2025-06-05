import express from 'express';
import { leaderboardController } from '../controllers/leaderboardController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET /api/leaderboard - Get top players (public)
router.get('/', leaderboardController.getLeaderboard);

// GET /api/leaderboard/player/:playerId - Get specific player ranking
router.get('/player/:playerId', leaderboardController.getPlayerRanking);

// POST /api/leaderboard/submit - Submit score (requires auth)
router.post('/submit', authMiddleware, leaderboardController.submitScore);

// GET /api/leaderboard/weekly - Get weekly leaderboard
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);

// GET /api/leaderboard/level/:levelName - Get leaderboard for specific level
router.get('/level/:levelName', leaderboardController.getLevelLeaderboard);

export default router;
