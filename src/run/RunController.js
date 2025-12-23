// run/RunController.js
import { generateRunMap, NODE_TYPES } from './RunMapGenerator.js';

export const RUN_ACTION = {
  NONE: 'NONE',
  MODAL: 'MODAL',
  ENCOUNTER: 'ENCOUNTER',
};

export class RunController {
  constructor({ floors = 9 } = {}) {
    this.floors = floors;

    this.map = null;
    this.seed = null;

    this.progress = {
      cleared: new Set(),
      frontier: new Set(),
      selected: null,
    };

    this.inBattle = false;

    this._listeners = new Set();
  }

  // ---- subscriptions ----
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    for (const fn of this._listeners) fn(this.getSnapshot());
  }

  // ---- snapshot / getters ----
  getSnapshot() {
    return {
      floors: this.floors,
      seed: this.seed,
      map: this.map,
      progress: this.progress,
      inBattle: this.inBattle,
      selectedNode: this.getSelectedNode(),
      canEnterSelected: this.canEnterSelected(),
    };
  }

  getSelectedNode() {
    if (!this.map) return null;
    const id = this.progress.selected;
    if (!id) return null;
    return this.map.nodes.get(id) ?? null;
  }

  canEnterSelected() {
    const id = this.progress.selected;
    if (!id) return false;
    return this.progress.frontier.has(id);
  }

  // ---- run lifecycle ----
  startNewRun({ seed = Date.now(), floors = this.floors } = {}) {
    this.floors = floors;
    this.seed = seed;

    this.map = generateRunMap({ floors, seed });

    this.progress.cleared = new Set();
    this.progress.frontier = new Set(this.map.nodesByFloor[0].map(n => n.id));
    this.progress.selected = null;

    this.inBattle = false;

    this._emit();
    return this.getSnapshot();
  }

  // ---- selection ----
  clearSelection() {
    this.progress.selected = null;
    this._emit();
  }

  selectNode(nodeOrId) {
    const id = typeof nodeOrId === 'string' ? nodeOrId : (nodeOrId?.id ?? null);
    this.progress.selected = id;
    this._emit();
  }

  // ---- progression ----
  completeNode(nodeId) {
    if (!this.map) return;

    this.progress.cleared.add(nodeId);
    this.progress.frontier.delete(nodeId);

    // unlock outgoing edges to next nodes
    for (const [a, b] of this.map.edges) {
      if (a === nodeId && !this.progress.cleared.has(b)) {
        this.progress.frontier.add(b);
      }
    }

    // drop invalid selection
    if (this.progress.selected && !this.progress.frontier.has(this.progress.selected)) {
      this.progress.selected = null;
    }

    this._emit();
  }

  // ---- entering nodes ----
  enterSelected() {
    if (!this.map) return { kind: RUN_ACTION.NONE };
    const node = this.getSelectedNode();
    if (!node) return { kind: RUN_ACTION.NONE };
    if (!this.progress.frontier.has(node.id)) return { kind: RUN_ACTION.NONE };

    if (node.type === NODE_TYPES.SHOP || node.type === NODE_TYPES.REWARD || node.type === NODE_TYPES.EVENT) {
      return {
        kind: RUN_ACTION.MODAL,
        modalType: node.type,    // SHOP/REWARD/EVENT
        nodeId: node.id,
        node,
      };
    }

    // FIGHT/BOSS -> battle encounter
    this.inBattle = true;
    this._emit();

    return {
      kind: RUN_ACTION.ENCOUNTER,
      nodeId: node.id,
      encounter: {
        nodeId: node.id,
        type: node.type,         // FIGHT/BOSS
        floor: node.floor,
      },
      node,
    };
  }

  setInBattle(flag) {
    this.inBattle = !!flag;
    this._emit();
  }
}
