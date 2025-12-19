import { GridManager } from '../grid/GridManager';
import { Unit } from '../units/Unit';
import { UIManager } from '../ui/UIManager';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';
import gsap from 'gsap';

export class GameManager {
    constructor(app) {
        this.app = app;
        
        // 1. Создаем сетку
        this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));
        
        // 2. Создаем юнитов
        this.player = new Unit('player', 1, 6, 0x00ff00, 20);
        this.player.mana = 3; 
        this.player.maxMana = 3;

        this.enemy = new Unit('enemy', 2, 1, 0xff0000, 30);
        this.enemy.mana = 0; // Врагу мана пока не нужна
        
        this.gridManager.container.addChild(this.player.container);
        this.gridManager.container.addChild(this.enemy.container);

        // 3. UI и Рука
        this.ui = new UIManager(this);
        
        // Начальная колода (бесконечная)
        this.hand = [
            { name: "Fireball", type: "attack", cost: 1, val: 5, desc: "Deal 5 dmg (Range 3)", selected: false },
            { name: "Heal", type: "heal", cost: 1, val: 5, desc: "Heal 5 HP", selected: false },
            { name: "Dash", type: "move", cost: 0, val: 3, desc: "Move to tile", selected: false },
            { name: "Smite", type: "attack", cost: 2, val: 10, desc: "Deal 10 dmg (Range 2)", selected: false }
        ];

        this.selectedCardIndex = -1;
        this.isPlayerTurn = true; // Чей ход?

        this.updateUI();
        this.centerGrid();
        window.addEventListener('resize', () => this.centerGrid());
    }

    updateUI() {
        this.ui.updateStats(this.player, this.enemy);
        this.ui.renderHand(this.hand);
        
        // Если ход врага — блокируем кнопку
        this.ui.endTurnBtn.disabled = !this.isPlayerTurn;
        this.ui.endTurnBtn.innerText = this.isPlayerTurn ? "END TURN" : "ENEMY TURN...";
        this.ui.endTurnBtn.style.opacity = this.isPlayerTurn ? "1" : "0.5";
    }

    selectCard(index) {
        if (!this.isPlayerTurn) return; // Нельзя выбирать в чужой ход

        // Логика переключения выделения
        if (this.selectedCardIndex === index) {
            this.hand[index].selected = false;
            this.selectedCardIndex = -1;
        } else {
            this.hand.forEach(c => c.selected = false);
            this.hand[index].selected = true;
            this.selectedCardIndex = index;
        }
        this.updateUI();
    }

    handleTileClick(x, y) {
        if (!this.isPlayerTurn) return;

        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);
        const isPlayerThere = (x === this.player.gridX && y === this.player.gridY);

        // А. ИСПОЛЬЗОВАНИЕ КАРТЫ
        if (this.selectedCardIndex !== -1) {
            const card = this.hand[this.selectedCardIndex];
            
            // 1. Проверка маны
            if (this.player.mana < card.cost) {
                console.log("Not enough mana!");
                // Можно добавить визуальную тряску UI
                return;
            }

            // 2. Применение по типам
            let success = false;

            if (card.type === "attack" && isEnemyThere) {
                // Проверка дистанции (условно 3 клетки)
                if (dist <= 3) {
                    this.enemy.takeDamage(card.val);
                    success = true;
                } else {
                    console.log("Too far!");
                }
            } 
            else if (card.type === "heal" && isPlayerThere) {
                this.player.takeDamage(-card.val); // Отрицательный урон = хил
                success = true;
            }
            else if (card.type === "move" && !isEnemyThere && !isPlayerThere) {
                if (dist <= card.val) {
                    this.player.moveTo(x, y);
                    success = true;
                }
            }

            // 3. Если карта сработала
            if (success) {
                this.player.mana -= card.cost;
                this.hand.splice(this.selectedCardIndex, 1); // Удаляем карту
                this.selectedCardIndex = -1;
                this.updateUI();
            }
            return;
        }

        // Б. ОБЫЧНОЕ ДЕЙСТВИЕ (без карты)
        // Движение (1 клетка)
        if (dist === 1 && !isEnemyThere) {
            this.player.moveTo(x, y);
        } 
        // Атака (в упор)
        else if (dist === 1 && isEnemyThere) {
            this.enemy.takeDamage(3); // Базовая атака слабее карт
            this.updateUI();
        }
    }

    endTurn() {
        if (!this.isPlayerTurn) return;
        
        this.isPlayerTurn = false;
        this.selectedCardIndex = -1;
        this.hand.forEach(c => c.selected = false);
        this.updateUI();

        // Запускаем ход врага с задержкой
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        // Простой AI: Иди к игроку и бей
        const dist = Math.abs(this.enemy.gridX - this.player.gridX) + Math.abs(this.enemy.gridY - this.player.gridY);

        if (dist === 1) {
            // Если рядом — кусь
            this.player.takeDamage(6);
            console.log("Enemy attacks!");
        } else {
            // Если далеко — шаг навстречу
            let newX = this.enemy.gridX;
            let newY = this.enemy.gridY;

            if (this.player.gridX > this.enemy.gridX) newX++;
            else if (this.player.gridX < this.enemy.gridX) newX--;
            else if (this.player.gridY > this.enemy.gridY) newY++;
            else if (this.player.gridY < this.enemy.gridY) newY--;

            // Проверка, не занято ли игроком
            if (!(newX === this.player.gridX && newY === this.player.gridY)) {
                this.enemy.moveTo(newX, newY);
            }
        }

        this.updateUI();

        // Конец хода врага
        setTimeout(() => {
            this.isPlayerTurn = true;
            
            // Восстановление маны + Новая карта
            this.player.mana = this.player.maxMana;
            if (this.hand.length < 5) {
                this.hand.push({ name: "Strike", type: "attack", cost: 1, val: 6, desc: "Deal 6 dmg", selected: false });
            }
            
            this.updateUI();
        }, 800);
    }

    centerGrid() {
        const container = this.gridManager.container;
        const width = GRID_W * TILE_SIZE;
        const height = GRID_H * TILE_SIZE;
        
        container.x = (this.app.screen.width - width) / 2;
        container.y = (this.app.screen.height - height) / 2;
    }
}
