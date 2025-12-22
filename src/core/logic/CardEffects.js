import { GameState } from '../state/GameState.js';
import { BattleLogic } from './BattleLogic.js';
import { PathFinding } from './PathFinding.js';
import { CARD_EFFECTS, UNIT_TYPES, TEAMS } from '../../data/constants.js';
import { UnitModel } from '../state/UnitModel.js';


export class CardEffects {
    
    // Проверка: можно ли сыграть карту в эту клетку (x, y)
    static canPlay(card, targetX, targetY) {
        const state = GameState.getInstance();
        const player = state.getPlayer();
        if (!player) return false;

        // 1. Проверка дистанции
        const dist = Math.abs(player.x - targetX) + Math.abs(player.y - targetY);
        if (dist > card.range) return false;

        // 2. Специфичные проверки для эффектов
        switch (card.effect) {
            case CARD_EFFECTS.DAMAGE:
                // Цель должна быть врагом
                const target = state.getUnitAt(targetX, targetY);
                return target && target.team !== player.team;

            case CARD_EFFECTS.HEAL:
                // Цель должна быть союзником (или собой)
                const friend = state.getUnitAt(targetX, targetY);
                return friend && friend.team === player.team;

            case CARD_EFFECTS.DASH:
                // Клетка должна быть свободна и достижима
                return state.isWalkable(targetX, targetY);
            
            case CARD_EFFECTS.SUMMON:
                // Клетка должна быть свободна
                return state.isWalkable(targetX, targetY);

            default:
                return true;
        }
    }

    // Выполнение эффекта
    static execute(card, targetX, targetY) {
        const state = GameState.getInstance();
        const player = state.getPlayer();

        switch (card.effect) {
            case CARD_EFFECTS.DAMAGE: {
                const target = state.getUnitAt(targetX, targetY);
                if (target) {
                    BattleLogic.dealDamage(player, target, card.value);
                }
                break;
            }

            case CARD_EFFECTS.HEAL: {
                const target = state.getUnitAt(targetX, targetY);
                if (target) {
                    BattleLogic.heal(target, card.value);
                }
                break;
            }

            case CARD_EFFECTS.DASH: {
                // В теории для Dash нужен путь, но сделаем мгновенный телепорт для простоты,
                // так как canPlay уже проверил валидность.
                BattleLogic.moveUnit(player, targetX, targetY);
                break;
            }

            case CARD_EFFECTS.SUMMON: {
                // Создаем нового юнита
                const newUnit = new UnitModel({
                    id: `summon_${Date.now()}`,
                    type: UNIT_TYPES.SUMMON_TURRET, // Турель по умолчанию
                    team: TEAMS.PLAYER,
                    x: targetX,
                    y: targetY,
                    hp: card.value, // HP суммона берем из value карты
                    maxMana: 0
                });
                state.addUnit(newUnit);
                // Тут можно добавить emit(UNIT_SPAWNED)
                state.emit('UNIT_SPAWNED', { unit: newUnit });
                break;
            }
            
            case CARD_EFFECTS.TERRAIN: {
                // Создаем лужу (value = длительность)
                state.grid.addTileEffect(targetX, targetY, 'fire', card.value);
                break;
            }
        }
    }
}
