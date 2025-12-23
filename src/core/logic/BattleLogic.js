import { GameState } from '../state/GameState.js';
import { EVENTS } from '../../data/constants.js';

export class BattleLogic {
  static dealDamage(attacker, target, amount) {
    const state = GameState.getInstance();
    
    // Сначала щит
    if (target.shield > 0) {
      const absorbed = Math.min(amount, target.shield);
      target.shield -= absorbed;
      amount -= absorbed;
    }

    // Затем HP
    if (amount > 0) {
      target.hp -= amount;
    }

    state.emit(EVENTS.UNIT_DAMAGED, { target });

    if (target.hp <= 0) {
      target.isDead = true;
      state.removeUnit(target.id);
      state.emit(EVENTS.UNIT_DIED, { unit: target });
    }
  }

  static heal(target, amount) {
    const state = GameState.getInstance();
    
    target.hp = Math.min(target.maxHp, target.hp + amount);
    state.emit(EVENTS.UNIT_HEALED, { target });
  }

  static addShield(target, amount) {
    const state = GameState.getInstance();
    
    target.shield = (target.shield || 0) + amount;
    state.emit(EVENTS.UNIT_HEALED, { target }); // shield как heal для UI
  }

  static addPoison(target, damagePerTurn, turns) {
    const state = GameState.getInstance();
    
    target.poisonDamage = (target.poisonDamage || 0) + damagePerTurn;
    target.poisonTurns = (target.poisonTurns || 0) + turns;
    
    // Применяем poison сразу
    this.dealDamage({ type: 'poison' }, target, damagePerTurn);
    state.emit(EVENTS.UNIT_DAMAGED, { target });
  }

  static moveUnit(unit, newX, newY) {
    const state = GameState.getInstance();
    
    unit.x = newX;
    unit.y = newY;
    
    state.emit(EVENTS.UNIT_MOVED, { unit, x: newX, y: newY });
  }

  // Вызывается в начале хода врагов для статусов
  static applyStatusEffects(unit) {
    const state = GameState.getInstance();
    
    // Poison tick
    if (unit.poisonDamage > 0 && unit.poisonTurns > 0) {
      this.dealDamage({ type: 'poison' }, unit, unit.poisonDamage);
      unit.poisonTurns--;
      
      if (unit.poisonTurns <= 0) {
        unit.poisonDamage = 0;
        unit.poisonTurns = 0;
      }
      
      state.emit(EVENTS.UNIT_DAMAGED, { target: unit });
    }
  }
}
