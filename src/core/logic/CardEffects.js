import { GameState } from '../state/GameState.js';
import { BattleLogic } from './BattleLogic.js';
import { PathFinding } from './PathFinding.js';
import { CARD_EFFECTS, UNIT_TYPES, TEAMS, EVENTS } from '../../data/constants.js';
import { UnitModel } from '../state/UnitModel.js';

export class CardEffects {
  // Проверка: можно ли сыграть карту в эту клетку (x, y)
  static canPlay(card, targetX, targetY) {
    const state = GameState.getInstance();
    const player = state.getPlayer();
    if (!player) return false;

    const dist = Math.abs(player.x - targetX) + Math.abs(player.y - targetY);
    if (dist > (card.range ?? 0)) return false;

    switch (card.effect) {
      case CARD_EFFECTS.DAMAGE:
      case CARD_EFFECTS.POISON: {
        const target = state.getUnitAt(targetX, targetY);
        return target && target.team === TEAMS.ENEMY;
      }

      case CARD_EFFECTS.HEAL:
        // HEAL всегда по себе: можно играть, если у игрока есть хоть 1 потерянное HP
        return player.hp < player.maxHp;

      case CARD_EFFECTS.DASH:
      case CARD_EFFECTS.SUMMON:
        return state.isWalkable(targetX, targetY);

      case CARD_EFFECTS.SHIELD:
      case CARD_EFFECTS.TERRAIN:
      case CARD_EFFECTS.LOOT:
      default:
        return true;
    }
  }

  // Выполнение эффекта
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

      case CARD_EFFECTS.HEAL: {
        // Игнорируем targetX/Y, лечим игрока
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

      case CARD_EFFECTS.POISON: {
        const target = state.getUnitAt(targetX, targetY);
        if (target && target.team === TEAMS.ENEMY) {
          BattleLogic.dealDamage(player, target, card.value);
          BattleLogic.addPoison(target, 2, 3); // 2 dmg/turn x 3 turns
        }
        break;
      }

      case CARD_EFFECTS.TERRAIN: {
        state.grid.addTileEffect(targetX, targetY, 'fire', card.value);
        break;
      }

      default:
        console.warn(`Unknown card effect: ${card.effect}`);
        break;
    }
  }
}
