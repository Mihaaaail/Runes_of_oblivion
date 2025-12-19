import { GridManager } from '../grid/GridManager';
import { Unit } from '../units/Unit';
import { UIManager } from '../ui/UIManager';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GameManager {
    constructor(app) {
        this.app = app;
        
        // 1. Создаем сетку
        this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));
        
        // 2. Создаем игрока (добавляем ману)
        this.player = new Unit('player', 1, 6, 0x00ff00, 20);
        this.player.mana = 3; 
        this.player.maxMana = 3;

        // 3. Создаем врага
        this.enemy = new Unit('enemy', 2, 1, 0xff0000, 30);
        
        // Добавляем их на сцену
        this.gridManager.container.addChild(this.player.container);
        this.gridManager.container.addChild(this.enemy.container);

        // 4. Инициализируем UI
        this.ui = new UIManager(this);
        
        // Тестовая рука (пока хардкод)
        this.hand = [
            { name: "Fireball", cost: 1, desc: "Deal 5 dmg", selected: false },
            { name: "Heal", cost: 1, desc: "Heal 4 hp", selected: false },
            { name: "Dash", cost: 0, desc: "Move 2", selected: false }
        ];

        this.selectedCardIndex = -1; // Ничего не выбрано

        // Обновляем всё
        this.updateUI();
        this.centerGrid();
        
        // Ресайз
        window.addEventListener('resize', () => this.centerGrid());
    }

    updateUI() {
        this.ui.updateStats(this.player, this.enemy);
        this.ui.renderHand(this.hand);
    }

    selectCard(index) {
        // Если кликнули на уже выбранную карту — снимаем выделение
        if (this.selectedCardIndex === index) {
            this.hand[index].selected = false;
            this.selectedCardIndex = -1;
        } else {
            // Снимаем выделение со всех остальных
            this.hand.forEach(c => c.selected = false);
            
            // Выделяем новую
            this.hand[index].selected = true;
            this.selectedCardIndex = index;
        }
        
        this.updateUI();
        console.log("Selected card index:", this.selectedCardIndex);
    }

    handleTileClick(x, y) {
        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);

        // Если есть выбранная карта — применяем её (пока заглушка)
        if (this.selectedCardIndex !== -1) {
            console.log(`Trying to use card ${this.hand[this.selectedCardIndex].name} on ${x},${y}`);
            // Тут позже будет логика карты
            return;
        }

        // Обычное движение / атака
        if (dist === 1 && !isEnemyThere) {
            this.player.moveTo(x, y);
        } else if (dist === 1 && isEnemyThere) {
            this.enemy.takeDamage(5);
            this.updateUI(); // Обновляем UI (ХП врага)
        }
    }

    centerGrid() {
        const container = this.gridManager.container;
        const width = GRID_W * TILE_SIZE;
        const height = GRID_H * TILE_SIZE;
        
        container.x = (this.app.screen.width - width) / 2;
        container.y = (this.app.screen.height - height) / 2;
    }
}
