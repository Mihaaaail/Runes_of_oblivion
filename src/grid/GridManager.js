import { Container, Sprite, Graphics } from 'pixi.js';
import { TILE_SIZE, GRID_W, GRID_H } from '../main'; // TILE_SIZE здесь используется как базовый масштаб
import { IsoMath, TILE_WIDTH, TILE_HEIGHT } from '../utils/IsoMath';

export class GridManager {
    constructor(app, onTileClick) {
        this.app = app;
        this.onTileClick = onTileClick;

        this.container = new Container();
        
        // ВАЖНО: Включаем автоматическую сортировку по zIndex.
        // Это позволяет объектам перекрывать друг друга правильно в 3D-перспективе.
        this.container.sortableChildren = true;

        this.tiles = []; // Массив объектов тайлов
        this.obstacles = []; // Массив препятствий

        this.createGrid();
        
        // Добавляем контейнер на сцену
        this.app.stage.addChild(this.container);
        
        // Центрируем камеру
        this.centerGrid();
    }

    createGrid() {
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                this.createTile(x, y);
            }
        }
    }

    createTile(x, y) {
        // Получаем изометрические координаты для центра тайла
        const isoPos = IsoMath.gridToIso(x, y);

        // Рисуем ромб (пол)
        const g = new Graphics();
        
        // Настраиваем стиль
        const fillColor = 0x2c3e50; // Темно-синий пол
        const strokeColor = 0x34495e; // Чуть светлее обводка

        g.moveTo(0, 0); // Верхняя точка (относительно центра тайла)
        g.lineTo(TILE_WIDTH / 2, TILE_HEIGHT / 2); // Правая
        g.lineTo(0, TILE_HEIGHT); // Нижняя
        g.lineTo(-TILE_WIDTH / 2, TILE_HEIGHT / 2); // Левая
        g.closePath();

        g.fill({ color: fillColor, alpha: 1 });
        g.stroke({ width: 1, color: strokeColor });

        // Позиционируем
        g.x = isoPos.x;
        g.y = isoPos.y;

        // Z-Index для пола. Делаем его меньше, чем у любого юнита (-100).
        g.zIndex = IsoMath.getDepth(x, y) - 100;

        // Интерактивность
        g.interactive = true;
        g.cursor = 'pointer';

        // События мыши
        g.on('pointerover', () => {
            g.tint = 0x99ccff; // Подсветка при наведении
        });
        
        g.on('pointerout', () => {
            // Если тайл не подсвечен логикой (например, дальность хода), возвращаем цвет
            if (!g.isHighlighted) g.tint = 0xffffff; 
            else g.tint = 0x44ff44; // Цвет активной зоны
        });

        g.on('pointerdown', () => {
            if (this.onTileClick) this.onTileClick(x, y);
        });

        // Сохраняем ссылку
        const tileData = { 
            x, 
            y, 
            visual: g,
            defaultColor: 0xffffff 
        };
        
        this.container.addChild(g);
        this.tiles.push(tileData);
    }

    // --- Управление препятствиями ---

    addObstacle(x, y, type) {
        if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
        if (this.isObstacleAt(x, y)) return;

        const alias = (type === 'shrine') ? 'shrine' : 'rock';
        const sprite = Sprite.from(alias);

        // Изометрическая позиция (центр ромба)
        const isoPos = IsoMath.gridToIso(x, y);
        
        sprite.x = isoPos.x;
        
        // --- ФИКС ВЫСОТЫ ---
        // TILE_HEIGHT/2 - это низ ромба (относительно центра)
        // Но так как anchor.y = 1 (самый низ спрайта), мы ставим спрайт ровно в эту точку.
        // Это "приземлит" стену идеально в центр тайла.
        sprite.y = isoPos.y + (TILE_HEIGHT / 2); 

        // Anchor ставим в (0.5, 1.0) - середина низа
        sprite.anchor.set(0.5, 1.0); 

        // Размеры (чуть массивнее)
        sprite.width = 64;
        sprite.height = 75; // Чуть ниже, чтобы не казались небоскребами

        sprite.zIndex = IsoMath.getDepth(x, y);

        this.container.addChild(sprite);
        this.obstacles.push({ x, y, type, visual: sprite });
    }



    removeObstacle(x, y) {
        const idx = this.obstacles.findIndex(o => o.x === x && o.y === y);
        if (idx === -1) return;

        const obs = this.obstacles[idx];
        if (obs.visual && obs.visual.parent) {
            obs.visual.destroy(); // Полностью удаляем из Pixi
        }
        this.obstacles.splice(idx, 1);
    }

    clearObstacles() {
        this.obstacles.forEach(o => {
            if (o.visual) o.visual.destroy();
        });
        this.obstacles = [];
    }

    isObstacleAt(x, y) {
        return this.obstacles.find(o => o.x === x && o.y === y) || null;
    }

    // --- Логика путей и проверок ---

    isWalkable(x, y) {
        // Проверка границ
        if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return false;
        
        // Проверка стен
        const obs = this.isObstacleAt(x, y);
        if (obs && obs.type === 'wall') return false; // Предполагаем, что 'rock' это стена
        if (obs && obs.type === 'rock') return false;

        return true;
    }

    getReachableTiles(startX, startY, maxSteps) {
        const key = (x, y) => `${x},${y}`;
        const dist = new Map();
        const q = [];

        dist.set(key(startX, startY), 0);
        q.push({ x: startX, y: startY });

        const reachable = [];

        while (q.length) {
            const cur = q.shift();
            const d = dist.get(key(cur.x, cur.y));

            if (d > maxSteps) continue;

            // Добавляем в результат (кроме стартовой точки)
            if (d > 0 || (cur.x !== startX || cur.y !== startY)) {
                reachable.push({ x: cur.x, y: cur.y, steps: d });
            }

            if (d === maxSteps) continue;

            const neighbors = [
                { x: cur.x + 1, y: cur.y },
                { x: cur.x - 1, y: cur.y },
                { x: cur.x, y: cur.y + 1 },
                { x: cur.x, y: cur.y - 1 },
            ];

            for (const n of neighbors) {
                if (!this.isWalkable(n.x, n.y)) continue;
                
                const k = key(n.x, n.y);
                if (dist.has(k)) continue;

                dist.set(k, d + 1);
                q.push(n);
            }
        }
        return reachable;
    }

    // --- Визуализация (Подсветка) ---

    highlightTiles(tilesToHighlight, color) {
        this.resetHighlights();
        
        tilesToHighlight.forEach(pos => {
            const tile = this.tiles.find(t => t.x === pos.x && t.y === pos.y);
            if (tile) {
                tile.visual.tint = color;
                tile.visual.isHighlighted = true; // Флаг, чтобы hover не сбивал цвет
            }
        });
    }

    resetHighlights() {
        this.tiles.forEach(tile => {
            tile.visual.tint = tile.defaultColor;
            tile.visual.isHighlighted = false;
        });
    }

    centerGrid() {
        // Жесткое центрирование
        const screenW = this.app.screen.width;
        const screenH = this.app.screen.height;
        
        // Смещение контейнера в центр экрана
        this.container.x = screenW / 2;
        
        // Смещение по вертикали. 
        // В изометрии (0,0) - это самый ВЕРХНИЙ угол ромба всей сетки.
        // Нам нужно опустить его немного вниз, чтобы видеть сетку.
        this.container.y = 150; 
        
        // Лог для отладки (посмотри в консоль F12)
        console.log(`Grid centered at: ${this.container.x}, ${this.container.y}`);
    }

}
