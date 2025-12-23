import { GameState } from './core/state/GameState.js';
import { UnitModel } from './core/state/UnitModel.js';
import { CardEffects } from './core/logic/CardEffects.js';
import { AILogic } from './core/logic/AILogic.js';
import { PathFinding } from './core/logic/PathFinding.js';
import { BattleLogic } from './core/logic/BattleLogic.js';
import { UIManager } from './ui/UIManager.js';
import { getCard } from './data/CardLibrary.js';
import { EVENTS, UNIT_TYPES, TEAMS, UNIT_STATS } from './data/constants.js';

export class GameManager {
  constructor() {
    this.state = GameState.getInstance();
    this.ui = new UIManager(this);

    this.selectedCardIndex = -1;
    this.renderer = null;

    // Стартовая колода (ключи из CardLibrary)
    this.starterDeck = [
      'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE', 'STRIKE',
      'FIREBALL', 'FIREBALL',
      'HEAL', 'HEAL',
      'DASH',
      'TURRET',
    ];
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  // ---------- Deck helpers ----------
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  initDeck() {
    this.state.deck = [...this.starterDeck];
    this.state.discard = [];
    this.shuffle(this.state.deck);
  }

  refillDeckFromDiscard() {
    if (this.state.deck.length > 0) return;
    if (this.state.discard.length === 0) return;

    this.state.deck = this.state.discard;
    this.state.discard = [];
    this.shuffle(this.state.deck);
  }

  drawToHand(count, handLimit = 5) {
    while (count > 0 && this.state.hand.length < handLimit) {
      this.refillDeckFromDiscard();
      if (this.state.deck.length === 0) break;

      const key = this.state.deck.pop();
      this.state.hand.push(getCard(key));
      count--;
    }

    // Семантически это "hand changed", но пока используем существующий ивент
    this.state.emit(EVENTS.CARD_PLAYED);
  }

  // ---------- Game flow ----------
  startGame() {
    // Чистим старых юнитов/препятствия
    this.state.units = [];
    this.state.grid.obstacles = [];

    // Карты
    this.state.hand = [];
    this.initDeck();
    this.drawToHand(5);

    // Препятствия (как юниты — оставляю как у тебя сейчас)
    this.spawnRock(1, 1);
    this.spawnRock(0, 2);

    // Герой
    const hero = new UnitModel({
      id: 'hero',
      type: UNIT_TYPES.PLAYER,
      team: TEAMS.PLAYER,
      x: 0,
      y: 4,
      hp: 30,
      mana: 3,
    });

    this.state.addUnit(hero);
    this.state.emit(EVENTS.UNIT_SPAWNED, { unit: hero });

    // Волна + старт хода
    this.startWave(1);
    this.startPlayerTurn(true);
  }

  spawnRock(x, y) {
    const rock = new UnitModel({
      id: `rock_${x}_${y}`,
      type: UNIT_TYPES.OBSTACLE,
      team: TEAMS.NEUTRAL,
      x,
      y,
      hp: 10,
    });

    this.state.addUnit(rock);
    this.state.emit(EVENTS.UNIT_SPAWNED, { unit: rock });
  }

  startWave(waveNum) {
    this.state.wave = waveNum;
    this.state.emit(EVENTS.WAVE_STARTED, { wave: waveNum });

    const enemyCount = 1 + Math.floor(waveNum / 2);

    for (let i = 0; i < enemyCount; i++) {
      const ex = 3;
      const ey = i * 2;

      const enemy = new UnitModel({
        id: `enemy_${waveNum}_${i}`,
        type: i % 2 === 0 ? UNIT_TYPES.ENEMY_MELEE : UNIT_TYPES.ENEMY_RANGED,
        team: TEAMS.ENEMY,
        x: ex,
        y: ey,
        hp: 15 + waveNum * 2,
      });

      this.state.addUnit(enemy);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: enemy });
    }
  }

  selectCard(index) {
    if (!this.state.isPlayerTurn) return;

    if (this.selectedCardIndex === index) {
      this.selectedCardIndex = -1;
      this.renderer?.gridRenderer?.clearHighlight();
    } else {
      this.selectedCardIndex = index;
      this.highlightCardRange(this.state.hand[index]);
    }

    this.ui.renderHand();
  }

  highlightCardRange(card) {
    const player = this.state.getPlayer();
    if (!player) return;

    const tiles = [];
    const { width, height } = this.state.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
        if (dist <= card.range && CardEffects.canPlay(card, x, y)) {
          tiles.push({ x, y });
        }
      }
    }

    this.renderer?.gridRenderer?.highlight(tiles, 0x00ff00);
  }

  async handleTileClick(x, y) {
    if (!this.state.isPlayerTurn) return;

    const player = this.state.getPlayer();
    if (!player) return;

    // --- Игра карты ---
    if (this.selectedCardIndex !== -1) {
      const card = this.state.hand[this.selectedCardIndex];

      if (player.mana < card.cost) {
        console.log('Not enough mana');
        return;
      }

      if (!CardEffects.canPlay(card, x, y)) {
        console.log('Invalid target for card');
        return;
      }

      player.mana -= card.cost;
      CardEffects.execute(card, x, y);

      const [played] = this.state.hand.splice(this.selectedCardIndex, 1);
      this.state.discard.push(played.key);

      this.selectedCardIndex = -1;
      this.renderer?.gridRenderer?.clearHighlight();

      this.state.emit(EVENTS.CARD_PLAYED);
      this.ui.updateStats();

      this.checkWaveStatus();
      return;
    }

    // --- Ходьба ---
    const path = PathFinding.findPath(player.x, player.y, x, y);
    if (path && path.length - 1 <= player.movePoints) {
      const target = path[path.length - 1];
      player.movePoints -= path.length - 1;
      BattleLogic.moveUnit(player, target.x, target.y);
      this.ui.updateStats();
    } else {
      console.log('Not enough move points');
    }
  }

  async endTurn() {
    if (!this.state.isPlayerTurn) return;

    this.state.isPlayerTurn = false;
    this.selectedCardIndex = -1;
    this.renderer?.gridRenderer?.clearHighlight();

    this.ui.updateAll();

    await AILogic.executeTurn();

    this.startPlayerTurn(false);
  }

  startPlayerTurn(isFirstTurn) {
    const player = this.state.getPlayer();
    if (!player || player.isDead) {
      console.log('GAME OVER');
      return;
    }

    this.state.isPlayerTurn = true;

    player.maxMana = player.maxMana ?? UNIT_STATS.PLAYER.MAX_MANA;
    player.mana = player.maxMana;

    player.movePoints = UNIT_STATS.PLAYER.MOVE_POINTS;

    // Первый ход: рука уже набрана в startGame(). Дальше: добираем 1, если есть место.
    if (!isFirstTurn) {
      this.drawToHand(1, 5);
    }

    this.ui.updateAll();
    this.state.emit(EVENTS.TURN_START);
  }

  checkWaveStatus() {
    const enemies = this.state.getEnemies();
    if (enemies.length === 0) {
      console.log('Wave Cleared!');
      setTimeout(() => this.startWave(this.state.wave + 1), 1000);
    }
  }
}
