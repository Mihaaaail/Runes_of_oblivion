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
            this.game.endTurn();
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

    showGameOver(message) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.fontSize = '48px';
        overlay.style.fontWeight = 'bold';
        overlay.style.zIndex = '1000';
        overlay.innerHTML = `<div>${message}</div>`;
        
        // Кнопка рестарта
        const btn = document.createElement('button');
        btn.innerText = "RESTART";
        btn.style.display = "block";
        btn.style.margin = "20px auto";
        btn.style.padding = "10px 20px";
        btn.style.fontSize = "24px";
        btn.onclick = () => location.reload();
        
        overlay.firstElementChild.appendChild(btn);
        document.body.appendChild(overlay);
    }
}


