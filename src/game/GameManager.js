import { GridManager } from '../grid/GridManager';
import { Unit } from '../units/Unit';
import { UIManager } from '../ui/UIManager';
import { DeckManager } from './DeckManager';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

const GameState = Object.freeze({
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN: 'ENEMY_TURN',
  WAVE_CLEAR: 'WAVE_CLEAR',
  GAME_OVER: 'GAME_OVER',
});

export class GameManager {
  constructor(app) {
    this.app = app;

    this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));

    const px = Math.floor(GRID_W / 2);
    const py = Math.max(0, GRID_H - 2); // безопасно при любой высоте
    this.player = new Unit('player', px, py, 0x00ff00, 20);
    this.player.mana = 3;
    this.player.maxMana = 3;

    this.ui = new UIManager(this);

    this.deckManager = new DeckManager();
    this.deckManager.drawHand(5);

    this.selectedCardIndex = -1;

    this.state = GameState.PLAYER_TURN;
    this.isPlayerTurn = true;
    this._timers = new Set();

    this.wave = 0;
    this.enemy = null;

    this.gridManager.container.addChild(this.player.container);

    this.startNextWave();

    this.centerGrid();
    window.addEventListener('resize', () => this.centerGrid());
  }

  // ---------------- timers/state ----------------

  setState(s) { this.state = s; }

  isInputAllowed() { return this.state === GameState.PLAYER_TURN; }

  schedule(fn, ms) {
    const id = setTimeout(() => {
      this._timers.delete(id);
      fn();
    }, ms);
    this._timers.add(id);
    return id;
  }

  clearTimers() {
    for (const id of this._timers) clearTimeout(id);
    this._timers.clear();
  }

  // ---------------- wave ----------------

  startNextWave() {
    if (this.state === GameState.GAME_OVER) return;

    this.wave += 1;

    if (this.enemy && this.enemy.container && this.enemy.container.parent) {
      this.gridManager.container.removeChild(this.enemy.container);
    }

    this.gridManager.clearObstacles();

    const isGhost = Math.random() > 0.5;
    const type = isGhost ? 'ghost' : 'enemy';
    const hp = 30 + (this.wave - 1) * 5;

    const ex = Math.floor(GRID_W / 2);
    const ey = 1;

    this.enemy = new Unit(type, ex, ey, 0xff0000, hp);
    this.enemy.maxHp = hp;
    this.enemy.mana = 0;

    this.gridManager.container.addChild(this.enemy.container);

    this.spawnEnvironment();

    if (this.ui.showWaveNotification) this.ui.showWaveNotification(this.wave);

    this.beginPlayerTurn(false);
  }

  spawnEnvironment() {
    // стены
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * GRID_W);
      const y = Math.floor(Math.random() * GRID_H);

      if ((x === this.player.gridX && y === this.player.gridY) ||
          (x === this.enemy.gridX && y === this.enemy.gridY)) continue;

      this.gridManager.addObstacle(x, y, 'wall');
    }

    // алтарь
    const sx = Math.floor(Math.random() * GRID_W);
    const sy = Math.floor(Math.random() * GRID_H);

    if (!(sx === this.player.gridX && sy === this.player.gridY) &&
        !(sx === this.enemy.gridX && sy === this.enemy.gridY) &&
        !this.gridManager.isObstacleAt(sx, sy)) {
      this.gridManager.addObstacle(sx, sy, 'shrine');
    }
  }

  beginPlayerTurn(redrawHand = true) {
    if (this.state === GameState.GAME_OVER) return;

    this.setState(GameState.PLAYER_TURN);
    this.isPlayerTurn = true;

    this.player.mana = this.player.maxMana;

    this.selectedCardIndex = -1;
    this.deckManager.hand.forEach(c => (c.selected = false));
    this.gridManager.resetHighlights();

    if (redrawHand) {
      this.deckManager.discardHand();
      this.deckManager.drawHand(5);
    }

    this.updateUI();
  }

  // ---------------- end conditions ----------------

  checkEndConditions() {
    if (this.player.hp <= 0) {
      this.onDefeat();
      return true;
    }
    if (this.enemy && this.enemy.hp <= 0) {
      this.onWaveClear();
      return true;
    }
    return false;
  }

  onDefeat() {
    this.setState(GameState.GAME_OVER);
    this.isPlayerTurn = false;
    this.clearTimers();
    this.gridManager.resetHighlights();
    this.updateUI();
    this.ui.showGameOver(`DEFEAT (Wave ${this.wave})`);
  }

  onWaveClear() {
    this.setState(GameState.WAVE_CLEAR);
    this.isPlayerTurn = false;
    this.clearTimers();
    this.gridManager.resetHighlights();
    this.updateUI();

    if (this.ui.showWaveCleared) this.ui.showWaveCleared(this.wave);
    else this.ui.showGameOver(`VICTORY (Wave ${this.wave})`);
  }

  // ---------------- UI ----------------

  updateUI() {
    this.ui.updateStats(this.player, this.enemy);
    this.ui.renderHand(this.deckManager.hand);

    if (this.ui.endTurnBtn) {
      const enabled = this.state === GameState.PLAYER_TURN;
      this.ui.endTurnBtn.disabled = !enabled;
      this.ui.endTurnBtn.innerText = enabled ? 'END TURN' : 'ENEMY TURN...';
      this.ui.endTurnBtn.style.opacity = enabled ? '1' : '0.5';
    }
  }

  // ---------------- cards/input ----------------

  selectCard(index) {
    if (!this.isInputAllowed()) return;

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

    if (card.type === 'move') {
      const reachable = this.gridManager.getReachableTiles(this.player.gridX, this.player.gridY, range);
      this.gridManager.highlightTiles(reachable.map(p => ({ x: p.x, y: p.y })), 0x44ff44);
      return;
    }

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
    if (!this.isInputAllowed()) return;

    const isEnemyThere = (x === this.enemy.gridX && y === this.enemy.gridY);
    const isPlayerThere = (x === this.player.gridX && y === this.player.gridY);
    const dist = Math.abs(this.player.gridX - x) + Math.abs(this.player.gridY - y);

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
        if (this.gridManager.isReachableWithin(this.player.gridX, this.player.gridY, x, y, range)) {
          this.movePlayerTo(x, y);
          success = true;
        }
      }

      if (!success) return;

      this.player.mana -= card.cost;
      this.deckManager.discardCard(this.selectedCardIndex);
      this.selectedCardIndex = -1;
      this.gridManager.resetHighlights();

      this.updateUI();
      this.checkEndConditions();
      return;
    }

    // обычное движение: 1 клетка за 1 ману
    if (dist === 1 && !isEnemyThere && this.gridManager.isWalkable(x, y)) {
      if (this.player.mana >= 1) {
        this.player.mana -= 1;
        this.movePlayerTo(x, y);
        this.gridManager.resetHighlights();
        this.updateUI();
        this.checkEndConditions();
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

  // ---------------- turn loop ----------------

  endTurn() {
    if (!this.isInputAllowed()) return;

    this.setState(GameState.ENEMY_TURN);
    this.isPlayerTurn = false;

    this.selectedCardIndex = -1;
    this.deckManager.hand.forEach(c => (c.selected = false));
    this.gridManager.resetHighlights();

    this.updateUI();
    this.schedule(() => this.enemyTurn(), 600);
  }

  enemyTurn() {
    if (this.state !== GameState.ENEMY_TURN) return;
    if (!this.enemy || this.enemy.hp <= 0) return;

    const dist =
      Math.abs(this.enemy.gridX - this.player.gridX) +
      Math.abs(this.enemy.gridY - this.player.gridY);

    if (this.enemy.type === 'ghost') {
      if (dist >= 3 && dist <= 5) this.player.takeDamage(5);
      else if (dist < 3) this.ghostStep(true);
      else this.moveEnemyTowardsPlayer();
    } else {
      if (dist === 1) this.player.takeDamage(8);
      else this.moveEnemyTowardsPlayer();
    }

    this.updateUI();
    if (this.checkEndConditions()) return;

    this.schedule(() => this.beginPlayerTurn(true), 800);
  }

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

      const d = Math.abs(p.x - this.player.gridX) + Math.abs(p.y - this.player.gridY);

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

  // ---------------- layout ----------------

  centerGrid() {
    const container = this.gridManager.container;

    const width = GRID_W * TILE_SIZE;
    const height = GRID_H * TILE_SIZE;

    // чтобы карты снизу не закрывали поле
    const TOP_SAFE = 90;
    const BOTTOM_SAFE = 260;

    const availH = this.app.screen.height - TOP_SAFE - BOTTOM_SAFE;

    container.x = (this.app.screen.width - width) / 2;
    container.y = TOP_SAFE + Math.max(0, (availH - height) / 2);
  }
}
