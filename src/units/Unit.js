import { Container, Sprite, Text, TextStyle, Graphics } from 'pixi.js';
import { TILE_SIZE } from '../main';
import gsap from 'gsap';

export class Unit {
    constructor(type, gridX, gridY, color, hp) {
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.hp = hp;
        this.maxHp = hp;

        this.container = new Container();

        // 1. Тень
        const shadow = new Graphics();
        shadow.ellipse(TILE_SIZE/2, TILE_SIZE - 5, 20, 8);
        shadow.fill({ color: 0x000000, alpha: 0.5 });
        shadow.filterArea = null; 
        this.container.addChild(shadow);
        
        // 2. Спрайт (выбор текстуры)
        let textureName;
        if (type === 'player') textureName = 'hero';
        else if (type === 'ghost') textureName = 'ghost'; // <--- НОВОЕ
        else textureName = 'enemy';
        
        this.visual = Sprite.from(textureName);
        this.visual.width = TILE_SIZE;
        this.visual.height = TILE_SIZE;
        this.container.addChild(this.visual);

        // 3. Текст HP
        const style = new TextStyle({
            fontSize: 14,
            fill: '#ffffff',
            stroke: { color: '#000000', width: 4 },
            fontWeight: '900',
            fontFamily: 'Verdana'
        });
        
        const hpColor = type === 'player' ? '#44ff44' : '#ff4444';
        
        this.hpText = new Text({ text: `${this.hp}`, style });
        this.hpText.style.fill = hpColor;
        this.hpText.anchor.set(0.5);
        this.hpText.x = TILE_SIZE / 2;
        this.hpText.y = -10;
        this.container.addChild(this.hpText);

        this.container.x = gridX * TILE_SIZE;
        this.container.y = gridY * TILE_SIZE;
    }

    moveTo(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        
        gsap.to(this.container, {
            x: gridX * TILE_SIZE,
            y: gridY * TILE_SIZE,
            duration: 0.4,
            ease: "back.out(1.2)"
        });
        
        gsap.to(this.visual.scale, { x: 1.1, y: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    }

    updateHpText() {
        this.hpText.text = `${this.hp}`;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.hpText.text = `${this.hp}`;

        if (amount < 0) {
             gsap.to(this.visual, {
                pixi: { tint: 0x00ff00 },
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                onComplete: () => { this.visual.tint = 0xffffff; }
            });
            return;
        }

        gsap.to(this.visual, {
            pixi: { tint: 0xff0000 },
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            onComplete: () => { this.visual.tint = 0xffffff; }
        });

        this.showDamageNumber(amount);

        if (this.hp <= 0) {
            gsap.to(this.container, { alpha: 0, duration: 0.5, y: "+=20" });
        }
    }

    showDamageNumber(amount) {
        const dmgText = new Text({
            text: `-${amount}`,
            style: { fontSize: 24, fill: '#ff0000', stroke: { width: 3, color: 'black' }, fontWeight: 'bold' }
        });
        dmgText.anchor.set(0.5);
        dmgText.x = TILE_SIZE / 2;
        dmgText.y = 0;
        this.container.addChild(dmgText);

        gsap.to(dmgText, {
            y: -40,
            alpha: 0,
            duration: 1,
            ease: "power1.out",
            onComplete: () => dmgText.destroy()
        });
    }
}
