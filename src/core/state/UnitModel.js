export class UnitModel {
    constructor(data) {
        this.id = data.id;
        this.type = data.type; // 'player', 'skeleton', 'turret'
        this.team = data.team; // 0 = Player, 1 = Enemy
        
        // Позиция
        this.x = data.x;
        this.y = data.y;

        // Статы
        this.maxHp = data.hp;
        this.hp = data.hp;
        this.maxMana = data.maxMana || 3;
        this.mana = data.mana || 3;
        this.movePoints = 3; // Очки движения за ход

        // Состояния
        this.isDead = false;
        this.shield = 0; // Временное HP
        this.buffs = []; // [{ type: 'freeze', duration: 2 }]
        
        // Для ИИ
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
