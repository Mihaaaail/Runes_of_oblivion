import { Application } from 'pixi.js';
import { GridRenderer } from './GridRenderer.js';
import { UnitRenderer } from './UnitRenderer.js';
import { GameState } from '../core/state/GameState.js';
import { EVENTS } from '../data/constants.js';

export class GameRenderer {
    constructor(gameManager) {
        this.app = new Application();
        this.gameManager = gameManager;
    }

    async init() {
        await this.app.init({ 
            background: '#101015', 
            resizeTo: window,
            antialias: true 
        });
        document.body.appendChild(this.app.canvas);

        this.gridRenderer = new GridRenderer(this.app, (x, y) => this.onTileClick(x, y));
        this.unitRenderer = new UnitRenderer(this.app);
        
        this.unitRenderer.container.x = this.gridRenderer.container.x;
        this.unitRenderer.container.y = this.gridRenderer.container.y;

        window.addEventListener('resize', () => {
            this.gridRenderer.centerGrid();
            // Синхронизация после ресайза
            this.unitRenderer.container.x = this.gridRenderer.container.x;
            this.unitRenderer.container.y = this.gridRenderer.container.y;
        });

        this.bindEvents();
    }

    bindEvents() {
        const state = GameState.getInstance();

        // Юниты - ПРАВИЛЬНАЯ ДЕСТРУКТУРИЗАЦИЯ
        state.on(EVENTS.UNIT_SPAWNED, (data) => {
            console.log('UNIT_SPAWNED event received:', data);
            if (data && data.unit) {
                this.unitRenderer.createUnitVisual(data.unit);
            }
        });
        
        state.on(EVENTS.UNIT_MOVED, (data) => {
            if (data && data.unit) {
                this.unitRenderer.moveUnit(data.unit, data.x, data.y);
            }
        });
        
        state.on(EVENTS.UNIT_DAMAGED, (data) => {
            if (data && data.target) {
                this.unitRenderer.damageUnit(data.target);
            }
        });
        
        state.on(EVENTS.UNIT_DIED, (data) => {
            if (data && data.unit) {
                this.unitRenderer.removeUnit(data.unit);
            }
        });
    }

    onTileClick(x, y) {
        this.gameManager.handleTileClick(x, y);
    }
}
