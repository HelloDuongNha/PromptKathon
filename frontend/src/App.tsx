import React, { useState, useEffect } from 'react'
import GameContainer from './components/GameContainer'
import LoadingScreen from './components/LoadingScreen'
import MenuOverlay from './components/MenuOverlay'
import { GameManager } from './game/managers/GameManager'

interface AppState {
    isLoading: boolean
    gameInitialized: boolean
    showMenu: boolean
    error: string | null
}

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        isLoading: true,
        gameInitialized: false,
        showMenu: false,
        error: null
    })

    const [gameManager, setGameManager] = useState<GameManager | null>(null)

    useEffect(() => {
        initializeGame()
    }, [])

    const initializeGame = async () => {
        try {
            console.log('🎮 Initializing Vietnam War Game...')

            // Check browser compatibility
            if (!checkBrowserCompatibility()) {
                throw new Error('Trình duyệt không được hỗ trợ')
            }

            // Initialize game manager
            const manager = new GameManager()
            await manager.initialize()

            setGameManager(manager)

            setState(prev => ({
                ...prev,
                isLoading: false,
                gameInitialized: true,
                showMenu: true
            }))

            console.log('✅ Game initialized successfully')

        } catch (error) {
            console.error('❌ Failed to initialize game:', error)
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Lỗi không xác định'
            }))
        }
    }

    const checkBrowserCompatibility = (): boolean => {
        const requiredFeatures = ['fetch', 'Promise', 'localStorage', 'WebGL']

        for (const feature of requiredFeatures) {
            if (!window[feature as keyof Window]) {
                console.error(`❌ Browser missing required feature: ${feature}`)
                return false
            }
        }

        return true
    }

    const handleStartGame = () => {
        setState(prev => ({ ...prev, showMenu: false }))
        gameManager?.startNewGame()
    }

    const handleLoadGame = () => {
        setState(prev => ({ ...prev, showMenu: false }))
        gameManager?.loadSavedGame()
    }

    const handleShowMenu = () => {
        setState(prev => ({ ...prev, showMenu: true }))
        gameManager?.pauseGame()
    }

    if (state.isLoading) {
        return <LoadingScreen />
    }

    if (state.error) {
        return (
            <div className="error-screen">
                <h1>❌ Lỗi khởi tạo game</h1>
                <p>{state.error}</p>
                <button onClick={() => window.location.reload()}>
                    Tải lại trang
                </button>
            </div>
        )
    }

    return (
        <div className="app">
            <GameContainer gameManager={gameManager} />

            {state.showMenu && (
                <MenuOverlay
                    onStartGame={handleStartGame}
                    onLoadGame={handleLoadGame}
                    onCloseMenu={() => setState(prev => ({ ...prev, showMenu: false }))}
                />
            )}
        </div>
    )
}

export default App
