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

    // 2. Игрок
    this.player = new Unit('player', 2, 6, 0x00ff00, 20);
    this.player.mana = 3;
    this.player.maxMana = 3;

    // 3. ПЕРВЫЙ ВРАГ (РАНДОМНЫЙ)
    const isGhost = Math.random() > 0.5;
    const type = isGhost ? 'ghost' : 'enemy';
    console.log(`Spawned first enemy: ${type}`);
    this.enemy = new Unit(type, 3, 1, 0xff0000, 30);
    this.enemy.mana = 0;

    this.gridManager.container.addChild(this.player.container);
    this.gridManager.container.addChild(this.enemy.container);

    // 4. UI
    this.ui = new UIManager(this);

    // 5. Колода
    this.deckManager = new DeckManager();
    this.deckManager.drawHand(5);

    this.selectedCardIndex = -1;
    this.isPlayerTurn = true;
    this.wave = 1;

    this.updateUI();
    this.centerGrid();
    window.addEventListener('resize', () => this.centerGrid());
  }

  startNewGame() {
    location.reload();
  }

  startNextLevel() {
    location.reload();
  }

  selectCard(index) {
    if (!this.isPlayerTurn) return;
    const hand = this.deckManager.hand;
    if (index < 0 || index >= hand.length) return;

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
      this.gridManager.highlightTiles([{ x: this.player.gridX, y: this.player.gridY }], 0x4444ff);
      return;
    }

    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        if (dist <= range && dist > 0) {
          tilesToHighlight.push({ x, y });
        }
      }
    }

    let color = 0xffffff;
    if (card.type === 'attack' || card.type === 'fireball' || card.type === 'strike' || card.type === 'smite') color = 0xff4444;
    if (card.type === 'move' || card.type === 'dash') color = 0x44ff44;
    if (card.type === 'heal') color = 0x4444ff;

    this.gridManager.highlightTiles(tilesToHighlight, color);
  }

  handleTileClick(x, y) {
    if (!this.isPlayerTurn) return;

    const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
    const isEnemyThere = x === this.enemy.gridX && y === this.enemy.gridY;
    const isPlayerThere = x === this.player.gridX && y === this.player.gridY;

    // А. ИСПОЛЬЗОВАНИЕ КАРТЫ
    if (this.selectedCardIndex !== -1) {
      const hand = this.deckManager.hand;
      const card = hand[this.selectedCardIndex];
      const range = card.range !== undefined ? card.range : 1;

      if (this.player.mana < card.cost) {
        console.log('No mana!');
        return;
      }

      let success = false;

      // АТАКА
      if ((card.type === 'attack' || card.type === 'fireball' || card.type === 'strike' || card.type === 'smite') && isEnemyThere) {
        if (dist <= range) {
          this.enemy.takeDamage(card.val);
          success = true;
        }
      }
      // ЛЕЧЕНИЕ
      else if (card.type === 'heal' && isPlayerThere) {
        this.player.takeDamage(-card.val);
        success = true;
      }
      // ДВИЖЕНИЕ
      else if ((card.type === 'move' || card.type === 'dash') && !isEnemyThere && !isPlayerThere) {
        if (dist <= range) {
          this.player.moveTo(x, y);
          success = true;
        }
      }

      if (success) {
        this.player.mana -= card.cost;
        this.deckManager.discardCard(this.selectedCardIndex);
        this.selectedCardIndex = -1;
        this.gridManager.resetHighlights();
        this.updateUI();
      }

      return;
    }

    // Б. ОБЫЧНЫЕ ДЕЙСТВИЯ (БЕЗ КАРТЫ)

    // 1. ДВИЖЕНИЕ
    if (dist === 1 && !isEnemyThere) {
      if (this.player.mana >= 1) {
        this.player.mana -= 1;
        this.player.moveTo(x, y);
        this.gridManager.resetHighlights();
        this.updateUI();
      } else {
        console.log('No mana to move!');
      }
    }
    // 2. АТАКА БЕЗ КАРТЫ ЗАПРЕЩЕНА
    else if (dist === 1 && isEnemyThere) {
      console.log('Need card to attack!');
    }
  }

  updateUI() {
    this.ui.updateStats(this.player, this.enemy);
    this.ui.renderHand(this.deckManager.hand);

    if (this.enemy.hp <= 0) {
      this.gridManager.container.removeChild(this.enemy.container);
      this.startNextWave();
      return;
    }

    if (this.player.hp <= 0) {
      this.ui.showGameOver(`DEFEAT (Wave ${this.wave})`);
      this.isPlayerTurn = false;
      this.ui.endTurnBtn.disabled = true;
      this.gridManager.resetHighlights();
      return;
    }

    this.ui.endTurnBtn.disabled = !this.isPlayerTurn;
    this.ui.endTurnBtn.innerText = this.isPlayerTurn ? 'END TURN' : 'ENEMY TURN...';
    this.ui.endTurnBtn.style.opacity = this.isPlayerTurn ? '1' : '0.5';
  }

  startNextWave() {
    this.wave++;
    console.log(`Starting Wave ${this.wave}`);

    const isGhost = Math.random() > 0.5;
    const type = isGhost ? 'ghost' : 'enemy';
    console.log(`Spawned wave enemy: ${type}`);

    const hp = 30 + (this.wave - 1) * 5;
    this.enemy = new Unit(type, 3, 1, 0xff0000, hp);
    this.enemy.maxHp = hp;
    this.gridManager.container.addChild(this.enemy.container);

    // Лечим игрока
    this.player.hp = Math.min(this.player.hp + 10, this.player.maxHp);
    this.player.updateHpText();

    this.ui.showWaveNotification(this.wave);
    this.updateUI();
    this.isPlayerTurn = true;
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

    const dist = Math.abs(this.enemy.gridX - this.player.gridX) + Math.abs(this.enemy.gridY - this.player.gridY);

    if (this.enemy.type === 'ghost') {
      // ПРИЗРАК: Кайтит и стреляет
      if (dist >= 3 && dist <= 5) {
        this.player.takeDamage(5);
        console.log('Ghost shoots!');
      } else if (dist < 3) {
        // Убегает
        let newX = this.enemy.gridX;
        let newY = this.enemy.gridY;

        if (this.player.gridX > this.enemy.gridX && this.enemy.gridX > 0) newX--;
        else if (this.player.gridX < this.enemy.gridX && this.enemy.gridX < GRID_W - 1) newX++;
        else if (this.player.gridY > this.enemy.gridY && this.enemy.gridY > 0) newY--;
        else if (this.player.gridY < this.enemy.gridY && this.enemy.gridY < GRID_H - 1) newY++;

        if (newX !== this.enemy.gridX || newY !== this.enemy.gridY) {
          this.enemy.moveTo(newX, newY);
        } else {
          this.player.takeDamage(3);
        }
      } else {
        this.moveEnemyTowardsPlayer();
      }
    } else {
      // СКЕЛЕТ: Бежит и бьет
      if (dist === 1) {
        this.player.takeDamage(8);
      } else {
        this.moveEnemyTowardsPlayer();
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
      this.deckManager.discardHand();
      this.deckManager.drawHand(5);
      this.updateUI();
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

    // Центрируем сетку
    container.x = (this.app.screen.width - width) / 2;
    container.y = (this.app.screen.height - height) / 2;
  }
}
