import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE, GRID_W, GRID_H } from '../main';

export class GridManager {
    constructor(app) {
        this.app = app;
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
        // Создаем графический объект (прямоугольник)
        const g = new Graphics();
        
        // Рисуем квадрат
        g.rect(0, 0, TILE_SIZE - 2, TILE_SIZE - 2); // -2 пикселя для красивого зазора
        g.fill(0x3e3e3e); // Темно-серый цвет тайла
        g.stroke({ width: 1, color: 0x555555 }); // Обводка

        // Позиционируем
        g.x = x * TILE_SIZE;
        g.y = y * TILE_SIZE;

        // Делаем интерактивным
        g.interactive = true;
        g.cursor = 'pointer';

        // Наведение мыши (Hover эффект)
        g.on('pointerover', () => {
            g.tint = 0x888888; // Светлее при наведении
        });
        g.on('pointerout', () => {
            g.tint = 0xffffff; // Возврат цвета
        });
        
        return {
            x, y,
            visual: g,
            occupied: false
        };
    }
}
