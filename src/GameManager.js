import { GameState } from './core/state/GameState.js';
import { UnitModel } from './core/state/UnitModel.js';
import { CardEffects } from './core/logic/CardEffects.js';
import { AILogic } from './core/logic/AILogic.js';
import { PathFinding } from './core/logic/PathFinding.js';
import { BattleLogic } from './core/logic/BattleLogic.js';
import { UIManager } from './ui/UIManager.js';
import { CardLibrary, getCard, STARTING_DECK } from './data/CardLibrary.js';
import { EVENTS, UNIT_TYPES, TEAMS, UNIT_STATS, CARD_EFFECTS } from './data/constants.js';

function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashStrToU32(str) {
  const s = String(str ?? '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export class GameManager {
  constructor() {
    this.state = GameState.getInstance();
    this.ui = new UIManager(this);
    this.renderer = null;

    this.selectedCardIndex = -1;

    this.pendingDiscard = 0;
    this.pendingDiscardReason = null;

    this.encounter = null; // { nodeId, type, floor, seed? }

    // RUN persistence
    this.run = null; // { seed, masterDeckKeys, hp, maxHp, gold }
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  // ----------------------------
  // RUN
  // ----------------------------
  startNewRun({ seed = Date.now() } = {}) {
    this.run = {
      seed,
      masterDeckKeys: Array.isArray(STARTING_DECK) ? [...STARTING_DECK] : [],
      hp: 30,
      maxHp: 30,
      gold: 0,
    };
  }

  _ensureRun() {
    if (!this.run) this.startNewRun({ seed: Date.now() });
  }

  _saveRunFromPlayer() {
    const p = this.state.getPlayer();
    if (!p || !this.run) return;
    this.run.hp = Math.max(0, p.hp);
    this.run.maxHp = p.maxHp ?? this.run.maxHp;
  }

  // ----------------------------
  // Entry points
  // ----------------------------
  startGame() {
    this._ensureRun();
    this.startEncounter({ nodeId: 'debug', type: 'FIGHT', floor: 0 });
  }

  // ----------------------------
  // Node rewards (auto)
  // ----------------------------
  applyNodeReward(node) {
    this._ensureRun();

    const floor = node?.floor ?? 0;
    const seed = (this.run.seed ^ hashStrToU32(node?.id ?? 'node')) >>> 0;
    const rng = makeRng(seed);

    const type = node?.type;

    // Общая награда за "не бой": чуть золота, чтобы SHOP имел смысл
    if (type === 'EVENT') {
      const roll = rng();
      if (roll < 0.33) {
        // free gold
        this.run.gold += 25 + floor * 5;
      } else if (roll < 0.66) {
        // heal a bit
        this.run.hp = Math.min(this.run.maxHp, this.run.hp + (6 + floor));
      } else {
        // maxHp up (маленький)
        this.run.maxHp += 2;
        this.run.hp = Math.min(this.run.maxHp, this.run.hp + 2);
      }
      return;
    }

    if (type === 'REWARD') {
      // Добавляем 1 случайную карту в master deck (auto)
      const pool = Object.keys(CardLibrary).filter(k => k !== 'STRIKE');
      const gained = pick(rng, pool);
      if (gained) this.run.masterDeckKeys.push(gained);
      return;
    }

    if (type === 'SHOP') {
      // Auto-shop:
      // - если есть 40+ золота: удалить один STRIKE (если есть), иначе дать heal
      // - если мало: просто heal
      if (this.run.gold >= 40) {
        const idx = this.run.masterDeckKeys.findIndex(k => k === 'STRIKE');
        if (idx !== -1) {
          this.run.masterDeckKeys.splice(idx, 1);
          this.run.gold -= 40;
        } else {
          this.run.hp = Math.min(this.run.maxHp, this.run.hp + 8);
          this.run.gold -= 20;
        }
      } else {
        this.run.hp = Math.min(this.run.maxHp, this.run.hp + 6);
      }
      return;
    }
  }

  // ----------------------------
  // Encounter start
  // ----------------------------
  startEncounter(encounter) {
    this._ensureRun();

    this.encounter = encounter ?? { nodeId: 'unknown', type: 'FIGHT', floor: 0 };
    const floor = this.encounter.floor ?? 0;

    // reset combat state
    this.state.isGameOver = false;
    this.state.isPlayerTurn = true;

    this.state.units = [];
    this.state.grid.obstacles = [];
    this.state.hand = [];
    this.state.deck = [];
    this.state.discard = [];

    this.selectedCardIndex = -1;
    this.pendingDiscard = 0;
    this.pendingDiscardReason = null;

    // clear visuals from previous encounter
    this.renderer?.gridRenderer?.clearHighlight();
    this.renderer?.unitRenderer?.clearAll?.();

    // theme + map variety
    this.applyEncounterTheme(this.encounter);

    // init combat deck from MASTER deck
    this.initCombatDeckFromRun();
    this.drawToHand(5, 5);

    // obstacles & enemies vary per node
    this.spawnEncounterObstacles(this.encounter);

    // hero (persist)
    const spawn = this.getPlayerSpawnForFloor(floor);
    const hero = new UnitModel({
      id: 'hero',
      type: UNIT_TYPES.PLAYER,
      team: TEAMS.PLAYER,
      x: spawn.x,
      y: spawn.y,
      hp: Math.max(1, this.run.hp), // чтобы после поражения можно было продолжить
      maxHp: this.run.maxHp,
      mana: UNIT_STATS.PLAYER.MAX_MANA,
      maxMana: UNIT_STATS.PLAYER.MAX_MANA,
      movePoints: UNIT_STATS.PLAYER.MOVE_POINTS,
    });

    this.state.addUnit(hero);
    this.state.emit(EVENTS.UNIT_SPAWNED, { unit: hero });

    this.spawnEncounterEnemies(this.encounter);

    this.state.wave = floor + 1;
    this.state.emit(EVENTS.WAVE_STARTED, { wave: this.state.wave, encounter: this.encounter });

    this.startPlayerTurn(true);
  }

  // ----------------------------
  // Theme + variety
  // ----------------------------
  applyEncounterTheme(enc) {
    const floor = enc?.floor ?? 0;

    const themes = [
      { light: 0x3b3a37, dark: 0x2f2e2b, hover: 0x8b7355, frame: 0xc9a66b },
      { light: 0x2f3a3b, dark: 0x232c2d, hover: 0x62a0a5, frame: 0x7fb6ba },
      { light: 0x3b2f2f, dark: 0x2d2323, hover: 0xaa6a6a, frame: 0xd2a07a },
      { light: 0x2f3b2f, dark: 0x232d23, hover: 0x6faa6f, frame: 0x9bd29b },
    ];

    const theme = themes[floor % themes.length];
    this.renderer?.gridRenderer?.setTheme?.(theme);
  }

  getPlayerSpawnForFloor(floor) {
    const spawns = [
      { x: 0, y: 4 },
      { x: 0, y: 6 },
      { x: 1, y: 7 },
      { x: 0, y: 7 },
    ];
    return spawns[floor % spawns.length];
  }

  spawnEncounterObstacles(enc) {
    const floor = enc?.floor ?? 0;
    const seed = (this.run.seed ^ hashStrToU32(enc?.nodeId)) >>> 0;
    const rng = makeRng(seed);

    const rocks = 2 + Math.min(4, Math.floor(floor / 2));
    let placed = 0;
    let attempts = 0;

    const start = this.getPlayerSpawnForFloor(floor);

    while (placed < rocks && attempts < 250) {
      attempts++;

      const x = Math.floor(rng() * this.state.grid.width);
      const y = Math.floor(rng() * this.state.grid.height);

      // не рядом со стартом
      const tooClose = Math.max(Math.abs(x - start.x), Math.abs(y - start.y)) <= 1;
      if (tooClose) continue;

      // не в юнита
      if (this.state.getUnitAt(x, y)) continue;

      const rock = new UnitModel({
        id: `rock_${floor}_${placed}_${x}_${y}`,
        type: UNIT_TYPES.OBSTACLE,
        team: TEAMS.NEUTRAL,
        x,
        y,
        hp: 10,
        maxHp: 10,
      });

      this.state.addUnit(rock);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: rock });
      placed++;
    }
  }

  spawnEncounterEnemies(enc) {
    const floor = enc?.floor ?? 0;
    const seed = (this.run.seed ^ (hashStrToU32(enc?.nodeId) + 1337)) >>> 0;
    const rng = makeRng(seed);

    const trySpawn = (unit) => {
      if (!this.state.isWalkable(unit.x, unit.y)) return false;
      this.state.addUnit(unit);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit });
      return true;
    };

    if (enc?.type === 'BOSS') {
      const boss = new UnitModel({
        id: `boss_${enc.nodeId ?? 'x'}`,
        type: UNIT_TYPES.ENEMY_MELEE,
        team: TEAMS.ENEMY,
        x: 3,
        y: 3,
        hp: 60 + floor * 12,
        maxHp: 60 + floor * 12,
        movePoints: UNIT_STATS.ENEMY_MELEE.MOVE_POINTS,
      });

      if (!trySpawn(boss)) {
        for (const p of [{ x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 4 }, { x: 1, y: 3 }]) {
          boss.x = p.x; boss.y = p.y;
          if (trySpawn(boss)) break;
        }
      }
      return;
    }

    const enemyCount = 2 + Math.min(3, Math.floor(floor / 2));
    const rangedChance = Math.min(0.75, 0.25 + floor * 0.1);

    for (let i = 0; i < enemyCount; i++) {
      const type = (rng() < rangedChance) ? UNIT_TYPES.ENEMY_RANGED : UNIT_TYPES.ENEMY_MELEE;
      const x = Math.max(0, this.state.grid.width - 1 - Math.floor(rng() * 2));
      const y = Math.floor(rng() * this.state.grid.height);

      const hpBase = (type === UNIT_TYPES.ENEMY_RANGED) ? 12 : 16;

      const enemy = new UnitModel({
        id: `enemy_${floor}_${i}_${type}`,
        type,
        team: TEAMS.ENEMY,
        x,
        y,
        hp: hpBase + floor * 4,
        maxHp: hpBase + floor * 4,
        movePoints:
          type === UNIT_TYPES.ENEMY_RANGED
            ? UNIT_STATS.ENEMY_RANGED.MOVE_POINTS
            : UNIT_STATS.ENEMY_MELEE.MOVE_POINTS,
      });

      let ok = trySpawn(enemy);
      for (let t = 0; !ok && t < 20; t++) {
        enemy.x = Math.floor(rng() * this.state.grid.width);
        enemy.y = Math.floor(rng() * this.state.grid.height);
        ok = trySpawn(enemy);
      }
    }
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

  initCombatDeckFromRun() {
    this.state.deck = [...(this.run?.masterDeckKeys ?? [])];
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
  // Cards (autoplay self)
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
        const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
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
  // Input
  // ----------------------------
  async handleTileClick(x, y) {
    if (!this.state.isPlayerTurn) return;
    if (this.state.isGameOver) return;
    if (this.isAwaitingDiscard()) return;

    const player = this.state.getPlayer();
    if (!player) return;

    // play card
    if (this.selectedCardIndex !== -1) {
      const card = this.state.hand[this.selectedCardIndex];
      if (!card) return;

      if (player.mana < (card.cost ?? 0)) return;
      if (!CardEffects.canPlay(card, x, y)) return;

      player.mana -= (card.cost ?? 0);

      const [played] = this.state.hand.splice(this.selectedCardIndex, 1);
      this.selectedCardIndex = -1;

      if (played?.key) {
        this.state.discard.push(played.key);
        this.state.emit(EVENTS.DISCARD_CHANGED);
      }

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

    // movement
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
    this.ui.updateAll();

    await AILogic.executeTurn();

    // если игрок умер на ходу врага
    const player = this.state.getPlayer();
    if (!player || player.isDead) {
      this.handleDefeatAndContinue();
      return;
    }

    // если врагов больше нет — победа (checkEncounterStatus сделает emit и вернёт на карту)
    if (this.state.getEnemies().length === 0) {
      this.checkEncounterStatus();
      return;
    }

    // иначе — НАЧИНАЕМ следующий ход игрока
    this.startPlayerTurn(false);
  }

  startPlayerTurn(isFirstTurn) {
    const player = this.state.getPlayer();
    if (!player || player.isDead) {
      this.handleDefeatAndContinue();
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

  handleDefeatAndContinue() {
    this._ensureRun();
    this._saveRunFromPlayer();

    // “продолжить с карты”: авто-реанимация и штраф по золоту
    const reviveHp = Math.max(1, Math.floor(this.run.maxHp * 0.5));
    this.run.hp = reviveHp;
    this.run.gold = Math.floor((this.run.gold ?? 0) * 0.7);

    this.state.isGameOver = true;
    this.state.isPlayerTurn = false;
    this.state.emit(EVENTS.GAME_OVER, { reason: 'DEFEAT', encounter: this.encounter });
  }

  // ----------------------------
  // Victory
  // ----------------------------
  checkEncounterStatus() {
    const enemies = this.state.getEnemies();
    if (enemies.length === 0) {
      this._ensureRun();
      this._saveRunFromPlayer();

      const floor = this.encounter?.floor ?? 0;
      this.run.gold += 10 + floor * 5;

      // маленький рост maxHp раз в несколько этажей
      if (floor > 0 && floor % 3 === 0) {
        this.run.maxHp += 1;
        this.run.hp = Math.min(this.run.maxHp, this.run.hp + 1);
      }

      this.state.isPlayerTurn = false;
      this.state.emit(EVENTS.WAVE_COMPLETED, { encounter: this.encounter });
    }
  }
}
