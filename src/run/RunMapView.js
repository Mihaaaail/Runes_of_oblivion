// src/run/RunMapView.js

import { NODE_TYPES } from './RunMapGenerator.js';

export function typeColor(type) {
  switch (type) {
    case NODE_TYPES.FIGHT: return '#ff7070';
    case NODE_TYPES.REWARD: return '#ffd700';
    case NODE_TYPES.EVENT: return '#8f7bff';
    case NODE_TYPES.SHOP: return '#44ccaa';
    case NODE_TYPES.BOSS: return '#ff4444';
    default: return '#cccccc';
  }
}

export function typeIcon(type) {
  switch (type) {
    case NODE_TYPES.FIGHT: return '⚔';
    case NODE_TYPES.REWARD: return '★';
    case NODE_TYPES.EVENT: return '✦';
    case NODE_TYPES.SHOP: return '⛁';
    case NODE_TYPES.BOSS: return '☠';
    default: return '?';
  }
}

export function clearSvg(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function svgEl(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

/**
 * Layout that avoids "2 nodes on extreme sides" which creates long edges and a web.
 * This keeps floors with 2 nodes closer to center.
 */
export function computeRunMapLayout(map, {
  W = 1000,
  H = 600,
  paddingX = 90,
  paddingY = 60,
} = {}) {
  const floors = map.nodesByFloor.length; // includes boss
  const usableH = H - paddingY * 2;
  const stepY = (floors <= 1) ? 0 : usableH / (floors - 1);

  const pos = new Map(); // id -> {x,y}

  for (let f = 0; f < floors; f++) {
    const row = map.nodesByFloor[f];
    const n = row.length;

    const y = paddingY + f * stepY;
    const left = paddingX;
    const right = W - paddingX;

    let xs = [];

    if (n === 1) {
      xs = [(left + right) / 2];
    } else if (n === 2) {
      // center-ish points instead of extremes
      xs = [
        left + (right - left) * 0.35,
        left + (right - left) * 0.65,
      ];
    } else {
      const usableW = W - paddingX * 2;
      const stepX = usableW / (n - 1);
      xs = Array.from({ length: n }, (_, i) => left + i * stepX);
    }

    for (let i = 0; i < n; i++) {
      pos.set(row[i].id, { x: xs[i], y });
    }
  }

  return { W, H, paddingX, paddingY, pos };
}

/**
 * @param {{
 *  svg: SVGElement,
 *  map: { nodesByFloor: any[], nodes: Map, edges: Array<[string,string]> },
 *  progress: { cleared:Set<string>, frontier:Set<string>, selected:string|null },
 *  onNodeClick: (node:any) => void,
 *  options?: { W?:number, H?:number, paddingX?:number, paddingY?:number }
 * }} params
 */
export function renderRunMapSVG({ svg, map, progress, onNodeClick, options = {} }) {
  clearSvg(svg);

  const { W, H, pos } = computeRunMapLayout(map, options);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // --- Edges ---
  for (const [a, b] of map.edges) {
    const pa = pos.get(a);
    const pb = pos.get(b);
    if (!pa || !pb) continue;

    const line = svgEl('line');
    line.setAttribute('x1', pa.x);
    line.setAttribute('y1', pa.y);
    line.setAttribute('x2', pb.x);
    line.setAttribute('y2', pb.y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.18)');
    line.setAttribute('stroke-width', '2');
    line.style.pointerEvents = 'none';

    const isRelevant = progress.frontier.has(a) || progress.cleared.has(a);
    line.setAttribute('opacity', isRelevant ? '1' : '0.18');

    svg.appendChild(line);
  }

  // --- Nodes ---
  for (const [id, node] of map.nodes.entries()) {
    const p = pos.get(id);
    if (!p) continue;

    const g = svgEl('g');
    g.setAttribute('data-node-id', id);

    const isCleared = progress.cleared.has(id);
    const isFrontier = progress.frontier.has(id);
    const isSelected = progress.selected === id;

    const r = (node.type === NODE_TYPES.BOSS) ? 20 : 16;

    const circle = svgEl('circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', r);

    const base = typeColor(node.type);
    circle.setAttribute('fill', isCleared ? 'rgba(255,255,255,0.10)' : base);
    circle.setAttribute('stroke', isSelected ? '#00ff00' : 'rgba(0,0,0,0.45)');
    circle.setAttribute('stroke-width', isSelected ? '4' : '2');
    circle.setAttribute('opacity', (isFrontier || isCleared) ? '1' : '0.22');
    circle.style.cursor = isFrontier ? 'pointer' : 'default';

    const label = svgEl('text');
    label.setAttribute('x', p.x);
    label.setAttribute('y', p.y + 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', node.type === NODE_TYPES.BOSS ? '16' : '14');
    label.setAttribute('font-weight', '900');
    label.setAttribute('fill', isCleared ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.80)');
    label.textContent = typeIcon(node.type);
    label.style.pointerEvents = 'none';

    g.appendChild(circle);
    g.appendChild(label);

    if (isFrontier) {
      g.addEventListener('click', () => onNodeClick(node));
    }

    svg.appendChild(g);
  }
}
