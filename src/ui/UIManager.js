export class UIManager {
    constructor(gameManager) {
        this.gm = gameManager;

        // Элементы
        this.statsDiv = document.getElementById('ui-stats');
        this.handContainer = document.getElementById('hand-container');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        
        this.gameUI = document.getElementById('game-ui');
        this.mainMenu = document.getElementById('main-menu');
        this.levelScreen = document.getElementById('level-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');

        // Кнопки меню
        document.getElementById('start-game-btn').onclick = () => this.gm.startNewGame();
        document.getElementById('next-level-btn').onclick = () => this.gm.startNextLevel();
        document.getElementById('restart-btn').onclick = () => this.gm.startNewGame();
        
        this.endTurnBtn.onclick = () => this.gm.endTurn();
    }

    showMenu() {
        this.hideAll();
        this.mainMenu.classList.remove('hidden');
    }

    showGame() {
        this.hideAll();
        this.gameUI.classList.remove('hidden');
    }

    showLevelComplete(floor) {
        this.hideAll();
        document.getElementById('level-title').innerText = `FLOOR ${floor} CLEARED`;
        this.levelScreen.classList.remove('hidden');
    }

    showGameOver(reason) {
        this.hideAll();
        document.getElementById('death-reason').innerText = reason;
        this.gameOverScreen.classList.remove('hidden');
    }

    hideAll() {
        this.mainMenu.classList.add('hidden');
        this.gameUI.classList.add('hidden');
        this.levelScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    updateStats(player, enemy) {
        if (!player || !enemy) return;
        this.statsDiv.innerHTML = `
            PLAYER HP: ${player.hp}/${player.maxHp} | MANA: ${player.mana}/${player.maxMana} <br>
            FLOOR: ${this.gm.floor} <br>
            ENEMY HP: ${enemy.hp}/${enemy.maxHp} (${enemy.type.toUpperCase()})
        `;
    }

    renderHand(hand) {
        this.handContainer.innerHTML = '';
        hand.forEach((card, index) => {
            const btn = document.createElement('div');
            btn.className = 'card';
            
            // Цвета для карт
            let borderColor = '#fff';
            if (card.type === 'attack') borderColor = '#ff4444';
            if (card.type === 'fireball') borderColor = '#ff8800';
            if (card.type === 'move') borderColor = '#44ff44';
            if (card.type === 'push') borderColor = '#00ffff';

            btn.style.border = card.selected ? `3px solid ${borderColor}` : '1px solid #555';
            btn.style.background = '#222';
            btn.style.color = '#fff';
            btn.style.padding = '10px';
            btn.style.minWidth = '80px';
            btn.style.textAlign = 'center';
            btn.style.cursor = 'pointer';
            if (card.selected) btn.style.transform = 'translateY(-10px)';

            btn.innerHTML = `
                <div style="color:${borderColor}; font-weight:bold">${card.type.toUpperCase()}</div>
                <div style="font-size:12px">Cost: ${card.cost}</div>
                <div style="font-size:12px">Val: ${card.val}</div>
                <div style="font-size:10px; color:#aaa">Rng: ${card.range}</div>
            `;
            
            btn.onclick = () => this.gm.selectCard(index);
            this.handContainer.appendChild(btn);
        });
    }
}
