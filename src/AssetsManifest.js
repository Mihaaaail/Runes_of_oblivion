// Векторная графика (SVG)

// 1. ГЕРОЙ
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

// 2. ВРАГ (Скелет - Melee)
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

// 3. НОВЫЙ ВРАГ: ПРИЗРАК (Ranged)
const ghostSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="ghostGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Тело призрака -->
  <path d="M32 10 Q12 10 12 30 V50 L22 40 L32 50 L42 40 L52 50 V30 Q52 10 32 10Z" fill="#1a0033" stroke="#8800ff" stroke-width="2" opacity="0.9"/>
  <!-- Глаза -->
  <circle cx="24" cy="25" r="3" fill="#cc88ff" filter="url(#ghostGlow)"/>
  <circle cx="40" cy="25" r="3" fill="#cc88ff" filter="url(#ghostGlow)"/>
</svg>`;

// 4. ПОЛ (Темно-Зеленый / Изумрудный)
const floorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0b1e11"/>
  <rect x="2" y="2" width="60" height="60" fill="#0f2b1d" stroke="#1b4f32" stroke-width="2"/>
  <path d="M10 10 L20 20 M54 54 L44 44" stroke="#236b42" stroke-width="2" opacity="0.4"/>
  <circle cx="32" cy="32" r="1.5" fill="#236b42" opacity="0.6"/>
</svg>`;

export const HERO_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(heroSvg);
export const ENEMY_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(enemySvg);
export const GHOST_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ghostSvg);
export const FLOOR_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(floorSvg);
