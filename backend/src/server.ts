import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './utils/database';
import { logger } from './utils/logger';

// Import routes
import progressRoutes from './routes/progress';
import leaderboardRoutes from './routes/leaderboard';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env['PORT'] || '3001', 10);

// Middleware
app.use(cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Người Lính Vô Danh Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env['NODE_ENV'] || 'development'
    });
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Người Lính Vô Danh API',
            version: '1.0.0',
            description: 'Backend API cho game Người Lính Vô Danh',
            endpoints: {
                auth: '/api/auth',
                progress: '/api/progress',
                leaderboard: '/api/leaderboard',
                health: '/api/health'
            }
        }
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint không tồn tại',
        path: req.originalUrl
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Initialize database and start server
async function startServer(): Promise<void> {
    try {
        await initDatabase();
        logger.info('Database initialized successfully');

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📝 Environment: ${process.env['NODE_ENV'] || 'development'}`);
            logger.info(`🌐 API available at: http://localhost:${PORT}/api`);
            logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
            logger.info(`🎮 Game: Người Lính Vô Danh Backend`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});

export default app;
