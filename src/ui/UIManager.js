export class UIManager {
    constructor(gameManager) {
        this.game = gameManager;
        
        this.handContainer = document.getElementById('hand-container');
        this.playerHp = document.getElementById('player-hp-ui');
        this.playerMana = document.getElementById('player-mana-ui');
        this.enemyHp = document.getElementById('enemy-hp-ui');
        this.endTurnBtn = document.getElementById('end-turn-btn');

        this.endTurnBtn.addEventListener('click', () => {
            this.game.endTurn();
        });
    }

    updateStats(player, enemy) {
        this.playerHp.innerText = `HP: ${player.hp}/${player.maxHp}`;
        this.playerMana.innerText = `MP: ${player.mana}/${player.maxMana}`;
        
        // Если враг умер, пишем 0
        const enemyCurrentHp = Math.max(0, enemy.hp);
        this.enemyHp.innerText = `HP: ${enemyCurrentHp}/${enemy.maxHp}`;
    }

    renderHand(hand) {
        this.handContainer.innerHTML = ''; 

        hand.forEach((card, index) => {
            const el = document.createElement('div');
            el.className = `card ${card.selected ? 'selected' : ''}`;
            
            el.innerHTML = `
                <div class="card-cost">${card.cost}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-desc">${card.desc}</div>
            `;
            
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
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = '#ff4444';
        overlay.style.fontSize = '48px';
        overlay.style.fontWeight = 'bold';
        overlay.style.zIndex = '1000';
        overlay.style.fontFamily = 'Verdana';
        
        overlay.innerHTML = `<div class="game-over-msg">${message}</div>`;
        
        const btn = document.createElement('button');
        btn.innerText = "TRY AGAIN";
        btn.style.marginTop = "30px";
        btn.style.padding = "15px 40px";
        btn.style.fontSize = "24px";
        btn.style.background = "#ff4444";
        btn.style.border = "none";
        btn.style.color = "white";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        btn.style.borderRadius = "8px";
        
        btn.onclick = () => location.reload();
        
        overlay.appendChild(btn);
        document.body.appendChild(overlay);
    }

    // НОВЫЙ МЕТОД: Уведомление о волне
    showWaveNotification(waveNum) {
        const div = document.createElement('div');
        div.innerText = `WAVE ${waveNum}`;
        div.style.position = 'absolute';
        div.style.top = '40%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.fontSize = '80px';
        div.style.fontWeight = '900';
        div.style.color = '#ffcc00';
        div.style.textShadow = '0 0 30px rgba(255, 100, 0, 0.8)';
        div.style.pointerEvents = 'none';
        div.style.opacity = '0';
        div.style.transition = 'all 0.5s ease-out';
        div.style.fontFamily = 'Verdana, sans-serif';
        div.style.zIndex = '500';
        
        document.body.appendChild(div);
        
        // Анимация CSS через JS
        requestAnimationFrame(() => {
            div.style.opacity = '1';
            div.style.transform = 'translate(-50%, -50%) scale(1.2)';
            
            setTimeout(() => {
                div.style.opacity = '0';
                div.style.transform = 'translate(-50%, -50%) scale(1.5)';
                setTimeout(() => div.remove(), 500);
            }, 1500);
        });
    }
}
