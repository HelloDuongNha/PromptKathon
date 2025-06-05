import React, { useEffect, useRef } from 'react'
import { GameManager } from '../game/managers/GameManager'

interface Props {
    gameManager: GameManager | null
}

const GameContainer: React.FC<Props> = ({ gameManager }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (gameManager && canvasRef.current) {
            try {
                gameManager.initializeCanvas(canvasRef.current)
            } catch (err) {
                console.error('Failed to initialize canvas', err)
            }
        }
    }, [gameManager])

    return <canvas ref={canvasRef} className="game-canvas" />
}

export default GameContainer
