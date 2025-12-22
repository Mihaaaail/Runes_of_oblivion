import { Application, Assets } from 'pixi.js';
import { GameManager } from './game/GameManager.js'; // ДОБАВИЛ .js
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';

// Импорт ассетов (проверь, чтобы этот файл лежал в корне src или поправь путь)
import { HERO_IMG, ENEMY_IMG, GHOST_IMG, ROCK_IMG, SHRINE_IMG } from './AssetsManifest.js'; // ДОБАВИЛ .js

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export const TILE_SIZE = 64;
// Размеры сетки
export const GRID_W = 10; // Чуть меньше, чтобы точно влезло
export const GRID_H = 10;

(async () => {
    // 1. Создаем приложение
    const app = new Application();

    await app.init({
        resizeTo: window,
        backgroundColor: 0x050505, // Черный фон
        antialias: true,
        resolution: window.devicePixelRatio || 1,
    });

    document.body.appendChild(app.canvas);
    
    // Стили для canvas
    app.canvas.style.position = 'absolute';
    app.canvas.style.top = '0';
    app.canvas.style.left = '0';
    app.canvas.style.zIndex = '-1'; // Под UI (который обычно z-index: 10+)

    // 2. Загружаем ассеты
    // Важно: Pixi v8 может требовать явного указания, что это за ресурс, если это data-uri
    // Но обычно alias + src работает.
    
    try {
        await Assets.load([
            { alias: 'hero', src: HERO_IMG },
            { alias: 'enemy', src: ENEMY_IMG },
            { alias: 'ghost', src: GHOST_IMG },
            { alias: 'rock', src: ROCK_IMG },
            { alias: 'shrine', src: SHRINE_IMG },
            // 'floor' удален, так как мы рисуем его программно
        ]);
        
        console.log("Assets loaded!");
        
        // 3. Запускаем игру
        const game = new GameManager(app);
        
        // Отладочный вывод, чтобы понять, создалась ли игра
        console.log("GameManager started", game);
        
    } catch (e) {
        console.error("Failed to load game:", e);
    }
})();
