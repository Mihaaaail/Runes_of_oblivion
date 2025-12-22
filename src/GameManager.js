import { GameState } from './core/state/GameState.js';
import { UnitModel } from './core/state/UnitModel.js';
import { CardEffects } from './core/logic/CardEffects.js';
import { AILogic } from './core/logic/AILogic.js';
import { PathFinding } from './core/logic/PathFinding.js';
import { BattleLogic } from './core/logic/BattleLogic.js';
import { UIManager } from './ui/UIManager.js';
import { CardLibrary, getCard } from './data/CardLibrary.js';
import { EVENTS, UNIT_TYPES, TEAMS, CARD_EFFECTS, UNIT_STATS } from './data/constants.js';

export class GameManager {
  constructor() {
    this.state = GameState.getInstance();
    this.ui = new UIManager(this);
    this.selectedCardIndex = -1;
    this.renderer = null;
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  startGame() {
    // Чистим старых юнитов
    this.state.units = [];
    this.state.grid.obstacles = [];

    // 1. Создаем препятствия как ЮНИТОВ (чтобы они были видны)
    this.spawnRock(1, 1);
    this.spawnRock(0, 2);

    // 2. Спавним Героя
    const hero = new UnitModel({
      id: 'hero',
      type: UNIT_TYPES.PLAYER,
      team: TEAMS.PLAYER,
      x: 0, y: 4,
      hp: 30, mana: 3
    });
    this.state.addUnit(hero);
    this.state.emit(EVENTS.UNIT_SPAWNED, { unit: hero });

    // 3. Рука
    this.drawHand();

    // 4. Старт волны
    this.startWave(1);
    this.state.emit(EVENTS.TURN_START);
  }

  spawnRock(x, y) {
    const rock = new UnitModel({
      id: `rock_${x}_${y}`,
      type: UNIT_TYPES.OBSTACLE,
      team: TEAMS.NEUTRAL,
      x: x, y: y,
      hp: 10
    });
    this.state.addUnit(rock);

    if (this.renderer) {
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: rock });
    }
  }

  drawHand() {
    this.state.hand = [
      getCard('STRIKE'),
      getCard('FIREBALL'),
      getCard('HEAL'),
      getCard('DASH'),
      getCard('TURRET')
    ];
    this.state.emit(EVENTS.CARD_PLAYED);
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
        x: ex, y: ey,
        hp: 15 + (waveNum * 2)
      });
      this.state.addUnit(enemy);
      this.state.emit(EVENTS.UNIT_SPAWNED, { unit: enemy });
    }
  }

  selectCard(index) {
    if (!this.state.isPlayerTurn) return;

    if (this.selectedCardIndex === index) {
        // Отмена выбора
        this.selectedCardIndex = -1;
        if (this.renderer?.gridRenderer) {
        this.renderer.gridRenderer.clearHighlight();
        }
    } else {
        // Выбор новой карты
        this.selectedCardIndex = index;
        this.highlightCardRange(this.state.hand[index]);
    }

    // В любом случае перерисовываем руку, чтобы .selected обновился
    this.ui.renderHand();
  }


  highlightCardRange(card) {
    const player = this.state.getPlayer();
    if (!player) return;

    const tiles = [];
    const grid = this.state.grid;
    const { width, height } = grid;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
        if (dist <= card.range && CardEffects.canPlay(card, x, y)) {
          tiles.push({ x, y });
        }
      }
    }

    // Подсветка ВНЕ цикла
    if (this.renderer?.gridRenderer) {
      this.renderer.gridRenderer.highlight(tiles, 0x00ff00);
    }
  }

  async handleTileClick(x, y) {
    console.log(`Clicked on ${x},${y}`);
    const unitHere = this.state.getUnitAt(x, y);
    if (unitHere) {
      console.log(`Unit here: ${unitHere.type} (Team: ${unitHere.team})`);
    } else {
      console.log("No unit here");
    }

    if (!this.state.isPlayerTurn) return;
    const player = this.state.getPlayer();
    if (!player) return;

    if (this.selectedCardIndex !== -1) {
      const card = this.state.hand[this.selectedCardIndex];
      if (player.mana >= card.cost) {
        if (CardEffects.canPlay(card, x, y)) {
          player.mana -= card.cost;
          CardEffects.execute(card, x, y);
          this.state.hand.splice(this.selectedCardIndex, 1);
          this.selectedCardIndex = -1;
          if (this.renderer?.gridRenderer) {
            this.renderer.gridRenderer.clearHighlight();
          }
          this.state.emit(EVENTS.CARD_PLAYED);
          this.ui.updateStats();
          this.checkWaveStatus();
        } else {
          console.log("Invalid target for card");
        }
      } else {
        console.log("Not enough mana");
      }
    } else {
      // Ходьба
      const path = PathFinding.findPath(player.x, player.y, x, y);
      if (path && path.length - 1 <= player.movePoints) {
        const target = path[path.length - 1];
        player.movePoints -= (path.length - 1);
        BattleLogic.moveUnit(player, target.x, target.y);
        this.ui.updateStats();
      } else {
        console.log("Not enough move points");
      }
    }
  }

  async endTurn() {
    if (!this.state.isPlayerTurn) return;

    this.state.isPlayerTurn = false;
    this.selectedCardIndex = -1;
    if (this.renderer?.gridRenderer) {
      this.renderer.gridRenderer.clearHighlight();
    }
    this.ui.updateAll();

    await AILogic.executeTurn();
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    const player = this.state.getPlayer();
    if (player && !player.isDead) {
        this.state.isPlayerTurn = true;

        player.mana = player.maxMana;
        player.movePoints = 3; // или UNIT_STATS.PLAYER.MOVE_POINTS, если уже вынес

        // Добор случайной карты из пула
        const drawPool = ['STRIKE', 'FIREBALL', 'HEAL', 'DASH', 'TURRET'];
        if (this.state.hand.length < 5) {
        const key = drawPool[Math.floor(Math.random() * drawPool.length)];
        this.state.hand.push(getCard(key));
        }

        this.ui.updateAll();
    } else {
        console.log('GAME OVER');
    }
  }


  checkWaveStatus() {
    const enemies = this.state.getEnemies();
    if (enemies.length === 0) {
      console.log("Wave Cleared!");
      setTimeout(() => this.startWave(this.state.wave + 1), 1000);
    }
  }
}
