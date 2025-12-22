import { GridManager } from '../grid/GridManager.js'; 
import { Unit } from '../units/Unit.js';
import { UIManager } from '../ui/UIManager.js';

// Эти файлы лежат рядом в папке game, поэтому одна точка (.)
import { DeckManager } from './DeckManager.js';
import { CardActions } from './cards/CardActions.js';

// main.js лежит в корне src, поэтому выходим вверх (../)
import { GRID_W, GRID_H } from '../main.js';

const GameState = Object.freeze({
    PLAYER_TURN: 'PLAYER_TURN',
    ENEMY_TURN: 'ENEMY_TURN',
    ANIMATING: 'ANIMATING', // Блокировка ввода во время анимаций
    GAME_OVER: 'GAME_OVER',
});

export class GameManager {
    constructor(app) {
        this.app = app;
        
        // 1. Инициализация систем
        // GridManager теперь сам управляет контейнером и изометрией
        this.gridManager = new GridManager(app, (x, y) => this.handleTileClick(x, y));
        
        this.ui = new UIManager(this);
        this.deckManager = new DeckManager();
        
        // 2. Состояние игры
        this.state = GameState.ANIMATING; 
        this.wave = 0;
        
        // 3. Реестр сущностей (ВМЕСТО this.enemy и this.player)
        this.units = []; 
        
        // Инициализация
        this.deckManager.drawHand(5); // Стартовая рука
        this.startNextWave();
        
        // Авто-центровка при ресайзе
        window.addEventListener('resize', () => this.gridManager.centerGrid());
    }

    // ==========================================
    //              UNIT MANAGEMENT
    // ==========================================

    /**
     * Создает юнита и добавляет его в игровой цикл
     */
    spawnUnit(type, team, x, y, hp) {
        // Генерируем ID
        const id = `${type}_${Math.random().toString(36).substr(2, 5)}`;
        
        const unit = new Unit(id, type, team, x, y, hp);
        
        this.units.push(unit);
        
        // Добавляем визуальную часть юнита в контейнер сетки.
        // Это ВАЖНО для правильной Z-сортировки (чтобы юнит перекрывал тайлы и других юнитов)
        this.gridManager.container.addChild(unit.container);
        
        return unit;
    }

    /**
     * Возвращает юнита игрока (предполагаем, что он один, или первый попавшийся)
     */
    getPlayer() {
        return this.units.find(u => u.team === 0 && u.hp > 0);
    }

    /**
     * Возвращает всех живых врагов
     */
    getEnemies() {
        return this.units.filter(u => u.team === 1 && u.hp > 0);
    }

    getUnitAt(x, y) {
        return this.units.find(u => u.gridX === x && u.gridY === y && u.hp > 0);
    }

    // ==========================================
    //              GAME LOOP & WAVE
    // ==========================================

    startNextWave() {
        if (this.state === GameState.GAME_OVER) return;

        this.wave++;
        this.state = GameState.ANIMATING;

        // 1. Очистка старых врагов (но оставляем героя, если он жив)
        const player = this.getPlayer();
        
        // Удаляем мертвых или врагов с прошлой волны
        // (Очищаем их визуальные контейнеры)
        this.units.forEach(u => {
            if (u.team !== 0) {
                u.container.destroy(); 
            }
        });
        
        // Оставляем в массиве только игрока
        this.units = player ? [player] : [];
        this.gridManager.clearObstacles();

        // 2. Спавн Героя (если это первая волна)
        if (!player) {
            const px = 1;
            const py = Math.floor(GRID_H / 2);
            this.spawnUnit('player', 0, px, py, 40); // 40 HP
        } else {
            // Лечим героя немного между волнами?
            // player.hp = Math.min(player.hp + 5, player.maxHp);
            // player.updateHpBar();
        }

        // 3. Генерация уровня (Стены и Декор)
        this.generateLevelEnvironment();

        // 4. Спавн Врагов (теперь их может быть несколько!)
        this.spawnWaveEnemies();

        // 5. Старт
        this.ui.showWaveNotification(this.wave);
        if (this.wave === 1) {
            this.startPlayerTurn();
        } else {
            // Иначе - красивая пауза
            setTimeout(() => this.startPlayerTurn(), 1500);
        }
    }

    generateLevelEnvironment() {
        // Простая генерация стен
        for (let i = 0; i < 4; i++) {
            const rx = Math.floor(Math.random() * GRID_W);
            const ry = Math.floor(Math.random() * GRID_H);
            if (!this.getUnitAt(rx, ry)) {
                this.gridManager.addObstacle(rx, ry, 'rock');
            }
        }
    }

    spawnWaveEnemies() {
        const difficulty = this.wave; // Простой множитель
        
        // Пример логики спавна:
        // Волна 1: 1 Враг
        // Волна 2: 2 Врага
        // Волна 3: 1 Призрак + 1 Враг
        
        const count = Math.min(1 + Math.floor(difficulty / 2), 4);
        
        for (let i = 0; i < count; i++) {
            // Ищем свободную клетку справа
            let ex, ey;
            do {
                ex = GRID_W - 1 - Math.floor(Math.random() * 3); // Правая часть карты
                ey = Math.floor(Math.random() * GRID_H);
            } while (this.getUnitAt(ex, ey) || this.gridManager.isObstacleAt(ex, ey));

            // Тип врага
            const isGhost = (this.wave >= 2 && Math.random() > 0.6);
            const type = isGhost ? 'ghost' : 'enemy';
            const hp = 20 + (this.wave * 5);

            this.spawnUnit(type, 1, ex, ey, hp);
        }
    }

    // ==========================================
    //              TURN LOGIC
    // ==========================================

    startPlayerTurn() {
        const player = this.getPlayer();
        if (!player) return;

        this.state = GameState.PLAYER_TURN;
        
        // Восстановление ресурсов
        player.mana = player.maxMana;
        player.movePoints = 3; // Можно вынести в параметр юнита
        
        // UI
        this.selectedCardIndex = -1;
        this.deckManager.hand.forEach(c => c.selected = false);
        this.gridManager.resetHighlights();
        
        // Добор карт
        this.deckManager.discardHand();
        this.deckManager.drawHand(5);
        
        // Планирование намерений врагов (Intent System)
        this.planEnemyIntents();

        this.updateUI();
        this.highlightAvailableMoves();
    }

    async endTurn() {
        if (this.state !== GameState.PLAYER_TURN) return;
        
        this.state = GameState.ENEMY_TURN;
        this.selectedCardIndex = -1;
        this.gridManager.resetHighlights();
        this.updateUI();

        // Пауза перед ходом врага
        await this.wait(500);
        
        await this.executeEnemyTurn();
    }

    // ==========================================
    //              ENEMY AI (ASYNC)
    // ==========================================

    planEnemyIntents() {
        const player = this.getPlayer();
        if (!player) return;

        const enemies = this.getEnemies();
        enemies.forEach(enemy => {
            const dist = this.getDist(enemy, player);
            
            // Простейшая логика намерений
            if (dist <= 1) {
                enemy.setIntent('attack', 8);
            } else {
                enemy.setIntent('move', null);
            }
        });
    }

    async executeEnemyTurn() {
        const enemies = this.getEnemies();
        const player = this.getPlayer();

        if (!player) return;

        // Враги ходят по очереди
        for (const enemy of enemies) {
            // Снимаем интент перед действием
            enemy.clearIntent();
            
            // Логика AI
            const dist = this.getDist(enemy, player);

            if (dist <= 1) {
                // Атака ближнего боя
                // Анимация рывка к игроку
                await this.animBump(enemy, player);
                player.takeDamage(8);
            } else {
                // Движение к игроку
                const path = this.findPathTowards(enemy, player.gridX, player.gridY);
                if (path) {
                    enemy.moveTo(path.x, path.y);
                    await this.wait(600); // Ждем пока дойдет
                }
            }
            
            this.updateUI();
            
            // Проверка смерти игрока после каждого действия врага
            if (player.hp <= 0) {
                this.gameOver(false);
                return;
            }
            
            // Небольшая пауза между врагами
            await this.wait(300);
        }

        // Конец хода врагов
        this.startPlayerTurn();
    }

    // ==========================================
    //              INPUT & ACTIONS
    // ==========================================

    selectCard(index) {
        if (this.state !== GameState.PLAYER_TURN) return;

        const hand = this.deckManager.hand;
        if (index === this.selectedCardIndex) {
            // Deselect
            this.selectedCardIndex = -1;
            hand[index].selected = false;
            this.highlightAvailableMoves(); // Показываем ходьбу
        } else {
            // Select
            if (this.selectedCardIndex !== -1) hand[this.selectedCardIndex].selected = false;
            this.selectedCardIndex = index;
            hand[index].selected = true;
            
            // Подсветка зоны действия карты
            // ВАЖНО: Тут нужно обновить CardActions, чтобы он работал с новой системой
            // Пока просто подсветим все клетки, если карта есть
            this.highlightCardRange(hand[index]);
        }
        this.updateUI();
    }

    handleTileClick(x, y) {
        if (this.state !== GameState.PLAYER_TURN) return;

        const player = this.getPlayer();
        if (!player) return;

        // 1. Использование Карты
        if (this.selectedCardIndex !== -1) {
            const card = this.deckManager.hand[this.selectedCardIndex];
            
            if (player.mana < card.cost) {
                console.log("Not enough mana");
                return; // Нужен визуальный фидбек
            }

            // Пытаемся сыграть карту
            // CardActions должен возвращать true, если карта сыграна успешно
            // Мы передаем this (GameManager), чтобы CardActions мог использовать getUnitAt
            const success = this.tryExecuteCard(card, x, y);
            
            if (success) {
                player.mana -= card.cost;
                this.deckManager.discardCard(this.selectedCardIndex);
                this.selectedCardIndex = -1;
                this.highlightAvailableMoves();
                this.updateUI();
                this.checkWinCondition();
            }
            return;
        }

        // 2. Перемещение (если карта не выбрана)
        // Проверяем, кликнули ли мы в допустимую зону
        const reachable = this.gridManager.getReachableTiles(player.gridX, player.gridY, player.movePoints);
        const target = reachable.find(t => t.x === x && t.y === y);

        if (target && !this.getUnitAt(x, y)) {
            // Двигаемся
            player.moveTo(x, y);
            player.movePoints -= target.steps; // Вычитаем очки хода
            this.highlightAvailableMoves();
            this.updateUI();
        }
    }

    tryExecuteCard(card, x, y) {
        // Здесь мы временно адаптируем старые CardActions или вызываем новые
        // Лучше всего, если CardActions.execute будет принимать (gm, targetX, targetY, card)
        
        if (CardActions && CardActions[card.id]) { // Или card.actionId
             // Для совместимости пока используем card.actions[0] если это массив
             const actionKey = card.actions ? card.actions[0] : null;
             if(actionKey && CardActions[actionKey]) {
                 return CardActions[actionKey].execute(this, x, y, card);
             }
        }
        
        // Временная заглушка, если CardActions еще не обновлен
        console.warn("Card action logic pending update");
        return false;
    }

    // ==========================================
    //              HELPERS & UTILS
    // ==========================================

    highlightAvailableMoves() {
        this.gridManager.resetHighlights();
        const player = this.getPlayer();
        if (!player) return;

        const reachable = this.gridManager.getReachableTiles(player.gridX, player.gridY, player.movePoints);
        // Фильтруем клетки, где уже стоят враги (туда ходить нельзя)
        const validMoves = reachable.filter(t => !this.getUnitAt(t.x, t.y));
        
        this.gridManager.highlightTiles(validMoves, 0x44ff44);
    }

    highlightCardRange(card) {
        this.gridManager.resetHighlights();
        // TODO: Реализовать честную проверку range из CardActions
        // Пока просто подсветим радиус вокруг героя
        const player = this.getPlayer();
        const range = card.range || 3;
        
        // Используем алгоритм поиска пути для определения радиуса атаки (игнорируя стены для магии?)
        // Или простую дистанцию
        const targets = [];
        for(let y=0; y<GRID_H; y++) {
            for(let x=0; x<GRID_W; x++) {
                const dist = Math.abs(x - player.gridX) + Math.abs(y - player.gridY);
                if (dist <= range) targets.push({x, y});
            }
        }
        this.gridManager.highlightTiles(targets, 0xffaa00);
    }

    findPathTowards(unit, targetX, targetY) {
        // Простой шаг в сторону цели (жадный алгоритм)
        // Для полноценного pathfinding нужен A*
        const moves = [
            {x: unit.gridX+1, y: unit.gridY},
            {x: unit.gridX-1, y: unit.gridY},
            {x: unit.gridX, y: unit.gridY+1},
            {x: unit.gridX, y: unit.gridY-1}
        ];
        
        let bestMove = null;
        let minDist = Infinity;
        
        for(const m of moves) {
            if (this.gridManager.isWalkable(m.x, m.y) && !this.getUnitAt(m.x, m.y)) {
                const dist = Math.abs(m.x - targetX) + Math.abs(m.y - targetY);
                if (dist < minDist) {
                    minDist = dist;
                    bestMove = m;
                }
            }
        }
        return bestMove;
    }

    getDist(u1, u2) {
        return Math.abs(u1.gridX - u2.gridX) + Math.abs(u1.gridY - u2.gridY);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Анимация удара (юнит дергается к цели и обратно)
    async animBump(attacker, target) {
        // Тут можно вызвать GSAP. Временная заглушка.
        // await gsap.to(...) 
        await this.wait(200);
    }

    updateUI() {
        const player = this.getPlayer();
        // Врага берем первого попавшегося для UI старого образца,
        // но вообще UI надо переделать под hover
        const enemy = this.getEnemies()[0]; 
        
        this.ui.updateStats(player, enemy);
        this.ui.renderHand(this.deckManager.hand);
        
        // Кнопка End Turn
        if (this.ui.endTurnBtn) {
            this.ui.endTurnBtn.disabled = (this.state !== GameState.PLAYER_TURN);
            this.ui.endTurnBtn.innerText = (this.state === GameState.PLAYER_TURN) ? "END TURN" : "ENEMY TURN...";
        }
    }

    checkWinCondition() {
        const enemies = this.getEnemies();
        if (enemies.length === 0) {
            // Победа в волне
            setTimeout(() => this.startNextWave(), 1000);
        }
    }
    
    gameOver(victory) {
        this.state = GameState.GAME_OVER;
        this.ui.showGameOver(victory ? "VICTORY" : "DEFEAT");
    }
}
