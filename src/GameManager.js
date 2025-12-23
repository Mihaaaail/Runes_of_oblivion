import { GameState } from './core/state/GameState.js';
import { UnitModel } from './core/state/UnitModel.js';

import { CardEffects } from './core/logic/CardEffects.js';
import { AILogic } from './core/logic/AILogic.js';
import { PathFinding } from './core/logic/PathFinding.js';
import { BattleLogic } from './core/logic/BattleLogic.js';

import { UIManager } from './ui/UIManager.js';

import { getCard, STARTING_DECK } from './data/CardLibrary.js';
import { EVENTS, UNIT_TYPES, TEAMS, CARD_EFFECTS, UNIT_STATS } from './data/constants.js';

export class GameManager {
  constructor() {
    this.state = GameState.getInstance();
    this.ui = new UIManager(this);

    this.renderer = null;

    this.selectedCardIndex = -1;

    // режим "выбери карту чтобы сбросить"
    this.pendingDiscard = 0;
    this.pendingDiscardReason = null;

    // колода из конфига
    this.starterDeck = STARTING_DECK;
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  isAwaitingDiscard() {
    return this.pendingDiscard > 0;
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

    this.state.emit(EVENTS.DECK_CHANGED);
    this.state.emit(EVENTS.DISCARD_CHANGED);
  }

  refillDeckFromDiscard() {
    if (this.state.deck.length > 0) return;
    if (this.state.discard.length === 0) return;

    this.state.deck = this.state.discard;
    this.state.discard = [];
    this.shuffle(this.state.deck);

    this.state.emit(EVENTS.DECK_CHANGED);
    this.state.emit(EVENTS.DISCARD_CHANGED);
  }

  drawToHand(count, handLimit = 5) {
    let drewAny = false;

    while (count > 0 && this.state.hand.length < handLimit) {
      this.refillDeckFromDiscard();
      if (this.state.deck.length === 0) break;

      const key = this.state.deck.pop();
      this.state.hand.push(getCard(key));

      drewAny = true;
      count--;
    }

    if (drewAny) {
      this.state.emit(EVENTS.DECK_CHANGED);
      this.state.emit(EVENTS.HAND_CHANGED);
    }
  }

  // ---------- Discard mode ----------
  beginDiscardMode(count, reason) {
    this.pendingDiscard = Math.max(0, count);
    this.pendingDiscardReason = reason ?? null;

    // пока выбираем сброс — снимаем выделение карты и подсветку поля
    this.selectedCardIndex = -1;
    this.renderer?.gridRenderer?.clearHighlight();

    this.ui.updateAll();
  }

  discardFromHand(index) {
    if (!this.isAwaitingDiscard()) return;
    if (index < 0 || index >= this.state.hand.length) return;

    const [c] = this.state.hand.splice(index, 1);

    if (c?.key) {
      this.state.discard.push(c.key);
      this.state.emit(EVENTS.DISCARD_CHANGED);
    }

    this.state.emit(EVENTS.HAND_CHANGED);

    this.pendingDiscard -= 1;
    if (this.pendingDiscard <= 0) {
      this.pendingDiscard = 0;
      this.pendingDiscardReason = null;
    }

    this.ui.updateAll();
  }

  // UI вызывает это вместо прямого selectCard()
  onHandCardClick(index) {
    if (this.isAwaitingDiscard()) {
      this.discardFromHand(index);
      return;
    }
    this.selectCard(index);
  }

  // ---------- Game flow ----------
  startGame() {
    // чистим старых юнитов/препятствия
    this.state.units = [];
    this.state.grid.obstacles = [];

    // карты
    this.state.hand = [];
    this.initDeck();
    this.drawToHand(5);

    // препятствия
    this.spawnRock(1, 1);
    this.spawnRock(0, 2);

    // герой
    const hero = new UnitModel({
      id: 'hero',
      type: UNIT_TYPES.PLAYER,
      team: TEAMS.PLAYER,
      x: 0,
      y: 4,
      hp: 30,
      maxHp: 30,
      mana: UNIT_STATS.PLAYER.MAX_MANA,
      maxMana: UNIT_STATS.PLAYER.MAX_MANA,
      movePoints: UNIT_STATS.PLAYER.MOVE_POINTS,
    });

    this.state.addUnit(hero);
    this.state.emit(EVENTS.UNIT_SPAWNED, { unit: hero });

    // волна + старт хода
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
      maxHp: 10,
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
        maxHp: 15 + waveNum * 2,
        movePoints: UNIT_STATS.ENEMY_MELEE.MOVE_POINTS,
      });

      this.state.addUnit(enemy);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: enemy });
    }
  }

  selectCard(index) {
    if (!this.state.isPlayerTurn) return;
    if (this.isAwaitingDiscard()) return;

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

  playLootEffect() {
    // LOOT: draw 2, discard 1 (выбором)
    this.drawToHand(2, 5);

    if (this.state.hand.length === 0) return;
    this.beginDiscardMode(1, 'LOOT');
  }

  async handleTileClick(x, y) {
    if (!this.state.isPlayerTurn) return;
    if (this.isAwaitingDiscard()) return;

    const player = this.state.getPlayer();
    if (!player) return;

    // ---- Игра карты ----
    if (this.selectedCardIndex !== -1) {
      const card = this.state.hand[this.selectedCardIndex];
      if (!card) return;

      if (player.mana < card.cost) {
        console.log('Not enough mana');
        return;
      }

      if (!CardEffects.canPlay(card, x, y)) {
        console.log('Invalid target for card');
        return;
      }

      player.mana -= card.cost;

      // убрать из руки до эффекта (важно для LOOT)
      const [played] = this.state.hand.splice(this.selectedCardIndex, 1);
      this.selectedCardIndex = -1;

      // сыгранная карта -> discard
      if (played?.key) {
        this.state.discard.push(played.key);
        this.state.emit(EVENTS.DISCARD_CHANGED);
      }

      // эффекты
      if (card.effect === CARD_EFFECTS.LOOT) {
        this.playLootEffect();
      } else {
        CardEffects.execute(card, x, y);
      }

      this.renderer?.gridRenderer?.clearHighlight();

      this.state.emit(EVENTS.HAND_CHANGED);
      this.state.emit(EVENTS.CARD_PLAYED);

      this.ui.updateStats();
      this.checkWaveStatus();
      return;
    }

    // ---- Ходьба ----
    const path = PathFinding.findPath(player.x, player.y, x, y);
    if (path && path.length - 1 <= player.movePoints) {
      const target = path[path.length - 1];
      player.movePoints -= (path.length - 1);
      BattleLogic.moveUnit(player, target.x, target.y);
      this.ui.updateStats();
    } else {
      console.log('Not enough move points');
    }
  }

  async endTurn() {
    if (!this.state.isPlayerTurn) return;
    if (this.isAwaitingDiscard()) return;

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

    // оставляем как было: добор 1/ход
    if (!isFirstTurn) this.drawToHand(1, 5);

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
