// src/AssetsManifest.js

// ЦВЕТОВАЯ ПАЛИТРА (Grim Dark / High Fantasy)
const C = {
    hero_primary: '#2980b9',    // Благородный синий
    hero_accent: '#3498db',     // Светлый синий
    enemy_primary: '#c0392b',   // Кровавый красный
    enemy_accent: '#e74c3c',    // Алый
    ghost: '#8e44ad',           // Мистический фиолетовый
    metal: '#95a5a6',           // Металл
    gold: '#f1c40f'             // Золото
};

// 1. ГЕРОЙ (Абстрактный рыцарь / Монолит)
const heroSvg = `
<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${C.hero_accent};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${C.hero_primary};stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Тень -->
  <ellipse cx="32" cy="75" rx="20" ry="8" fill="black" opacity="0.4"/>
  <!-- Тело (Щит-Монолит) -->
  <path d="M12 20 L32 5 L52 20 L52 55 L32 75 L12 55 Z" fill="url(#heroGrad)" stroke="#1a5276" stroke-width="2"/>
  <!-- Символ (Крест/Меч) -->
  <path d="M32 15 L32 65 M20 30 L44 30" stroke="white" stroke-width="4" stroke-linecap="round"/>
  <!-- Глаза (Свечение) -->
  <circle cx="26" cy="25" r="2" fill="${C.gold}"/>
  <circle cx="38" cy="25" r="2" fill="${C.gold}"/>
</svg>
`;

// 2. ВРАГ (Шипастая Сущность)
const enemySvg = `
<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="enemyGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:${C.enemy_accent};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${C.enemy_primary};stop-opacity:1" />
    </radialGradient>
  </defs>
  <ellipse cx="32" cy="75" rx="20" ry="8" fill="black" opacity="0.4"/>
  <!-- Тело (Хаос) -->
  <path d="M32 65 Q10 65 10 35 Q10 5 32 5 Q54 5 54 35 Q54 65 32 65 Z" fill="url(#enemyGrad)" stroke="#641e16" stroke-width="2"/>
  <!-- Шипы -->
  <path d="M10 35 L-5 25 L10 25 Z" fill="${C.enemy_primary}"/>
  <path d="M54 35 L69 25 L54 25 Z" fill="${C.enemy_primary}"/>
  <path d="M32 5 L32 -10 L40 5 Z" fill="${C.enemy_primary}"/>
  <!-- Глаз (Циклоп) -->
  <circle cx="32" cy="30" r="8" fill="#500"/>
  <circle cx="32" cy="30" r="3" fill="#ff0"/>
</svg>
`;

// 3. ПРИЗРАК (Эфирный Дух)
const ghostSvg = `
<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 70 Q15 10 32 10 Q49 10 49 70 L43 60 L38 70 L32 60 L26 70 L21 60 Z" 
        fill="${C.ghost}" fill-opacity="0.7" stroke="white" stroke-width="1"/>
  <!-- Пустые глаза -->
  <ellipse cx="25" cy="35" rx="3" ry="5" fill="white"/>
  <ellipse cx="39" cy="35" rx="3" ry="5" fill="white"/>
</svg>
`;

// 4. СТЕНА (Рунный Камень)
const rockSvg = `
<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Тени -->
  <path d="M2 25 L32 40 L32 75 L2 60 Z" fill="#34495e" stroke="#2c3e50" stroke-width="1"/>
  <path d="M32 40 L62 25 L62 60 L32 75 Z" fill="#4a6278" stroke="#2c3e50" stroke-width="1"/>
  <!-- Верх -->
  <path d="M2 25 L32 10 L62 25 L32 40 Z" fill="#5d6d7e" stroke="#2c3e50" stroke-width="1"/>
  <!-- Руна (высечена) -->
  <path d="M20 50 L32 55 L44 45" fill="none" stroke="#2c3e50" stroke-width="2" opacity="0.5"/>
</svg>
`;

// 5. АЛТАРЬ
const shrineSvg = `
<svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 60 L32 70 L54 60 L32 50 Z" fill="#444"/>
  <rect x="27" y="30" width="10" height="30" fill="#666"/>
  <circle cx="32" cy="20" r="12" fill="#0ff" stroke="white" stroke-width="2">
     <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite"/>
     <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite"/>
  </circle>
</svg>
`;

export const HERO_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(heroSvg);
export const ENEMY_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(enemySvg);
export const GHOST_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ghostSvg);
export const ROCK_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(rockSvg);
export const SHRINE_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(shrineSvg);
// Заглушка для совместимости
export const FLOOR_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg></svg>');
