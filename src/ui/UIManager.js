export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;

    // HUD
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
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '12%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '10px 16px';
    el.style.borderRadius = '10px';
    el.style.background = 'rgba(0,0,0,0.65)';
    el.style.border = '1px solid rgba(255,255,255,0.15)';
    el.style.color = '#fff';
    el.style.fontFamily = 'Verdana, sans-serif';
    el.style.letterSpacing = '2px';
    el.style.textTransform = 'uppercase';
    el.style.zIndex = '9999';
    el.innerText = `Wave ${wave}`;

    document.body.appendChild(el);

    setTimeout(() => {
      el.style.transition = 'opacity 250ms ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 260);
    }, 800);
  }

  showWaveCleared(wave) {
    const next = confirm(`WAVE ${wave} CLEARED.\nNext wave?`);
    if (next) {
      this.gm.startNextWave();
      this.gm.beginPlayerTurn();
    } else {
      this.showGameOver(`VICTORY (Wave ${wave})`);
    }
  }

  showGameOver(reason) {
    const restart = confirm(`${reason}\n\nRestart?`);
    if (restart) location.reload();
  }
}
