import { Application } from 'pixi.js';
import { GridManager } from './grid/GridManager';

// Глобальные константы
export const TILE_SIZE = 64;
export const GRID_W = 4;
export const GRID_H = 8;

(async () => {
    // 1. Создаем Pixi приложение
    const app = new Application();
    
    // Инициализация (на весь экран, темно-серый фон)
    await app.init({ 
        resizeTo: window,
        backgroundColor: 0x2a2a2a,
        antialias: true
    });

    // Добавляем canvas в HTML
    document.body.appendChild(app.canvas);
    document.body.style.margin = '0'; // Убираем отступы браузера
    document.body.style.overflow = 'hidden'; // Убираем скроллбары

    // 2. Создаем менеджер сетки
    const gridManager = new GridManager(app);

    // Центрируем поле
    centerGameContainer(app, gridManager.container);

    // При ресайзе окна — центрируем снова
    window.addEventListener('resize', () => {
        centerGameContainer(app, gridManager.container);
    });

})();

function centerGameContainer(app, container) {
    const gridPixelWidth = GRID_W * TILE_SIZE;
    const gridPixelHeight = GRID_H * TILE_SIZE;
    
    container.x = (app.screen.width - gridPixelWidth) / 2;
    container.y = (app.screen.height - gridPixelHeight) / 2;
}
