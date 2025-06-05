const LEVELS = [
    {
        id: 1,
        name: 'Ha Noi - 12 Ngay Dem',
        description: 'Bảo vệ Hà Nội khỏi các đợt ném bom B-52',
        background: 'bg_hanoi_city.png'
    },
    {
        id: 2,
        name: 'Duong 9 - Khe Sanh',
        description: 'Chiến đấu tại mặt trận Khe Sanh',
        background: 'bg_quangtri_dmz.png'
    },
    {
        id: 3,
        name: 'Hue - Mau Than',
        description: 'Tổng tiến công và nổi dậy tại Huế',
        background: 'bg_hatinh_rural.png'
    },
    {
        id: 4,
        name: 'Dia Dao Cu Chi',
        description: 'Chiến đấu trong địa đạo Củ Chi',
        background: 'bg_taynguyen_forest.png'
    },
    {
        id: 5,
        name: 'Sai Gon - 30/4',
        description: 'Tiến vào giải phóng Sài Gòn',
        background: 'bg_saigon_palace.png'
    }
];

class Level {
    constructor(data) {
        Object.assign(this, data);
    }
}

if (typeof window !== 'undefined') {
    window.GameLevels = LEVELS.map(l => new Level(l));
    window.Level = Level;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEVELS, Level };
}
