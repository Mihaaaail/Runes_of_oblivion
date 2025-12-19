import { Container, Sprite } from 'pixi.js';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GridManager {
    constructor(app, onTileClick) {
        this.app = app;
        this.onTileClick = onTileClick;
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
        const sprite = Sprite.from('floor');
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.x = x * TILE_SIZE;
        sprite.y = y * TILE_SIZE;
        
        // Немного рандомизируем прозрачность для "живости" пола
        sprite.alpha = 0.8 + Math.random() * 0.2; 

        sprite.interactive = true;
        sprite.cursor = 'pointer';
        
        // Запоминаем дефолтный цвет (белый = оригинал)
        const defaultTint = 0xffffff;

        sprite.on('pointerover', () => { 
            // Меняем альфу при наведении, только если тайл не перекрашен подсветкой
            if (sprite.tint === defaultTint) sprite.alpha = 1; 
        });
        sprite.on('pointerout', () => { 
            if (sprite.tint === defaultTint) sprite.alpha = 0.9; 
        });
        
        sprite.on('pointerdown', () => {
            if (this.onTileClick) this.onTileClick(x, y);
        });

        return { x, y, visual: sprite, defaultTint };
    }

    // Метод включения подсветки
    highlightTiles(tilesToHighlight, color) {
        // Сначала сбрасываем старую подсветку
        this.resetHighlights();

        tilesToHighlight.forEach(pos => {
            const tile = this.tiles.find(t => t.x === pos.x && t.y === pos.y);
            if (tile) {
                tile.visual.tint = color;
                tile.visual.alpha = 1; // Делаем ярким
            }
        });
    }

    // Метод сброса
    resetHighlights() {
        this.tiles.forEach(tile => {
            tile.visual.tint = tile.defaultTint; // Возвращаем белый цвет
            tile.visual.alpha = 0.8 + Math.random() * 0.2; // Возвращаем легкую прозрачность
        });
    }
}
