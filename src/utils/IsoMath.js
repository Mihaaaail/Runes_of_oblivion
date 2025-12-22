// src/utils/IsoMath.js

// Настройки размера тайла.
// Ширина 64 и Высота 32 дают классическую изометрию 2:1.
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export const IsoMath = {
    /**
     * Переводит координаты сетки (gridX, gridY) в экранные координаты (x, y).
     * @param {number} gx - координата X в сетке
     * @param {number} gy - координата Y в сетке
     * @returns {Object} {x, y}
     */
    gridToIso: (gx, gy) => {
        return {
            x: (gx - gy) * TILE_WIDTH / 2,
            y: (gx + gy) * TILE_HEIGHT / 2
        };
    },

    /**
     * Рассчитывает Z-index (глубину) для отрисовки.
     * В изометрии: чем больше X и Y, тем объект "ближе" к зрителю (ниже на экране).
     * Умножаем на 10, чтобы оставить место для слоев (например, эффекты на полу).
     */
    getDepth: (gx, gy) => {
        return (gx + gy) * 10;
    }
};
