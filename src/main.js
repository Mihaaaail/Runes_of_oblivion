import { GameManager } from './GameManager.js'; // Создадим следующим
import { GameRenderer } from './view/GameRenderer.js';

// Запуск
(async () => {
    const gameManager = new GameManager();
    const renderer = new GameRenderer(gameManager);
    
    await renderer.init();
    
    // Передаем renderer в gameManager, чтобы он мог управлять подсветкой
    gameManager.setRenderer(renderer);
    
    // Старт игры
    gameManager.startGame();
})();
