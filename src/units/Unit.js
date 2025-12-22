import { Container, Sprite, Text, TextStyle, Graphics } from 'pixi.js';
import { IsoMath, TILE_HEIGHT } from '../utils/IsoMath';
import gsap from 'gsap';

export class Unit {
    /**
     * @param {string} id - уникальный ID юнита (например, 'hero_1')
     * @param {string} type - тип юнита ('player', 'enemy', 'ghost', 'golem')
     * @param {number} team - команда (0 - игрок, 1 - враги)
     * @param {number} gridX - начальная X координата
     * @param {number} gridY - начальная Y координата
     * @param {number} hp - здоровье
     */
    constructor(id, type, team, gridX, gridY, hp) {
        this.id = id;
        this.type = type;
        this.team = team;
        this.gridX = gridX;
        this.gridY = gridY;
        
        this.hp = hp;
        this.maxHp = hp;
        this.mana = 3; // Базовое значение, менеджер может переопределить
        this.maxMana = 3;

        // Основной контейнер юнита
        this.container = new Container();
        
        // ВАЖНО: zIndex управляется извне (GameManager/GridManager) или обновляется при движении
        // Инициализируем глубину сразу
        this.container.zIndex = IsoMath.getDepth(gridX, gridY);

        this.buildVisuals();
        this.updatePosition(gridX, gridY, false);
    }

    buildVisuals() {
        // 1. Тень (Изометрическая)
        // Тень в изометрии - это плоский овал под ногами
        const shadow = new Graphics();
        shadow.ellipse(0, 0, 24, 12); // Широкий и плоский овал
        shadow.fill({ color: 0x000000, alpha: 0.4 });
        shadow.y = TILE_HEIGHT / 2; // Смещаем чуть вниз к центру тайла
        this.container.addChild(shadow);

        // 2. Спрайт персонажа
        let textureName;
        switch (this.type) {
            case 'player': textureName = 'hero'; break;
            case 'ghost': textureName = 'ghost'; break;
            case 'golem': textureName = 'rock'; break; // Временно, если нет спрайта
            default: textureName = 'enemy'; break;
        }

        this.visual = Sprite.from(textureName);
        
        // Anchor (Якорь) - ставим в ноги (середина по X, низ по Y)
        this.visual.anchor.set(0.5, 1);
        
        // Размеры (можно настроить под каждый тип отдельно)
        this.visual.width = 64; 
        this.visual.height = (this.type === 'ghost') ? 70 : 80;

        // Смещаем визуально вверх, чтобы ноги стояли на центре тайла (где тень)
        this.visual.y = TILE_HEIGHT / 2; 

        this.container.addChild(this.visual);

        // 3. UI (HP Bar и Текст)
        this.uiContainer = new Container();
        this.uiContainer.y = -this.visual.height + 10; // Над головой
        this.container.addChild(this.uiContainer);

        this.createHealthBar();
        this.createIntentContainer();
    }

    createHealthBar() {
        this.hpBar = new Graphics();
        this.uiContainer.addChild(this.hpBar);
        this.drawHp();
    }

    drawHp() {
        this.hpBar.clear();
        
        const w = 50;
        const h = 6;
        
        // Фон (черный)
        this.hpBar.roundRect(-w/2, -h, w, h, 2).fill(0x000000);
        
        // Полоска здоровья
        const pct = Math.max(0, this.hp / this.maxHp);
        // Цвет: Зеленый для своих (team 0), Красный для врагов (team 1)
        const color = (this.team === 0) ? 0x44ff44 : 0xff4444;
        
        if (pct > 0) {
            this.hpBar.roundRect(-w/2, -h, w * pct, h, 2).fill(color);
        }
    }

    createIntentContainer() {
        this.intentContainer = new Container();
        this.intentContainer.y = -25; // Еще выше над HP баром
        this.uiContainer.addChild(this.intentContainer);
    }

    // --- Логика Перемещения ---

    /**
     * Мгновенно или плавно перемещает юнита
     */
    updatePosition(gx, gy, animate = true) {
        const isoPos = IsoMath.gridToIso(gx, gy);
        // Добавляем смещение, чтобы юнит стоял по центру тайла
        // (GridManager рисует тайл от (0,0), центр тайла там же)
        
        // Обновляем глубину для сортировки
        const newZ = IsoMath.getDepth(gx, gy);

        if (animate) {
            // GSAP анимация перемещения
            gsap.to(this.container, {
                x: isoPos.x,
                y: isoPos.y,
                zIndex: newZ, // Pixi v8 сортирует это динамически если parent.sortableChildren = true
                duration: 0.5,
                ease: "power2.out"
            });
            
            // Анимация "подпрыгивания" при шаге
            gsap.to(this.visual.scale, { y: 0.9, x: 1.1, duration: 0.1, yoyo: true, repeat: 1 });
            
        } else {
            this.container.x = isoPos.x;
            this.container.y = isoPos.y;
            this.container.zIndex = newZ;
        }
    }

    moveTo(gx, gy) {
        this.gridX = gx;
        this.gridY = gy;
        this.updatePosition(gx, gy, true);
    }

    // --- Боевая Логика ---

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.drawHp();

        // Анимация получения урона (мигание красным)
        if (amount > 0) {
            gsap.fromTo(this.visual, 
                { pixi: { tint: 0xffffff } }, 
                { pixi: { tint: 0xff0000 }, duration: 0.1, yoyo: true, repeat: 3 }
            );
            this.showFloatingText(`-${amount}`, 0xff5555);
        } else {
            // Лечение
             gsap.fromTo(this.visual, 
                { pixi: { tint: 0xffffff } }, 
                { pixi: { tint: 0x00ff00 }, duration: 0.2, yoyo: true, repeat: 1 }
            );
            this.showFloatingText(`+${Math.abs(amount)}`, 0x55ff55);
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    showFloatingText(text, color) {
        const style = new TextStyle({
            fontSize: 20,
            fill: color,
            fontWeight: 'bold',
            stroke: { color: 'black', width: 3 },
            dropShadow: true
        });
        
        const t = new Text({ text, style });
        t.anchor.set(0.5);
        t.y = -50; // Стартовая высота
        this.container.addChild(t);

        gsap.to(t, {
            y: -90, // Всплывает вверх
            alpha: 0,
            duration: 1.2,
            ease: "circ.out",
            onComplete: () => t.destroy()
        });
    }

    die() {
        // Анимация смерти: исчезновение и уход вниз
        gsap.to(this.container, { 
            alpha: 0, 
            y: "+=20", 
            duration: 0.5,
            onComplete: () => {
                this.container.visible = false; 
                // Не удаляем destroy(), чтобы GameManager мог проверить состояние,
                // но визуально убираем
            }
        });
    }

    // --- Система Намерений (Intent) ---
    // Показывает иконку над врагом: Атака, Защита, Бафф

    setIntent(type, value) {
        this.intentContainer.removeChildren();
        if (!type) return;

        // Фон пузыря
        const bg = new Graphics();
        bg.roundRect(-20, -25, 40, 25, 5);
        bg.fill({ color: 0xFFFFFF, alpha: 0.9 });
        bg.stroke({ width: 1, color: 0x000000 });
        this.intentContainer.addChild(bg);

        // Иконка / Текст
        let icon = '';
        let color = '#000000';

        switch (type) {
            case 'attack': icon = '⚔️'; color = '#aa0000'; break;
            case 'defend': icon = '🛡️'; color = '#0000aa'; break;
            case 'buff':   icon = '✨'; color = '#00aa00'; break;
            case 'move':   icon = '👟'; color = '#aaaa00'; break;
            default:       icon = '❓'; break;
        }

        const textStr = value ? `${icon}${value}` : icon;
        const txt = new Text({ text: textStr, style: { fontSize: 16, fill: color, fontWeight: 'bold' } });
        txt.anchor.set(0.5);
        txt.y = -12;
        this.intentContainer.addChild(txt);

        // Анимация появления
        this.intentContainer.scale.set(0);
        gsap.to(this.intentContainer.scale, { x: 1, y: 1, duration: 0.3, ease: "back.out(1.7)" });
    }

    clearIntent() {
        gsap.to(this.intentContainer.scale, { 
            x: 0, y: 0, duration: 0.2, 
            onComplete: () => this.intentContainer.removeChildren() 
        });
    }
}
