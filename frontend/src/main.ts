// Main entry point for the game
import './styles/main.css';
import { VietnamWarGame } from './game/VietnamWarGame';
import { AudioManager } from './utils/AudioManager';
import { StorageManager } from './utils/StorageManager';
import { APIClient } from './utils/APIClient';
import { NotificationSystem } from './utils/NotificationSystem';

// Global type declarations
declare global {
    interface Window {
        game: VietnamWarGame;
        audioManager: AudioManager;
        storageManager: StorageManager;
        apiClient: APIClient;
        notifications: NotificationSystem;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Initializing Vietnam War Game...');
    
    try {
        // Check browser compatibility
        if (!checkBrowserCompatibility()) {
            showCompatibilityError();
            return;
        }

        // Show loading screen
        showLoadingScreen();

        // Initialize core systems
        await initializeSystems();

        // Initialize game
        const game = new VietnamWarGame();
        window.game = game;

        // Hide loading screen when game is ready
        hideLoadingScreen();

        console.log('✅ Game initialized successfully');

    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        showInitializationError(error);
    }
});

async function initializeSystems(): Promise<void> {
    // Initialize API client
    window.apiClient = new APIClient();
    
    // Initialize storage manager
    window.storageManager = new StorageManager();
    
    // Initialize audio manager
    window.audioManager = new AudioManager();
    await window.audioManager.init();
    
    // Initialize notification system
    window.notifications = new NotificationSystem();
    
    console.log('✅ Core systems initialized');
}

function checkBrowserCompatibility(): boolean {
    // Check for required features
    const requiredFeatures = [
        'fetch',
        'Promise',
        'localStorage',
        'WebGL',
        'AudioContext'
    ];

    for (const feature of requiredFeatures) {
        if (!window[feature as keyof Window] && !window[`webkit${feature}` as keyof Window]) {
            console.error(`❌ Browser missing required feature: ${feature}`);
            return false;
        }
    }

    return true;
}

function showCompatibilityError(): void {
    document.body.innerHTML = `
        <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #1a1a1a;
            color: #ffffff;
            font-family: Arial, sans-serif;
            text-align: center;
        ">
            <div>
                <h1 style="color: #f44336; margin-bottom: 20px;">
                    ❌ Trình duyệt không được hỗ trợ
                </h1>
                <p style="margin-bottom: 20px;">
                    Game yêu cầu trình duyệt hiện đại hỗ trợ WebGL và Web Audio API.
                </p>
                <p>
                    Vui lòng cập nhật trình duyệt hoặc sử dụng Chrome, Firefox, Safari phiên bản mới nhất.
                </p>
            </div>
        </div>
    `;
}

function showLoadingScreen(): void {
    const loadingHTML = `
        <div id="loading-screen" class="loading-screen">
            <div class="loading-content">
                <h1 style="color: #d4af37; margin-bottom: 20px;">
                    🇻🇳 Chiến Tranh Việt Nam
                </h1>
                <div class="loading-spinner"></div>
                <p id="loading-text">Đang khởi tạo game...</p>
                <div class="loading-bar">
                    <div id="loading-progress" class="loading-progress"></div>
                </div>
                <p style="font-size: 0.9rem; color: #888; margin-top: 20px;">
                    Tái hiện lịch sử dân tộc
                </p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', loadingHTML);
}

function hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

function showInitializationError(error: Error): void {
    document.body.innerHTML = `
        <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #1a1a1a;
            color: #ffffff;
            font-family: Arial, sans-serif;
            text-align: center;
        ">
            <div>
                <h1 style="color: #f44336; margin-bottom: 20px;">
                    ❌ Lỗi khởi tạo game
                </h1>
                <p style="margin-bottom: 20px;">
                    ${error.message}
                </p>
                <button onclick="location.reload()" style="
                    background: #d4af37;
                    color: #1a1a1a;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                    Tải lại trang
                </button>
            </div>
        </div>
    `;
}

// Handle unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    if (window.notifications) {
        window.notifications.show('Đã xảy ra lỗi không mong muốn', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.notifications) {
        window.notifications.show('Lỗi kết nối hoặc xử lý dữ liệu', 'error');
    }
});
