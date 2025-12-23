// src/run/RunMapGenerator.js

export const NODE_TYPES = {
  FIGHT: 'FIGHT',
  REWARD: 'REWARD',
  EVENT: 'EVENT',
  SHOP: 'SHOP',
  BOSS: 'BOSS',
};

// --- Simple seeded RNG (deterministic map) ---
export function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    // LCG
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffleInPlace(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {{floors?: number, seed?: number}} params
 * @returns {{
 *  seed: number,
 *  floors: number,
 *  nodesByFloor: Array<Array<any>>,
 *  nodes: Map<string, any>,
 *  edges: Array<[string,string]>
 * }}
 */
export function generateRunMap({ floors = 9, seed = Date.now() } = {}) {
  const rng = makeRng(seed);

  // floors: 0..(floors-2) normal, last is boss
  const normalFloors = Math.max(1, floors - 1);

  const nodesByFloor = [];
  const edges = []; // [fromId, toId]
  const nodes = new Map(); // id -> node

  // Decide one SHOP floor in the middle (avoid 0 and last-1)
  const shopFloor = Math.max(
    2,
    Math.min(normalFloors - 2, 3 + Math.floor(rng() * 3))
  );

  // --- Create nodes ---
  for (let f = 0; f < normalFloors; f++) {
    // 2..3 nodes per floor
    const count = (f === 0) ? 2 : (rng() < 0.55 ? 3 : 2);

    const floorNodes = [];
    for (let i = 0; i < count; i++) {
      const id = `${f}-${i}`;

      let type = NODE_TYPES.FIGHT;

      if (f === shopFloor) {
        type = (i === 1 ? NODE_TYPES.SHOP : NODE_TYPES.FIGHT);
      } else if (f > 0) {
        // sprinkle events/rewards (keep fights dominant)
        const roll = rng();
        if (roll < 0.14) type = NODE_TYPES.EVENT;
        else if (roll < 0.26) type = NODE_TYPES.REWARD;
        else type = NODE_TYPES.FIGHT;
      }

      const node = { id, floor: f, index: i, type };
      nodes.set(id, node);
      floorNodes.push(node);
    }

    nodesByFloor.push(floorNodes);
  }

  // Boss floor
  const boss = { id: 'boss', floor: floors - 1, index: 0, type: NODE_TYPES.BOSS };
  nodes.set(boss.id, boss);
  nodesByFloor.push([boss]);

  // --- Create edges between consecutive floors with branching and some merges ---
  for (let f = 0; f < nodesByFloor.length - 1; f++) {
    const from = nodesByFloor[f];
    const to = nodesByFloor[f + 1];

    // For each from node connect to 1..2 targets
    for (const a of from) {
      const targets = [...to];
      shuffleInPlace(rng, targets);

      const degree = (to.length === 1) ? 1 : (rng() < 0.55 ? 2 : 1);
      for (let k = 0; k < degree; k++) {
        edges.push([a.id, targets[k % targets.length].id]);
      }
    }

    // Ensure each target has at least 1 incoming (fix disconnected)
    const incoming = new Map();
    for (const b of to) incoming.set(b.id, 0);

    for (const [u, v] of edges) {
      const nu = nodes.get(u);
      const nv = nodes.get(v);
      if (nu?.floor === f && nv?.floor === f + 1) {
        incoming.set(v, (incoming.get(v) ?? 0) + 1);
      }
    }

    for (const b of to) {
      if ((incoming.get(b.id) ?? 0) === 0) {
        const a = pick(rng, from);
        edges.push([a.id, b.id]);
      }
    }
  }

  return { seed, floors, nodesByFloor, nodes, edges };
}
