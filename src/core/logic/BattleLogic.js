import { GameState } from '../state/GameState.js';
import { EVENTS } from '../../data/constants.js';

export class BattleLogic {
    static dealDamage(sourceUnit, targetUnit, amount) {
        const state = GameState.getInstance();
        
        // Расчет урона
        const result = targetUnit.takeDamage(amount);
        
        // Эмитим события для UI и Анимаций
        state.emit(EVENTS.UNIT_DAMAGED, {
            target: targetUnit,
            source: sourceUnit,
            amount: result.damageDealt,
            isCritical: false 
        });

        if (result.isDead) {
            this.killUnit(targetUnit);
        }
    }

    static heal(targetUnit, amount) {
        const state = GameState.getInstance();
        const oldHp = targetUnit.hp;
        targetUnit.heal(amount);
        const healedAmount = targetUnit.hp - oldHp;

        if (healedAmount > 0) {
            state.emit(EVENTS.UNIT_HEALED, {
                target: targetUnit,
                amount: healedAmount
            });
        }
    }

    static addShield(targetUnit, amount) {
        targetUnit.addShield(amount);
        // Можно добавить событие UNIT_SHIELDED
    }

    static killUnit(unit) {
        const state = GameState.getInstance();
        
        // Гарантируем, что юнит помечен мертвым
        unit.isDead = true;

        state.emit(EVENTS.UNIT_DIED, { unit });
        
        // Мы НЕ удаляем юнита из state.units сразу через removeUnit,
        // чтобы Renderer мог прочитать его данные для анимации.
        // Фильтрация живых идет через getEnemies() и getUnitAt().
    }
    
    static moveUnit(unit, x, y) {
        const state = GameState.getInstance();
        unit.x = x;
        unit.y = y;
        state.emit(EVENTS.UNIT_MOVED, { unit, x, y });
    }
}
