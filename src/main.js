import { Application, Assets } from 'pixi.js';
import { GameManager } from './game/GameManager';
import { HERO_IMG, ENEMY_IMG, GHOST_IMG, FLOOR_IMG } from './AssetsManifest';

// Размеры сетки
export const TILE_SIZE = 64;
export const GRID_W = 8;
export const GRID_H = 8;

(async () => {
    // 1. Создаем приложение
    const app = new Application();
    
    await app.init({ 
        background: '#111',
        resizeTo: window,
        antialias: false // Пиксель-арт стиль
    });

    document.body.appendChild(app.canvas);

    try {
        console.log("Loading assets...");
        
        // 2. Загружаем ресурсы
        // ВАЖНО: Если тут ошибка, игра зависнет
        await Assets.load([
            { alias: 'hero', src: HERO_IMG },
            { alias: 'enemy', src: ENEMY_IMG },
            { alias: 'ghost', src: GHOST_IMG }, // <--- Проверь, что файл существует!
            { alias: 'floor', src: FLOOR_IMG }
        ]);

        console.log("Assets loaded. Starting Game Manager...");

        // 3. Запускаем игру
        const game = new GameManager(app);
        
        // @ts-ignore (для отладки из консоли браузера)
        window.game = game; 

    } catch (e) {
        console.error("FATAL ERROR IN GAME START:", e);
        alert("Ошибка запуска! Открой консоль (F12) чтобы увидеть детали.\nСкорее всего не найдена картинка: " + e.message);
    }
})();
