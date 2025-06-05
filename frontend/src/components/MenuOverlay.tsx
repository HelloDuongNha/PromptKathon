import React from 'react'

interface Props {
    onStartGame: () => void
    onLoadGame: () => void
    onCloseMenu: () => void
}

const MenuOverlay: React.FC<Props> = ({ onStartGame, onLoadGame, onCloseMenu }) => (
    <div className="menu-overlay">
        <div className="menu-content">
            <h1>Người Lính Vô Danh</h1>
            <button onClick={onStartGame}>Bắt đầu</button>
            <button onClick={onLoadGame}>Tiếp tục</button>
            <button onClick={onCloseMenu}>Đóng</button>
        </div>
    </div>
)

export default MenuOverlay
