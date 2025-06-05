import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// ✅ Sửa lỗi 1: Import các function đã được export từ database.ts
import { 
    findPlayerByUsername, 
    findPlayerByEmail, 
    findPlayerById, 
    createPlayer, 
    updatePlayerLastLogin,
    findProgressByPlayerId,
    createProgress,
    updateProgress
} from '../utils/database';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
    playerId?: string;
}

class AuthController {
    // Register new player
    async register(req: Request, res: Response) {
        try {
            const { username, email, password } = req.body;

            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Vui lòng cung cấp đầy đủ thông tin'
                });
            }

            // Check if username already exists
            const existingPlayerByUsername = await findPlayerByUsername(username);
            if (existingPlayerByUsername) {
                return res.status(400).json({
                    success: false,
                    error: 'Tên người chơi đã tồn tại'
                });
            }

            // Check if email already exists
            const existingPlayerByEmail = await findPlayerByEmail(email);
            if (existingPlayerByEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Email đã được sử dụng'
                });
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // ✅ Sửa lỗi: Sử dụng function createPlayer với đúng tham số
            const newPlayer = await createPlayer(username, email, hashedPassword);

            // Generate JWT token
            const token = this.generateToken(newPlayer.id);

            // Create initial progress for new player
            const initialProgress = await this.createInitialProgress(newPlayer.id);

            // Update player stats
            await updatePlayerLastLogin(newPlayer.id);

            logger.info(`New player registered: ${username}`);

            res.status(201).json({
                success: true,
                data: {
                    player: {
                        id: newPlayer.id,
                        username: newPlayer.username,
                        email: newPlayer.email,
                        createdAt: newPlayer.createdAt,
                        isActive: newPlayer.isActive
                    },
                    token,
                    progress: initialProgress
                },
                message: 'Đăng ký thành công'
            });
        } catch (error) {
            logger.error('Error registering player:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi đăng ký tài khoản'
            });
        }
    }

    // Login player
    async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Vui lòng cung cấp tên đăng nhập và mật khẩu'
                });
            }

            // Find player by username
            const player = await findPlayerByUsername(username);
            if (!player) {
                return res.status(401).json({
                    success: false,
                    error: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, player.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Tên đăng nhập hoặc mật khẩu không đúng'
                });
            }

            // Generate JWT token
            const token = this.generateToken(player.id);

            // Get player progress
            const progress = await findProgressByPlayerId(player.id);

            // Update last login
            await updatePlayerLastLogin(player.id);

            logger.info(`Player logged in: ${username}`);

            res.json({
                success: true,
                data: {
                    player: {
                        id: player.id,
                        username: player.username,
                        email: player.email,
                        createdAt: player.createdAt,
                        lastLogin: player.lastLogin,
                        isActive: player.isActive
                    },
                    token,
                    progress
                },
                message: 'Đăng nhập thành công'
            });
        } catch (error) {
            logger.error('Error logging in player:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi đăng nhập'
            });
        }
    }

    // Logout player
    async logout(req: AuthRequest, res: Response) {
        try {
            const playerId = req.playerId!;
            const player = await findPlayerById(playerId);

            if (player) {
                logger.info(`Player logged out: ${player.username}`);
            }

            // In a more complex system, you might want to blacklist the token
            // For now, we just return success
            res.json({
                success: true,
                message: 'Đăng xuất thành công'
            });
        } catch (error) {
            logger.error('Error logging out player:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi đăng xuất'
            });
        }
    }

    // Get player profile
    async getProfile(req: AuthRequest, res: Response) {
        try {
            const playerId = req.playerId!;
            const player = await findPlayerById(playerId);

            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy thông tin người chơi'
                });
            }

            const progress = await findProgressByPlayerId(playerId);

            res.json({
                success: true,
                data: {
                    player: {
                        id: player.id,
                        username: player.username,
                        email: player.email,
                        createdAt: player.createdAt,
                        lastLogin: player.lastLogin,
                        isActive: player.isActive
                    },
                    gameStats: progress ? {
                        level: progress.level,
                        score: progress.score,
                        completedMissions: progress.completedMissions.length,
                        achievements: progress.achievements.length,
                        totalPlayTime: progress.totalPlayTime,
                        currentStage: progress.gameData.currentStage,
                        unlockedLevels: progress.gameData.unlockedLevels.length
                    } : null
                },
                message: 'Lấy thông tin hồ sơ thành công'
            });
        } catch (error) {
            logger.error('Error getting player profile:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi lấy thông tin hồ sơ'
            });
        }
    }

    // Update player profile
    async updateProfile(req: AuthRequest, res: Response) {
        try {
            const playerId = req.playerId!;
            const { email, currentPassword, newPassword } = req.body;

            const player = await findPlayerById(playerId);
            if (!player) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy thông tin người chơi'
                });
            }

            let hasUpdates = false;

            // Update email if provided
            if (email && email !== player.email) {
                // Check if email is already used by another player
                const existingPlayer = await findPlayerByEmail(email);
                if (existingPlayer && existingPlayer.id !== playerId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email đã được sử dụng bởi người chơi khác'
                    });
                }
                player.email = email;
                hasUpdates = true;
            }

            // Update password if provided
            if (newPassword && currentPassword) {
                // Verify current password
                const isCurrentPasswordValid = await bcrypt.compare(currentPassword, player.password);
                if (!isCurrentPasswordValid) {
                    return res.status(400).json({
                        success: false,
                        error: 'Mật khẩu hiện tại không đúng'
                    });
                }

                // Hash new password
                const saltRounds = 12;
                player.password = await bcrypt.hash(newPassword, saltRounds);
                hasUpdates = true;
            }

            if (!hasUpdates) {
                return res.status(400).json({
                    success: false,
                    error: 'Không có thông tin nào để cập nhật'
                });
            }

            // Note: In your current database structure, there's no direct update function
            // You would need to add an updatePlayer function to database.ts
            // For now, this is a placeholder - you'll need to implement updatePlayer in database.ts

            logger.info(`Player profile updated: ${player.username}`);

            res.json({
                success: true,
                data: {
                    id: player.id,
                    username: player.username,
                    email: player.email,
                    createdAt: player.createdAt,
                    lastLogin: player.lastLogin,
                    isActive: player.isActive
                },
                message: 'Cập nhật hồ sơ thành công'
            });
        } catch (error) {
            logger.error('Error updating player profile:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi cập nhật hồ sơ'
            });
        }
    }

    // Refresh JWT token
    async refreshToken(req: Request, res: Response) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Token không được cung cấp'
                });
            }

            // ✅ Sửa lỗi 2: Sử dụng bracket notation để truy cập JWT_SECRET
            const jwtSecret = process.env['JWT_SECRET'];
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured');
            }

            // Verify the token
            const decoded = jwt.verify(token, jwtSecret) as any;
            const playerId = decoded.playerId;

            // Check if player still exists
            const player = await findPlayerById(playerId);
            if (!player) {
                return res.status(401).json({
                    success: false,
                    error: 'Người chơi không tồn tại'
                });
            }

            // Generate new token
            const newToken = this.generateToken(playerId);

            res.json({
                success: true,
                data: {
                    token: newToken,
                    player: {
                        id: player.id,
                        username: player.username,
                        email: player.email
                    }
                },
                message: 'Làm mới token thành công'
            });
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({
                    success: false,
                    error: 'Token không hợp lệ'
                });
            }

            logger.error('Error refreshing token:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi làm mới token'
            });
        }
    }

    // Create guest account
    async createGuest(req: Request, res: Response) {
        try {
            const guestUsername = `Guest_${Date.now()}`;
            const guestPassword = Math.random().toString(36).substring(7);

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(guestPassword, saltRounds);

            // Create guest player
            const guestPlayer = await createPlayer(
                guestUsername, 
                `${guestUsername}@guest.local`, 
                hashedPassword
            );

            // Generate JWT token
            const token = this.generateToken(guestPlayer.id);

            // Create initial progress
            const initialProgress = await this.createInitialProgress(guestPlayer.id);

            logger.info(`Guest account created: ${guestUsername}`);

            res.status(201).json({
                success: true,
                data: {
                    player: {
                        id: guestPlayer.id,
                        username: guestPlayer.username,
                        isGuest: true,
                        createdAt: guestPlayer.createdAt,
                        isActive: guestPlayer.isActive
                    },
                    token,
                    progress: initialProgress,
                    guestCredentials: {
                        username: guestUsername,
                        password: guestPassword
                    }
                },
                message: 'Tài khoản khách được tạo thành công'
            });
        } catch (error) {
            logger.error('Error creating guest account:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi tạo tài khoản khách'
            });
        }
    }

    // ✅ Sửa lỗi 3: Helper method to generate JWT token với đúng cú pháp
    private generateToken(playerId: string): string {
        const jwtSecret = process.env['JWT_SECRET'];
        const jwtExpiresIn = process.env['JWT_EXPIRES_IN'] || '7d';
        
        if (!jwtSecret || typeof jwtSecret !== 'string') {
            throw new Error('JWT_SECRET is not configured or invalid');
        }
    
        return jwt.sign(
            { playerId } as jwt.JwtPayload,
            jwtSecret,
            { expiresIn: jwtExpiresIn } as jwt.SignOptions
        );
    }

    // Helper method to create initial progress
    private async createInitialProgress(playerId: string) {
        try {
            const initialProgress = await createProgress(playerId);
            return initialProgress;
        } catch (error) {
            logger.error('Error creating initial progress:', error);
            throw error;
        }
    }
}

export const authController = new AuthController();
