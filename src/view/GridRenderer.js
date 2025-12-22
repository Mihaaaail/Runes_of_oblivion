import { Container, Graphics, Polygon } from 'pixi.js';
import { GameState } from '../core/state/GameState.js';
import { IsoMath } from '../utils/IsoMath.js';
import { TILE_WIDTH, TILE_HEIGHT } from '../data/constants.js';

export class GridRenderer {
    constructor(app, onTileClick) {
        this.app = app;
        this.container = new Container();
        this.container.sortableChildren = true;
        this.app.stage.addChild(this.container);
        
        this.tiles = []; 
        this.highlightedTiles = [];
        this.onTileClick = onTileClick;

        this.renderInitialGrid();
    }

    renderInitialGrid() {
        const state = GameState.getInstance();
        const grid = state.grid;

        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                this.createTile(x, y);
            }
        }
        this.centerGrid();
    }

    createTile(x, y) {
        const isoPos = IsoMath.gridToIso(x, y);
        const g = new Graphics();
        
        // Рисуем ромб вокруг центра (0,0)
        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;

        g.moveTo(0, -halfH);      // Верх
        g.lineTo(halfW, 0);       // Право
        g.lineTo(0, halfH);       // Низ
        g.lineTo(-halfW, 0);      // Лево
        g.closePath();
        
        // Цвет: шахматный порядок
        const isOdd = (x + y) % 2 === 0;
        const color = isOdd ? 0x2c3e50 : 0x34495e; 
        
        g.fill({ color: color });
        g.stroke({ width: 1, color: 0x556677 });

        g.x = isoPos.x;
        g.y = isoPos.y;
        g.zIndex = -1000; // Пол всегда внизу

        // Интерактивность
        g.interactive = true;
        g.cursor = 'pointer';
        
        // Хитбокс точно по форме ромба
        g.hitArea = new Polygon([
            0, -halfH,
            halfW, 0,
            0, halfH,
            -halfW, 0
        ]);
        
        g.on('pointerdown', () => this.onTileClick(x, y));
        g.on('pointerover', () => { if (!g.isHighlighted) g.tint = 0xaaddff; });
        g.on('pointerout', () => { if (!g.isHighlighted) g.tint = 0xffffff; });

        this.container.addChild(g);
        this.tiles.push({ x, y, graphic: g, defaultColor: 0xffffff });
    }

    highlight(tiles, color = 0x00ff00) {
        this.clearHighlight();
        tiles.forEach(pos => {
            const tile = this.tiles.find(t => t.x === pos.x && t.y === pos.y);
            if (tile) {
                tile.graphic.tint = color;
                tile.graphic.isHighlighted = true;
                this.highlightedTiles.push(tile);
            }
        });
    }

    clearHighlight() {
        this.highlightedTiles.forEach(tile => {
            tile.graphic.tint = tile.defaultColor;
            tile.graphic.isHighlighted = false;
        });
        this.highlightedTiles = [];
    }
    
    centerGrid() {
        this.container.x = this.app.screen.width / 2;
        this.container.y = 100;
    }
}
