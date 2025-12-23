import { GameState } from '../state/GameState.js';
import { PathFinding } from './PathFinding.js';
import { BattleLogic } from './BattleLogic.js';
import { UNIT_TYPES, EVENTS, UNIT_STATS } from '../../data/constants.js';

export class AILogic {
  static async executeTurn() {
    const state = GameState.getInstance();
    const enemies = state.getEnemies();
    const player = state.getPlayer();
    if (!player || player.isDead) return;

    // 1) Ходят враги
    for (const enemy of enemies) {
      if (!enemy || enemy.isDead) continue;

      // В НАЧАЛЕ ХОДА ВРАГА: тикают статусы (яд и т.п.)
      BattleLogic.applyStatusEffects(enemy);

      // если яд убил — враг ход не делает
      if (enemy.isDead) continue;

      // небольшая пауза, чтобы визуально было читаемо
      await new Promise((r) => setTimeout(r, 350));

      await this.processEnemyAction(enemy, player);

      if (player.isDead) break;
    }

    // 2) Стреляют турели игрока
    this.processTurrets();

    state.emit(EVENTS.TURN_END, { team: 1 });
  }

  static async processEnemyAction(enemy, player) {
    const state = GameState.getInstance();

    const stats =
      enemy.type === UNIT_TYPES.ENEMY_RANGED
        ? UNIT_STATS.ENEMY_RANGED
        : UNIT_STATS.ENEMY_MELEE;

    // --- 1. Попробовать ударить игрока ---
    if (this.canEnemyAttackTarget(enemy, player, stats)) {
      console.log(`${enemy.type} attacks player!`);
      BattleLogic.dealDamage(enemy, player, stats.DAMAGE);
      return;
    }

    // --- 2. Попробовать ударить ближайшую турель ---
    const turrets = state.units.filter(
      (u) => u.type === UNIT_TYPES.SUMMON_TURRET && !u.isDead
    );

    let turretTarget = null;
    let bestDist = Infinity;

    for (const t of turrets) {
      const dx = Math.abs(enemy.x - t.x);
      const dy = Math.abs(enemy.y - t.y);
      if (!this.canEnemyAttackRaw(enemy, dx, dy, stats)) continue;

      // Chebyshev dist
      const dist = Math.max(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        turretTarget = t;
      }
    }

    if (turretTarget) {
      console.log(`${enemy.type} attacks turret!`);
      BattleLogic.dealDamage(enemy, turretTarget, stats.DAMAGE);
      return;
    }

    // --- 3. Если никого ударить нельзя — двигаться / убегать ---
    // Лучник отбегает, если слишком близко к игроку
    if (
      enemy.type === UNIT_TYPES.ENEMY_RANGED &&
      Math.abs(enemy.x - player.x) <= stats.FLEE_RANGE &&
      Math.abs(enemy.y - player.y) <= stats.FLEE_RANGE
    ) {
      const moves = PathFinding.getReachableTiles(
        enemy.x,
        enemy.y,
        Math.max(1, stats.MOVE_POINTS - 1)
      );

      moves.sort((a, b) => {
        const distA = Math.max(Math.abs(a.x - player.x), Math.abs(a.y - player.y));
        const distB = Math.max(Math.abs(b.x - player.x), Math.abs(b.y - player.y));
        return distB - distA;
      });

      if (moves.length > 0) {
        console.log(`${enemy.type} is running away.`);
        BattleLogic.moveUnit(enemy, moves[0].x, moves[0].y);
        return;
      }
    }

    // Движение к игроку
    const path = PathFinding.findPath(enemy.x, enemy.y, player.x, player.y);
    if (!path || path.length < 2) return;

    const maxIndex = Math.min(stats.MOVE_POINTS, path.length - 2);
    if (maxIndex < 1) return;

    const step = path[maxIndex];
    if (!step) return;

    console.log(`${enemy.type} moves to ${step.x},${step.y}`);
    BattleLogic.moveUnit(enemy, step.x, step.y);
  }

  static canEnemyAttackTarget(enemy, target, stats) {
    const dx = Math.abs(enemy.x - target.x);
    const dy = Math.abs(enemy.y - target.y);
    return this.canEnemyAttackRaw(enemy, dx, dy, stats);
  }

  static canEnemyAttackRaw(enemy, dx, dy, stats) {
    if (enemy.type === UNIT_TYPES.ENEMY_RANGED) {
      // Range по диагоналям (Chebyshev)
      const dist = Math.max(dx, dy);
      return dist >= stats.RANGE_MIN && dist <= stats.RANGE_MAX;
    }

    // милишник: 8-соседей
    return dx <= 1 && dy <= 1;
  }

  static processTurrets() {
    const state = GameState.getInstance();

    const turrets = state.units.filter(
      (u) => u.type === UNIT_TYPES.SUMMON_TURRET && !u.isDead
    );

    const enemies = state.getEnemies();
    if (turrets.length === 0 || enemies.length === 0) return;

    const { RANGE, DAMAGE } = UNIT_STATS.TURRET;

    for (const turret of turrets) {
      let best = null;
      let bestDist = Infinity;

      for (const enemy of enemies) {
        if (enemy.isDead) continue;

        const dist = Math.max(
          Math.abs(enemy.x - turret.x),
          Math.abs(enemy.y - turret.y)
        );

        if (dist <= RANGE && dist < bestDist) {
          bestDist = dist;
          best = enemy;
        }
      }

      if (!best) continue;

      console.log(`Turret at ${turret.x},${turret.y} shoots ${best.id}`);
      BattleLogic.dealDamage(turret, best, DAMAGE);
    }
  }
}
