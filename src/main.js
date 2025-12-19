import { Application } from 'pixi.js';
import { GridManager } from './grid/GridManager';
import { Unit } from './units/Unit';
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export const TILE_SIZE = 64;
export const GRID_W = 4;
export const GRID_H = 8;

(async () => {
    const app = new Application();
    await app.init({ resizeTo: window, backgroundColor: 0x2a2a2a, antialias: true });
    document.body.appendChild(app.canvas);
    document.body.style.overflow = 'hidden';

    // 1. Создаем сетку
    const gridManager = new GridManager(app);

    // 2. Создаем юнитов
    // Герой (Зеленый) внизу
    const player = new Unit('player', 1, 6, 0x00ff00, 20);
    gridManager.container.addChild(player.container);

    // Враг (Красный) вверху
    const enemy = new Unit('enemy', 2, 1, 0xff0000, 30);
    gridManager.container.addChild(enemy.container);

    // Центрируем всё
    centerGameContainer(app, gridManager.container);
    window.addEventListener('resize', () => centerGameContainer(app, gridManager.container));
})();

function centerGameContainer(app, container) {
    const gridPixelWidth = GRID_W * TILE_SIZE;
    const gridPixelHeight = GRID_H * TILE_SIZE;
    container.x = (app.screen.width - gridPixelWidth) / 2;
    container.y = (app.screen.height - gridPixelHeight) / 2;
}
