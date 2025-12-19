// Векторная графика (SVG) - выглядит четко и "дорого"
// Стиль: Dark Fantasy Neon

// 1. ГЕРОЙ: Шлем с голубым свечением
const heroSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="30" fill="#1a1a2e" stroke="#4a4e69" stroke-width="2"/>
  <path d="M32 8 L52 18 V36 C52 48 32 58 32 58 C32 58 12 48 12 36 V18 L32 8Z" fill="#16213e" stroke="#00d4ff" stroke-width="2" filter="url(#glow)"/>
  <path d="M32 15 V52 M20 25 L44 25" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="32" cy="25" r="4" fill="#00d4ff" filter="url(#glow)"/>
</svg>`;

// 2. ВРАГ: Череп с красными глазами
const enemySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="evilGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#1a0505" stroke="#4a0a0a" stroke-width="2"/>
  <path d="M18 20 Q32 10 46 20 Q52 35 46 45 Q40 55 32 58 Q24 55 18 45 Q12 35 18 20Z" fill="#2d0a0a" stroke="#ff0000" stroke-width="2"/>
  <circle cx="25" cy="30" r="4" fill="#ff0000" filter="url(#evilGlow)"/>
  <circle cx="39" cy="30" r="4" fill="#ff0000" filter="url(#evilGlow)"/>
  <path d="M26 48 L32 44 L38 48" stroke="#ff0000" stroke-width="2" fill="none"/>
</svg>`;

// 3. ПОЛ: Темная плитка с рунами
const floorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#111111"/>
  <rect x="2" y="2" width="60" height="60" fill="#1a1a1a" stroke="#333" stroke-width="1"/>
  <path d="M10 10 L20 20 M54 54 L44 44" stroke="#222" stroke-width="2"/>
  <circle cx="32" cy="32" r="2" fill="#222"/>
</svg>`;

// Конвертируем в формат, понятный браузеру
export const HERO_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(heroSvg);
export const ENEMY_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(enemySvg);
export const FLOOR_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(floorSvg);
