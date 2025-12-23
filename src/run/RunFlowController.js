// run/RunFlowController.js
import { RunController, RUN_ACTION } from './RunController.js';
import { renderRunMapSVG } from './RunMapView.js';
import { EVENTS } from '../data/constants.js';

function $(id) { return document.getElementById(id); }
function show(el) { el?.classList.remove('hidden'); }
function hide(el) { el?.classList.add('hidden'); }

export class RunFlowController {
  constructor({ gameManager }) {
    this.gameManager = gameManager;

    this.hud = $('ui-layer');
    this.sceneMenu = $('scene-menu');
    this.sceneMap = $('scene-map');

    this.btnNewRun = $('menu-new-run');
    this.btnOpenMap = $('menu-open-map');
    this.btnMapBackToMenu = $('map-back-to-menu');
    this.btnMapEnter = $('map-start-selected');
    this.mapSelectedInfo = $('map-selected-info');
    this.mapRunStatus = $('map-run-status');
    this.svgMap = $('run-map-active');

    this.shopModal = $('shop-modal');
    this.rewardModal = $('reward-modal');
    this.eventModal = $('event-modal');
    this.resultModal = $('result-modal');

    this.shopClose = $('shop-modal-close');
    this.rewardClose = $('reward-modal-close');
    this.eventClose = $('event-modal-close');
    this.resultClose = $('result-modal-close');

    this.run = new RunController({ floors: 9 });

    this._unsubRun = null;
    this._unsubWaveCompleted = null;
    this._unsubGameOver = null;
    this._activeModalCleanup = null;
  }

  init() {
    show(this.sceneMenu);
    hide(this.sceneMap);
    this._showHUD(false);

    this._unsubRun = this.run.subscribe((snapshot) => this._render(snapshot));

    this.btnNewRun?.addEventListener('click', () => this.startNewRun());
    this.btnOpenMap?.addEventListener('click', () => this.goToMap());
    this.btnMapBackToMenu?.addEventListener('click', () => this.goToMenu());
    this.btnMapEnter?.addEventListener('click', () => this.enterSelected());

    this.shopClose?.addEventListener('click', () => this._closeModal(this.shopModal));
    this.rewardClose?.addEventListener('click', () => this._closeModal(this.rewardModal));
    this.eventClose?.addEventListener('click', () => this._closeModal(this.eventModal));
    this.resultClose?.addEventListener('click', () => this._closeModal(this.resultModal));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.run.inBattle) {
          this.run.setInBattle(false);
          this.goToMap();
        } else {
          this.goToMenu();
        }
      }
      if (e.key.toLowerCase() === 'm') this.goToMap();
      if (e.key === 'Enter') this.enterSelected();
    });

    // победа: закрыть бой, отметить узел, вернуться на карту
    this._unsubWaveCompleted = this.gameManager.state.on(EVENTS.WAVE_COMPLETED, ({ encounter }) => {
      if (encounter?.nodeId) this.run.completeNode(encounter.nodeId);
      this.run.setInBattle(false);
      this.goToMap();
    });

    // поражение: показать Result, вернуться на карту (узел НЕ завершаем)
    this._unsubGameOver = this.gameManager.state.on(EVENTS.GAME_OVER, () => {
      show(this.resultModal);
      this.run.setInBattle(false);
      this.goToMap();
    });

    this._render(this.run.getSnapshot());
  }

  destroy() {
    this._unsubRun?.();
    this._unsubWaveCompleted?.();
    this._unsubGameOver?.();
    this._activeModalCleanup?.();
  }

  startNewRun() {
    const snap = this.run.startNewRun({ seed: Date.now(), floors: 9 });
    this.gameManager.startNewRun?.({ seed: snap.seed });

    hide(this.sceneMenu);
    show(this.sceneMap);
    this._showHUD(false);
  }

  goToMenu() {
    show(this.sceneMenu);
    hide(this.sceneMap);
    this._showHUD(false);
    this.run.clearSelection();
  }

  goToMap() {
    hide(this.sceneMenu);
    show(this.sceneMap);
    this._showHUD(false);
    this._render(this.run.getSnapshot());
  }

  enterSelected() {
    const action = this.run.enterSelected();

    if (action.kind === RUN_ACTION.MODAL) {
      this._openNodeModal(action.node);
      return;
    }

    if (action.kind === RUN_ACTION.ENCOUNTER) {
      hide(this.sceneMenu);
      hide(this.sceneMap);
      this._showHUD(true);
      this.gameManager.startEncounter(action.encounter);
    }
  }

  _openNodeModal(node) {
    const modal = this._getModalByNodeType(node.type);
    show(modal);

    this._activeModalCleanup?.();
    this._activeModalCleanup = null;

    const closeBtn = this._getCloseBtnByNodeType(node.type);

    const handler = () => {
      this._closeModal(modal);

      // авто-награда/эффект узла
      this.gameManager.applyNodeReward?.(node);

      // отметить узел как пройденный
      this.run.completeNode(node.id);
      this.run.clearSelection();
    };

    closeBtn?.addEventListener('click', handler);
    this._activeModalCleanup = () => closeBtn?.removeEventListener('click', handler);
  }

  _getModalByNodeType(type) {
    if (type === 'SHOP') return this.shopModal;
    if (type === 'REWARD') return this.rewardModal;
    if (type === 'EVENT') return this.eventModal;
    return this.resultModal;
  }

  _getCloseBtnByNodeType(type) {
    if (type === 'SHOP') return this.shopClose;
    if (type === 'REWARD') return this.rewardClose;
    if (type === 'EVENT') return this.eventClose;
    return this.resultClose;
  }

  _closeModal(modalEl) {
    hide(modalEl);
    this._activeModalCleanup?.();
    this._activeModalCleanup = null;
  }

  _showHUD(flag) {
    if (!this.hud) return;
    this.hud.style.display = flag ? '' : 'none';
  }

  _render(snapshot) {
    if (snapshot.map && this.svgMap) {
      renderRunMapSVG({
        svg: this.svgMap,
        map: snapshot.map,
        progress: snapshot.progress,
        onNodeClick: (node) => this.run.selectNode(node),
      });
    }

    const node = snapshot.selectedNode;
    if (!node) {
      if (this.btnMapEnter) this.btnMapEnter.disabled = true;
      if (this.mapSelectedInfo) this.mapSelectedInfo.innerText = 'Нажми на узел на карте.';
      return;
    }

    const allowed = snapshot.canEnterSelected;
    if (this.btnMapEnter) this.btnMapEnter.disabled = !allowed;

    if (this.mapSelectedInfo) {
      this.mapSelectedInfo.innerText = `Node: ${node.id}\nType: ${node.type}\nFloor: ${node.floor + 1}`;
    }

    if (this.mapRunStatus) {
      this.mapRunStatus.innerText = allowed
        ? 'Node selected. Press Enter to continue.'
        : 'This node is not available yet.';
    }
  }
}
