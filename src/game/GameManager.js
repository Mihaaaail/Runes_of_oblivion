import { GridManager } from '../grid/GridManager';
import { Unit } from '../units/Unit';
import { UIManager } from '../ui/UIManager';
import { DeckManager } from './DeckManager';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GameManager {
    constructor(app) {
        this.app = app;
        this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));
        
        this.deckManager = new DeckManager();
        this.ui = new UIManager(this);

        this.player = null;
        this.enemy = null;
        this.floor = 0;
        
        this.centerGrid();
        window.addEventListener('resize', () => this.centerGrid());

        // Сразу показываем меню
        this.ui.showMenu();
    }

    // --- УПРАВЛЕНИЕ ПОТОКОМ ИГРЫ ---

    startNewGame() {
        this.floor = 0;
        this.deckManager.initializeDeck(); // Сброс колоды
        
        // Создаем игрока заново
        if (this.player) this.gridManager.container.removeChild(this.player.container);
        this.player = new Unit('player', 2, 6, 0x00ff00, 20);
        this.player.maxMana = 3;
        this.player.mana = 3;
        this.gridManager.container.addChild(this.player.container);

        this.startNextLevel();
    }

    startNextLevel() {
        this.floor++;
        this.cleanupLevel(); // Убираем старого врага
        this.spawnEnemy();
        
        // Восстанавливаем ману, лечим немного за проход этажа
        this.player.mana = this.player.maxMana;
        this.player.hp = Math.min(this.player.hp + 5, this.player.maxHp);
        this.player.updateHpText();

        this.deckManager.discardHand();
        this.deckManager.drawHand(5);

        this.isPlayerTurn = true;
        this.selectedCardIndex = -1;
        
        this.ui.showGame();
        this.updateUI();
    }

    cleanupLevel() {
        if (this.enemy) {
            this.gridManager.container.removeChild(this.enemy.container);
            this.enemy = null;
        }
        this.gridManager.resetHighlights();
    }

    spawnEnemy() {
        // Логика сложности: чем выше этаж, тем сильнее враг
        const isGhost = Math.random() > 0.5; // 50/50
        const type = isGhost ? 'ghost' : 'enemy';
        
        const baseHp = 25;
        const hpGrowth = (this.floor - 1) * 5;
        
        // Враг спавнится в случайной верхней позиции
        const spawnX = Math.floor(Math.random() * GRID_W);
        const spawnY = Math.floor(Math.random() * 2); // 0 или 1 ряд

        this.enemy = new Unit(type, spawnX, spawnY, 0xff0000, baseHp + hpGrowth);
        this.gridManager.container.addChild(this.enemy.container);
    }

    // --- ИГРОВОЙ ЦИКЛ (Старый код с правками) ---

    updateUI() {
        if (!this.player) return;
        this.ui.updateStats(this.player, this.enemy);
        this.ui.renderHand(this.deckManager.hand);
        
        // Победа
        if (this.enemy && this.enemy.hp <= 0) {
            this.ui.showLevelComplete(this.floor);
            return;
        } 
        
        // Поражение
        if (this.player.hp <= 0) {
            this.ui.showGameOver(`Slain by ${this.enemy.type.toUpperCase()} on Floor ${this.floor}`);
            return;
        }

        this.ui.endTurnBtn.disabled = !this.isPlayerTurn;
        this.ui.endTurnBtn.innerText = this.isPlayerTurn ? "END TURN" : "ENEMY ACTING...";
        this.ui.endTurnBtn.style.opacity = this.isPlayerTurn ? "1" : "0.5";
    }

    selectCard(index) {
        if (!this.isPlayerTurn) return;
        const hand = this.deckManager.hand;
        if (this.selectedCardIndex === index) {
            hand[index].selected = false;
            this.selectedCardIndex = -1;
            this.gridManager.resetHighlights();
        } else {
            hand.forEach(c => c.selected = false);
            hand[index].selected = true;
            this.selectedCardIndex = index;
            this.highlightCardRange(hand[index]);
        }
        this.ui.renderHand(hand); // Обновляем визуал выбора
    }

    highlightCardRange(card) {
        // ... (Без изменений: твой код из прошлого шага)
        // Вставь сюда тот код highlightCardRange, который мы сделали для Fireball/Push
        // --- COPY PASTE START ---
        const tilesToHighlight = [];
        const range = card.range !== undefined ? card.range : 1;

        if (card.type === 'heal') {
            this.gridManager.highlightTiles([{x: this.player.gridX, y: this.player.gridY}], 0x4444ff);
            return;
        }
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
                if (dist <= range && dist > 0) tilesToHighlight.push({x, y});
            }
        }
        let color = 0xffffff;
        if (card.type === 'attack') color = 0xff4444; 
        if (card.type === 'fireball') color = 0xff8800; 
        if (card.type === 'push') color = 0x00ffff; 
        if (card.type === 'move') color = 0x44ff44;  
        this.gridManager.highlightTiles(tilesToHighlight, color);
        // --- COPY PASTE END ---
    }

    handleTileClick(x, y) {
        if (!this.isPlayerTurn || !this.enemy) return;

        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);
        const isPlayerThere = (x === this.player.gridX && y === this.player.gridY);

        if (this.selectedCardIndex !== -1) {
            const hand = this.deckManager.hand;
            const card = hand[this.selectedCardIndex];
            const range = card.range !== undefined ? card.range : 1;
            
            if (this.player.mana < card.cost) return;

            let success = false;
            // ... (Вставь сюда логику карт из прошлого шага: Attack, Fireball, Push, Heal, Move)
            // --- COPY PASTE LOGIC START ---
            if ((card.type === "attack" || card.type === "fireball") && isEnemyThere) {
                if (dist <= range) {
                    this.enemy.takeDamage(card.val);
                    success = true;
                }
            } else if (card.type === "push" && isEnemyThere) {
                if (dist <= range) {
                    const dx = this.enemy.gridX - this.player.gridX;
                    const dy = this.enemy.gridY - this.player.gridY;
                    let targetX = this.enemy.gridX + dx;
                    let targetY = this.enemy.gridY + dy;
                    if (targetX >= 0 && targetX < GRID_W && targetY >= 0 && targetY < GRID_H) {
                        this.enemy.moveTo(targetX, targetY);
                        this.enemy.takeDamage(2);
                    } else {
                        this.enemy.takeDamage(5);
                    }
                    success = true;
                }
            } else if (card.type === "heal" && isPlayerThere) {
                this.player.takeDamage(-card.val);
                success = true;
            } else if (card.type === "move" && !isEnemyThere && !isPlayerThere) {
                if (dist <= range) {
                    this.player.moveTo(x, y);
                    success = true;
                }
            }
            // --- COPY PASTE LOGIC END ---

            if (success) {
                this.player.mana -= card.cost;
                this.deckManager.discardCard(this.selectedCardIndex);
                this.selectedCardIndex = -1;
                this.gridManager.resetHighlights();
                this.updateUI();
            }
            return;
        }

        // Обычное движение без карты
        if (dist === 1 && !isEnemyThere && this.player.mana >= 1) {
            this.player.mana -= 1;
            this.player.moveTo(x, y);
            this.updateUI();
        }
    }

    endTurn() {
        if (!this.isPlayerTurn) return;
        this.isPlayerTurn = false;
        this.selectedCardIndex = -1;
        this.gridManager.resetHighlights();
        this.deckManager.hand.forEach(c => c.selected = false); // Сброс визуального выделения
        this.updateUI();

        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        if (!this.enemy || this.enemy.hp <= 0) return;
        
        // ... (Тут оставь наш крутой AI для Призрака и Скелета)
        // Я сокращу для примера, но ты оставь полную версию
        const dist = Math.abs(this.enemy.gridX - this.player.gridX) + Math.abs(this.enemy.gridY - this.player.gridY);
        
        if (this.enemy.type === 'ghost') {
             // ... Вставь логику призрака (стрельба/бегство)
             if (dist >= 3 && dist <= 5) this.player.takeDamage(5);
             else if (dist < 3) {/* Бегство */} 
             else this.moveEnemyTowardsPlayer();
        } else {
             // Скелет
             if (dist === 1) this.player.takeDamage(8);
             else this.moveEnemyTowardsPlayer();
        }

        this.updateUI();

        setTimeout(() => {
            if (this.player.hp > 0) {
                this.isPlayerTurn = true;
                this.player.mana = this.player.maxMana;
                this.deckManager.discardHand();
                this.deckManager.drawHand(5);
                this.updateUI();
            } else {
                this.updateUI(); // Триггер Game Over
            }
        }, 800);
    }

    moveEnemyTowardsPlayer() {
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

    centerGrid() {
        const container = this.gridManager.container;
        const width = GRID_W * TILE_SIZE;
        const height = GRID_H * TILE_SIZE;
        container.x = (this.app.screen.width - width) / 2;
        container.y = (this.app.screen.height - height) / 2 - 50;
    }
}
