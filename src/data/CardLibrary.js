import { CARD_EFFECTS } from './constants.js';

export const CardLibrary = {
  STRIKE: {
    id: 'strike',
    name: 'Strike',
    cost: 1,
    value: 8,
    range: 2,
    effect: CARD_EFFECTS.DAMAGE,
    description: 'Deal 8 dmg',
  },

  FIREBALL: {
    id: 'fireball',
    name: 'Fireball',
    cost: 2,
    value: 5,
    range: 3,
    effect: CARD_EFFECTS.DAMAGE,
    description: 'Deal 5 dmg in range 3',
  },

  HEAL: {
    id: 'heal',
    name: 'Heal',
    cost: 1,
    value: 5,
    range: 0,
    effect: CARD_EFFECTS.HEAL,
    description: 'Heal 5 HP (self)',
  },

  DASH: {
    id: 'dash',
    name: 'Dash',
    cost: 1,
    value: 0,
    range: 3,
    effect: CARD_EFFECTS.DASH,
    description: 'Teleport within 3',
  },

  LOOT: {
    id: 'loot',
    name: 'Loot',
    cost: 1,
    value: 0,
    range: 0,
    effect: CARD_EFFECTS.LOOT,
    description: 'Draw 2, discard 1',
  },

  TURRET: {
    id: 'turret',
    name: 'Turret',
    cost: 3,
    value: 10,
    range: 2,
    effect: CARD_EFFECTS.SUMMON,
    description: 'Summon turret (10 HP)',
  },

  SHIELD: {
    id: 'shield',
    name: 'Shield',
    cost: 1,
    value: 8,
    range: 0,
    effect: CARD_EFFECTS.SHIELD,
    description: 'Gain 8 shield',
    },

    CLEAV: {
    id: 'cleave',
    name: 'Cleave',
    cost: 2,
    value: 6,
    range: 2,
    effect: CARD_EFFECTS.DAMAGE,
    description: 'Deal 6 to all enemies in range',
    },

    POISON: {
    id: 'poison',
    name: 'Poison Dart',
    cost: 1,
    value: 3,
    range: 3,
    effect: CARD_EFFECTS.DAMAGE,
    description: 'Deal 3 + 2 poison/turn x3',
    },

    BASH: {
    id: 'bash',
    name: 'Bash',
    cost: 2,
    value: 10,
    range: 1,
    effect: CARD_EFFECTS.DAMAGE,
    description: 'Deal 10, draw 1',
    }
};

// Хелпер для получения копии карты (чтобы не мутировать оригинал)
export function getCard(key) {
  const base = CardLibrary[key];
  if (!base) throw new Error(`Unknown card key: ${key}`);
  return { key, ...base };
}

export const STARTING_DECK = [
  'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE',
  'FIREBALL', 'FIREBALL',
  'HEAL', 'HEAL',
  'DASH',
  'TURRET',
  'LOOT', 'LOOT',
];
