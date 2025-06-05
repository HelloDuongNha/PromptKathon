// Main Game Entry Point
class VietnamWarGame {
    constructor() {
        this.currentScreen = 'loading';
        this.gameState = null;
        this.audioManager = null;
        this.apiClient = null;
        this.isAuthenticated = false;
        this.playerData = null;
        
        this.init();
    }

    async init() {
        console.log('🎮 Khởi tạo game Chiến Tranh Việt Nam...');
        
        try {
            // Initialize core systems
            await this.initializeSystems();
            
            // Load game assets
            await this.loadAssets();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check authentication
            await this.checkAuthentication();
            
            // Show main menu
            this.showMainMenu();
            
        } catch (error) {
            console.error('❌ Lỗi khởi tạo game:', error);
            this.showError('Không thể khởi tạo game. Vui lòng tải lại trang.');
        }
    }

    async initializeSystems() {
        // Initialize API client
        this.apiClient = new APIClient();
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        await this.audioManager.init();
        
        // Initialize storage
        this.storage = new StorageManager();
        
        // Initialize notification system
        this.notifications = new NotificationSystem();
        
        console.log('✅ Hệ thống đã được khởi tạo');
    }

    async loadAssets() {
        const loadingProgress = document.getElementById('loading-progress');
        const loadingText = document.getElementById('loading-text');
        
        const assets = [
            { type: 'image', src: 'images/backgrounds/vietnam-landscape.jpg', name: 'background' },
            { type: 'image', src: 'images/characters/soldier.png', name: 'soldier' },
            { type: 'image', src: 'images/weapons/rifle.png', name: 'rifle' },
            { type: 'audio', src: 'audio/background-music.mp3', name: 'bgMusic' },
            { type: 'audio', src: 'audio/gunshot.wav', name: 'gunshot' }
        ];

        let loaded = 0;
        const total = assets.length;

        for (const asset of assets) {
            try {
                loadingText.textContent = `Đang tải ${asset.name}...`;
                
                if (asset.type === 'image') {
                    await this.loadImage(asset.src);
                } else if (asset.type === 'audio') {
                    await this.audioManager.loadSound(asset.name, asset.src);
                }
                
                loaded++;
                const progress = (loaded / total) * 100;
                loadingProgress.style.width = `${progress}%`;
                
                // Simulate loading time
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.warn(`⚠️ Không thể tải ${asset.name}:`, error);
            }
        }

        loadingText.textContent = 'Hoàn tất!';
        console.log('✅ Tài nguyên đã được tải');
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('continue-game-btn').addEventListener('click', () => {
            this.continueGame();
        });

        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.showLeaderboard();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('about-btn').addEventListener('click', () => {
            this.showAbout();
        });

        // Auth form handlers
        this.setupAuthListeners();
        
        // Modal handlers
        this.setupModalListeners();
        
        // Game controls
        this.setupGameControls();
        
        // Keyboard shortcuts
        this.setupKeyboardControls();

        console.log('✅ Event listeners đã được thiết lập');
    }

    setupAuthListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e);
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister(e);
        });

        // Auth navigation
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('register-screen');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('login-screen');
        });
    }

    setupModalListeners() {
        // Settings modal
        document.getElementById('close-settings').addEventListener('click', () => {
            this.hideModal('settings-modal');
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('reset-settings').addEventListener('click', () => {
            this.resetSettings();
        });

        // Leaderboard modal
        document.getElementById('close-leaderboard').addEventListener('click', () => {
            this.hideModal('leaderboard-modal');
        });

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLeaderboardTab(e.target.dataset.tab);
            });
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    setupGameControls() {
        // Game control buttons
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Action buttons
        document.getElementById('attack-btn').addEventListener('click', () => {
            this.handleAttack();
        });

        document.getElementById('defend-btn').addEventListener('click', () => {
            this.handleDefend();
        });

        document.getElementById('recruit-btn').addEventListener('click', () => {
            this.showRecruitMenu();
        });
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Escape':
                    if (this.currentScreen === 'game-screen') {
                        this.togglePause();
                    } else {
                        this.showMainMenu();
                    }
                    break;
                case 'KeyP':
                    if (this.currentScreen === 'game-screen') {
                        this.togglePause();
                    }
                    break;
                case 'Space':
                    if (this.currentScreen === 'game-screen') {
                        e.preventDefault();
                        this.handleAttack();
                    }
                    break;
                case 'Enter':
                    if (this.currentScreen === 'main-menu') {
                        this.startNewGame();
                    }
                    break;
            }
        });
    }

    async checkAuthentication() {
        const token = this.storage.getToken();
        if (token) {
            try {
                const playerData = await this.apiClient.getPlayerProfile();
                if (playerData.success) {
                    this.isAuthenticated = true;
                    this.playerData = playerData.data;
                    console.log('✅ Đã đăng nhập:', this.playerData.username);
                }
            } catch (error) {
                console.log('ℹ️ Token không hợp lệ, yêu cầu đăng nhập lại');
                this.storage.removeToken();
            }
        }
    }

    async handleLogin(e) {
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const result = await this.apiClient.login(credentials);
            if (result.success) {
                this.storage.setToken(result.token);
                this.isAuthenticated = true;
                this.playerData = result.player;
                
                this.notifications.show('Đăng nhập thành công!', 'success');
                this.showMainMenu();
            } else {
                this.notifications.show(result.error || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.notifications.show('Lỗi kết nối server', 'error');
        }
    }

    async handleRegister(e) {
        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (userData.password !== userData.confirmPassword) {
            this.notifications.show('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        try {
            const result = await this.apiClient.register(userData);
            if (result.success) {
                this.notifications.show('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                this.showScreen('login-screen');
            } else {
                this.notifications.show(result.error || 'Đăng ký thất bại', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.notifications.show('Lỗi kết nối server', 'error');
        }
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show target screen
        document.getElementById(screenId).classList.remove('hidden');
        this.currentScreen = screenId;

        // Update UI based on screen
        if (screenId === 'main-menu') {
            this.updateMainMenu();
        }
    }

    showMainMenu() {
        if (!this.isAuthenticated) {
            this.showScreen('login-screen');
            return;
        }

        this.showScreen('main-menu');
        this.audioManager.playBackgroundMusic();
    }

    updateMainMenu() {
        const continueBtn = document.getElementById('continue-game-btn');
        if (this.isAuthenticated && this.playerData) {
            continueBtn.style.display = 'flex';
        } else {
            continueBtn.style.display = 'none';
        }
    }

    async startNewGame() {
        if (!this.isAuthenticated) {
            this.notifications.show('Vui lòng đăng nhập để chơi game', 'warning');
            this.showScreen('login-screen');
            return;
        }

        try {
            // Initialize new game
            this.gameState = new GameState();
            await this.gameState.startNewGame();
            
            this.showScreen('game-screen');
            this.notifications.show('Bắt đầu trò chơi mới!', 'success');
            
        } catch (error) {
            console.error('Error starting new game:', error);
            this.notifications.show('Không thể bắt đầu game mới', 'error');
        }
    }

    async continueGame() {
        if (!this.isAuthenticated) {
            this.notifications.show('Vui lòng đăng nhập để tiếp tục game', 'warning');
            this.showScreen('login-screen');
            return;
        }

        try {
            // Load saved game
            this.gameState = new GameState();
            await this.gameState.loadSavedGame();
            
            this.showScreen('game-screen');
            this.notifications.show('Tiếp tục trò chơi!', 'success');
            
        } catch (error) {
            console.error('Error continuing game:', error);
            this.notifications.show('Không thể tải game đã lưu', 'error');
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    async showLeaderboard() {
        this.showModal('leaderboard-modal');
        await this.loadLeaderboard('global');
    }

    async loadLeaderboard(type = 'global') {
        try {
            const result = await this.apiClient.getLeaderboard(type);
            if (result.success) {
                this.renderLeaderboard(result.data);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.notifications.show('Không thể tải bảng xếp hạng', 'error');
        }
    }

    renderLeaderboard(data) {
        const listContainer = document.getElementById('leaderboard-list');
        listContainer.innerHTML = '';

        data.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'leaderboard-entry';
            
            if (this.playerData && entry.playerId === this.playerData.id) {
                entryElement.classList.add('current-player');
            }

            const rankClass = index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : '';
            
            entryElement.innerHTML = `
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="player-name">${entry.username}</div>
                <div class="player-score">${entry.score.toLocaleString()}</div>
            `;
            
            listContainer.appendChild(entryElement);
        });
    }

    switchLeaderboardTab(tabType) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
        
        // Load new data
        this.loadLeaderboard(tabType);
    }

    showSettings() {
        this.showModal('settings-modal');
        this.loadCurrentSettings();
    }

    loadCurrentSettings() {
        const settings = this.storage.getSettings();
        
        // Audio settings
        document.getElementById('master-volume').value = settings.masterVolume || 50;
        document.getElementById('music-volume').value = settings.musicVolume || 30;
        document.getElementById('sfx-volume').value = settings.sfxVolume || 70;
        
        // Graphics settings
        document.getElementById('graphics-quality').value = settings.graphicsQuality || 'medium';
        document.getElementById('particles-enabled').checked = settings.particlesEnabled !== false;
        
        // Update volume displays
        this.updateVolumeDisplays();
    }

    updateVolumeDisplays() {
        ['master', 'music', 'sfx'].forEach(type => {
            const slider = document.getElementById(`${type}-volume`);
            const display = document.getElementById(`${type}-volume-value`);
            display.textContent = `${slider.value}%`;
            
            slider.addEventListener('input', () => {
                display.textContent = `${slider.value}%`;
            });
        });
    }

    saveSettings() {
        const settings = {
            masterVolume: parseInt(document.getElementById('master-volume').value),
            musicVolume: parseInt(document.getElementById('music-volume').value),
            sfxVolume: parseInt(document.getElementById('sfx-volume').value),
            graphicsQuality: document.getElementById('graphics-quality').value,
            particlesEnabled: document.getElementById('particles-enabled').checked
        };
        
        this.storage.saveSettings(settings);
        this.audioManager.updateSettings(settings);
        
        this.notifications.show('Cài đặt đã được lưu', 'success');
        this.hideModal('settings-modal');
    }

    resetSettings() {
        const defaultSettings = {
            masterVolume: 50,
            musicVolume: 30,
            sfxVolume: 70,
            graphicsQuality: 'medium',
            particlesEnabled: true
        };
        
        this.storage.saveSettings(defaultSettings);
        this.loadCurrentSettings();
        this.notifications.show('Đã khôi phục cài đặt mặc định', 'info');
    }

    showAbout() {
        this.notifications.show('Game Chiến Tranh Việt Nam v1.0 - Tái hiện lịch sử dân tộc', 'info');
    }

    // Game control methods
    togglePause() {
        if (this.gameState) {
            this.gameState.togglePause();
        }
    }

    handleAttack() {
        if (this.gameState) {
            this.gameState.playerAttack();
        }
    }

    handleDefend() {
        if (this.gameState) {
            this.gameState.playerDefend();
        }
    }

    showRecruitMenu() {
        // TODO: Implement recruit menu
        this.notifications.show('Chức năng tuyển quân đang phát triển', 'info');
    }

    showError(message) {
        document.getElementById('loading-screen').innerHTML = `
            <div class="loading-content">
                <h2 style="color: #f44336;">❌ Lỗi</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn primary" style="margin-top: 20px;">
                    Tải lại trang
                </button>
            </div>
        `;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new VietnamWarGame();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VietnamWarGame;
}
