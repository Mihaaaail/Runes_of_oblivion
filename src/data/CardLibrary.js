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

  TURRET: {
    id: 'turret',
    name: 'Turret',
    cost: 3,
    value: 10,
    range: 2,
    effect: CARD_EFFECTS.SUMMON,
    description: 'Summon turret (10 HP)',
  },
};

// Хелпер для получения копии карты (чтобы не мутировать оригинал)
export function getCard(key) {
  const base = CardLibrary[key];
  if (!base) throw new Error(`Unknown card key: ${key}`);
  return { key, ...base };
}
