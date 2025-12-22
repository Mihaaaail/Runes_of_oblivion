import { GRID_W, GRID_H } from '../../data/constants.js';

export class GridModel {
    constructor() {
        this.width = GRID_W;
        this.height = GRID_H;
        this.obstacles = []; // {x, y, type: 'rock'}
        this.tileEffects = []; // {x, y, type: 'fire', duration: 2} - Для ТЗ
    }

    addObstacle(x, y, type) {
        if (!this.isObstacleAt(x, y)) {
            this.obstacles.push({ x, y, type });
        }
    }

    isObstacleAt(x, y) {
        return this.obstacles.find(o => o.x === x && o.y === y);
    }

    // Для ландшафтных эффектов
    addTileEffect(x, y, type, duration) {
        this.tileEffects.push({ x, y, type, duration });
    }

    getTileEffectAt(x, y) {
        return this.tileEffects.find(e => e.x === x && e.y === y);
    }
}
