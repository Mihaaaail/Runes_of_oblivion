import { GridManager } from '../grid/GridManager';
import { Unit } from '../units/Unit';
import { UIManager } from '../ui/UIManager';
import { DeckManager } from './DeckManager';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';
import gsap from 'gsap';

export class GameManager {
    constructor(app) {
        this.app = app;
        
        // 1. Сетка
        this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));
        
        // 2. Юниты
        this.player = new Unit('player', 2, 6, 0x00ff00, 20);
        this.player.mana = 3; 
        this.player.maxMana = 3;

        this.enemy = new Unit('enemy', 3, 1, 0xff0000, 30);
        this.enemy.mana = 0;
        
        this.gridManager.container.addChild(this.player.container);
        this.gridManager.container.addChild(this.enemy.container);

        // 3. UI
        this.ui = new UIManager(this);
        
        // 4. Колода
        this.deckManager = new DeckManager();
        this.deckManager.drawHand(5); // Стартовая рука - 5 карт

        this.selectedCardIndex = -1;
        this.isPlayerTurn = true;

        this.updateUI();
        this.centerGrid();
        window.addEventListener('resize', () => this.centerGrid());
    }

    updateUI() {
        this.ui.updateStats(this.player, this.enemy);
        // Берем руку из менеджера колоды
        this.ui.renderHand(this.deckManager.hand);
        
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
        this.updateUI();
    }

    highlightCardRange(card) {
        const tilesToHighlight = [];
        const range = card.range !== undefined ? card.range : 1;

        if (card.type === 'heal') {
            this.gridManager.highlightTiles([{x: this.player.gridX, y: this.player.gridY}], 0x4444ff);
            return;
        }

        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
                if (dist <= range && dist > 0) {
                    tilesToHighlight.push({x, y});
                }
            }
        }
        
        let color = 0xffffff;
        if (card.type === 'attack') color = 0xff4444; 
        if (card.type === 'move') color = 0x44ff44;  
        this.gridManager.highlightTiles(tilesToHighlight, color);
    }

    handleTileClick(x, y) {
        if (!this.isPlayerTurn) return;

        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);
        const isPlayerThere = (x === this.player.gridX && y === this.player.gridY);

        // А. КАРТА
        if (this.selectedCardIndex !== -1) {
            const hand = this.deckManager.hand;
            const card = hand[this.selectedCardIndex];
            const range = card.range !== undefined ? card.range : 1;
            
            if (this.player.mana < card.cost) {
                console.log("Not enough mana!");
                return;
            }

            let success = false;

            if (card.type === "attack" && isEnemyThere) {
                if (dist <= range) {
                    this.enemy.takeDamage(card.val);
                    success = true;
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

            if (success) {
                this.player.mana -= card.cost;
                // Сбрасываем карту в дискард
                this.deckManager.discardCard(this.selectedCardIndex);
                
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
        this.deckManager.hand.forEach(c => c.selected = false);
        this.gridManager.resetHighlights();
        this.updateUI();

        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        if (this.enemy.hp <= 0) return;

        // Простой AI
        const dist = Math.abs(this.enemy.gridX - this.player.gridX) + Math.abs(this.enemy.gridY - this.player.gridY);

        if (dist === 1) {
            this.player.takeDamage(6);
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
            
            // СБРОС И НОВАЯ РУКА
            this.deckManager.discardHand();
            this.deckManager.drawHand(5);
            
            this.updateUI();
        }, 800);
    }

    centerGrid() {
        const container = this.gridManager.container;
        const width = GRID_W * TILE_SIZE;
        const height = GRID_H * TILE_SIZE;
        container.x = (this.app.screen.width - width) / 2;
        container.y = (this.app.screen.height - height) / 2 - 50;
    }
}
