import { GameState } from '../state/GameState.js';
import { PathFinding } from './PathFinding.js';
import { BattleLogic } from './BattleLogic.js';
import { UNIT_TYPES, EVENTS } from '../../data/constants.js';

export class AILogic {
    
    static async executeTurn() {
        const state = GameState.getInstance();
        const enemies = state.getEnemies();
        const player = state.getPlayer();

        if (!player || player.isDead) return;

        for (const enemy of enemies) {
            await new Promise(r => setTimeout(r, 500));
            if (enemy.isDead) continue;
            
            await this.processEnemyAction(enemy, player);
            
            if (player.isDead) break;
        }

        // Эмитим событие конца хода, даже если врагов нет (на всякий случай)
        state.emit(EVENTS.TURN_END, { team: 1 });
    }

    static async processEnemyAction(enemy, player) {
        // --- ЛОГИКА АТАКИ ---
        // Проверяем, может ли враг атаковать из текущей позиции
        const canAttack = this.canEnemyAttack(enemy, player);

        if (canAttack) {
            // Если да - атакуем и завершаем ход этого юнита
            console.log(`${enemy.type} attacks player!`);
            let damage = (enemy.type === UNIT_TYPES.ENEMY_RANGED) ? 4 : 6;
            BattleLogic.dealDamage(enemy, player, damage);
            return;
        }

        // --- ЛОГИКА ДВИЖЕНИЯ (если атаковать не можем) ---
        
        // Для лучника: если близко - убегаем
        if (enemy.type === UNIT_TYPES.ENEMY_RANGED && Math.abs(enemy.x - player.x) <= 1 && Math.abs(enemy.y - player.y) <= 1) {
            const moves = PathFinding.getReachableTiles(enemy.x, enemy.y, 2); // 2 - очки хода на побег
            moves.sort((a, b) => {
                const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
                const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
                return distB - distA; // Сортируем по убыванию дистанции (самая дальняя клетка)
            });
            if (moves.length > 0) {
                console.log(`${enemy.type} is running away.`);
                BattleLogic.moveUnit(enemy, moves[0].x, moves[0].y);
            }
            return;
        }
        
        // Для всех остальных: идем к игроку
        const path = PathFinding.findPath(enemy.x, enemy.y, player.x, player.y);
        
        if (path && path.length > 1) {
            // movePoints врага (допустим 3)
            const movePoints = 3; 
            
            // Индекс шага, до которого можем дойти.
            // path.length-2, чтобы не встать на игрока.
            // movePoints-1, т.к. индексы с 0.
            const targetIndex = Math.min(path.length - 2, movePoints - 1);

            if (targetIndex >= 0) { // Идти можно даже на 1 шаг
                const step = path[targetIndex];
                if (step) {
                    console.log(`${enemy.type} moves to ${step.x},${step.y}`);
                    BattleLogic.moveUnit(enemy, step.x, step.y);
                }
            }
        }
    }

    // Хелпер, чтобы определить, может ли враг атаковать
    static canEnemyAttack(enemy, player) {
        const dx = Math.abs(enemy.x - player.x);
        const dy = Math.abs(enemy.y - player.y);

        if (enemy.type === UNIT_TYPES.ENEMY_RANGED) {
            // Лучник бьет на расстоянии от 2 до 4 (манхэттен)
            const manhattanDist = dx + dy;
            return manhattanDist > 1 && manhattanDist <= 4;
        } else { // Милишник
            // Бьет вплотную (по 8 направлениям)
            return dx <= 1 && dy <= 1;
        }
    }
}
