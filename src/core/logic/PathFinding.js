import { GameState } from '../state/GameState.js';

export class PathFinding {
    static findPath(startX, startY, targetX, targetY) {
        const state = GameState.getInstance();
        
        // УБРАЛ ПРОВЕРКУ !state.isWalkable(targetX, targetY)
        // Потому что если мы идем атаковать врага, targetX/Y будет занят врагом, и это НОРМАЛЬНО.

        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const { x, y, path } = queue.shift();

            if (x === targetX && y === targetY) {
                return path; 
            }

            // 8 соседей
            const neighbors = [
                { x: x + 1, y: y }, { x: x - 1, y: y },
                { x: x, y: y + 1 }, { x: x, y: y - 1 },
                { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
                { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }
            ];

            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                if (visited.has(key)) continue;

                // ВАЖНОЕ ИСПРАВЛЕНИЕ:
                // Если клетка - это наша ЦЕЛЬ (targetX, targetY), мы разрешаем ее добавить в путь,
                // даже если она занята (isWalkable == false).
                // Иначе мы никогда не построим путь к врагу.
                const isTarget = (n.x === targetX && n.y === targetY);
                
                if (!isTarget && !state.isWalkable(n.x, n.y)) {
                    continue;
                }

                visited.add(key);
                queue.push({ 
                    x: n.x, 
                    y: n.y, 
                    path: [...path, { x: n.x, y: n.y }] 
                });
            }
        }
        
        // Если пути нет (реально заблокирован стенами)
        return null; 
    }

    static getReachableTiles(startX, startY, movePoints) {
        const state = GameState.getInstance();
        const results = [];
        const visited = new Set();
        const queue = [{ x: startX, y: startY, steps: 0 }];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const { x, y, steps } = queue.shift();

            if (steps > 0) {
                results.push({ x, y });
            }

            if (steps >= movePoints) continue;

            const neighbors = [
                { x: x + 1, y: y }, { x: x - 1, y: y },
                { x: x, y: y + 1 }, { x: x, y: y - 1 },
                { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
                { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }
            ];

            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                if (!visited.has(key) && state.isWalkable(n.x, n.y)) {
                    visited.add(key);
                    queue.push({ x: n.x, y: n.y, steps: steps + 1 });
                }
            }
        }
        
        return results;
    }
}
