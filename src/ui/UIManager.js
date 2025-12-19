export class UIManager {
    constructor(gameManager) {
        this.game = gameManager;
        
        this.handContainer = document.getElementById('hand-container');
        this.playerHp = document.getElementById('player-hp-ui');
        this.playerMana = document.getElementById('player-mana-ui');
        this.enemyHp = document.getElementById('enemy-hp-ui');
        this.endTurnBtn = document.getElementById('end-turn-btn');

        // Привязываем кнопку конца хода
        this.endTurnBtn.addEventListener('click', () => {
            console.log("Turn Ended");
            // В будущем здесь будет вызов this.game.endTurn();
        });
    }

    updateStats(player, enemy) {
        this.playerHp.innerText = `HP: ${player.hp}/${player.maxHp}`;
        this.playerMana.innerText = `MP: ${player.mana}/${player.maxMana}`;
        this.enemyHp.innerText = `HP: ${enemy.hp}/${enemy.maxHp}`;
    }

    renderHand(hand) {
        this.handContainer.innerHTML = ''; // Очищаем контейнер

        hand.forEach((card, index) => {
            const el = document.createElement('div');
            // Добавляем класс 'selected' если карта выбрана
            el.className = `card ${card.selected ? 'selected' : ''}`;
            
            el.innerHTML = `
                <div class="card-cost">${card.cost}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-desc">${card.desc}</div>
            `;
            
            // Обработчик клика по карте
            el.onclick = () => {
                this.game.selectCard(index);
            };

            this.handContainer.appendChild(el);
        });
    }
}
