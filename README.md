# Runes of Oblivion

A turn-based tactical roguelike deckbuilder with isometric combat, developed as a student project.  
The game combines grid-based strategy mechanics (like *Into the Breach*) with card-driven actions (like *Slay the Spire*).

**🎮 Play Online:** https://410fe5bc.runes-of-oblivion.pages.dev/

---

## ✨ Key Features

### ⚔️ Tactical Combat
- **Isometric Grid:** Battles take place on a procedurally generated grid with obstacles.
- **Card System:** All actions (Attack, Move, Heal, Summon) are performed by playing cards from your hand.
- **Resource Management:** Manage your Health (HP) and Mana (MP) strategically.
- **Enemy AI:** Enemies have different behaviors (Melee rush, Ranged kiting) and react to player positioning.

### 🗺️ Roguelike Progression
- **Branching Map:** Choose your path through 8–10 floors.
- **Node Types:**
  - **FIGHT:** Standard battles to earn rewards.
  - **EVENT:** Random encounters with choices (risk vs reward).
  - **SHOP:** Heal or remove cards from your deck.
  - **BOSS:** A challenging final encounter.
- **Permadeath:** Each run is unique; if you die, you restart from the beginning.

---

## 🛠 Technology Stack

The project is built using **Vanilla JavaScript** without heavy game engines to demonstrate core programming concepts and architecture design.

- **Language:** JavaScript (ES6 Modules)
- **Build Tool:** Vite
- **Rendering:** Custom Canvas API rendering + DOM UI overlay
- **State Management:** Custom Event Emitter & singleton `GameState`
- **Algorithms:**
  - **A\* (A-Star):** For unit pathfinding and obstacle avoidance.
  - **Procedural Generation:** For the run map layout and battle obstacles.

---

## 🚀 How to Run Locally

### Requirements

- [Node.js](https://nodejs.org/) (version 16 or higher)

### Setup

git clone https://github.com/Mihaaaail/Runes_of_oblivion.git
cd Runes_of_oblivion
npm install 

### Development server

npm run dev

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Production build

npm run build

Build output will be generated in the `dist/` folder.

### Preview production build locally

npm run preview

---

## 📂 Project Structure

src/
├── core/
│ ├── logic/ # Game rules: BattleLogic, CardEffects, AILogic, PathFinding
│ └── state/ # State management: GameState, UnitModel, GridModel
├── data/ # Static configs: CardLibrary, constants (stats, types)
├── render/ # Visuals: GridRenderer, UnitRenderer
├── run/ # Meta-game: run map generation, flow controller
├── ui/ # User Interface: UIManager (DOM manipulation)
├── utils/ # Helpers: IsoMath (isometric projection formulas)
├── main.js # Entry point
└── index.html # Main HTML template

---

## 🎮 Controls

- **Click:** Select a card / tile / map node
- **Enter:** Confirm entering the selected encounter (on the roadmap screen)
- **Esc:** Back to menu / Cancel card selection

---

## 📜 License

This project was created for educational purposes. Code and assets are provided as-is.