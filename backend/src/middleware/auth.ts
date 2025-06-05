import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// ✅ Import function findPlayerById từ database utils
import { findPlayerById } from '../utils/database';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
    playerId?: string;
    player?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token không được cung cấp hoặc không đúng định dạng'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, jwtSecret) as any;
        const playerId = decoded.playerId;

        // ✅ Sử dụng function findPlayerById đã được export từ database.ts
        const player = await findPlayerById(playerId);
        if (!player) {
            return res.status(401).json({
                success: false,
                error: 'Người chơi không tồn tại'
            });
        }

        // Add player info to request
        req.playerId = playerId;
        req.player = player;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Token không hợp lệ'
            });
        }

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Token đã hết hạn'
            });
        }

        logger.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi xác thực'
        });
    }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            try {
                const jwtSecret = process.env['JWT_SECRET'];
                if (!jwtSecret) {
                    logger.warn('JWT_SECRET is not configured');
                    return next();
                }

                const decoded = jwt.verify(token, jwtSecret) as any;
                const playerId = decoded.playerId;

                // ✅ Sử dụng function findPlayerById đã được export từ database.ts
                const player = await findPlayerById(playerId);
                if (player) {
                    req.playerId = playerId;
                    req.player = player;
                }
            } catch (tokenError) {
                // Token is invalid but we don't fail the request
                logger.warn('Invalid token in optional auth:', tokenError);
            }
        }

        next();
    } catch (error) {
        logger.error('Optional auth middleware error:', error);
        next(); // Continue even if there's an error
    }
};

// Admin middleware (for future admin features)
export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.player) {
            return res.status(401).json({
                success: false,
                error: 'Yêu cầu xác thực'
            });
        }

        // Check if player is admin (you can add admin field to player schema)
        const isAdmin = req.player.username === 'admin' || req.player.isAdmin === true;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Không có quyền truy cập'
            });
        }

        next();
    } catch (error) {
        logger.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi kiểm tra quyền admin'
        });
    }
};

// Rate limiting middleware
export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();

        // Clean up expired entries
        for (const [key, value] of requests.entries()) {
            if (now > value.resetTime) {
                requests.delete(key);
            }
        }

        // Get or create client record
        let clientRecord = requests.get(clientId);
        if (!clientRecord || now > clientRecord.resetTime) {
            clientRecord = {
                count: 0,
                resetTime: now + windowMs
            };
            requests.set(clientId, clientRecord);
        }

        // Check rate limit
        if (clientRecord.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
                retryAfter: Math.ceil((clientRecord.resetTime - now) / 1000)
            });
        }

        // Increment counter
        clientRecord.count++;

        next();
    };
};
