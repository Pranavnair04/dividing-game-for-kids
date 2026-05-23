# Just Divide – Number Puzzle Game (Phaser)

A small number-puzzle game built with Phaser 3 for the Eklavya assignment.

You place tiles on a 4×4 grid and merge them by equality or division. Use the keep and trash mechanics to plan ahead, and try to reach the highest score before you run out of moves.

---

## Approach

- I chose **Phaser 3** with a **single-scene** architecture.
- Layout is inspired by the provided reference:
  - Cat + Level/Score banner at the top.
  - 4×4 grid on the left.
  - Keep / Upcoming / Trash panel on the right.
- Game logic is separated into:
  - **Layout methods** (`createHeader`, `createCatAndBadges`, `createGrid`, `createRightPanel`).
  - **Game state & mechanics** (`initGameState`, `spawnActiveTile`, `resolveMergesFrom`, `tryMergeOnce`, `checkGameOver`).
  - **UX helpers** (hint system, undo, pause, timer, best score).

I used Phaser’s built-in **Scale.FIT** mode so the game scales to different resolutions while keeping a 1440×1024 logical canvas.

---

## Decisions Made

- **Phaser via CDN**: no build tools, easy to host as static files on Vercel.
- **Single JS file (`main.js`)** for simplicity; the code is grouped by responsibility (UI, game logic, helpers) to stay readable.
- **Scoring & levels**:
  - +1 score for each merge (equal or divisible).
  - `level = floor(score / 10) + 1`.
  - Each new level grants extra trash uses.
- **Hint system**:
  - When you tap the hint icon, the grid highlights **empty cells** where dropping the current tile would cause a merge (equality or division) with at least one neighbor.
  - No popups, only subtle grid highlights.
- **Keep & Trash mechanics**:
  - **Keep** allows storing one tile and swapping with the active tile.
  - **Trash** discards the current tile and pulls the next one from the queue, with limited uses.
- **Undo**:
  - One-step undo that restores grid state, queue, keep value, score, level, and trash uses.

---

## Challenges

- **Merge rules**: Implementing the “equal or divisible” rule in a clean way and making sure merges can **cascade** correctly from a single placement.
- **State management for Undo**:
  - I had to snapshot the entire game state (grid values, tile styles, queue, keep, score, trash, level) *before* each action, and then recreate the visual tiles from that snapshot.
- **UI polish in Phaser**:
  - Matching the reference layout (cat holding labels, panel rounding, tile sizes, outlined text) while staying within a single-scene Phaser setup.
- **Hint logic**:
  - Ensuring hints only show **useful empty cells**, and that they are cleared whenever the tile is placed/trashed/kept.

---

## What I Would Improve

If I had more time, I would:

- Refactor the scene into **smaller classes/modules** (e.g., a separate Grid manager, Panel manager) instead of a single large scene file.
- Add **animations**:
  - Small tween on tile placement and merges.
  - Highlight pulses for hint cells.
  - Level-up and best-score animations.
- Improve **mobile experience**:
  - A portrait-specific layout using a separate background.
  - Larger buttons and touch targets on smaller screens.
- Add **sound effects**:
  - Soft click for moves.
  - Satisfying sound on merges, level-ups, and game over.
- Add **more advanced hint logic** (limited uses, cooldown, or context-based suggestions).

---

## Running the Game Locally

1. Clone the repo:

   ```bash
   git clone https://github.com/Ijasahmed03/Just-Divide-kids-mode/edit/main/README.md)
   cd <your-repo>
