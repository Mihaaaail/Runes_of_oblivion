import { GameState } from '../core/state/GameState.js';
import { EVENTS } from '../data/constants.js';

export class UIManager {
    constructor(gameManager) {
        this.gm = gameManager;
        this.state = GameState.getInstance();
        
        this.hpEl = document.getElementById('player-hp-ui');
        this.manaEl = document.getElementById('player-mana-ui');
        this.handContainer = document.getElementById('hand-container');
        this.endTurnBtn = document.getElementById('end-turn-btn');

        this.endTurnBtn.addEventListener('click', () => this.gm.endTurn());

        // Подписки на обновление UI
        this.state.on(EVENTS.TURN_START, () => this.updateAll());
        this.state.on(EVENTS.UNIT_DAMAGED, () => this.updateStats());
        this.state.on(EVENTS.UNIT_HEALED, () => this.updateStats());
        this.state.on(EVENTS.CARD_PLAYED, () => this.renderHand());
    }

    updateAll() {
        this.updateStats();
        this.renderHand();
        this.endTurnBtn.disabled = !this.state.isPlayerTurn;
    }

    updateStats() {
        const player = this.state.getPlayer();
        if (player) {
            this.hpEl.innerText = `HP: ${player.hp}/${player.maxHp}`;
            this.manaEl.innerText = `MP: ${player.mana}/${player.maxMana}`;
        }
    }

    renderHand() {
        this.handContainer.innerHTML = '';
        const hand = this.state.hand;

        hand.forEach((card, index) => {
            const el = document.createElement('div');
            el.className = 'card';
            if (this.gm.selectedCardIndex === index) el.classList.add('selected');

            el.innerHTML = `
                <div class="card-cost">${card.cost}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-desc">Damage: ${card.value}</div>
            `;
            
            el.onclick = () => this.gm.selectCard(index);
            this.handContainer.appendChild(el);
        });
    }
}
