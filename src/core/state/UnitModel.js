import { UNIT_STATS, UNIT_TYPES } from '../../data/constants.js';

export class UnitModel {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.team = data.team;

        this.x = data.x;
        this.y = data.y;

        this.maxHp = data.hp;
        this.hp = data.hp;

        const baseStats = UNIT_STATS.PLAYER; // дефолт, ниже поправим

        if (this.type === UNIT_TYPES.ENEMY_MELEE) {
        this.movePoints = UNIT_STATS.ENEMY_MELEE.MOVE_POINTS;
        } else if (this.type === UNIT_TYPES.ENEMY_RANGED) {
        this.movePoints = UNIT_STATS.ENEMY_RANGED.MOVE_POINTS;
        } else {
        // игрок и прочие
        this.movePoints = UNIT_STATS.PLAYER.MOVE_POINTS;
        }

        this.maxMana = data.maxMana ?? UNIT_STATS.PLAYER.MAX_MANA;
        this.mana = data.mana ?? this.maxMana;

        this.isDead = false;
        this.shield = 0;
        this.buffs = [];
        this.intent = null;
    }

    takeDamage(amount) {
        let damageToDeal = amount;

        // 1. Сначала урон идет в щит
        if (this.shield > 0) {
            if (this.shield >= damageToDeal) {
                this.shield -= damageToDeal;
                damageToDeal = 0;
            } else {
                damageToDeal -= this.shield;
                this.shield = 0;
            }
        }

        // 2. Остаток урона идет в HP
        this.hp -= damageToDeal;

        // 3. Проверка на смерть
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }

        return {
            damageDealt: amount, // Для отображения цифр урона (можно возвращать damageToDeal, если хотим показывать чистый урон по хп)
            isDead: this.isDead
        };
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    addShield(amount) {
        this.shield += amount;
    }
}
