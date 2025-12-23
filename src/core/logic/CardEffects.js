import { GameState } from '../state/GameState.js';
import { BattleLogic } from './BattleLogic.js';
import { CARD_EFFECTS, UNIT_TYPES, TEAMS, EVENTS } from '../../data/constants.js';
import { UnitModel } from '../state/UnitModel.js';

function chebDist(ax, ay, bx, by) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export class CardEffects {
  static canPlay(card, targetX, targetY) {
    const state = GameState.getInstance();
    const player = state.getPlayer();
    if (!player) return false;

    // Range по диагоналям (Chebyshev)
    const dist = chebDist(player.x, player.y, targetX, targetY);
    if (dist > (card.range ?? 0)) return false;

    switch (card.effect) {
      case CARD_EFFECTS.DAMAGE: {
        const target = state.getUnitAt(targetX, targetY);
        return target && target.team === TEAMS.ENEMY;
      }

      case CARD_EFFECTS.POISON: {
        const target = state.getUnitAt(targetX, targetY);
        return target && target.team === TEAMS.ENEMY;
      }

      case CARD_EFFECTS.CLEAV: {
        // Клив целится в клетку с врагом
        const target = state.getUnitAt(targetX, targetY);
        return target && target.team === TEAMS.ENEMY;
      }

      case CARD_EFFECTS.HEAL:
        return player.hp < player.maxHp;

      case CARD_EFFECTS.DASH:
      case CARD_EFFECTS.SUMMON:
        return state.isWalkable(targetX, targetY);

      case CARD_EFFECTS.SHIELD:
      case CARD_EFFECTS.LOOT:
      case CARD_EFFECTS.TERRAIN:
      default:
        return true;
    }
  }

  static execute(card, targetX, targetY) {
    const state = GameState.getInstance();
    const player = state.getPlayer();
    if (!player) return;

    switch (card.effect) {
      case CARD_EFFECTS.DAMAGE: {
        const target = state.getUnitAt(targetX, targetY);
        if (target && target.team === TEAMS.ENEMY) {
          BattleLogic.dealDamage(player, target, card.value);
        }
        break;
      }

      case CARD_EFFECTS.POISON: {
        const target = state.getUnitAt(targetX, targetY);
        if (target && target.team === TEAMS.ENEMY) {
          // мгновенный урон
          BattleLogic.dealDamage(player, target, card.value);
          // DoT: 2 урона на ход врагов, 3 тика
          BattleLogic.addPoison(target, 2, 3);
        }
        break;
      }

      case CARD_EFFECTS.CLEAV: {
        // AoE вокруг цели (радиус 1 по Chebyshev)
        const center = state.getUnitAt(targetX, targetY);
        if (!center || center.team !== TEAMS.ENEMY) break;

        const enemies = state.getEnemies();
        for (const e of enemies) {
          if (e.isDead) continue;
          const d = chebDist(e.x, e.y, targetX, targetY);
          if (d <= 1) {
            BattleLogic.dealDamage(player, e, card.value);
          }
        }
        break;
      }

      case CARD_EFFECTS.HEAL: {
        if (player.hp < player.maxHp) {
          BattleLogic.heal(player, card.value);
        }
        break;
      }

      case CARD_EFFECTS.DASH: {
        BattleLogic.moveUnit(player, targetX, targetY);
        break;
      }

      case CARD_EFFECTS.SUMMON: {
        const newUnit = new UnitModel({
          id: `summon_${Date.now()}`,
          type: UNIT_TYPES.SUMMON_TURRET,
          team: TEAMS.PLAYER,
          x: targetX,
          y: targetY,
          hp: card.value,
          maxHp: card.value,
          maxMana: 0,
        });

        state.addUnit(newUnit);
        state.emit(EVENTS.UNIT_SPAWNED, { unit: newUnit });
        break;
      }

      case CARD_EFFECTS.SHIELD: {
        BattleLogic.addShield(player, card.value);
        break;
      }

      case CARD_EFFECTS.TERRAIN: {
        state.grid.addTileEffect(targetX, targetY, 'fire', card.value);
        break;
      }

      case CARD_EFFECTS.LOOT:
        // обрабатывается в GameManager (спец-кейс)
        break;

      default:
        console.warn(`Unknown card effect: ${card.effect}`);
        break;
    }
  }
}
