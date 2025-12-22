export const TILE_WIDTH = 96;
export const TILE_HEIGHT = 48;

export const GRID_W = 4;
export const GRID_H = 8;

export const TEAMS = {
  PLAYER: 0,
  ENEMY: 1,
  NEUTRAL: 2,
};

export const UNIT_TYPES = {
  PLAYER: 'player',
  ENEMY_MELEE: 'skeleton',
  ENEMY_RANGED: 'archer',
  OBSTACLE: 'rock',
  SUMMON_TURRET: 'turret',
};

export const CARD_EFFECTS = {
  DAMAGE: 'DAMAGE',
  HEAL: 'HEAL',
  DASH: 'DASH',
  SUMMON: 'SUMMON',
  SHIELD: 'SHIELD',
  TERRAIN: 'TERRAIN',
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
  TILE_CLICKED: 'TILE_CLICKED',
};

// Балансные статы юнитов
export const UNIT_STATS = {
  PLAYER: {
    MOVE_POINTS: 3,
    MAX_MANA: 3,
  },
  ENEMY_MELEE: {
    DAMAGE: 6,
    MOVE_POINTS: 3,
  },
  ENEMY_RANGED: {
    DAMAGE: 4,
    MOVE_POINTS: 3,
    RANGE_MIN: 2,
    RANGE_MAX: 4,
    FLEE_RANGE: 1,
  },
  TURRET: {
    DAMAGE: 4,
    RANGE: 3,
  },
};
