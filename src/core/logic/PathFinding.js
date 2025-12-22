import { GameState } from '../state/GameState.js';

export class PathFinding {
  static getNeighbors(x, y) {
    return [
      { x: x + 1, y: y },
      { x: x - 1, y: y },
      { x: x, y: y + 1 },
      { x: x, y: y - 1 },

      { x: x + 1, y: y + 1 },
      { x: x - 1, y: y - 1 },
      { x: x + 1, y: y - 1 },
      { x: x - 1, y: y + 1 },
    ];
  }

  // Возвращает путь ВКЛЮЧАЯ стартовую клетку
  static findPath(startX, startY, targetX, targetY) {
    const state = GameState.getInstance();

    if (startX === targetX && startY === targetY) {
      return [{ x: startX, y: startY }];
    }

    const startKey = `${startX},${startY}`;
    const visited = new Set([startKey]);
    const queue = [
      { x: startX, y: startY, path: [{ x: startX, y: startY }] },
    ];

    while (queue.length > 0) {
      const { x, y, path } = queue.shift();

      for (const n of this.getNeighbors(x, y)) {
        const key = `${n.x},${n.y}`;
        if (visited.has(key)) continue;

        const isTarget = n.x === targetX && n.y === targetY;

        if (!isTarget && !state.isWalkable(n.x, n.y)) continue;

        const nextPath = [...path, { x: n.x, y: n.y }];
        visited.add(key);

        if (isTarget) return nextPath;

        queue.push({ x: n.x, y: n.y, path: nextPath });
      }
    }

    return null;
  }

  static getReachableTiles(startX, startY, movePoints) {
    const state = GameState.getInstance();

    const results = [];
    const visited = new Set([`${startX},${startY}`]);
    const queue = [{ x: startX, y: startY, steps: 0 }];

    while (queue.length > 0) {
      const { x, y, steps } = queue.shift();

      if (steps > 0) results.push({ x, y });
      if (steps >= movePoints) continue;

      for (const n of this.getNeighbors(x, y)) {
        const key = `${n.x},${n.y}`;
        if (visited.has(key)) continue;
        if (!state.isWalkable(n.x, n.y)) continue;

        visited.add(key);
        queue.push({ x: n.x, y: n.y, steps: steps + 1 });
      }
    }

    return results;
  }
}
