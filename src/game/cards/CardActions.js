import { TILE_SIZE, GRID_W, GRID_H } from '../../main';

export const CardActions = {
  
  // --- НАНЕСЕНИЕ УРОНА ---
  deal_damage: {
    getValidTargets: (gm, card) => {
      const targets = [];
      const range = card.range ?? 1;
      const player = gm.getPlayer();
      if (!player) return [];

      // Проходим по всем врагам
      const enemies = gm.getEnemies();
      
      enemies.forEach(enemy => {
         const dist = Math.abs(player.gridX - enemy.gridX) + Math.abs(player.gridY - enemy.gridY);
         if (dist <= range) {
             targets.push({ x: enemy.gridX, y: enemy.gridY });
         }
      });

      return targets;
    },
    execute: (gm, targetX, targetY, card) => {
      // Ищем, есть ли кто-то на этой клетке
      const targetUnit = gm.getUnitAt(targetX, targetY);
      
      // Если юнит есть и это враг (team 1)
      if (targetUnit && targetUnit.team === 1) {
          targetUnit.takeDamage(card.val);
          // Анимация эффекта (опционально, можно добавить позже)
          return true; // Успех
      }
      return false; // Не попали или не туда кликнули
    }
  },

  // --- ЛЕЧЕНИЕ ---
  heal: {
    getValidTargets: (gm, card) => {
      const player = gm.getPlayer();
      // Можно лечить только себя (пока что)
      return player ? [{ x: player.gridX, y: player.gridY }] : [];
    },
    execute: (gm, targetX, targetY, card) => {
      const targetUnit = gm.getUnitAt(targetX, targetY);
      
      // Проверяем, что лечим именно игрока (или союзника в будущем)
      if (targetUnit && targetUnit.team === 0) {
        targetUnit.takeDamage(-card.val); // Отрицательный урон = хил
        return true;
      }
      return false;
    }
  },

  // --- РЫВОК (DASH) ---
  dash: {
    getValidTargets: (gm, card) => {
      const range = card.range ?? 3;
      const player = gm.getPlayer();
      if (!player) return [];

      // Используем pathfinding GridManager'а
      const reachable = gm.gridManager.getReachableTiles(
        player.gridX,
        player.gridY,
        range
      );
      
      // Фильтруем клетки, где уже кто-то стоит
      return reachable
        .filter(pos => !gm.getUnitAt(pos.x, pos.y))
        .map(p => ({ x: p.x, y: p.y }));
    },
    execute: (gm, targetX, targetY, card) => {
      // Проверяем еще раз (вдруг ситуация изменилась)
      if (gm.getUnitAt(targetX, targetY)) return false;
      if (!gm.gridManager.isWalkable(targetX, targetY)) return false;

      const player = gm.getPlayer();
      
      // Перемещаем мгновенно или быстро
      player.moveTo(targetX, targetY);
      
      // Рывок часто сбрасывает очки движения или просто тратит ману
      // В твоей логике Dash стоил ману, но не тратил MovePoints (или наоборот)
      // Оставим просто перемещение
      return true;
    }
  }
};
