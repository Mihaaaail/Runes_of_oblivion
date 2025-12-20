// Векторная графика (SVG)

// HERO (синий щит)
// 1) ГЕРОЙ (синий щит + белый крест)
const heroSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="bglow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3cf0ff"/>
      <stop offset="100%" stop-color="#1b39ff"/>
    </linearGradient>
  </defs>

  <path d="M32 8 C24 12 16 14 12 14 V30 C12 44 22 54 32 58 C42 54 52 44 52 30 V14 C48 14 40 12 32 8 Z"
        fill="url(#bg)" stroke="#9df7ff" stroke-width="2.5" filter="url(#bglow)"/>
  <path d="M32 18 V44" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <path d="M22 30 H42" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
</svg>
`;

// 2) ВРАГ (красная рожица)
const enemySvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="rglow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <circle cx="32" cy="32" r="22" fill="#240000" stroke="#ff3333" stroke-width="3" filter="url(#rglow)"/>
  <circle cx="25" cy="30" r="4" fill="#ff3333"/>
  <circle cx="39" cy="30" r="4" fill="#ff3333"/>
  <path d="M22 45 Q32 37 42 45" stroke="#ff3333" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>
`;

// 3) ПРИЗРАК (фиолетовый + бирюзовые глаза)
const ghostSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="pglow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <path d="M12 52 C12 22 20 10 32 10 C44 10 52 22 52 52
           L46 46 L40 52 L34 46 L28 52 L22 46 L18 52 Z"
        fill="#3b0d78" stroke="#b36cff" stroke-width="3" filter="url(#pglow)"/>
  <circle cx="25" cy="30" r="4" fill="#00ffd9"/>
  <circle cx="39" cy="30" r="4" fill="#00ffd9"/>
</svg>
`;


// FLOOR (тёмно‑зелёная плитка, “как раньше”)
const floorSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f2a22"/>
      <stop offset="100%" stop-color="#081814"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#fg)"/>
  <rect x="1" y="1" width="62" height="62" fill="none" stroke="#1e3d33" stroke-width="2"/>
  <path d="M0 48 L48 0" stroke="#0b1f19" stroke-width="2" opacity="0.45"/>
  <path d="M16 64 L64 16" stroke="#0b1f19" stroke-width="2" opacity="0.35"/>
</svg>
`;

// ROCK (стена)
const rockSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <path d="M14 48 L22 22 L42 16 L54 30 L46 54 L26 56 Z"
        fill="#4b4f55" stroke="#2a2d31" stroke-width="3"/>
  <path d="M22 22 L32 34 L42 30" fill="none" stroke="#1f2124" stroke-width="2" opacity="0.8"/>
</svg>
`;

// SHRINE (алтарь)
const shrineSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <filter id="yglow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.6" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect x="18" y="28" width="28" height="28" rx="6" fill="#2b2b2b" stroke="#666" stroke-width="2"/>
  <circle cx="32" cy="22" r="10" fill="#ffd34d" stroke="#ff9f1a" stroke-width="2" filter="yglow"/>
  <path d="M32 16 V40" stroke="#fff1b0" stroke-width="5" stroke-linecap="round"/>
  <path d="M24 24 H40" stroke="#fff1b0" stroke-width="5" stroke-linecap="round"/>
</svg>
`;

export const HERO_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(heroSvg);
export const ENEMY_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(enemySvg);
export const GHOST_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ghostSvg);
export const FLOOR_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(floorSvg);
export const ROCK_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(rockSvg);
export const SHRINE_IMG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(shrineSvg);
