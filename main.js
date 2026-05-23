const GAME_WIDTH = 1440;
const GAME_HEIGHT = 1024;
const TILE_STYLES = [
  { key: "tileBlue",   textColor: "#123063" }, // dark blue
  { key: "tileOrange", textColor: "#7b2100" }, // dark orange
  { key: "tilePurple", textColor: "#5b005f" }, // dark magenta/purple
  { key: "tileRed",    textColor: "#6b0000" }  // dark red
];
const TILE_TEXT_SIZE = 50; 

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
     this.add.text(0, 0, ".", {
    fontFamily: "Killjoy",
    fontSize: "1px",
  }).setAlpha(0);
  this.load.image("bg","assets/background.png");
   this.add.text(0, 0, ".", {
    fontFamily: "KongaNext",
    fontSize: "1px",
  }).setAlpha(0);
  this.load.image("PlacementBox", "assets/Placement_Box.png");
  this.load.image("catHeader", "assets/cat.png");      
  this.load.image("levelBox", "assets/levelandscore.png");        
   this.load.image("tileBlue",   "assets/blue.png");
  this.load.image("tileOrange", "assets/orange.png");
  this.load.image("tilePurple", "assets/purple.png");
  this.load.image("tileRed",    "assets/red.png");
  this.load.image("trashIcon", "assets/trash_icon.png");
  this.load.image("pauseIcon", "assets/pause.png");
this.load.image("playIcon", "assets/play.png");
this.load.image("hintIcon", "assets/hint.png");
this.load.image("undoIcon", "assets/undo.png");
  }

  create() {
    this.add.image(0,0,"bg").setOrigin(0,0).setDisplaySize(GAME_WIDTH,GAME_HEIGHT);
    // --- Data structures that we will use later ---
  this.gridSlots = [];
  this.gridSize = 4;
  this.hintHighlights = [];
this.undoState = null;
 this.bestScore = Number(localStorage.getItem("bestScore") || 0);
  // --- Build UI layout ---
  this.createHeader();
  this.createCatAndBadges();
  this.createGrid();
  this.createRightPanel();
// --- Best score from previous sessions ---
    this.bestScore = Number(localStorage.getItem("bestScore") || 0);
    this.elapsedSeconds = 0;
  this.updateTimerText();   // show 00:00 initially

  this.timerEvent = this.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      this.elapsedSeconds++;
      this.updateTimerText();
    }
  });
  // --- Game state ---
  this.initGameState();
  this.setupDragEvents();
  this.spawnActiveTile();
  console.log("MainScene created with layout.");
  }
  initGameState() {
  // 16 cells in the 4x4 grid
  this.gridValues = Array(16).fill(null);  // store numbers or null
    this.gridTiles  = Array(16).fill(null); 
  // Simple starting queue; later we’ll randomize
  this.queueValues = [2, 3, 4];
  this.updateUpcomingTexts();
  this.keepValue = null;
  this.trashUses = 3;
  this.score = 0;
  this.level = 1;
  // Update UI text
  this.levelText.setText("LEVEL " + this.level);
  this.scoreText.setText("SCORE " + this.score); // will hook to localStorage later
  this.trashCountText.setText("x " + this.trashUses);
    if (this.besScoretText) {
    this.bestScoreText.setText("Best: " + this.bestScore);
  }
}
updateUpcomingTexts() {
  // queueValues[0] is active tile (top); [1] and [2] are previews
  const v1 = this.queueValues[1] ?? "";
  const v2 = this.queueValues[2] ?? "";

  if (this.upcomingSecondText) {
    this.upcomingSecondText.setText(v1 !== "" ? String(v1) : "");
  }
  if (this.upcomingThirdText) {
    this.upcomingThirdText.setText(v2 !== "" ? String(v2) : "");
  }
}
  // ---------------- LAYOUT METHODS ----------------
  createHeader() {
  // Title
  this.add.text(GAME_WIDTH / 2, 50, "JUST DIVIDE", {
    fontFamily: "Killjoy",
    fontSize: "46px",
    fontStyle: "bold",
    letterSpacing: 4,
    color: "#222"
  }).setOrigin(0.5);
 // Center timer under title
this.headerTimerText = this.add.text(GAME_WIDTH / 2, 95, "⏳ 00:00", {
  fontFamily: "Killjoy",
  fontSize: "22px",
  color: "#111"
}).setOrigin(0.5);
  // Red banner subtitle
  this.add.text(
    GAME_WIDTH / 2,
    145,
    "DIVIDE WITH THE NUMBERS TO SOLVE THE ROWS AND COLUMNS.",
    {
      fontFamily: "KongaNext",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fbd6bfff",
      stroke: "#891b1bff",
      strokeThickness: 4
    }
  ).setOrigin(0.5);
// Top-left pause button (icon)
this.pauseButton = this.add.image(80, 60, "pauseIcon")
  .setDisplaySize(50, 50)
  .setInteractive({ useHandCursor: true })
  .setDepth(10);
this.pauseButton.on("pointerup", () => {
  this.togglePause();
});
// Undo button next to pause
this.undoButton = this.add.image(140, 60, "undoIcon")
  .setDisplaySize(46, 46)
  .setInteractive({ useHandCursor: true })
  .setDepth(10);
this.undoButton.on("pointerup", () => {
  this.applyUndo();
});
// Top-right hint icon
this.hintButton = this.add.image(GAME_WIDTH - 80, 60, "hintIcon")
  .setDisplaySize(50, 50)
  .setInteractive({ useHandCursor: true })
  .setDepth(10);
this.hintButton.on("pointerup", () => {
  this.showHint();
});
}
showHint() {
  if (this.isPaused) return;
  if (!this.activeTile) return;
  // Clear previous hints
  this.clearHintHighlights();
  const hintIndices = this.computeHintIndicesForActiveTile();
  if (hintIndices.length === 0) {
    return; // no valid merges for this tile
  }
  // Use same size as grid cells (110 in your createGrid)
  const size = 110;
  hintIndices.forEach((idx) => {
    const slot = this.gridSlots[idx];
    const rect = this.add.rectangle(
      slot.x,
      slot.y,
      size,
      size,
      0xffffff,
      0.2   // semi-transparent white fill
    )
      .setStrokeStyle(5, 0xfff176) // soft yellow outline
      .setDepth(3);

    this.hintHighlights.push(rect);
  });
}
createCatAndBadges() {
  // Horizontal offset: negative = move left, positive = move right
  const offsetX = -150;   // tweak this value until you like the position
  const catY = 250;       // vertical position of cat
  const badgeWidth = 300;
  const badgeHeight = 120;
  const badgeY = catY + 100;  // boxes just under paws
  const gap = 40;
  // Base X for this whole cluster (cat + both boxes)
  const baseX = GAME_WIDTH / 2 + offsetX;
  // Level and score centers relative to baseX
  const levelX = baseX - (badgeWidth / 2 + gap);
  const scoreX = baseX + (badgeWidth / 2 + gap);
  // ---- 1) Level & Score boxes (under the cat) ----
  this.add.image(levelX, badgeY, "levelBox")
    .setDisplaySize(badgeWidth, badgeHeight)
    .setDepth(1);
  this.add.image(scoreX, badgeY, "levelBox")
    .setDisplaySize(badgeWidth, badgeHeight)
    .setDepth(1);
  this.levelText = this.add.text(levelX, badgeY, "LEVEL 1", {
    fontFamily: "KongaNext",
    fontSize: "30px",
    color: "#ffffff",
    align: "center",
    stroke: "#751d1dff",
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(2);
  this.scoreText = this.add.text(scoreX, badgeY, "SCORE 0", {
    fontFamily: "KongaNext",
    fontSize: "30px",
    color: "#ffffff",
    align: "center",
    stroke: "#751d1dff",
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(2);
  // ---- 2) Cat sprite (on top, centered over both boxes) ----
  this.catSprite = this.add.image(baseX, catY, "catHeader")
    .setOrigin(0.5, 0.5)
    .setScale(1.0)
    .setDepth(3);
}
  createGrid() {
    const rows = 4, cols = 4;
    const cellSize = 110;
    const cellGap = 14;
    const gridWidth = cols * cellSize + (cols - 1) * cellGap;
    const gridHeight = rows * cellSize + (rows - 1) * cellGap+80;
    const gridCenterX = GAME_WIDTH / 2 - 150; // shift left to make space for panel
    const gridCenterY = GAME_HEIGHT / 2 + 130;
    const startX = gridCenterX - gridWidth / 2;
    const startY = gridCenterY - gridHeight / 2+80;
     // ---- NEW: teal panel behind the cells ----
  const panelPaddingX = 40;
  const panelPaddingY = 40;
  const panelWidth = gridWidth + panelPaddingX * 2;
  const panelHeight = gridHeight + panelPaddingY * 2;
  this.add.rectangle(
    gridCenterX,
    gridCenterY,
    panelWidth,
    panelHeight,
    0x007b83,   // teal-ish
    1
  ).setStrokeStyle(10, 0xffffff);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (cellSize + cellGap) + cellSize / 2;
      const y = startY + r * (cellSize + cellGap) + cellSize / 2;
      const index = r * cols + c;
     this.add.image(x, y, "PlacementBox")
  .setDisplaySize(cellSize, cellSize);
      this.gridSlots.push({ x, y, index });
    }
  }
  const bestY = gridCenterY + panelHeight / 2 + 35;
  this.bestText = this.add.text(
    gridCenterX,
    bestY,
    "Best: " + this.bestScore,
    {
      fontFamily: "KongaNext",
      fontSize: "36px",
      color: "#ffffff",
      stroke: "#007b83",
      strokeThickness: 4,
      align: "center"
    }
  ).setOrigin(0.5);
}
  createRightPanel() {
  const panelWidth = 200;
  const panelHeight = 600;
  const panelX = GAME_WIDTH / 2 + 370;
  const panelY = GAME_HEIGHT / 2 + 150; // aligned a bit lower with grid
  // Panel background (orange card)
 const radius = 25; // corner roundness
const panelGfx = this.add.graphics();
panelGfx.fillStyle(0xF5C827, 1);  // panel color
panelGfx.lineStyle(20, 0xF59127, 1); // border color
panelGfx.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, radius);
panelGfx.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, radius);
  // ============== KEEP AREA ==============
  const keepY = panelY - panelHeight / 2 + 80;
  this.add.text(panelX, keepY + 73, "KEEP", {
    fontFamily: "KongaNext",
    fontSize: "30px",
    color: "#228251ff",
  }).setOrigin(0.5).setDepth(2);
  const keepSize = 120;
 // Faint background hint for KEEP (behind actual kept tile)
this.add.image(panelX, keepY, "tileBlue")
  .setDisplaySize(keepSize, keepSize)
  .setAlpha(0.5)       // very faint
  .setDepth(0);         // behind everything
  // Invisible rect used for hit detection (KEEP slot)
  this.keepSlotRect = this.add.rectangle(panelX, keepY, keepSize+10, keepSize+1, 0xffffff, 0)
    .setStrokeStyle(6, 0xffffff)
  .setDepth(2);
 // ============== UPCOMING STACK ==============
// Current (active) tile sits here
const stackY = keepY + 140;
// Position where the active draggable tile appears
this.stackTopPos = { x: panelX, y: stackY };
// Row of upcoming tiles beneath current
const previewY = stackY + 115;
const previewOffsetX = 60;
// 2nd upcoming tile (left)
this.upcomingSecondBg = this.add.image(panelX - previewOffsetX, previewY, "tileBlue")
  .setDisplaySize(80, 80)
  .setDepth(1);            
this.upcomingSecondText = this.add.text(panelX - previewOffsetX, previewY, "", {
  fontFamily: "KongaNext",
  fontSize: "40px",
  color: "#123063"
}).setOrigin(0.5).setDepth(2);
// 3rd upcoming tile (right)
this.upcomingThirdBg = this.add.image(panelX + previewOffsetX, previewY, "tileOrange")
  .setDisplaySize(80, 80)
  .setDepth(1);              
this.upcomingThirdText = this.add.text(panelX + previewOffsetX, previewY, "", {
  fontFamily: "KongaNext",
  fontSize: "40px",
  color: "#7b2100"
}).setOrigin(0.5).setDepth(2);
// ============== TRASH AREA ==============
const trashY = panelY + panelHeight / 2 - 120;
this.add.text(panelX, trashY - 90, "TRASH", {
  fontFamily: "KongaNext",
  fontSize: "30px",
  color: "#ec2222ff",
}).setOrigin(0.5).setDepth(2);
const trashSize = 120;
// Red tile for TRASH
this.add.image(panelX, trashY, "tileRed")
  .setDisplaySize(trashSize, trashSize)
  .setDepth(1);
// White border around the red tile
this.trashSlotRect = this.add.rectangle(
  panelX,
  trashY,
  trashSize + 10,
  trashSize + 10,
  0xffffff,
  0
)
  .setStrokeStyle(6, 0xffffff)
  .setDepth(2);
// Trash icon INSIDE the red tile
this.trashIcon = this.add.image(panelX, trashY-20, "trashIcon")
  .setDisplaySize(56, 56)
  .setDepth(3);
// "x 3" BELOW the box
this.trashCountText = this.add.text(panelX, trashY + trashSize / 2 -30, "x 3", {
  fontFamily: "KongaNext",
  fontSize: "35px",
  color: "#fffcfcff"
}).setOrigin(0.5).setDepth(3);
}
  spawnActiveTile() {
  const value = this.queueValues[0]; // top of queue
  const size = 100;
  // Pick a random tile style (background + text color)
  const style = Phaser.Utils.Array.GetRandom(TILE_STYLES);
  // Background gem image
  const bg = this.add.image(0, 0, style.key)
    .setDisplaySize(size, size);
  // Number text with darker shade of tile color
  const label = this.add.text(0, 0, String(value), {
    fontFamily: "KongaNext",
    fontSize: `${TILE_TEXT_SIZE}px`,
    color: style.textColor,
    align: "center"
  }).setOrigin(0.5);
  // Container holding both
  const container = this.add.container(this.stackTopPos.x, this.stackTopPos.y, [bg, label]);
  // Needed for input
  container.setSize(size, size);
  container.setInteractive();
  this.input.setDraggable(container);
  // Attach value and extra info
  container.tileValue = value;
  container.gridIndex = null;
  container.label = label;
  container.tileStyle = style; // in case we want to reuse later
  this.activeTile = container; // just a reference to the current draggable tile
}
setupDragEvents() {
this.input.on("dragstart", (pointer, gameObject) => {
  if (this.isPaused) return;
  this.children.bringToTop(gameObject);
});
this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
  if (this.isPaused) return;
  gameObject.x = dragX;
  gameObject.y = dragY;
});
  this.input.on("dragend", (pointer, gameObject) => {
     if (this.isPaused) {
    // Snap back to stack if they tried to drop during pause
    gameObject.x = this.stackTopPos.x;
    gameObject.y = this.stackTopPos.y;
    return;
  }
    const slot = this.findNearestEmptyGridSlot(gameObject.x, gameObject.y);
    if (slot) {
      gameObject.x = slot.x;
      gameObject.y = slot.y;
      gameObject.gridIndex = slot.index;

      this.handleTilePlaced(slot.index, gameObject);
      gameObject.disableInteractive();
      return;
    }
    if (this.isPointInRect(gameObject.x, gameObject.y, this.trashSlotRect)) {
      this.handleTrashDrop(gameObject);
      return;
    }
    if (this.isPointInRect(gameObject.x, gameObject.y, this.keepSlotRect)) {
      this.handleKeepDrop(gameObject);
      return;
    }
    gameObject.x = this.stackTopPos.x;
    gameObject.y = this.stackTopPos.y;
    gameObject.gridIndex = null;
  });
}
findNearestEmptyGridSlot(x, y) {
  const maxDistance = 80; // pixels; tune if needed
  let bestSlot = null;
  let bestDistSq = maxDistance * maxDistance;
  for (const slot of this.gridSlots) {
    const dx = slot.x - x;
    const dy = slot.y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= bestDistSq && this.gridValues[slot.index] === null) {
      bestSlot = slot;
      bestDistSq = distSq;
    }
  }
  return bestSlot;
}
handleTilePlaced(index, tileObject) {
  // 🔁 Save state BEFORE changing anything
  this.saveStateForUndo();
  this.clearHintHighlights();
  // Store tile in grid state
  this.gridValues[index] = tileObject.tileValue;
  this.gridTiles[index]  = tileObject;
  if (this.activeTile === tileObject) {
    this.activeTile = null;
  }
  // Resolve all merges starting from this cell
  this.resolveMergesFrom(index);
  // Now update UI based on score & level
  this.updateScoreAndLevelUI();
  // Check game over BEFORE spawning next tile
  if (this.checkGameOver()) {
    this.showGameOver();
    return;
  }
  // Continue game
  this.advanceQueue();
  this.spawnActiveTile();
}
handleTrashDrop(tileObject) {
  // Save state before consuming trash / changing queue
  this.saveStateForUndo();
  this.clearHintHighlights();
  if (this.trashUses <= 0) {
    tileObject.x = this.stackTopPos.x;
    tileObject.y = this.stackTopPos.y;
    return;
  }
  this.trashUses -= 1;
  this.trashCountText.setText("x " + this.trashUses);
  tileObject.destroy();
  if (this.activeTile === tileObject) {
    this.activeTile = null;
  }
  this.advanceQueue();
  this.spawnActiveTile();
}
checkGameOver() {
  // 1) If any empty cell exists, not game over
  if (this.gridValues.some(v => v === null)) {
    return false;
  }
  // 2) If any possible merge exists, not game over
  for (let i = 0; i < this.gridValues.length; i++) {
    const val = this.gridValues[i];
    if (val === null) continue;
    const neighbors = this.getNeighborIndices(i);
    for (const nIdx of neighbors) {
      const nVal = this.gridValues[nIdx];
      if (nVal === null) continue;
      if (nVal === val) {
        return false; // equal merge possible
      }
      const big = Math.max(val, nVal);
      const small = Math.min(val, nVal);
      if (big % small === 0) {
        return false; // divisible merge possible
      }
    }
  }
  // No space, no merges → game over
  return true;
}
canMergeValues(a, b) {
  if (a == null || b == null) return false;
  if (a === b) return true;
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  if (small === 0) return false;
  return big % small === 0;  // divisible merge
}
computeHintIndicesForActiveTile() {
  const indices = [];
  if (!this.activeTile) return indices;
  const value = this.activeTile.tileValue;
  if (value == null) return indices;
  for (let i = 0; i < this.gridSlots.length; i++) {
    // Only empty cells
    if (this.gridValues[i] !== null) continue;
    const neighbors = this.getNeighborIndices(i);
    let canMergeHere = false;
    for (const nIdx of neighbors) {
      const nVal = this.gridValues[nIdx];
      if (nVal == null) continue;
      if (this.canMergeValues(value, nVal)) {
        canMergeHere = true;
        break;
      }
    }
    if (canMergeHere) {
      indices.push(i);
    }
  }
  return indices;
}
clearHintHighlights() {
  if (!this.hintHighlights) return;
  this.hintHighlights.forEach(h => h.destroy());
  this.hintHighlights = [];
}
showGameOver() {
   // Stop timer
  if (this.timerEvent) {
    this.timerEvent.remove(false); // don't destroy immediately if you don't want to
    this.timerEvent = null;
  }
  this.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.5
  );
  this.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    420,
    260,
    0xffffff,
    1
  ).setStrokeStyle(3, 0x333333);
  this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, "GAME OVER", {
    fontFamily: "Arial",
    fontSize: "36px",
    fontStyle: "bold",
    color: "#000"
  }).setOrigin(0.5);
  this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
    `Score: ${this.score}\nBest: ${this.bestScore}`, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#333",
      align: "center"
    }).setOrigin(0.5);
  const info = this.add.text(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 + 60,
    "Click anywhere to restart",
    {
      fontFamily: "KongaNext",
      fontSize: "18px",
      color: "#555"
    }
  ).setOrigin(0.5);
  // Simple restart: click to restart scene
  this.input.once("pointerdown", () => {
    this.scene.restart();
  });
}
updateScoreAndLevelUI() {
  const prevLevel = this.level;
  const newLevel  = Math.floor(this.score / 10) + 1;  // every 10 points

  // If level increased, grant extra trash uses
  if (newLevel > prevLevel) {
    const gained = (newLevel - prevLevel) * 2; // +2 trash per level
    this.trashUses += gained;
    this.trashCountText.setText("x " + this.trashUses);
  }
  this.level = newLevel;
  this.levelText.setText("LEVEL " + this.level);
  if (this.score > this.bestScore) {
    this.bestScore = this.score;
    localStorage.setItem("bestScore", this.bestScore);
    if (this.bestScoreText) {
      this.bestScoreText.setText(String(this.bestScore));
    }
  }
  // Score label in red box
  this.scoreText.setText("SCORE " + this.score);
}

updateTimerText() {
  const minutes = Math.floor(this.elapsedSeconds / 60);
  const seconds = this.elapsedSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const text = `${mm}:${ss}`;
  if (this.headerTimerText) {
    this.headerTimerText.setText("⏳ " + text);
  }
}
togglePause() {
  this.isPaused = !this.isPaused;
  if (this.isPaused) {
    // Pause timer
    if (this.timerEvent) this.timerEvent.paused = true;
    // Switch icon to PLAY
    this.pauseButton.setTexture("playIcon");
    // Add semi-transparent screen overlay
    this.pauseOverlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.35
    ).setDepth(20);
    this.pauseLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "PAUSED", {
      fontFamily: "KongaNext",
      fontSize: "60px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(21);
  } else {
    // Resume timer
    if (this.timerEvent) this.timerEvent.paused = false;
    // Switch icon back to PAUSE
    this.pauseButton.setTexture("pauseIcon");
    // Remove overlay
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
    if (this.pauseLabel) {
      this.pauseLabel.destroy();
      this.pauseLabel = null;
    }
  }
}
applyUndo() {
  if (!this.undoState || this.isPaused) return;
  this.clearHintHighlights();
  // Remove current visuals
  if (this.activeTile) {
    this.activeTile.destroy();
    this.activeTile = null;
  }
  for (let i = 0; i < this.gridTiles.length; i++) {
    if (this.gridTiles[i]) {
      this.gridTiles[i].destroy();
      this.gridTiles[i] = null;
    }
  }
  if (this.keepTile) {
    this.keepTile.destroy();
    this.keepTile = null;
  }
  // Restore logic
  const s = this.undoState;
  this.gridValues = s.gridValues.slice();
  this.queueValues = s.queueValues.slice();
  this.keepValue   = s.keepValue;
  this.trashUses   = s.trashUses;
  this.score       = s.score;
  this.level       = s.level;
  // Rebuild grid visuals
  const size = 100;
  for (let i = 0; i < this.gridValues.length; i++) {
    const val = this.gridValues[i];
    if (val == null) continue;
    const slot  = this.gridSlots[i];
    const style = s.gridStyles[i] || { key: "tileBlue", textColor: "#123063" };
    const bg = this.add.image(0, 0, style.key)
      .setDisplaySize(size, size);
    const label = this.add.text(0, 0, String(val), {
      fontFamily: "KongaNext",
      fontSize: `${TILE_TEXT_SIZE}px`,
      color: style.textColor
    }).setOrigin(0.5);
    const cont = this.add.container(slot.x, slot.y, [bg, label]);
    cont.setSize(size, size);
    cont.tileValue = val;
    cont.gridIndex = i;
    cont.label     = label;
    cont.tileStyle = style;
    this.gridTiles[i] = cont;
  }
  // Rebuild KEEP tile visually (uses this.keepValue)
  this.updateKeepVisual();
  // Update UI texts
  this.levelText.setText("LEVEL " + this.level);
  this.scoreText.setText("Score: " + this.score);
  this.trashCountText.setText("x " + this.trashUses);
  // Upcoming numbers + active tile
  this.updateUpcomingTexts();
  this.spawnActiveTile();   // uses restored queue[0]
  // One-step undo only
  this.undoState = null;
}
saveStateForUndo() {
  this.undoState = {
    gridValues: this.gridValues.slice(),
    gridStyles: this.gridTiles.map(tile =>
      tile && tile.tileStyle
        ? { key: tile.tileStyle.key, textColor: tile.tileStyle.textColor }
        : null
    ),
    queueValues: this.queueValues.slice(),
    keepValue: this.keepValue,
    trashUses: this.trashUses,
    score: this.score,
    level: this.level
  };
}
updateKeepVisual() {
  // No value stored → remove tile if it exists
  if (this.keepValue === null) {
    if (this.keepTile) {
      this.keepTile.destroy();
      this.keepTile = null;
    }
    return;
  }
  const size = 100;
  // Safety: if we somehow don't have keepSlotRect yet, bail
  if (!this.keepSlotRect) return;
  if (!this.keepTile) {
    // Bright tile in KEEP
    const bg = this.add.image(0, 0, "tileBlue")
      .setDisplaySize(size, size);
    const label = this.add.text(0, 0, String(this.keepValue), {
      fontFamily: "KongaNext",
      fontSize: `${TILE_TEXT_SIZE}px`,
      color: "#228251ff"   // strong green text
    }).setOrigin(0.5);
    const container = this.add.container(this.keepSlotRect.x, this.keepSlotRect.y, [bg, label]);
    container.setSize(size, size);
    container.label = label;
    container.setDepth(4);        // ABOVE border & background
    this.keepTile = container;
  } else {
    // Just update number if tile already exists
    this.keepTile.label.setText(String(this.keepValue));
    this.keepTile.setDepth(4);
  }
  // Make absolutely sure it's on top of everything in that area
  this.children.bringToTop(this.keepTile);
}
handleKeepDrop(tileObject) {
  // Save state before swapping/keeping
  this.saveStateForUndo();
  this.clearHintHighlights();
  if (this.keepValue === null) {
    // No tile stored yet -> store this one, consume from queue
    this.keepValue = tileObject.tileValue;
    this.updateKeepVisual();
    tileObject.destroy();
    if (this.activeTile === tileObject) {
      this.activeTile = null;
    }
    this.advanceQueue();
    this.spawnActiveTile();
  } else {
    // Swap values between active tile and keep
    const temp = this.keepValue;
    this.keepValue = tileObject.tileValue;
    tileObject.tileValue = temp;
    tileObject.label.setText(String(tileObject.tileValue));
    this.updateKeepVisual();
    // Send active tile back to stack position
    tileObject.x = this.stackTopPos.x;
    tileObject.y = this.stackTopPos.y;
  }
}
advanceQueue() {
  // Remove the used value
  this.queueValues.shift();
  const possible = [2, 3, 4, 5, 6, 8, 9, 10, 12];
  const next = possible[Math.floor(Math.random() * possible.length)];
  this.queueValues.push(next);
  // Refresh the preview labels
  this.updateUpcomingTexts();
}

getNeighborIndices(index) {
  const neighbors = [];
  const cols = this.gridSize; // 4
  const rows = this.gridSize;
  const r = Math.floor(index / cols);
  const c = index % cols;
  // up
  if (r > 0) neighbors.push(index - cols);
  // down
  if (r < rows - 1) neighbors.push(index + cols);
  // left
  if (c > 0) neighbors.push(index - 1);
  // right
  if (c < cols - 1) neighbors.push(index + 1);
  return neighbors;
}
destroyTileAt(index) {
  const obj = this.gridTiles[index];
  if (obj) {
    obj.destroy();
  }
  this.gridTiles[index]  = null;
  this.gridValues[index] = null;
}
resolveMergesFrom(startIndex) {
  let index = startIndex;
  // If the tile disappeared due to merge, index will become null
  while (index !== null && this.gridValues[index] !== null) {
    const result = this.tryMergeOnce(index);
    if (!result.merged) {
      break; // nothing else to do
    }
    index = result.newIndex; // may move if merge result ends up in neighbor
  }
}
tryMergeOnce(index) {
  const value = this.gridValues[index];
  if (value === null) {
    return { merged: false, newIndex: null };
  }
  const neighbors = this.getNeighborIndices(index);
  for (const nIdx of neighbors) {
    const nVal = this.gridValues[nIdx];
    if (nVal === null) continue;
    // 1) Equal tiles -> both disappear
    if (nVal === value) {
      this.destroyTileAt(index);
      this.destroyTileAt(nIdx);
      this.score += 1;   // add 1 point
      return { merged: true, newIndex: null }; // no tile left here
    }
    // 2) Divisible tiles -> big / small (whole number)
    let bigIdx = index;
    let bigVal = value;
    let smallIdx = nIdx;
    let smallVal = nVal;
    if (nVal > value) {
      bigIdx = nIdx;
      bigVal = nVal;
      smallIdx = index;
      smallVal = value;
    }
    if (smallVal !== 0 && bigVal % smallVal === 0) {
      const result = bigVal / smallVal;
      // Remove smaller tile
      this.destroyTileAt(smallIdx);
      if (result === 1) {
        // Result 1 -> remove big tile as well
        this.destroyTileAt(bigIdx);
        this.score += 1;
        return { merged: true, newIndex: null };
      } else {
        // Result stays in the larger tile
        const bigTile = this.gridTiles[bigIdx];
        if (bigTile) {
          this.gridValues[bigIdx] = result;
          bigTile.tileValue = result;
          bigTile.label.setText(String(result));
        }
        this.score += 1;
        return { merged: true, newIndex: bigIdx };
      }
    }
  }
  // No neighbor caused a merge
  return { merged: false, newIndex: index };
}

isPointInRect(x, y, rect) {
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  return (
    x >= rect.x - halfW &&
    x <= rect.x + halfW &&
    y >= rect.y - halfH &&
    y <= rect.y + halfH
  );
}
}
//phaser config---
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#000000",
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};
const game = new Phaser.Game(config);
