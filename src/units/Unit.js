import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { TILE_SIZE } from '../main';
import gsap from 'gsap';

export class Unit {
    constructor(type, gridX, gridY, color, hp) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.hp = hp;
        this.maxHp = hp;
        this.color = color;

        this.container = new Container();
        
        // Визуальное тело юнита
        this.visual = new Graphics();
        this.visual.circle(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 3);
        this.visual.fill(color);
        this.visual.stroke({ width: 2, color: 0xffffff });
        this.container.addChild(this.visual);

        // Текст HP
        const style = new TextStyle({
            fontSize: 14,
            fill: '#ffffff',
            stroke: { color: '#000000', width: 2 },
            fontWeight: 'bold'
        });
        this.hpText = new Text({ text: `${this.hp}`, style });
        this.hpText.anchor.set(0.5);
        this.hpText.x = TILE_SIZE / 2;
        this.hpText.y = -10; // Над головой
        this.container.addChild(this.hpText);

        // Устанавливаем начальную позицию
        this.updatePosition(gridX, gridY);
    }

    updatePosition(x, y) {
        this.gridX = x;
        this.gridY = y;
        this.container.x = x * TILE_SIZE;
        this.container.y = y * TILE_SIZE;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.hpText.text = `${this.hp}`;

        // Анимация получения урона (тряска + красный цвет)
        gsap.to(this.visual, {
            pixi: { tint: 0xff0000 },
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            onComplete: () => { this.visual.tint = 0xffffff; } // Возврат к норме (белый тинт = родной цвет)
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        gsap.to(this.container, { alpha: 0, duration: 0.5 });
    }
}
