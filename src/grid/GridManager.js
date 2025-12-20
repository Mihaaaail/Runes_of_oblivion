import { Container, Sprite } from 'pixi.js';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GridManager {
  constructor(app, onTileClick) {
    this.app = app;
    this.onTileClick = onTileClick;

    this.container = new Container();
    this.tiles = [];
    this.obstacles = []; // { x, y, type, visual }

    this.createGrid();
    this.app.stage.addChild(this.container);
  }

  createGrid() {
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const tile = this.createTile(x, y);
        this.tiles.push(tile);
        this.container.addChild(tile.visual);
      }
    }
  }

  createTile(x, y) {
    const sprite = Sprite.from('floor');
    sprite.width = TILE_SIZE;
    sprite.height = TILE_SIZE;
    sprite.x = x * TILE_SIZE;
    sprite.y = y * TILE_SIZE;

    sprite.alpha = 0.85;
    sprite.interactive = true;
    sprite.cursor = 'pointer';

    const defaultTint = 0xffffff;

    sprite.on('pointerover', () => {
      if (sprite.tint === defaultTint) sprite.alpha = 1;
    });

    sprite.on('pointerout', () => {
      if (sprite.tint === defaultTint) sprite.alpha = 0.85;
    });

    sprite.on('pointerdown', () => {
      if (this.onTileClick) this.onTileClick(x, y);
    });

    return { x, y, visual: sprite, defaultTint };
  }

  // -------- Obstacles --------

  isObstacleAt(x, y) {
    return this.obstacles.find(o => o.x === x && o.y === y) || null;
  }

  isWalkable(x, y) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
    const obs = this.isObstacleAt(x, y);
    if (obs && obs.type === 'wall') return false;
    return true;
  }

  addObstacle(x, y, type) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
    if (this.isObstacleAt(x, y)) return;

    const alias = (type === 'shrine') ? 'shrine' : 'rock';
    const sprite = Sprite.from(alias);

    sprite.width = TILE_SIZE;
    sprite.height = TILE_SIZE;
    sprite.x = x * TILE_SIZE;
    sprite.y = y * TILE_SIZE;
    sprite.alpha = 0.95;

    this.container.addChild(sprite);
    this.obstacles.push({ x, y, type, visual: sprite });
  }

  removeObstacle(x, y) {
    const idx = this.obstacles.findIndex(o => o.x === x && o.y === y);
    if (idx === -1) return;

    const obs = this.obstacles[idx];
    if (obs.visual && obs.visual.parent) obs.visual.parent.removeChild(obs.visual);
    this.obstacles.splice(idx, 1);
  }

  clearObstacles() {
    for (const o of this.obstacles) {
      if (o.visual && o.visual.parent) o.visual.parent.removeChild(o.visual);
    }
    this.obstacles = [];
  }

  // -------- BFS reachability (для move/dash) --------

  getReachableTiles(startX, startY, maxSteps) {
    const key = (x, y) => `${x},${y}`;
    const dist = new Map();
    const q = [];

    dist.set(key(startX, startY), 0);
    q.push({ x: startX, y: startY });

    while (q.length) {
      const cur = q.shift();
      const d = dist.get(key(cur.x, cur.y));
      if (d >= maxSteps) continue;

      const ns = [
        { x: cur.x + 1, y: cur.y },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x, y: cur.y - 1 },
      ];

      for (const n of ns) {
        if (!this.isWalkable(n.x, n.y)) continue;
        const k = key(n.x, n.y);
        if (dist.has(k)) continue;
        dist.set(k, d + 1);
        q.push(n);
      }
    }

    const out = [];
    for (const k of dist.keys()) {
      if (k === key(startX, startY)) continue;
      const [x, y] = k.split(',').map(Number);
      out.push({ x, y, steps: dist.get(k) });
    }
    return out;
  }

  isReachableWithin(startX, startY, targetX, targetY, maxSteps) {
    if (!this.isWalkable(targetX, targetY)) return false;
    const reachable = this.getReachableTiles(startX, startY, maxSteps);
    return reachable.some(p => p.x === targetX && p.y === targetY);
  }

  // -------- Highlight --------

  highlightTiles(tilesToHighlight, color) {
    this.resetHighlights();
    tilesToHighlight.forEach(pos => {
      const tile = this.tiles.find(t => t.x === pos.x && t.y === pos.y);
      if (tile) {
        tile.visual.tint = color;
        tile.visual.alpha = 1;
      }
    });
  }

  resetHighlights() {
    this.tiles.forEach(tile => {
      tile.visual.tint = tile.defaultTint;
      tile.visual.alpha = 0.85;
    });
  }
}
