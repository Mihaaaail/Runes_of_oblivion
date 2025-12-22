// src/game/cards/CardLibrary.js
export const CardLibrary = [
  { 
    id: 'fireball', 
    name: "Fireball", 
    cost: 1, 
    desc: "Deal 5 dmg (Range 3)",
    // Конфигурация логики
    range: 3,
    val: 5,
    actions: ['deal_damage'], // Ссылка на CardActions
    color: 0xff4444 
  },
  { 
    id: 'heal', 
    name: "Heal", 
    cost: 1, 
    desc: "Heal 5 HP",
    range: 0,
    val: 5,
    actions: ['heal'],
    color: 0x44ff44
  },
  { 
    id: 'dash', 
    name: "Dash", 
    cost: 0, 
    desc: "Move within 3 tiles",
    range: 3,
    val: 0,
    actions: ['dash'],
    color: 0x4444ff
  },
  { 
    id: 'smite', 
    name: "Smite", 
    cost: 2, 
    desc: "Deal 10 dmg (Range 2)",
    range: 2,
    val: 10,
    actions: ['deal_damage'],
    color: 0xffff00
  },
  { 
    id: 'strike', 
    name: "Strike", 
    cost: 1, 
    desc: "Deal 4 dmg (Range 1)",
    range: 1,
    val: 4,
    actions: ['deal_damage'],
    color: 0xffffff
  }
];

export const getCardProto = (id) => CardLibrary.find(c => c.id === id);
