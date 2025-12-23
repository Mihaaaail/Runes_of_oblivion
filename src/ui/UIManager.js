import { GameState } from '../core/state/GameState.js';
import { EVENTS, UNIT_STATS } from '../data/constants.js';
import { CardLibrary } from '../data/CardLibrary.js';

export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;
    this.state = GameState.getInstance();

    this.hpEl = document.getElementById('player-hp-ui');
    this.manaEl = document.getElementById('player-mana-ui');

    this.deckEl = document.getElementById('deck-ui');
    this.discardEl = document.getElementById('discard-ui');
    this.deckCountEl = document.getElementById('deck-count');
    this.discardCountEl = document.getElementById('discard-count');

    this.handContainer = document.getElementById('hand-container');
    this.endTurnBtn = document.getElementById('end-turn-btn');

    // modal
    this.pileModal = document.getElementById('pile-modal');
    this.pileModalCard = document.getElementById('pile-modal-card');
    this.pileModalTitle = document.getElementById('pile-modal-title');
    this.pileModalBody = document.getElementById('pile-modal-body');
    this.pileModalClose = document.getElementById('pile-modal-close');

    this.endTurnBtn.addEventListener('click', () => this.gm.endTurn());

    // modal close handlers
    this.pileModalClose?.addEventListener('click', () => this.closePileModal());
    this.pileModal?.addEventListener('click', () => this.closePileModal());
    this.pileModalCard?.addEventListener('click', (e) => e.stopPropagation());

    // pile click handlers
    this.deckEl?.addEventListener('click', () => this.openPileModal('Draw pile', this.state.deck, 'draw'));
    this.discardEl?.addEventListener('click', () => this.openPileModal('Discard pile', this.state.discard, 'discard'));

    // events
    this.state.on(EVENTS.TURN_START, () => this.updateAll());
    this.state.on(EVENTS.UNIT_DAMAGED, () => this.updateStats());
    this.state.on(EVENTS.UNIT_HEALED, () => this.updateStats());

    this.state.on(EVENTS.HAND_CHANGED, () => this.renderHand());
    this.state.on(EVENTS.DECK_CHANGED, () => this.updateDeckCounters());
    this.state.on(EVENTS.DISCARD_CHANGED, () => this.updateDeckCounters());
  }

  updateAll() {
    this.updateStats();
    this.updateDeckCounters();
    this.renderHand();
    this.endTurnBtn.disabled = !this.state.isPlayerTurn || this.gm.isAwaitingDiscard();
  }

  updateStats() {
    const player = this.state.getPlayer();
    if (!player) return;

    this.hpEl.innerText = `HP: ${player.hp}/${player.maxHp ?? 0}`;

    const moveMax = UNIT_STATS.PLAYER.MOVE_POINTS ?? 3;
    let line = `MP: ${player.mana}/${player.maxMana ?? 0} | Move: ${player.movePoints}/${moveMax}`;

    if (this.gm.isAwaitingDiscard()) {
      line += ` | Discard: ${this.gm.pendingDiscard}`;
    }

    this.manaEl.innerText = line;
  }

  updateDeckCounters() {
    const deckN = this.state.deck?.length ?? 0;
    const discardN = this.state.discard?.length ?? 0;

    if (this.deckCountEl) this.deckCountEl.innerText = String(deckN);
    if (this.discardCountEl) this.discardCountEl.innerText = String(discardN);
  }

  renderHand() {
    this.handContainer.innerHTML = '';

    const hand = this.state.hand ?? [];
    const discardMode = this.gm.isAwaitingDiscard();

    hand.forEach((card, index) => {
      const el = document.createElement('div');
      el.className = 'card';

      if (!discardMode && this.gm.selectedCardIndex === index) el.classList.add('selected');
      if (discardMode) el.classList.add('discardable');

      const desc = discardMode ? 'Click to discard' : (card.description ?? '');

      el.innerHTML = `
        <div class="card-cost">${card.cost ?? 0}</div>
        <div class="card-name">${card.name ?? 'Card'}</div>
        <div class="card-desc">${desc}</div>
      `;

      el.onclick = () => this.gm.onHandCardClick(index);
      this.handContainer.appendChild(el);
    });
  }

  openPileModal(title, pileKeys, type) {
    if (!this.pileModal) return;

    const keys = pileKeys ?? [];
    const counts = this.aggregateKeys(keys);

    this.pileModalTitle.innerText = `${title} (${keys.length})`;

    const note = (type === 'draw')
      ? 'Shows what is inside the draw pile (counts by card type). Order is intentionally not displayed.'
      : 'Shows cards that were played/discarded (counts by card type).';

    const rows = counts.length
      ? counts.map(({ key, count }) => {
          const card = CardLibrary[key];
          const name = card?.name ?? key;
          const cost = card?.cost ?? 0;
          const desc = card?.description ?? '';
          return `
            <div class="pile-row">
              <div>
                <div class="pile-name">${name}</div>
                <div class="pile-desc">${desc}</div>
              </div>
              <div class="pile-right">${count}× (cost ${cost})</div>
            </div>
          `;
        }).join('')
      : `<div class="pile-row"><div class="pile-name">(empty)</div><div></div></div>`;

    this.pileModalBody.innerHTML = `
      <div class="pile-note">${note}</div>
      ${rows}
    `;

    this.pileModal.classList.remove('hidden');
  }

  closePileModal() {
    this.pileModal?.classList.add('hidden');
  }

  aggregateKeys(keys) {
    const map = new Map();
    for (const k of keys) map.set(k, (map.get(k) ?? 0) + 1);

    // sort by card name for readability
    const arr = Array.from(map.entries()).map(([key, count]) => ({ key, count }));
    arr.sort((a, b) => {
      const an = CardLibrary[a.key]?.name ?? a.key;
      const bn = CardLibrary[b.key]?.name ?? b.key;
      return an.localeCompare(bn);
    });
    return arr;
  }
}
