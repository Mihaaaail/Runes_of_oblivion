import { GridManager } from '../grid/GridManager';
import { Unit } from '../units/Unit';
import { UIManager } from '../ui/UIManager';
import { DeckManager } from './DeckManager';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GameManager {
  constructor(app) {
    this.app = app;

    this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));

    this.player = new Unit('player', 2, 6, 0x00ff00, 20);
    this.player.mana = 3;
    this.player.maxMana = 3;

    this.ui = new UIManager(this);

    this.deckManager = new DeckManager();
    this.deckManager.drawHand(5);

    this.selectedCardIndex = -1;
    this.isPlayerTurn = true;

    this.wave = 0;
    this.spawnEnemy();

    this.gridManager.container.addChild(this.player.container);
    this.gridManager.container.addChild(this.enemy.container);

    this.spawnEnvironment();

    this.updateUI();
    this.centerGrid();
    window.addEventListener('resize', () => this.centerGrid());
  }

  spawnEnemy() {
    this.wave += 1;

    const isGhost = Math.random() > 0.5;
    const type = isGhost ? 'ghost' : 'enemy';
    const hp = 30 + (this.wave - 1) * 5;

    this.enemy = new Unit(type, 3, 1, 0xff0000, hp);
    this.enemy.mana = 0;
    this.enemy.maxHp = hp;
  }

  spawnEnvironment() {
    this.gridManager.clearObstacles();

    // 3 стены
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * GRID_W);
      const y = Math.floor(Math.random() * GRID_H);

      if ((x === this.player.gridX && y === this.player.gridY) ||
          (x === this.enemy.gridX && y === this.enemy.gridY)) continue;

      this.gridManager.addObstacle(x, y, 'wall');
    }

    // 1 алтарь
    const sx = Math.floor(Math.random() * GRID_W);
    const sy = Math.floor(Math.random() * GRID_H);

    if (!(sx === this.player.gridX && sy === this.player.gridY) &&
        !(sx === this.enemy.gridX && sy === this.enemy.gridY) &&
        !this.gridManager.isObstacleAt(sx, sy)) {
      this.gridManager.addObstacle(sx, sy, 'shrine');
    }
  }

  updateUI() {
    this.ui.updateStats(this.player, this.enemy);
    this.ui.renderHand(this.deckManager.hand);

    if (this.ui.endTurnBtn) {
      this.ui.endTurnBtn.disabled = !this.isPlayerTurn;
      this.ui.endTurnBtn.innerText = this.isPlayerTurn ? 'END TURN' : 'ENEMY TURN...';
      this.ui.endTurnBtn.style.opacity = this.isPlayerTurn ? '1' : '0.5';
    }
  }

  selectCard(index) {
    if (!this.isPlayerTurn) return;

    const hand = this.deckManager.hand;
    if (!hand || index < 0 || index >= hand.length) return;

    if (this.selectedCardIndex === index) {
      hand[index].selected = false;
      this.selectedCardIndex = -1;
      this.gridManager.resetHighlights();
    } else {
      hand.forEach(c => (c.selected = false));
      hand[index].selected = true;
      this.selectedCardIndex = index;
      this.highlightCardRange(hand[index]);
    }

    this.updateUI();
  }

  highlightCardRange(card) {
    const range = card.range ?? 1;

    if (card.type === 'heal') {
      this.gridManager.highlightTiles([{ x: this.player.gridX, y: this.player.gridY }], 0x4444ff);
      return;
    }

    // MOVE: подсвечиваем только достижимые клетки (BFS), а не манхэттен-дистанцию
    if (card.type === 'move') {
      const reachable = this.gridManager.getReachableTiles(this.player.gridX, this.player.gridY, range);
      this.gridManager.highlightTiles(reachable.map(p => ({ x: p.x, y: p.y })), 0x44ff44);
      return;
    }

    // ATTACK и прочее: пока просто по манхэттену
    const tilesToHighlight = [];
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);
        if (dist <= range && dist > 0) tilesToHighlight.push({ x, y });
      }
    }
    this.gridManager.highlightTiles(tilesToHighlight, 0xff4444);
  }

  handleTileClick(x, y) {
    if (!this.isPlayerTurn) return;

    const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);
    const isPlayerThere = (x === this.player.gridX && y === this.player.gridY);

    const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);

    // --- если выбрана карта ---
    if (this.selectedCardIndex !== -1) {
      const hand = this.deckManager.hand;
      const card = hand[this.selectedCardIndex];
      const range = card.range ?? 1;

      if (this.player.mana < card.cost) return;

      let success = false;

      if (card.type === 'attack' && isEnemyThere && dist <= range) {
        this.enemy.takeDamage(card.val);
        success = true;
      } else if (card.type === 'heal' && isPlayerThere) {
        this.player.takeDamage(-card.val);
        success = true;
      } else if (card.type === 'move' && !isEnemyThere && !isPlayerThere) {
        // ВАЖНО: проверяем достижимость по пути, а не только dist
        if (this.gridManager.isReachableWithin(this.player.gridX, this.player.gridY, x, y, range)) {
          this.movePlayerTo(x, y);
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

    // --- обычное движение ---
    if (dist === 1 && !isEnemyThere && this.gridManager.isWalkable(x, y)) {
      if (this.player.mana >= 1) {
        this.player.mana -= 1;
        this.movePlayerTo(x, y);
        this.gridManager.resetHighlights();
        this.updateUI();
      }
    }
  }

  movePlayerTo(x, y) {
    this.player.moveTo(x, y);

    const obs = this.gridManager.isObstacleAt(x, y);
    if (obs && obs.type === 'shrine') {
      this.player.takeDamage(-10);
      this.gridManager.removeObstacle(x, y);
    }
  }

  endTurn() {
    if (!this.isPlayerTurn) return;

    this.isPlayerTurn = false;

    this.selectedCardIndex = -1;
    this.deckManager.hand.forEach(c => (c.selected = false));
    this.gridManager.resetHighlights();

    this.updateUI();
    setTimeout(() => this.enemyTurn(), 600);
  }

  enemyTurn() {
  if (this.enemy.hp <= 0) return;

  const dist =
    Math.abs(this.enemy.gridX - this.player.gridX) +
    Math.abs(this.enemy.gridY - this.player.gridY);

  if (this.enemy.type === 'ghost') {
    // Стреляет на дистанции 3..5
    if (dist >= 3 && dist <= 5) {
      this.player.takeDamage(5);
      this.updateUI();
    } else if (dist < 3) {
      // Уходит от игрока
      this.ghostStep(/*away=*/true);
      this.updateUI();
    } else {
      // Сближается, если слишком далеко
      this.moveEnemyTowardsPlayer();
      this.updateUI();
    }
  } else {
    // Скелет/обычный враг
    if (dist === 1) {
      this.player.takeDamage(8);
    } else {
      this.moveEnemyTowardsPlayer();
    }
    this.updateUI();
  }

  setTimeout(() => {
    if (this.player.hp <= 0) {
      this.ui.showGameOver(`DEFEAT (Wave ${this.wave})`);
      return;
    }

    this.isPlayerTurn = true;
    this.player.mana = this.player.maxMana;

    this.deckManager.discardHand();
    this.deckManager.drawHand(5);

    this.updateUI();
  }, 800);
}

// Выбор шага для призрака: away=true — увеличиваем дистанцию, иначе уменьшаем
ghostStep(away) {
  const opts = [
    { x: this.enemy.gridX + 1, y: this.enemy.gridY },
    { x: this.enemy.gridX - 1, y: this.enemy.gridY },
    { x: this.enemy.gridX, y: this.enemy.gridY + 1 },
    { x: this.enemy.gridX, y: this.enemy.gridY - 1 },
  ];

  let best = null;
  let bestScore = away ? -Infinity : Infinity;

  for (const p of opts) {
    if (!this.gridManager.isWalkable(p.x, p.y)) continue;
    if (p.x === this.player.gridX && p.y === this.player.gridY) continue;

    const d =
      Math.abs(p.x - this.player.gridX) +
      Math.abs(p.y - this.player.gridY);

    if (away) {
      if (d > bestScore) { bestScore = d; best = p; }
    } else {
      if (d < bestScore) { bestScore = d; best = p; }
    }
  }

  if (best) this.enemy.moveTo(best.x, best.y);
}


  moveEnemyTowardsPlayer() {
    let newX = this.enemy.gridX;
    let newY = this.enemy.gridY;

    if (this.player.gridX > this.enemy.gridX) newX++;
    else if (this.player.gridX < this.enemy.gridX) newX--;
    else if (this.player.gridY > this.enemy.gridY) newY++;
    else if (this.player.gridY < this.enemy.gridY) newY--;

    if (newX === this.player.gridX && newY === this.player.gridY) return;
    if (!this.gridManager.isWalkable(newX, newY)) return;

    this.enemy.moveTo(newX, newY);
  }

  centerGrid() {
    const container = this.gridManager.container;
    const width = GRID_W * TILE_SIZE;
    const height = GRID_H * TILE_SIZE;

    container.x = (this.app.screen.width - width) / 2;
    container.y = (this.app.screen.height - height) / 2;
  }
}
