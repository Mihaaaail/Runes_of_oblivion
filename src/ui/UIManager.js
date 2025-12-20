export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;

    // Твой HUD
    this.playerHpEl = document.getElementById('player-hp-ui');
    this.playerManaEl = document.getElementById('player-mana-ui');
    this.enemyHpEl = document.getElementById('enemy-hp-ui');

    this.handContainer = document.getElementById('hand-container');
    this.endTurnBtn = document.getElementById('end-turn-btn');

    if (this.endTurnBtn) {
      this.endTurnBtn.onclick = () => this.gm.endTurn();
    }
  }

  updateStats(player, enemy) {
    if (!player || !enemy) return;

    if (this.playerHpEl) this.playerHpEl.innerText = `HP: ${player.hp}/${player.maxHp}`;
    if (this.playerManaEl) this.playerManaEl.innerText = `MP: ${player.mana}/${player.maxMana}`;
    if (this.enemyHpEl) this.enemyHpEl.innerText = `HP: ${enemy.hp}/${enemy.maxHp}`;
  }

  renderHand(hand) {
    if (!this.handContainer) return;
    this.handContainer.innerHTML = '';

    (hand || []).forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      if (card.selected) cardEl.classList.add('selected');

      const costEl = document.createElement('div');
      costEl.className = 'card-cost';
      costEl.innerText = String(card.cost ?? 0);
      cardEl.appendChild(costEl);

      const nameEl = document.createElement('div');
      nameEl.className = 'card-name';
      nameEl.innerText = String(card.name ?? 'CARD');
      cardEl.appendChild(nameEl);

      const descEl = document.createElement('div');
      descEl.className = 'card-desc';
      descEl.innerText = String(card.desc ?? '');
      cardEl.appendChild(descEl);

      cardEl.onclick = (e) => {
        e.stopPropagation();
        this.gm.selectCard(index);
      };

      this.handContainer.appendChild(cardEl);
    });
  }

  showWaveNotification(wave) {
    // необязательно, но чтобы не ломалось если вызываешь
  }

  showGameOver(reason) {
    alert(reason);
  }
}
