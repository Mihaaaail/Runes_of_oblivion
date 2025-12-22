export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const GRID_W = 4;
export const GRID_H = 8;

export const TEAMS = {
    PLAYER: 0,
    ENEMY: 1,
    NEUTRAL: 2
};

export const UNIT_TYPES = {
    PLAYER: 'player',
    ENEMY_MELEE: 'skeleton',
    ENEMY_RANGED: 'archer',
    OBSTACLE: 'rock',
    SUMMON_TURRET: 'turret' // Для ТЗ
};

export const CARD_EFFECTS = {
    DAMAGE: 'DAMAGE',
    HEAL: 'HEAL',
    DASH: 'DASH',
    SUMMON: 'SUMMON',
    SHIELD: 'SHIELD',
    TERRAIN: 'TERRAIN' // Для ТЗ
};

export const EVENTS = {
    // Core Events
    TURN_START: 'TURN_START',
    TURN_END: 'TURN_END',
    WAVE_STARTED: 'WAVE_STARTED',
    WAVE_COMPLETED: 'WAVE_COMPLETED',
    GAME_OVER: 'GAME_OVER',
    
    // Unit Events
    UNIT_SPAWNED: 'UNIT_SPAWNED',
    UNIT_MOVED: 'UNIT_MOVED',
    UNIT_DAMAGED: 'UNIT_DAMAGED',
    UNIT_HEALED: 'UNIT_HEALED',
    UNIT_DIED: 'UNIT_DIED',
    
    // UI/Input Events
    CARD_PLAYED: 'CARD_PLAYED',
    TILE_CLICKED: 'TILE_CLICKED'
};
