import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Validation for user registration
export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
    const { username, password, email } = req.body;
    const errors: string[] = [];

    // Username validation
    if (!username) {
        errors.push('Tên người chơi là bắt buộc');
    } else if (username.length < 3) {
        errors.push('Tên người chơi phải có ít nhất 3 ký tự');
    } else if (username.length > 20) {
        errors.push('Tên người chơi không được quá 20 ký tự');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Tên người chơi chỉ được chứa chữ cái, số và dấu gạch dưới');
    }

    // Password validation
    if (!password) {
        errors.push('Mật khẩu là bắt buộc');
    } else if (password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    } else if (password.length > 50) {
        errors.push('Mật khẩu không được quá 50 ký tự');
    }

    // Email validation (optional)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email không hợp lệ');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu không hợp lệ',
            details: errors
        });
    }

    next();
};

// Validation for user login
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    const errors: string[] = [];

    if (!username) {
        errors.push('Tên người chơi là bắt buộc');
    }

    if (!password) {
        errors.push('Mật khẩu là bắt buộc');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu không hợp lệ',
            details: errors
        });
    }

    next();
};

// Validation for progress data
export const validateProgressData = (req: Request, res: Response, next: NextFunction) => {
    const progressData = req.body;
    const errors: string[] = [];

    // Validate current level
    if (progressData.currentLevel !== undefined) {
        if (!Number.isInteger(progressData.currentLevel) || progressData.currentLevel < 1 || progressData.currentLevel > 5) {
            errors.push('Cấp độ hiện tại phải là số nguyên từ 1 đến 5');
        }
    }

    // Validate current stage
    if (progressData.currentStage !== undefined) {
        const validStages = ['hanoi', 'hatinh', 'quangtri', 'taynguyen', 'saigon'];
        if (!validStages.includes(progressData.currentStage)) {
            errors.push('Giai đoạn hiện tại không hợp lệ');
        }
    }

    // Validate player stats
    if (progressData.playerStats) {
        const stats = progressData.playerStats;

        if (stats.health !== undefined && (typeof stats.health !== 'number' || stats.health < 0)) {
            errors.push('Máu hiện tại phải là số không âm');
        }

        if (stats.maxHealth !== undefined && (typeof stats.maxHealth !== 'number' || stats.maxHealth <= 0)) {
            errors.push('Máu tối đa phải là số dương');
        }

        if (stats.experience !== undefined && (typeof stats.experience !== 'number' || stats.experience < 0)) {
            errors.push('Kinh nghiệm phải là số không âm');
        }

        if (stats.level !== undefined && (!Number.isInteger(stats.level) || stats.level < 1)) {
            errors.push('Cấp độ nhân vật phải là số nguyên dương');
        }

        if (stats.score !== undefined && (typeof stats.score !== 'number' || stats.score < 0)) {
            errors.push('Điểm số phải là số không âm');
        }
    }

    // Validate inventory
    if (progressData.inventory) {
        const inventory = progressData.inventory;

        if (inventory.rice !== undefined && (typeof inventory.rice !== 'number' || inventory.rice < 0)) {
            errors.push('Số lượng gạo phải là số không âm');
        }

        if (inventory.wood !== undefined && (typeof inventory.wood !== 'number' || inventory.wood < 0)) {
            errors.push('Số lượng gỗ phải là số không âm');
        }

        if (inventory.medals !== undefined && (typeof inventory.medals !== 'number' || inventory.medals < 0)) {
            errors.push('Số lượng huy chương phải là số không âm');
        }

        if (inventory.weapons && !Array.isArray(inventory.weapons)) {
            errors.push('Danh sách vũ khí phải là mảng');
        }

        if (inventory.items && !Array.isArray(inventory.items)) {
            errors.push('Danh sách vật phẩm phải là mảng');
        }
    }

    // Validate heroes
    if (progressData.heroes && !Array.isArray(progressData.heroes)) {
        errors.push('Danh sách tướng phải là mảng');
    }

    // Validate completed levels
    if (progressData.completedLevels && !Array.isArray(progressData.completedLevels)) {
        errors.push('Danh sách màn đã hoàn thành phải là mảng');
    }

    // Validate achievements
    if (progressData.achievements && !Array.isArray(progressData.achievements)) {
        errors.push('Danh sách thành tựu phải là mảng');
    }

    // Validate game time
    if (progressData.gameTime !== undefined && (typeof progressData.gameTime !== 'number' || progressData.gameTime < 0)) {
        errors.push('Thời gian chơi phải là số không âm');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu tiến trình không hợp lệ',
            details: errors
        });
    }

    next();
};

// Validation for resource collection
export const validateResourceCollection = (req: Request, res: Response, next: NextFunction) => {
    const { resourceType, amount } = req.body;
    const errors: string[] = [];

    const validResourceTypes = ['rice', 'wood', 'medals'];

    if (!resourceType) {
        errors.push('Loại tài nguyên là bắt buộc');
    } else if (!validResourceTypes.includes(resourceType)) {
        errors.push('Loại tài nguyên không hợp lệ');
    }

    if (amount === undefined) {
        errors.push('Số lượng là bắt buộc');
    } else if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
        errors.push('Số lượng phải là số nguyên dương');
    } else if (amount > 1000) {
        errors.push('Số lượng không được vượt quá 1000');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu thu thập tài nguyên không hợp lệ',
            details: errors
        });
    }

    next();
};

// Validation for hero recruitment
export const validateHeroRecruitment = (req: Request, res: Response, next: NextFunction) => {
    const { heroType, heroName } = req.body;
    const errors: string[] = [];

    const validHeroTypes = ['vo_nguyen_giap', 'nguyen_thi_dinh', 'pham_tuan'];

    if (!heroType) {
        errors.push('Loại tướng là bắt buộc');
    } else if (!validHeroTypes.includes(heroType)) {
        errors.push('Loại tướng không hợp lệ');
    }

    if (!heroName) {
        errors.push('Tên tướng là bắt buộc');
    } else if (typeof heroName !== 'string' || heroName.length < 2 || heroName.length > 50) {
        errors.push('Tên tướng phải từ 2 đến 50 ký tự');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu chiêu mộ tướng không hợp lệ',
            details: errors
        });
    }

    next();
};

// General request sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Remove any potential XSS or injection attempts
        const sanitizeObject = (obj: any): any => {
            if (typeof obj === 'string') {
                return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            } else if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            } else if (obj && typeof obj === 'object') {
                const sanitized: any = {};
                for (const key in obj) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
                return sanitized;
            }
            return obj;
        };

        req.body = sanitizeObject(req.body);
        req.query = sanitizeObject(req.query);
        req.params = sanitizeObject(req.params);

        next();
    } catch (error) {
        logger.error('Error sanitizing input:', error);
        next();
    }
};

// Validation for level completion
export const validateLevelCompletion = (req: Request, res: Response, next: NextFunction) => {
    const { levelName, score, rewards } = req.body;
    const errors: string[] = [];

    const validLevels = [
        'hanoi_level_1', 'hanoi_level_2', 'hanoi_level_3',
        'hatinh_level_1', 'hatinh_level_2', 'hatinh_level_3',
        'quangtri_level_1', 'quangtri_level_2', 'quangtri_level_3',
        'taynguyen_level_1', 'taynguyen_level_2', 'taynguyen_level_3',
        'saigon_level_1', 'saigon_level_2', 'saigon_level_3'
    ];

    if (!levelName) {
        errors.push('Tên màn chơi là bắt buộc');
    } else if (!validLevels.includes(levelName)) {
        errors.push('Tên màn chơi không hợp lệ');
    }

    if (score !== undefined && (typeof score !== 'number' || score < 0)) {
        errors.push('Điểm số phải là số không âm');
    }

    if (rewards && typeof rewards === 'object') {
        if (rewards.rice !== undefined && (typeof rewards.rice !== 'number' || rewards.rice < 0)) {
            errors.push('Phần thưởng gạo phải là số không âm');
        }
        if (rewards.wood !== undefined && (typeof rewards.wood !== 'number' || rewards.wood < 0)) {
            errors.push('Phần thưởng gỗ phải là số không âm');
        }
        if (rewards.medals !== undefined && (typeof rewards.medals !== 'number' || rewards.medals < 0)) {
            errors.push('Phần thưởng huy chương phải là số không âm');
        }
        if (rewards.experience !== undefined && (typeof rewards.experience !== 'number' || rewards.experience < 0)) {
            errors.push('Phần thưởng kinh nghiệm phải là số không âm');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu hoàn thành màn chơi không hợp lệ',
            details: errors
        });
    }

    next();
};

// Validation for score submission
export const validateScoreSubmission = (req: Request, res: Response, next: NextFunction) => {
    const { score, level, completedLevels, achievements, gameTime } = req.body;
    const errors: string[] = [];

    if (score === undefined) {
        errors.push('Điểm số là bắt buộc');
    } else if (typeof score !== 'number' || score < 0) {
        errors.push('Điểm số phải là số không âm');
    }

    if (level !== undefined && (!Number.isInteger(level) || level < 1 || level > 5)) {
        errors.push('Cấp độ phải là số nguyên từ 1 đến 5');
    }

    if (completedLevels !== undefined && !Array.isArray(completedLevels)) {
        errors.push('Danh sách màn đã hoàn thành phải là mảng');
    }

    if (achievements !== undefined && (typeof achievements !== 'number' || achievements < 0)) {
        errors.push('Số thành tựu phải là số không âm');
    }

    if (gameTime !== undefined && (typeof gameTime !== 'number' || gameTime < 0)) {
        errors.push('Thời gian chơi phải là số không âm');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu gửi điểm không hợp lệ',
            details: errors
        });
    }

    next();
};
