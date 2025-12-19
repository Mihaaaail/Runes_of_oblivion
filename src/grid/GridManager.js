import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GridManager {
    constructor(app, onTileClick) {
        this.app = app;
        this.onTileClick = onTileClick; // Callback функция при клике
        this.container = new Container();
        this.tiles = [];

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
        const g = new Graphics();
        
        // Рисуем квадрат
        g.rect(0, 0, TILE_SIZE - 2, TILE_SIZE - 2);
        g.fill(0x3e3e3e);
        g.stroke({ width: 1, color: 0x555555 });

        // Позиционируем
        g.x = x * TILE_SIZE;
        g.y = y * TILE_SIZE;

        // Интерактивность
        g.interactive = true;
        g.cursor = 'pointer';

        // Hover эффекты
        g.on('pointerover', () => { g.tint = 0x888888; });
        g.on('pointerout', () => { g.tint = 0xffffff; });
        
        // Обработка клика
        g.on('pointerdown', () => {
            if (this.onTileClick) {
                this.onTileClick(x, y);
            }
        });

        return { x, y, visual: g, occupied: false };
    }
}
