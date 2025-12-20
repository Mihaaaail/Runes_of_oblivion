export class UIManager {
  constructor(gameManager) {
    this.gm = gameManager;

    // --- Элементы UI (с проверками на существование) ---
    this.handContainer = document.getElementById('hand-container');
    this.endTurnBtn = document.getElementById('end-turn-btn');
    
    // Статы (под твой HTML)
    this.playerHpEl = document.getElementById('player-hp-ui');
    this.playerManaEl = document.getElementById('player-mana-ui');
    this.enemyHpEl = document.getElementById('enemy-hp-ui');

    // Экраны (если они есть)
    this.gameUI = document.getElementById('ui-layer') || document.getElementById('game-ui');
    this.mainMenu = document.getElementById('main-menu');
    this.levelScreen = document.getElementById('level-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');

    // --- Биндинг кнопок (БЕЗОПАСНЫЙ) ---
    if (this.endTurnBtn) {
      this.endTurnBtn.onclick = () => this.gm.endTurn();
    }

    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) startBtn.onclick = () => this.gm.startNewGame();

    const nextBtn = document.getElementById('next-level-btn');
    if (nextBtn) nextBtn.onclick = () => this.gm.startNextLevel();

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.onclick = () => location.reload();
  }

  updateStats(player, enemy) {
    if (!player || !enemy) return;

    // Обновляем твои красивые плашки
    if (this.playerHpEl) this.playerHpEl.innerText = `HP: ${player.hp}/${player.maxHp}`;
    if (this.playerManaEl) this.playerManaEl.innerText = `MP: ${player.mana}/${player.maxMana}`;
    if (this.enemyHpEl) this.enemyHpEl.innerText = `HP: ${enemy.hp}/${enemy.maxHp}`;
  }

  renderHand(hand) {
    if (!this.handContainer) return;
    this.handContainer.innerHTML = '';

    hand.forEach((card, index) => {
      const cardEl = document.createElement('div');
      
      // Используем твои классы из CSS
      cardEl.className = 'card';
      if (card.selected) cardEl.classList.add('selected');

      // Внутренности карты (структура под твой CSS)
      // .card-cost
      const costEl = document.createElement('div');
      costEl.className = 'card-cost';
      costEl.innerText = card.cost;
      cardEl.appendChild(costEl);

      // .card-name
      const nameEl = document.createElement('div');
      nameEl.className = 'card-name';
      nameEl.innerText = card.name;
      cardEl.appendChild(nameEl);

      // .card-desc (Описание)
      const descEl = document.createElement('div');
      descEl.className = 'card-desc';
      // Генерируем описание, если его нет
      let descText = card.desc || `${card.type.toUpperCase()}`;
      if (!card.desc) {
          if (card.type === 'attack') descText = `Deal ${card.val} DMG`;
          if (card.type === 'heal') descText = `Heal ${card.val} HP`;
          if (card.type === 'move') descText = `Move ${card.val} tiles`;
      }
      descEl.innerText = descText;
      cardEl.appendChild(descEl);

      // Клик
      cardEl.onclick = (e) => {
        e.stopPropagation();
        this.gm.selectCard(index);
      };

      this.handContainer.appendChild(cardEl);
    });
  }

  // Методы для меню (заглушки, чтобы не падал код GameManager)
  showMenu() { if (this.mainMenu) this.mainMenu.classList.remove('hidden'); }
  showGame() { if (this.gameUI) this.gameUI.classList.remove('hidden'); }
  showLevelComplete(floor) { 
      if (this.levelScreen) this.levelScreen.classList.remove('hidden'); 
      else alert(`FLOOR ${floor} CLEARED!`); // Фолбек если нет экрана
  }
  showGameOver(reason) { 
      if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
      else alert(reason); // Фолбек
  }
}
