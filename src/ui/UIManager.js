import { GameState } from '../core/state/GameState.js';
import { EVENTS, UNIT_STATS } from '../data/constants.js';

export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;
    this.state = GameState.getInstance();

    this.hpEl = document.getElementById('player-hp-ui');
    this.manaEl = document.getElementById('player-mana-ui');

    this.deckEl = document.getElementById('deck-ui');
    this.discardEl = document.getElementById('discard-ui');

    this.handContainer = document.getElementById('hand-container');
    this.endTurnBtn = document.getElementById('end-turn-btn');

    this.endTurnBtn.addEventListener('click', () => this.gm.endTurn());

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

    const moveMax = UNIT_STATS.PLAYER.MOVE_POINTS;
    const base = `MP: ${player.mana}/${player.maxMana ?? 0} | Move: ${player.movePoints}/${moveMax}`;

    this.manaEl.innerText = this.gm.isAwaitingDiscard()
      ? `${base} | Discard: ${this.gm.pendingDiscard}`
      : base;
  }

  updateDeckCounters() {
    if (this.deckEl) this.deckEl.innerText = `Deck: ${this.state.deck?.length ?? 0}`;
    if (this.discardEl) this.discardEl.innerText = `Discard: ${this.state.discard?.length ?? 0}`;
  }

  renderHand() {
    this.handContainer.innerHTML = '';

    const hand = this.state.hand;
    const discardMode = this.gm.isAwaitingDiscard();

    hand.forEach((card, index) => {
      const el = document.createElement('div');
      el.className = 'card';

      if (!discardMode && this.gm.selectedCardIndex === index) el.classList.add('selected');
      if (discardMode) el.classList.add('discardable');

      const desc = discardMode ? 'Click to discard' : card.description;

      el.innerHTML = `
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${desc}</div>
      `;

      el.onclick = () => this.gm.onHandCardClick(index);
      this.handContainer.appendChild(el);
    });
  }
}
