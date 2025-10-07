const board = document.getElementById("board");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const startScreen = document.getElementById("start-screen");
const endScreen = document.getElementById("end-screen");
const finalScore = document.getElementById("final-score");
const gameContainer = document.getElementById("game-container");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const fullscreenToggle = document.getElementById("fullscreen-toggle");
const soundToggle = document.getElementById("sound-toggle");
const settingsClose = document.getElementById("settings-close");
const popSound = document.getElementById("pop-sound");
//süre satır sütün
let rows = 8;
let columns = 6;
let boardData = [];
let score = 0;
let timeLeft = 30;
let timer;
let tileClicked = null;
let isAnimating = false;
let dragStart = null; // { tile, x, y, id }
let delegatedBound = false;
let justDragged = false;
const candyImages = ["sugar1.png", "sugar2.png", "sugar3.png", "sugar4.png", "sugar5.png"];
let isSoundOn = true;

function startGame() {
    score = 0;
    timeLeft = 30;
    scoreText.textContent = "Puan: " + score;
    timerText.textContent = "Süre: " + timeLeft;
    startScreen.classList.add("hidden");
    startScreen.classList.remove("active");
    gameContainer.classList.remove("hidden");
    endScreen.classList.add("hidden");

    createBoard();
    if (!delegatedBound) {
        board.addEventListener("pointerdown", delegatedPointerDown);
        delegatedBound = true;
    }
    // Settings handlers (bind once)
    if (settingsBtn && !settingsBtn._bound) {
        settingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle("active");
        });
        settingsClose.addEventListener("click", () => {
            settingsPanel.classList.remove("active");
        });
        // Tap anywhere on panel to close
        settingsPanel.addEventListener("click", () => {
            settingsPanel.classList.remove("active");
        });
        fullscreenToggle.addEventListener("click", toggleFullscreen);
        soundToggle.addEventListener("click", toggleSound);
        document.addEventListener("fullscreenchange", syncFullscreenButton);
        syncFullscreenButton();
        syncSoundButton();
        settingsBtn._bound = true;
    }
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timeLeft--;
    timerText.textContent = "Süre: " + timeLeft;
    if (timeLeft <= 0) endGame();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        (document.documentElement.requestFullscreen && document.documentElement.requestFullscreen());
    } else {
        (document.exitFullscreen && document.exitFullscreen());
    }
}

function syncFullscreenButton() {
    if (!fullscreenToggle) return;
    const active = !!document.fullscreenElement;
    fullscreenToggle.textContent = active ? "Kapat" : "Aç";
}

function toggleSound() {
    isSoundOn = !isSoundOn;
    syncSoundButton();
}

function syncSoundButton() {
    if (!soundToggle) return;
    soundToggle.textContent = isSoundOn ? "Kapat" : "Aç";
}

function endGame() {
    clearInterval(timer);
    gameContainer.classList.add("hidden");
    endScreen.classList.remove("hidden");
    finalScore.textContent = score;
}

function createBoard() {
    board.innerHTML = "";
    boardData = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            // pick a candy that does not create an immediate 3+ match horizontally or vertically
            let candy;
            for (let attempt = 0; attempt < 10; attempt++) {
                const pick = candyImages[Math.floor(Math.random() * candyImages.length)];
                const left1 = c >= 1 ? row[c - 1] : null;
                const left2 = c >= 2 ? row[c - 2] : null;
                const up1 = r >= 1 ? boardData[r - 1][c] : null;
                const up2 = r >= 2 ? boardData[r - 2][c] : null;
                const makesHorizontalRun = left1 && left2 && left1 === left2 && left1 === pick;
                const makesVerticalRun = up1 && up2 && up1 === up2 && up1 === pick;
                if (!makesHorizontalRun && !makesVerticalRun) {
                    candy = pick;
                    break;
                }
            }
            if (!candy) candy = candyImages[Math.floor(Math.random() * candyImages.length)];
            let tile = document.createElement("div");
            tile.classList.add("tile");
            tile.style.backgroundImage = `url(images/${candy})`;
            tile.dataset.row = r;
            tile.dataset.col = c;
            tile.dataset.candy = candy;
            tile.addEventListener("click", tileClick);
            tile.addEventListener("pointerdown", pointerDown);
            board.appendChild(tile);
            row.push(candy);
        }
        boardData.push(row);
    }
}

function tileClick(e) {
    let tile = e.target;
    if (isAnimating || timeLeft <= 0 || dragStart || justDragged) return;
    if (!tileClicked) {
        tileClicked = tile;
        tile.style.outline = "3px solid #fff";
    } else {
        swapTiles(tileClicked, tile);
        tileClicked.style.outline = "none";
        tileClicked = null;
    }
}

function pointerDown(e) {
    if (isAnimating || timeLeft <= 0) return;
    e.preventDefault();
    const tile = e.currentTarget;
    dragStart = { tile, x: e.clientX, y: e.clientY, id: e.pointerId };
    tile.setPointerCapture(e.pointerId);
    tile.addEventListener("pointermove", pointerMove);
    tile.addEventListener("pointerup", pointerUp, { once: true });
    tile.addEventListener("pointercancel", pointerUp, { once: true });
    // Also listen on window to catch pointerup/move if element listeners miss
    window.addEventListener("pointermove", pointerMoveWindow);
    window.addEventListener("pointerup", pointerUpWindow, { once: true });
    window.addEventListener("pointercancel", pointerUpWindow, { once: true });
}

function pointerMove(e) {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const threshold = 12; // min px to consider a drag
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    // decide direction
    const tile1 = dragStart.tile;
    const r1 = parseInt(tile1.dataset.row, 10);
    const c1 = parseInt(tile1.dataset.col, 10);
    let r2 = r1, c2 = c1;
    if (Math.abs(dx) > Math.abs(dy)) {
        c2 = c1 + (dx > 0 ? 1 : -1);
    } else {
        r2 = r1 + (dy > 0 ? 1 : -1);
    }
    // bounds check
    if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= columns) return;
    const tile2 = board.children[r2 * columns + c2];

    // perform swap via existing flow
    pointerUp(e); // clean element listeners
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 50);
    swapTiles(tile1, tile2);
}

function pointerUp(e) {
    const tile = e.currentTarget;
    tile.removeEventListener("pointermove", pointerMove);
    try {
        if (dragStart && tile.hasPointerCapture(dragStart.id)) {
            tile.releasePointerCapture(dragStart.id);
        }
    } catch (_) { }
    dragStart = null;
}

function delegatedPointerDown(e) {
    if (isAnimating || timeLeft <= 0) return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    e.preventDefault();
    dragStart = { tile, x: e.clientX, y: e.clientY, id: e.pointerId };
    // Use window listeners so touch drags that leave the tile still end properly
    window.addEventListener("pointermove", pointerMoveWindow);
    window.addEventListener("pointerup", pointerUpWindow, { once: true });
    window.addEventListener("pointercancel", pointerUpWindow, { once: true });
}

function pointerMoveWindow(e) {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const threshold = 12;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    const tile1 = dragStart.tile;
    const r1 = parseInt(tile1.dataset.row, 10);
    const c1 = parseInt(tile1.dataset.col, 10);
    let r2 = r1, c2 = c1;
    if (Math.abs(dx) > Math.abs(dy)) {
        c2 = c1 + (dx > 0 ? 1 : -1);
    } else {
        r2 = r1 + (dy > 0 ? 1 : -1);
    }
    if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= columns) return;
    const tile2 = board.children[r2 * columns + c2];
    pointerUpWindow(e);
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 50);
    swapTiles(tile1, tile2);
}

function pointerUpWindow(e) {
    window.removeEventListener("pointermove", pointerMoveWindow);
    dragStart = null;
}

function pointerMoveWindow(e) {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const threshold = 12;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    const tile1 = dragStart.tile;
    const r1 = parseInt(tile1.dataset.row, 10);
    const c1 = parseInt(tile1.dataset.col, 10);
    let r2 = r1, c2 = c1;
    if (Math.abs(dx) > Math.abs(dy)) {
        c2 = c1 + (dx > 0 ? 1 : -1);
    } else {
        r2 = r1 + (dy > 0 ? 1 : -1);
    }
    if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= columns) return;
    const tile2 = board.children[r2 * columns + c2];
    pointerUpWindow(e);
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 50);
    swapTiles(tile1, tile2);
}

function pointerUpWindow(e) {
    window.removeEventListener("pointermove", pointerMoveWindow);
    dragStart = null;
}

async function swapTiles(tile1, tile2) {
    let r1 = tile1.dataset.row, c1 = tile1.dataset.col;
    let r2 = tile2.dataset.row, c2 = tile2.dataset.col;

    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
        isAnimating = true;
        // Pre-check: simulate swap in data and see if it would match
        let temp = boardData[r1][c1];
        boardData[r1][c1] = boardData[r2][c2];
        boardData[r2][c2] = temp;
        const wouldMatch = findMatchMask().count > 0;
        // revert preview
        temp = boardData[r1][c1];
        boardData[r1][c1] = boardData[r2][c2];
        boardData[r2][c2] = temp;

        if (!wouldMatch) {
            // invalid move: just shake the two tiles, no data change
            await animateInvalidMove(tile1, tile2);
            resetTileState();
            ensureTilesInteractive();
            isAnimating = false;
            return;
        }

        // one-way animations in opposite directions, then swap without bounce
        const classes = getOneWayClasses(r1, c1, r2, c2);
        await animateOneWaySwap(tile1, tile2, classes);

        temp = boardData[r1][c1];
        boardData[r1][c1] = boardData[r2][c2];
        boardData[r2][c2] = temp;
        renderBoard();

        await resolveMatchesWithAnimations();
        resetTileState();
        ensureTilesInteractive();
        isAnimating = false;
    }
}

function renderBoard() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const tile = board.children[r * columns + c];
            tile.style.backgroundImage = `url(images/${boardData[r][c]})`;
        }
    }
}

function getOneWayClasses(r1, c1, r2, c2) {
    if (r1 === r2) {
        // horizontal: tile1 moves toward tile2, tile2 moves toward tile1
        return c2 > c1 ? { a: "to-right", b: "to-left" } : { a: "to-left", b: "to-right" };
    }
    // vertical
    return r2 > r1 ? { a: "to-down", b: "to-up" } : { a: "to-up", b: "to-down" };
}

function animateOneWaySwap(tile1, tile2, classes) {
    return new Promise((resolve) => {
        let finished = 0;
        const onEnd = (e) => {
            const cls = e.currentTarget === tile1 ? classes.a : classes.b;
            e.currentTarget.classList.remove(cls);
            finished++;
            if (finished === 2) resolve();
        };
        tile1.addEventListener("animationend", onEnd, { once: true });
        tile2.addEventListener("animationend", onEnd, { once: true });
        tile1.classList.add(classes.a);
        tile2.classList.add(classes.b);
    });
}

function animateInvalidMove(tile1, tile2) {
    return new Promise((resolve) => {
        let finished = 0;
        const onEnd = (e) => {
            e.target.classList.remove("anim-invalid");
            finished++;
            if (finished === 2) resolve();
        };
        tile1.addEventListener("animationend", onEnd, { once: true });
        tile2.addEventListener("animationend", onEnd, { once: true });
        tile1.classList.add("anim-invalid");
        tile2.classList.add("anim-invalid");
    });
}

// Find all matches (>=3) including T/L shapes, return mask and count
function findMatchMask() {
    const mask = Array.from({ length: rows }, () => Array(columns).fill(false));
    let count = 0;

    // Horizontal runs
    for (let r = 0; r < rows; r++) {
        let runStart = 0;
        for (let c = 1; c <= columns; c++) {
            const same = c < columns && boardData[r][c] && boardData[r][runStart] === boardData[r][c];
            if (!same) {
                const runLen = c - runStart;
                if (boardData[r][runStart] && runLen >= 3) {
                    for (let k = runStart; k < c; k++) {
                        if (!mask[r][k]) {
                            mask[r][k] = true;
                            count++;
                        }
                    }
                }
                runStart = c;
            }
        }
    }

    // Vertical runs
    for (let c = 0; c < columns; c++) {
        let runStart = 0;
        for (let r = 1; r <= rows; r++) {
            const same = r < rows && boardData[r][c] && boardData[runStart][c] === boardData[r][c];
            if (!same) {
                const runLen = r - runStart;
                if (boardData[runStart][c] && runLen >= 3) {
                    for (let k = runStart; k < r; k++) {
                        if (!mask[k][c]) {
                            mask[k][c] = true;
                            count++;
                        }
                    }
                }
                runStart = r;
            }
        }
    }

    return { mask, count };
}

// Apply mask with explode animation; return true if anything cleared
async function clearMatchesWithMask(mask) {
    let cleared = 0;
    // animate explode on matched tiles
    const explodeTiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (mask[r][c]) {
                const tile = board.children[r * columns + c];
                spawnSparkles(tile);
                explodeTiles.push(tile);
            }
        }
    }
    if (explodeTiles.length) {
        await animateExplode(explodeTiles);
    }
    // clear after animation
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (mask[r][c]) {
                boardData[r][c] = null;
                cleared++;
            }
        }
    }
    if (cleared > 0) {
        score += cleared * 10;
        scoreText.textContent = "Puan: " + score;
        return true;
    }
    return false;
}

function animateExplode(tiles) {
    return new Promise((resolve) => {
        let finished = 0;
        if (tiles.length === 0) return resolve();
        // play sound once per explosion batch if enabled
        try {
            if (isSoundOn && popSound) {
                popSound.currentTime = 0;
                popSound.play().catch(() => { });
            }
        } catch (_) { }
        tiles.forEach((t) => {
            const onEnd = () => {
                t.classList.remove("anim-explode");
                cleanupSparkles(t);
                finished++;
                if (finished === tiles.length) resolve();
            };
            t.addEventListener("animationend", onEnd, { once: true });
            t.classList.add("anim-explode");
        });
    });
}

function spawnSparkles(tile) {
    // create a few sparkles in different angles
    for (let i = 0; i < 6; i++) {
        const s = document.createElement("div");
        s.className = `sparkle s${i}`;
        tile.appendChild(s);
    }
    // quick burst particles with random angles/distances
    for (let i = 0; i < 8; i++) {
        const b = document.createElement("div");
        b.className = "burst";
        const angle = Math.floor(Math.random() * 360);
        const dist = 18 + Math.floor(Math.random() * 16); // 18-34px
        b.style.setProperty("--angle", angle + "deg");
        b.style.setProperty("--dist", dist + "px");
        tile.appendChild(b);
    }
}

function cleanupSparkles(tile) {
    const debris = tile.querySelectorAll('.sparkle, .burst');
    debris.forEach((n) => n.remove());
}

// Resolve matches and cascades; return true if at least one match happened
async function resolveMatchesWithAnimations() {
    let any = false;
    while (true) {
        const { mask, count } = findMatchMask();
        if (count === 0) break;
        any = true;
        await clearMatchesWithMask(mask);
        const movedMask = dropCandies();
        await animateFallSome(movedMask);
        await delay(120); // brief pause between cascades
        resetTileState();
        ensureTilesInteractive();
    }
    return any;
}

function dropCandies() {
    const movedMask = Array.from({ length: rows }, () => Array(columns).fill(false));
    for (let c = 0; c < columns; c++) {
        let empty = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
            if (boardData[r][c]) {
                const targetRow = empty;
                if (targetRow !== r) {
                    movedMask[targetRow][c] = true;
                }
                boardData[targetRow][c] = boardData[r][c];
                empty--;
            }
        }
        for (let r = empty; r >= 0; r--) {
            boardData[r][c] = candyImages[Math.floor(Math.random() * candyImages.length)];
            movedMask[r][c] = true; // new candies fall in
        }
    }
    renderBoard();
    return movedMask;
}

function animateFallSome(movedMask) {
    return new Promise((resolve) => {
        const tilesToAnimate = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                if (movedMask[r][c]) {
                    tilesToAnimate.push(board.children[r * columns + c]);
                }
            }
        }
        if (tilesToAnimate.length === 0) return resolve();
        let finished = 0;
        tilesToAnimate.forEach((t) => {
            const onEnd = () => {
                t.classList.remove("anim-fall");
                finished++;
                if (finished === tilesToAnimate.length) resolve();
            };
            t.addEventListener("animationend", onEnd, { once: true });
            t.classList.add("anim-fall");
        });
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetTileState() {
    // Ensure tiles remain interactive after animations/cascades
    const tiles = Array.from(board.children);
    tiles.forEach((t) => {
        t.classList.remove(
            "anim-explode",
            "anim-fall",
            "anim-invalid",
            "to-left",
            "to-right",
            "to-up",
            "to-down"
        );
        t.style.outline = "none";
        t.style.transform = "";
        t.style.animation = "";
    });
}

function ensureTilesInteractive() {
    const tiles = Array.from(board.children);
    tiles.forEach((t) => {
        // Remove lingering listeners then rebind
        t.removeEventListener("pointerdown", pointerDown);
        t.removeEventListener("click", tileClick);
        t.addEventListener("pointerdown", pointerDown);
        t.addEventListener("click", tileClick);
        t.style.pointerEvents = "auto";
    });
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
