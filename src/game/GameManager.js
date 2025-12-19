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
        
        // 2. Создаем юнитов (Координаты для 6x8)
        this.player = new Unit('player', 2, 6, 0x00ff00, 20);
        this.player.mana = 3; 
        this.player.maxMana = 3;

        this.enemy = new Unit('enemy', 3, 1, 0xff0000, 30);
        this.enemy.mana = 0;
        
        this.gridManager.container.addChild(this.player.container);
        this.gridManager.container.addChild(this.enemy.container);

        // 3. UI и Рука
        this.ui = new UIManager(this);
        
        // Начальная колода
        this.hand = [
            { name: "Fireball", type: "attack", cost: 1, val: 5, range: 3, desc: "Deal 5 dmg (Range 3)", selected: false },
            { name: "Heal", type: "heal", cost: 1, val: 5, range: 0, desc: "Heal 5 HP", selected: false },
            { name: "Dash", type: "move", cost: 0, val: 3, range: 3, desc: "Move to tile (Range 3)", selected: false },
            { name: "Smite", type: "attack", cost: 2, val: 10, range: 2, desc: "Deal 10 dmg (Range 2)", selected: false }
        ];

        this.selectedCardIndex = -1;
        this.isPlayerTurn = true;

        this.updateUI();
        this.centerGrid();
        window.addEventListener('resize', () => this.centerGrid());
    }

    updateUI() {
        this.ui.updateStats(this.player, this.enemy);
        this.ui.renderHand(this.hand);
        
        // Проверка победы
        if (this.enemy.hp <= 0) {
            this.ui.showGameOver("VICTORY!");
            this.isPlayerTurn = false;
            this.ui.endTurnBtn.disabled = true;
            this.gridManager.resetHighlights();
            return;
        } 
        else if (this.player.hp <= 0) {
            this.ui.showGameOver("DEFEAT...");
            this.isPlayerTurn = false;
            this.ui.endTurnBtn.disabled = true;
            this.gridManager.resetHighlights();
            return;
        }

        this.ui.endTurnBtn.disabled = !this.isPlayerTurn;
        this.ui.endTurnBtn.innerText = this.isPlayerTurn ? "END TURN" : "ENEMY TURN...";
        this.ui.endTurnBtn.style.opacity = this.isPlayerTurn ? "1" : "0.5";
    }

    selectCard(index) {
        if (!this.isPlayerTurn) return;

        // Если кликнули на уже выбранную карту — отмена
        if (this.selectedCardIndex === index) {
            this.hand[index].selected = false;
            this.selectedCardIndex = -1;
            this.gridManager.resetHighlights(); // Сброс подсветки
        } else {
            // Сброс всех
            this.hand.forEach(c => c.selected = false);
            // Выбор новой
            this.hand[index].selected = true;
            this.selectedCardIndex = index;
            
            // ПОДСВЕТКА ЗОНЫ
            this.highlightCardRange(this.hand[index]);
        }
        this.updateUI();
    }

    highlightCardRange(card) {
        const tilesToHighlight = [];
        const range = card.range !== undefined ? card.range : 1;

        // Если это Heal — подсвечиваем только игрока
        if (card.type === 'heal') {
            this.gridManager.highlightTiles([{x: this.player.gridX, y: this.player.gridY}], 0x4444ff); // Синий
            return;
        }

        // Перебор всех клеток сетки
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
                
                // Если клетка в радиусе (и не мы сами)
                if (dist <= range && dist > 0) {
                    tilesToHighlight.push({x, y});
                }
            }
        }

        // Цвет подсветки
        let color = 0xffffff;
        if (card.type === 'attack') color = 0xff4444; // Красный
        if (card.type === 'move') color = 0x44ff44;   // Зеленый

        this.gridManager.highlightTiles(tilesToHighlight, color);
    }

    handleTileClick(x, y) {
        if (!this.isPlayerTurn) return;

        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);
        const isPlayerThere = (x === this.player.gridX && y === this.player.gridY);

        // А. ИСПОЛЬЗОВАНИЕ КАРТЫ
        if (this.selectedCardIndex !== -1) {
            const card = this.hand[this.selectedCardIndex];
            const range = card.range !== undefined ? card.range : 1;
            
            // 1. Проверка маны
            if (this.player.mana < card.cost) {
                console.log("Not enough mana!");
                return;
            }

            // 2. Применение
            let success = false;

            if (card.type === "attack" && isEnemyThere) {
                if (dist <= range) {
                    this.enemy.takeDamage(card.val);
                    success = true;
                } else {
                    console.log("Too far!");
                }
            } 
            else if (card.type === "heal" && isPlayerThere) {
                this.player.takeDamage(-card.val);
                success = true;
            }
            else if (card.type === "move" && !isEnemyThere && !isPlayerThere) {
                if (dist <= range) {
                    this.player.moveTo(x, y);
                    success = true;
                }
            }

            // 3. Успех
            if (success) {
                this.player.mana -= card.cost;
                this.hand.splice(this.selectedCardIndex, 1);
                this.selectedCardIndex = -1;
                this.gridManager.resetHighlights();
                this.updateUI();
            }
            return;
        }

        // Б. ОБЫЧНОЕ ДЕЙСТВИЕ
        if (dist === 1 && !isEnemyThere) {
            this.player.moveTo(x, y);
            this.gridManager.resetHighlights();
        } 
        else if (dist === 1 && isEnemyThere) {
            this.enemy.takeDamage(3);
            this.gridManager.resetHighlights();
            this.updateUI();
        }
    }

    endTurn() {
        if (!this.isPlayerTurn) return;
        
        this.isPlayerTurn = false;
        this.selectedCardIndex = -1;
        this.hand.forEach(c => c.selected = false);
        this.gridManager.resetHighlights(); // Сброс
        this.updateUI();

        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        if (this.enemy.hp <= 0) return;

        const dist = Math.abs(this.enemy.gridX - this.player.gridX) + Math.abs(this.enemy.gridY - this.player.gridY);

        if (dist === 1) {
            this.player.takeDamage(6);
            console.log("Enemy attacks!");
        } else {
            let newX = this.enemy.gridX;
            let newY = this.enemy.gridY;

            if (this.player.gridX > this.enemy.gridX) newX++;
            else if (this.player.gridX < this.enemy.gridX) newX--;
            else if (this.player.gridY > this.enemy.gridY) newY++;
            else if (this.player.gridY < this.enemy.gridY) newY--;

            if (!(newX === this.player.gridX && newY === this.player.gridY)) {
                this.enemy.moveTo(newX, newY);
            }
        }

        this.updateUI();

        setTimeout(() => {
            if (this.player.hp <= 0) {
                this.updateUI();
                return;
            }

            this.isPlayerTurn = true;
            this.player.mana = this.player.maxMana;
            if (this.hand.length < 5) {
                this.hand.push({ name: "Strike", type: "attack", cost: 1, val: 6, range: 1, desc: "Deal 6 dmg", selected: false });
            }
            
            this.updateUI();
        }, 800);
    }

    centerGrid() {
        const container = this.gridManager.container;
        const width = GRID_W * TILE_SIZE;
        const height = GRID_H * TILE_SIZE;
        
        container.x = (this.app.screen.width - width) / 2;
        // Сдвигаем вверх на 50px
        container.y = (this.app.screen.height - height) / 2 - 50;
    }
}
