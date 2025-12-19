import { Application } from 'pixi.js';
import { GameManager } from './game/GameManager';
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';

// Регистрируем плагин для анимации Pixi свойств
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

// Глобальные константы
export const TILE_SIZE = 64;
export const GRID_W = 4;
export const GRID_H = 8;

(async () => {
    // Инициализация Pixi
    const app = new Application();
    await app.init({ 
        resizeTo: window, 
        backgroundColor: 0x2a2a2a, 
        antialias: true 
    });
    document.body.appendChild(app.canvas);
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    
    // Запускаем игру
    new GameManager(app);
})();
