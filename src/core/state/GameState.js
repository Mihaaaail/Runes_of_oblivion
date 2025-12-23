import { EventEmitter } from '../../utils/EventEmitter.js';
import { GridModel } from './GridModel.js';
import { TEAMS } from '../../data/constants.js';

export class GameState extends EventEmitter {
    constructor() {
        super();
        if (GameState.instance) return GameState.instance;
        
        this.grid = new GridModel();
        this.units = []; // Массив UnitModel
        this.deck = [];     // массив ключей карт (например: 'STRIKE')
        this.discard = [];  // массив ключей карт
        this.hand = [];  // Массив карт игрока
        
        this.wave = 1;
        this.turn = 1;
        this.isPlayerTurn = true;
        this.isGameOver = false;

        GameState.instance = this;
    }

    static getInstance() {
        return GameState.instance || new GameState();
    }

    // --- Unit Helpers ---
    addUnit(unit) {
        this.units.push(unit);
    }

    removeUnit(unitId) {
        this.units = this.units.filter(u => u.id !== unitId);
    }

    getUnitById(id) {
        return this.units.find(u => u.id === id);
    }

    getUnitAt(x, y) {
        // Возвращаем только живых юнитов
        return this.units.find(u => u.x === x && u.y === y && !u.isDead);
    }

    getPlayer() {
        return this.units.find(u => u.team === TEAMS.PLAYER);
    }

    getEnemies() {
        // Возвращаем только живых врагов
        return this.units.filter(u => u.team === TEAMS.ENEMY && !u.isDead);
    }
    
    // --- Grid Helpers ---
    isWalkable(x, y) {
        // 1. Границы
        if (x < 0 || x >= this.grid.width || y < 0 || y >= this.grid.height) return false;
        // 2. Препятствия
        if (this.grid.isObstacleAt(x, y)) return false;
        // 3. Другие живые юниты
        if (this.getUnitAt(x, y)) return false;
        
        return true;
    }
}
