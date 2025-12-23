import { GameState } from './core/state/GameState.js';
import { UnitModel } from './core/state/UnitModel.js';
import { CardEffects } from './core/logic/CardEffects.js';
import { AILogic } from './core/logic/AILogic.js';
import { PathFinding } from './core/logic/PathFinding.js';
import { BattleLogic } from './core/logic/BattleLogic.js';
import { UIManager } from './ui/UIManager.js';
import { getCard, STARTING_DECK } from './data/CardLibrary.js';
import { EVENTS, UNIT_TYPES, TEAMS, UNIT_STATS, CARD_EFFECTS } from './data/constants.js';

export class GameManager {
  constructor() {
    this.state = GameState.getInstance();
    this.ui = new UIManager(this);
    this.renderer = null;

    this.selectedCardIndex = -1;

    this.pendingDiscard = 0;
    this.pendingDiscardReason = null;

    this.encounter = null; // { nodeId, type, floor, seed? }
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  // ----------------------------
  // Encounter entry points
  // ----------------------------
  startGame() {
    this.startEncounter({ nodeId: 'debug', type: 'FIGHT', floor: 0 });
  }

  startEncounter(encounter) {
    this.encounter = encounter ?? { nodeId: 'unknown', type: 'FIGHT', floor: 0 };

    // reset core state
    this.state.isGameOver = false;
    this.state.isPlayerTurn = true;

    // clear units / obstacles / cards
    this.state.units = [];
    this.state.grid.obstacles = [];
    this.state.hand = [];
    this.state.deck = [];
    this.state.discard = [];

    // clear UI transient
    this.selectedCardIndex = -1;
    this.pendingDiscard = 0;
    this.pendingDiscardReason = null;

    this.renderer?.gridRenderer?.clearHighlight();
    this.renderer?.unitRenderer?.clearAll?.();

    // deck init + opening draw
    this.initDeck();
    this.drawToHand(5, 5);

    // obstacles
    this.spawnRock(1, 1);
    this.spawnRock(0, 2);

    // hero
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

    // enemies for this encounter
    this.spawnEncounterEnemies(this.encounter);

    // announce encounter start
    this.state.wave = (this.encounter.floor ?? 0) + 1;
    this.state.emit(EVENTS.WAVE_STARTED, { wave: this.state.wave, encounter: this.encounter });

    this.startPlayerTurn(true);
  }

  spawnEncounterEnemies(enc) {
    const floor = enc?.floor ?? 0;

    if (enc?.type === 'BOSS') {
      const boss = new UnitModel({
        id: `boss_${enc.nodeId ?? 'x'}`,
        type: UNIT_TYPES.ENEMY_MELEE,
        team: TEAMS.ENEMY,
        x: 3,
        y: 3,
        hp: 60 + floor * 10,
        maxHp: 60 + floor * 10,
        movePoints: UNIT_STATS.ENEMY_MELEE.MOVE_POINTS,
      });

      this.state.addUnit(boss);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: boss });
      return;
    }

    const enemyCount = 1 + Math.floor(floor / 2);
    for (let i = 0; i < enemyCount; i++) {
      const ex = 3;
      const ey = (i * 2) % this.state.grid.height;

      const enemy = new UnitModel({
        id: `enemy_${floor}_${i}`,
        type: i % 2 === 0 ? UNIT_TYPES.ENEMY_MELEE : UNIT_TYPES.ENEMY_RANGED,
        team: TEAMS.ENEMY,
        x: ex,
        y: ey,
        hp: 15 + floor * 4,
        maxHp: 15 + floor * 4,
        movePoints: UNIT_STATS.ENEMY_MELEE.MOVE_POINTS,
      });

      this.state.addUnit(enemy);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: enemy });
    }
  }

  // ----------------------------
  // Obstacles
  // ----------------------------
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

  // ----------------------------
  // Deck/hand/discard
  // ----------------------------
  isAwaitingDiscard() {
    return this.pendingDiscard > 0;
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  initDeck() {
    const base = Array.isArray(STARTING_DECK) ? [...STARTING_DECK] : [];
    this.state.deck = base;
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

  beginDiscardMode(count, reason) {
    this.pendingDiscard = Math.max(0, count);
    this.pendingDiscardReason = reason ?? null;

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

  onHandCardClick(index) {
    if (this.isAwaitingDiscard()) {
      this.discardFromHand(index);
      return;
    }

    this.selectCard(index);
  }

  // ----------------------------
  // Card selection / highlight
  // ----------------------------
  _isAutoPlaySelfCard(card) {
    if (!card) return false;
    if ((card.range ?? 0) !== 0) return false;

    return (
      card.effect === CARD_EFFECTS.HEAL ||
      card.effect === CARD_EFFECTS.SHIELD ||
      card.effect === CARD_EFFECTS.LOOT
    );
  }

  selectCard(index) {
    if (!this.state.isPlayerTurn) return;
    if (this.isAwaitingDiscard()) return;

    if (this.selectedCardIndex === index) {
      this.selectedCardIndex = -1;
      this.renderer?.gridRenderer?.clearHighlight();
      this.ui.renderHand();
      return;
    }

    this.selectedCardIndex = index;

    const card = this.state.hand[index];
    const player = this.state.getPlayer();

    // Self cards (heal/shield/loot): играем сразу по клику на карту
    if (this._isAutoPlaySelfCard(card) && player) {
      void this.handleTileClick(player.x, player.y);
      return;
    }

    this.highlightCardRange(card);
    this.ui.renderHand();
  }

  highlightCardRange(card) {
    const player = this.state.getPlayer();
    if (!player || !card) return;

    const tiles = [];
    const { width, height } = this.state.grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dist = Math.max(Math.abs(x - player.x), Math.abs(y - player.y));
        if (dist <= (card.range ?? 0) && CardEffects.canPlay(card, x, y)) {
          tiles.push({ x, y });
        }
      }
    }

    this.renderer?.gridRenderer?.highlight(tiles, 0x00ff00);
  }

  playLootEffect() {
    this.drawToHand(2, 5);
    if (this.state.hand.length === 0) return;
    this.beginDiscardMode(1, 'LOOT');
  }

  // ----------------------------
  // Input: tile click
  // ----------------------------
  async handleTileClick(x, y) {
    if (!this.state.isPlayerTurn) return;
    if (this.state.isGameOver) return;
    if (this.isAwaitingDiscard()) return;

    const player = this.state.getPlayer();
    if (!player) return;

    // ---- play card ----
    if (this.selectedCardIndex !== -1) {
      const card = this.state.hand[this.selectedCardIndex];
      if (!card) return;

      if (player.mana < (card.cost ?? 0)) return;
      if (!CardEffects.canPlay(card, x, y)) return;

      player.mana -= (card.cost ?? 0);

      // remove from hand first
      const [played] = this.state.hand.splice(this.selectedCardIndex, 1);
      this.selectedCardIndex = -1;

      // send to discard
      if (played?.key) {
        this.state.discard.push(played.key);
        this.state.emit(EVENTS.DISCARD_CHANGED);
      }

      // effect
      if (
        played?.key === 'LOOT' ||
        played?.id === 'loot' ||
        String(played?.effect).toUpperCase() === 'LOOT'
      ) {
        this.playLootEffect();
      } else {
        CardEffects.execute(card, x, y);
      }

      this.renderer?.gridRenderer?.clearHighlight();
      this.state.emit(EVENTS.HAND_CHANGED);
      this.state.emit(EVENTS.CARD_PLAYED);

      this.ui.updateStats();
      this.checkEncounterStatus();
      return;
    }

    // ---- movement ----
    const path = PathFinding.findPath(player.x, player.y, x, y);
    if (path && path.length - 1 <= player.movePoints) {
      const target = path[path.length - 1];
      player.movePoints -= (path.length - 1);
      BattleLogic.moveUnit(player, target.x, target.y);
      this.ui.updateStats();
    }
  }

  // ----------------------------
  // Turn loop
  // ----------------------------
  async endTurn() {
    if (!this.state.isPlayerTurn) return;
    if (this.state.isGameOver) return;
    if (this.isAwaitingDiscard()) return;

    this.state.isPlayerTurn = false;
    this.selectedCardIndex = -1;
    this.renderer?.gridRenderer?.clearHighlight();

    // UI сразу обновим, чтобы кнопка стала disabled на время хода врагов
    this.ui.updateAll();

    // ход врагов
    await AILogic.executeTurn();

    // Победа могла случиться на ходе врагов (яд/турели)
    if (this.state.getEnemies().length === 0) {
      this.checkEncounterStatus();
      return;
    }

    // Возвращаем ход игроку
    this.startPlayerTurn(false);
  }

  startPlayerTurn(isFirstTurn) {
    const player = this.state.getPlayer();
    if (!player || player.isDead) {
      this.state.isGameOver = true;
      this.state.isPlayerTurn = false;
      this.state.emit(EVENTS.GAME_OVER, { reason: 'DEFEAT', encounter: this.encounter });
      return;
    }

    this.state.isPlayerTurn = true;

    player.maxMana = player.maxMana ?? UNIT_STATS.PLAYER.MAX_MANA;
    player.mana = player.maxMana;
    player.movePoints = UNIT_STATS.PLAYER.MOVE_POINTS;

    if (!isFirstTurn) this.drawToHand(1, 5);

    this.ui.updateAll();
    this.state.emit(EVENTS.TURN_START);
  }

  // ----------------------------
  // Win/lose for ONE encounter
  // ----------------------------
  checkEncounterStatus() {
    const enemies = this.state.getEnemies();
    if (enemies.length === 0) {
      this.state.isPlayerTurn = false;
      this.state.emit(EVENTS.WAVE_COMPLETED, { encounter: this.encounter });
    }
  }
}
