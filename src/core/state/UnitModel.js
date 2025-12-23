import { UNIT_TYPES, TEAMS } from '../../data/constants.js';

export class UnitModel {
  constructor(data = {}) {
    this.id = data.id ?? `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.type = data.type ?? UNIT_TYPES.ENEMY;
    // ВАЖНО: team может быть 0 (TEAMS.PLAYER), поэтому только ??
    this.team = data.team ?? TEAMS.ENEMY;

    this.x = data.x ?? 0;
    this.y = data.y ?? 0;

    // Основные статы
    this.maxHp = data.maxHp ?? 10;
    this.hp = data.hp ?? this.maxHp;

    this.maxMana = data.maxMana ?? 0;
    this.mana = data.mana ?? this.maxMana;

    this.movePoints = data.movePoints ?? 0;

    // Статусы
    this.shield = data.shield ?? 0;
    this.poisonDamage = data.poisonDamage ?? 0;
    this.poisonTurns = data.poisonTurns ?? 0;

    this.isDead = data.isDead ?? false;

    // Можно расширять позже
    this.buffs = data.buffs ?? [];
    this.intent = data.intent ?? null;
  }

  takeDamage(amount) {
    let dmg = amount;

    // 1) щит
    if (this.shield > 0) {
      const absorbed = Math.min(dmg, this.shield);
      this.shield -= absorbed;
      dmg -= absorbed;
    }

    // 2) HP
    if (dmg > 0) {
      this.hp -= dmg;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
      }
    }

    return {
      damageDealt: amount,
      isDead: this.isDead,
    };
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addShield(amount) {
    this.shield += amount;
  }

  clearStatusEffects() {
    this.shield = 0;
    this.poisonDamage = 0;
    this.poisonTurns = 0;
  }
}
