// В начале файла замени:
import { CardLibrary, getCardProto } from './cards/CardLibrary';

export class DeckManager {
  constructor() {
    // this.cardLibrary больше не нужен здесь, мы используем импорт
    this.deck = [];
    this.discardPile = [];
    this.hand = [];
    this.buildStarterDeck();
  }

  buildStarterDeck() {
    const starterIds = ['strike', 'strike', 'strike', 'fireball', 'fireball', 'heal', 'dash', 'dash', 'smite'];
    
    starterIds.forEach(id => {
      const proto = getCardProto(id);
      if (proto) {
        // Создаем уникальный экземпляр
        this.deck.push({ 
          ...proto, 
          uid: Math.random(),
          selected: false 
        });
      }
    });
    this.shuffle(this.deck);
  }
  
  // Остальные методы (drawCard, shuffle, etc) оставляем без изменений
  // ...
  drawCard() {
      // ... (тот же код)
      if (this.deck.length === 0) {
        if (this.discardPile.length === 0) return null;
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
      card.selected = false;
      this.discardPile.push(card);
  }

  discardHand() {
      while(this.hand.length > 0) this.discardCard(0);
  }

  drawHand(amount) {
      for (let i = 0; i < amount; i++) {
          if (this.hand.length >= 5) break;
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
