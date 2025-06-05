import express from 'express';
import { authController } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// POST /api/auth/register - Register new player
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login - Login player
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout - Logout player (requires auth)
router.post('/logout', authMiddleware, authController.logout);

// GET /api/auth/profile - Get player profile (requires auth)
router.get('/profile', authMiddleware, authController.getProfile);

// PUT /api/auth/profile - Update player profile (requires auth)
router.put('/profile', authMiddleware, authController.updateProfile);

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authController.refreshToken);

// POST /api/auth/guest - Create guest account
router.post('/guest', authController.createGuest);

export default router;
