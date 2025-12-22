import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { IsoMath } from '../utils/IsoMath.js';
import { UNIT_TYPES, TEAMS } from '../data/constants.js';

export class UnitRenderer {
    constructor(app) {
        this.app = app;
        this.container = new Container();
        this.container.sortableChildren = true;
        this.app.stage.addChild(this.container);
        this.unitSprites = new Map();
    }

    createUnitVisual(unitModel) {
        const wrapper = new Container();
        const isoPos = IsoMath.gridToIso(unitModel.x, unitModel.y);
        
        wrapper.x = isoPos.x;
        wrapper.y = isoPos.y;
        wrapper.zIndex = IsoMath.getDepth(unitModel.x, unitModel.y);

        // 1. Тень
        const shadow = new Graphics();
        shadow.ellipse(0, 0, 20, 10).fill({ color: 0x000000, alpha: 0.3 });
        wrapper.addChild(shadow);

        // 2. Тело
        const body = new Graphics();
        let color = 0xffffff;
        
        if (unitModel.type === UNIT_TYPES.PLAYER) color = 0x3498db; // Синий
        else if (unitModel.team === TEAMS.ENEMY) color = 0xe74c3c; // Красный
        else if (unitModel.type === UNIT_TYPES.OBSTACLE) color = 0x7f8c8d; // СЕРЫЙ (Камень)
        else color = 0xf1c40f; // Желтый (Турель)

        // Рисуем тело
        if (unitModel.type === UNIT_TYPES.OBSTACLE) {
            // Камень поменьше и квадратный
            body.rect(-15, -30, 30, 30).fill({ color });
        } else {
            // Юнит
            body.roundRect(-20, -60, 40, 60, 5).fill({ color });
        }
        
        wrapper.addChild(body);

        // 3. HP Bar (Камням не обязательно, но пусть будет, вдруг мы их ломаем)
        if (unitModel.type !== UNIT_TYPES.OBSTACLE) {
            this.drawHpBar(wrapper, unitModel);
        }

        this.container.addChild(wrapper);
        this.unitSprites.set(unitModel.id, { container: wrapper, body, hpBar: null });
    }

    drawHpBar(wrapper, unitModel) {
        const oldBar = wrapper.getChildByName('hpBar');
        if (oldBar) oldBar.destroy();

        const bar = new Graphics();
        bar.label = 'hpBar';
        bar.y = -70; 
        
        const width = 40;
        const pct = Math.max(0, unitModel.hp / unitModel.maxHp);
        
        bar.rect(-width/2, 0, width, 6).fill(0x000000);
        bar.rect(-width/2, 0, width * pct, 6).fill(0x00ff00);
        
        if (unitModel.shield > 0) {
            bar.rect(-width/2, -2, width * (unitModel.shield / 10), 2).fill(0x00aaff);
        }

        wrapper.addChild(bar);
    }

    moveUnit(unit, x, y) {
        const spriteData = this.unitSprites.get(unit.id);
        if (!spriteData) return;

        const targetIso = IsoMath.gridToIso(x, y);
        const newZ = IsoMath.getDepth(x, y);

        gsap.to(spriteData.container, {
            x: targetIso.x,
            y: targetIso.y,
            zIndex: newZ,
            duration: 0.4,
            ease: "power2.out"
        });
        
        gsap.to(spriteData.body, { y: -10, duration: 0.2, yoyo: true, repeat: 1 });
    }

    damageUnit(unit) {
        const spriteData = this.unitSprites.get(unit.id);
        if (!spriteData) return;
        
        if (unit.type !== UNIT_TYPES.OBSTACLE) {
            this.drawHpBar(spriteData.container, unit);
        }

        gsap.to(spriteData.body, { alpha: 0.3, duration: 0.1, yoyo: true, repeat: 3 });
        gsap.to(spriteData.container, { x: "+=5", duration: 0.05, yoyo: true, repeat: 3 });
    }

    removeUnit(unit) {
        const spriteData = this.unitSprites.get(unit.id);
        if (!spriteData) return;

        gsap.to(spriteData.container, {
            alpha: 0,
            y: "+=20",
            duration: 0.5,
            onComplete: () => {
                spriteData.container.destroy();
                this.unitSprites.delete(unit.id);
            }
        });
    }
}
