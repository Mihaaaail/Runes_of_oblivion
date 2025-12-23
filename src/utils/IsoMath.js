import { TILE_WIDTH, TILE_HEIGHT } from '../data/constants.js';

export const IsoMath = {
  // Сетка -> Пиксели
  gridToIso: (gx, gy) => {
    const x = (gx - gy) * (TILE_WIDTH / 2);
    const y = (gx + gy) * (TILE_HEIGHT / 2);
    return { x, y };
  },

  // Глубина (z-index)
  getDepth: (gx, gy) => {
    return (gx + gy) * 10;
  },

  // Расстояние для сетки с диагоналями (Chebyshev)
  getDistance: (u1, u2) => {
    return Math.max(Math.abs(u1.x - u2.x), Math.abs(u1.y - u2.y));
  },
};
