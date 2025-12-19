export class DeckManager {
    constructor() {
        // Шаблон всех возможных карт
        this.cardLibrary = [
            { id: 'fireball', name: "Fireball", type: "attack", cost: 1, val: 5, range: 3, desc: "Deal 5 dmg (Range 3)" },
            { id: 'heal', name: "Heal", type: "heal", cost: 1, val: 5, range: 0, desc: "Heal 5 HP" },
            { id: 'dash', name: "Dash", type: "move", cost: 0, val: 3, range: 3, desc: "Move to tile (Range 3)" },
            { id: 'smite', name: "Smite", type: "attack", cost: 2, val: 10, range: 2, desc: "Deal 10 dmg (Range 2)" },
            { id: 'strike', name: "Strike", type: "attack", cost: 1, val: 4, range: 1, desc: "Deal 4 dmg (Range 1)" }
        ];

        this.deck = [];
        this.discardPile = [];
        this.hand = [];

        // Начальная колода (собираем из библиотеки)
        this.buildStarterDeck();
    }

    buildStarterDeck() {
        // Дадим игроку: 3 Страйка, 2 Фаербола, 1 Хил, 2 Дэша, 1 Смайт
        const starterIds = ['strike', 'strike', 'strike', 'fireball', 'fireball', 'heal', 'dash', 'dash', 'smite'];
        
        starterIds.forEach(id => {
            const cardProto = this.cardLibrary.find(c => c.id === id);
            // Клонируем объект, чтобы не портить библиотеку
            this.deck.push({ ...cardProto, uid: Math.random() }); 
        });

        this.shuffle(this.deck);
    }

    drawCard() {
        // Если колода пуста — замешиваем сброс
        if (this.deck.length === 0) {
            if (this.discardPile.length === 0) return null; // Карт вообще нет
            console.log("Reshuffling discard pile...");
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffle(this.deck);
        }

        const card = this.deck.pop();
        this.hand.push(card);
        return card;
    }

    discardCard(index) {
        const card = this.hand.splice(index, 1)[0];
        card.selected = false; // Сбрасываем выделение
        this.discardPile.push(card);
    }

    discardHand() {
        while(this.hand.length > 0) {
            this.discardCard(0);
        }
    }

    drawHand(amount) {
        for (let i = 0; i < amount; i++) {
            if (this.hand.length >= 5) break; // Максимум 5 карт в руке
            this.drawCard();
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
