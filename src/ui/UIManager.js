export class UIManager {
    constructor(gameManager) {
        this.gm = gameManager;

        // Элементы интерфейса из index.html
        this.playerHpEl = document.getElementById('player-hp-ui');
        this.playerManaEl = document.getElementById('player-mana-ui');
        this.playerMpEl = document.getElementById('player-mp-ui');
        
        this.handContainer = document.getElementById('hand-container');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        this.waveNotifyEl = document.getElementById('wave-notification');

        // Привязка событий
        if (this.endTurnBtn) {
            this.endTurnBtn.onclick = () => this.gm.endTurn();
        }
    }

    /**
     * Обновляет текстовые значения статов.
     * @param {Unit} player - объект игрока
     */
    updateStats(player) {
        if (!player) return;

        if (this.playerHpEl) {
            this.playerHpEl.innerText = `HP: ${player.hp}/${player.maxHp}`;
            // Можно менять цвет, если мало HP
            this.playerHpEl.style.color = player.hp < player.maxHp * 0.3 ? '#ff0000' : 'var(--hp-color)';
        }

        if (this.playerManaEl) {
            this.playerManaEl.innerText = `MP: ${player.mana}/${player.maxMana}`;
        }

        if (this.playerMpEl) {
            this.playerMpEl.innerText = `Move: ${player.movePoints ?? 0}`;
        }
    }

    /**
     * Перерисовывает карты в руке.
     * @param {Array} hand - массив объектов карт
     */
    renderHand(hand) {
        if (!this.handContainer) return;

        this.handContainer.innerHTML = '';

        if (!hand || hand.length === 0) return;

        hand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';

            // Если карта выбрана в GameManager, добавляем класс для подсветки
            if (card.selected === true) {
                cardEl.classList.add('selected');
            }

            // --- Внутренности Карты ---
            
            // 1. Стоимость (Кружочек в углу)
            const costEl = document.createElement('div');
            costEl.className = 'card-cost';
            costEl.innerText = String(card.cost ?? 0);
            cardEl.appendChild(costEl);

            // 2. Название
            const nameEl = document.createElement('div');
            nameEl.className = 'card-name';
            nameEl.innerText = String(card.name ?? 'CARD');
            cardEl.appendChild(nameEl);

            // 3. Описание
            const descEl = document.createElement('div');
            descEl.className = 'card-desc';
            descEl.innerText = String(card.desc ?? '');
            cardEl.appendChild(descEl);

            // Событие клика
            cardEl.onclick = (e) => {
                e.stopPropagation(); // Чтобы клик не ушел на канвас
                this.gm.selectCard(index);
            };

            this.handContainer.appendChild(cardEl);
        });
    }

    /**
     * Показывает красивое уведомление о волне
     */
    showWaveNotification(wave) {
        if (!this.waveNotifyEl) return;

        this.waveNotifyEl.innerText = `WAVE ${wave}`;
        this.waveNotifyEl.style.opacity = '1';
        this.waveNotifyEl.style.transform = 'translate(-50%, -50%) scale(1.2)';
        this.waveNotifyEl.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        // Скрываем через 2 секунды
        setTimeout(() => {
            this.waveNotifyEl.style.opacity = '0';
            this.waveNotifyEl.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 2000);
    }

    /**
     * Экран победы/поражения (пока простой confirm, можно улучшить позже)
     */
    showGameOver(reason) {
        setTimeout(() => {
            const restart = confirm(`${reason}\n\nRestart Game?`);
            if (restart) location.reload();
        }, 500);
    }
}
