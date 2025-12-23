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

    // scenes / hud
    this.hud = $('ui-layer');
    this.sceneMenu = $('scene-menu');
    this.sceneMap = $('scene-map');

    // map ui
    this.btnNewRun = $('menu-new-run');
    this.btnOpenMap = $('menu-open-map');
    this.btnMapBackToMenu = $('map-back-to-menu');
    this.btnMapEnter = $('map-start-selected');
    this.mapSelectedInfo = $('map-selected-info');
    this.mapRunStatus = $('map-run-status');
    this.svgMap = $('run-map-active');

    // modals
    this.shopModal = $('shop-modal');
    this.rewardModal = $('reward-modal');
    this.eventModal = $('event-modal');
    this.resultModal = $('result-modal');

    this.shopClose = $('shop-modal-close');
    this.rewardClose = $('reward-modal-close');
    this.eventClose = $('event-modal-close');
    this.resultClose = $('result-modal-close');

    // core run logic (без DOM)
    this.run = new RunController({ floors: 9 });

    // bindings
    this._unsubRun = null;
    this._unsubWaveCompleted = null;
    this._unsubGameOver = null;

    // one-shot modal close handler
    this._activeModalCleanup = null;
  }

  init() {
    // start in MENU
    show(this.sceneMenu);
    hide(this.sceneMap);
    this._showHUD(false);

    // render updates
    this._unsubRun = this.run.subscribe((snapshot) => this._render(snapshot));

    // buttons
    this.btnNewRun?.addEventListener('click', () => this.startNewRun());
    this.btnOpenMap?.addEventListener('click', () => this.goToMap());
    this.btnMapBackToMenu?.addEventListener('click', () => this.goToMenu());
    this.btnMapEnter?.addEventListener('click', () => this.enterSelected());

    // modal close buttons (просто закрывают; “завершение узла” ставим локальным handler-ом при открытии)
    this.shopClose?.addEventListener('click', () => this._closeModal(this.shopModal));
    this.rewardClose?.addEventListener('click', () => this._closeModal(this.rewardModal));
    this.eventClose?.addEventListener('click', () => this._closeModal(this.eventModal));
    this.resultClose?.addEventListener('click', () => this._closeModal(this.resultModal));

    // hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.run.inBattle) {
          // временно: просто показать карту и считать “не в бою”
          this.run.setInBattle(false);
          this.goToMap();
        } else {
          this.goToMenu();
        }
      }

      if (e.key.toLowerCase() === 'm') this.goToMap();
      if (e.key === 'Enter') this.enterSelected();
    });

    // game events -> run progression
    // победа: отмечаем узел пройденным и возвращаемся на карту
    this._unsubWaveCompleted = this.gameManager.state.on(EVENTS.WAVE_COMPLETED, ({ encounter }) => {
      if (encounter?.nodeId) this.run.completeNode(encounter.nodeId);
      this.run.setInBattle(false);
      this.goToMap();
    });

    // поражение: показать result modal
    this._unsubGameOver = this.gameManager.state.on(EVENTS.GAME_OVER, (_payload) => {
      show(this.resultModal);
      this.run.setInBattle(false);
      this.goToMap();
    });

    // initial render (empty)
    this._render(this.run.getSnapshot());
  }

  destroy() {
    this._unsubRun?.();
    this._unsubWaveCompleted?.();
    this._unsubGameOver?.();
    this._activeModalCleanup?.();
  }

  startNewRun() {
    this.run.startNewRun({ seed: Date.now(), floors: 9 });
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
      // hide map, show HUD and start encounter
      hide(this.sceneMenu);
      hide(this.sceneMap);
      this._showHUD(true);

      // запускаем бой как “энкаунтер одного узла”
      this.gameManager.startEncounter(action.encounter);
      return;
    }
  }

  _openNodeModal(node) {
    const modal = this._getModalByNodeType(node.type);

    // снять предыдущий “complete-on-close”, если забыли
    this._activeModalCleanup?.();
    this._activeModalCleanup = null;

    show(modal);

    // на закрытии: отметить узел пройденным
    const handler = () => {
      this._closeModal(modal);
      this.run.completeNode(node.id);
      this.run.clearSelection();
    };

    // one-shot: подписываемся на конкретную кнопку закрытия
    const closeBtn = this._getCloseBtnByNodeType(node.type);
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
    // map render
    if (snapshot.map && this.svgMap) {
      renderRunMapSVG({
        svg: this.svgMap,
        map: snapshot.map,
        progress: snapshot.progress,
        onNodeClick: (node) => this.run.selectNode(node),
      });
    }

    // selected info
    const node = snapshot.selectedNode;
    if (!node) {
      if (this.btnMapEnter) this.btnMapEnter.disabled = true;
      if (this.mapSelectedInfo) this.mapSelectedInfo.innerText = 'Нажми на узел на карте.';
      if (this.mapRunStatus) this.mapRunStatus.innerText = 'Choose your path.';
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
