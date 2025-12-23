import { GameState } from '../state/GameState.js';
import { EVENTS } from '../../data/constants.js';

export class BattleLogic {
  static dealDamage(attacker, target, amount) {
    const state = GameState.getInstance();
    if (!target || target.isDead) return;

    let dmg = Math.max(0, amount ?? 0);
    if (dmg <= 0) return;

    let changed = false;

    // 1) Shield
    if ((target.shield ?? 0) > 0) {
      const absorbed = Math.min(dmg, target.shield);
      target.shield -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) changed = true;
    }

    // 2) HP
    if (dmg > 0) {
      target.hp -= dmg;
      changed = true;
    }

    if (changed) {
      state.emit(EVENTS.UNIT_DAMAGED, { target });
    }

    if (target.hp <= 0) {
      target.isDead = true;
      state.removeUnit(target.id);
      state.emit(EVENTS.UNIT_DIED, { unit: target });
    }
  }

  static heal(target, amount) {
    const state = GameState.getInstance();
    if (!target || target.isDead) return;

    const add = Math.max(0, amount ?? 0);
    if (add <= 0) return;

    target.hp = Math.min(target.maxHp, target.hp + add);
    state.emit(EVENTS.UNIT_HEALED, { target });
  }

  static addShield(target, amount) {
    const state = GameState.getInstance();
    if (!target || target.isDead) return;

    const add = Math.max(0, amount ?? 0);
    if (add <= 0) return;

    target.shield = (target.shield || 0) + add;

    // shield как heal для UI (у тебя UnitRenderer.healUnit обновляет hp bar)
    state.emit(EVENTS.UNIT_HEALED, { target });
  }

    static addPoison(target, damagePerTurn, turns) {
      if (!target || target.isDead) return;

      const dpt = Math.max(0, damagePerTurn ?? 0);
      const t = Math.max(0, turns ?? 0);
      if (dpt <= 0 || t <= 0) return;

      target.poisonDamage = (target.poisonDamage || 0) + dpt;
      target.poisonTurns = (target.poisonTurns || 0) + t;

      // ВАЖНО: не наносим урон сразу — тик будет в начале хода врагов через applyStatusEffects()
  }


  static moveUnit(unit, newX, newY) {
    const state = GameState.getInstance();
    if (!unit || unit.isDead) return;

    unit.x = newX;
    unit.y = newY;
    state.emit(EVENTS.UNIT_MOVED, { unit, x: newX, y: newY });
  }

  // Вызывается в начале хода врагов для статусов
  static applyStatusEffects(unit) {
    if (!unit || unit.isDead) return;

    // Poison tick
    if ((unit.poisonDamage ?? 0) > 0 && (unit.poisonTurns ?? 0) > 0) {
      this.dealDamage({ type: 'poison' }, unit, unit.poisonDamage);

      // если умер — дальше не трогаем поля
      if (unit.isDead) return;

      unit.poisonTurns -= 1;

      if (unit.poisonTurns <= 0) {
        unit.poisonDamage = 0;
        unit.poisonTurns = 0;
      }
    }
  }
}
