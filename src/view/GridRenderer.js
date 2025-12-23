import { Container, Graphics, Polygon } from 'pixi.js';
import { GameState } from '../core/state/GameState.js';
import { IsoMath } from '../utils/IsoMath.js';
import { TILE_WIDTH, TILE_HEIGHT, GRID_W, GRID_H } from '../data/constants.js';

export class GridRenderer {
  constructor(app, onTileClick) {
    this.app = app;
    this.container = new Container();
    this.container.sortableChildren = true;
    this.app.stage.addChild(this.container);

    this.tiles = [];
    this.highlightedTiles = [];
    this.onTileClick = onTileClick;

    this.theme = {
      light: 0x3b3a37,
      dark: 0x2f2e2b,
      hover: 0x8b7355,
      frame: 0xc9a66b,
    };

    this.renderInitialGrid();
    this.centerGrid();
    this.drawBoardFrame();
  }

  setTheme(theme) {
    if (!theme) return;
    this.theme = { ...this.theme, ...theme };

    this.container.removeChildren();
    this.tiles = [];
    this.highlightedTiles = [];

    this.renderInitialGrid();
    this.centerGrid();
    this.drawBoardFrame();
  }

  renderInitialGrid() {
    const state = GameState.getInstance();
    const grid = state.grid;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        this.createTile(x, y);
      }
    }
  }

  createTile(x, y) {
    const isoPos = IsoMath.gridToIso(x, y);
    const g = new Graphics();

    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    g.moveTo(0, -halfH);
    g.lineTo(halfW, 0);
    g.lineTo(0, halfH);
    g.lineTo(-halfW, 0);
    g.closePath();

    const isLight = (x + y) % 2 === 0;
    const baseColor = isLight ? this.theme.light : this.theme.dark;

    g.fill({ color: baseColor });
    g.stroke({ width: 1.5, color: 0x17130f });

    g.x = isoPos.x;
    g.y = isoPos.y;
    g.zIndex = -1000;

    g.interactive = true;
    g.cursor = 'pointer';

    g.hitArea = new Polygon([0, -halfH, halfW, 0, 0, halfH, -halfW, 0]);

    g.on('pointerdown', () => this.onTileClick(x, y));
    g.on('pointerover', () => { if (!g.isHighlighted) g.tint = this.theme.hover; });
    g.on('pointerout', () => { if (!g.isHighlighted) g.tint = 0xffffff; });

    this.container.addChild(g);
    this.tiles.push({ x, y, graphic: g, defaultColor: 0xffffff });
  }

  drawBoardFrame() {
    const frame = new Graphics();

    const topLeft = IsoMath.gridToIso(0, 0);
    const topRight = IsoMath.gridToIso(GRID_W - 1, 0);
    const bottomLeft = IsoMath.gridToIso(0, GRID_H - 1);
    const bottomRight = IsoMath.gridToIso(GRID_W - 1, GRID_H - 1);

    const offset = 16;

    frame.lineStyle({ width: 6, color: this.theme.frame, alpha: 1 });
    frame.moveTo(topLeft.x - offset, topLeft.y - TILE_HEIGHT / 2);
    frame.lineTo(topRight.x + offset, topRight.y - TILE_HEIGHT / 2);
    frame.lineTo(bottomRight.x + offset, bottomRight.y + TILE_HEIGHT / 2);
    frame.lineTo(bottomLeft.x - offset, bottomLeft.y + TILE_HEIGHT / 2);
    frame.closePath();

    frame.lineStyle({ width: 2, color: 0x120e0a, alpha: 0.8 });
    frame.zIndex = -1500;

    this.container.addChild(frame);
  }

  highlight(tiles, color = 0x8b7355) {
    this.clearHighlight();

    tiles.forEach((pos) => {
      const tile = this.tiles.find((t) => t.x === pos.x && t.y === pos.y);
      if (!tile) return;

      tile.graphic.tint = color;
      tile.graphic.isHighlighted = true;
      this.highlightedTiles.push(tile);
    });
  }

  clearHighlight() {
    this.highlightedTiles.forEach((tile) => {
      tile.graphic.tint = tile.defaultColor;
      tile.graphic.isHighlighted = false;
    });
    this.highlightedTiles = [];
  }

  centerGrid() {
    this.container.x = this.app.screen.width / 2;
    this.container.y = 180;
  }
}
