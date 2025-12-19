import { Application, Assets } from 'pixi.js';
import { GameManager } from './game/GameManager';
import gsap from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import * as PIXI from 'pixi.js';
import { HERO_IMG, ENEMY_IMG, FLOOR_IMG } from './AssetsManifest';

gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

export const TILE_SIZE = 64;
export const GRID_W = 6; // Широкое поле
export const GRID_H = 8; // Высота

(async () => {
    const app = new Application();
    await app.init({ 
        resizeTo: window, 
        backgroundColor: 0x050505, 
        antialias: true 
    });
    document.body.appendChild(app.canvas);
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';

    await Assets.load([
        { alias: 'hero', src: HERO_IMG },
        { alias: 'enemy', src: ENEMY_IMG },
        { alias: 'floor', src: FLOOR_IMG }
    ]);

    new GameManager(app);
})();
