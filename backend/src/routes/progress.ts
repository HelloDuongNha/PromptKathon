import express from 'express';
import { progressController } from '../controllers/progressController';
import { authMiddleware } from '../middleware/auth';
import { validateProgressData } from '../middleware/validation';

const router = express.Router();

// All progress routes require authentication
router.use(authMiddleware);

// GET /api/progress - Get player's current progress
router.get('/', progressController.getProgress);

// POST /api/progress/save - Save player progress
router.post('/save', validateProgressData, progressController.saveProgress);

// POST /api/progress/load - Load player progress
router.post('/load', progressController.loadProgress);

// PUT /api/progress/update - Update specific progress data
router.put('/update', validateProgressData, progressController.updateProgressData);

// DELETE /api/progress/reset - Reset player progress (new game)
router.delete('/reset', progressController.resetProgress);

// GET /api/progress/stats - Get player statistics
router.get('/stats', progressController.getPlayerStats);

// POST /api/progress/level-complete - Mark level as completed
router.post('/level-complete', progressController.completeLevel);

// POST /api/progress/collect-resource - Add resources to inventory
router.post('/collect-resource', progressController.collectResource);

// POST /api/progress/recruit-hero - Add hero to player's team
router.post('/recruit-hero', progressController.recruitHero);

export default router;
