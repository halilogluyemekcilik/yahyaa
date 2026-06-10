/* ============================================
   101 PUAN TABLOSU — Application Logic v2
   Penalties are independent from rounds.
   ============================================ */

// ---- Game State ----
let gameState = {
  playerCount: 0,
  players: [],       // [{ name: 'Takım 1' }, ...]
  rounds: [],        // [{ scores: [10, -5] }, ...]  — only scores, no penalties
  penalties: [],     // [{ playerIndex: 0, value: 20 }, ...]  — independent penalty entries
  isFinished: false
};

// ---- Helpers ----
const $ = (id) => document.getElementById(id);
const screens = {};

document.addEventListener('DOMContentLoaded', () => {
  screens.welcome = $('screen-welcome');
  screens.names = $('screen-names');
  screens.scoreboard = $('screen-scoreboard');
  screens.results = $('screen-results');

  const saved = loadGame();
  if (saved) {
    // Migrate old format if needed
    if (!saved.penalties) saved.penalties = [];
    gameState = saved;

    if (gameState.isFinished) {
      showScreen('results');
      renderResults();
    } else if (gameState.players.length > 0) {
      showScreen('scoreboard');
      renderScoreboard();
      renderInputForm();
      updateRoundDisplay();
    }
  }
});

// ============================================
//  SCREEN MANAGEMENT
// ============================================
function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
  window.scrollTo(0, 0);
}

// ============================================
//  SCREEN 1 — WELCOME
// ============================================
function selectPlayerCount(count) {
  gameState.playerCount = count;
  if (count === 2) {
    gameState.players = [{ name: 'Takım 1' }, { name: 'Takım 2' }];
  } else {
    gameState.players = [{ name: '1. Kişi' }, { name: '2. Kişi' }, { name: '3. Kişi' }, { name: '4. Kişi' }];
  }
  generateNameInputs();
  showScreen('names');
}

function goBackToWelcome() { showScreen('welcome'); }

// ============================================
//  SCREEN 2 — NAMES
// ============================================
function generateNameInputs() {
  const form = $('names-form');
  const emojis = ['♠️', '♥️', '♣️', '♦️'];
  form.innerHTML = '';
  gameState.players.forEach((player, i) => {
    const div = document.createElement('div');
    div.className = 'name-input-group';
    div.innerHTML = `
      <label for="name-input-${i}">${emojis[i]} ${gameState.playerCount === 2 ? 'Takım' : 'Kişi'} ${i + 1}</label>
      <input type="text" id="name-input-${i}" value="${esc(player.name)}" placeholder="${esc(player.name)}" maxlength="20" autocomplete="off">
    `;
    form.appendChild(div);
  });
}

function startGame() {
  gameState.players.forEach((p, i) => {
    const val = $(`name-input-${i}`).value.trim();
    if (val) p.name = val;
  });
  if (gameState.players.some(p => !p.name)) { showToast('Lütfen tüm isimleri doldurun'); return; }
  const names = gameState.players.map(p => p.name);
  if (new Set(names).size !== names.length) { showToast('İsimler birbirinden farklı olmalı'); return; }

  gameState.rounds = [];
  gameState.penalties = [];
  gameState.isFinished = false;
  saveGame();
  showScreen('scoreboard');
  renderScoreboard();
  renderInputForm();
  updateRoundDisplay();
}

// ============================================
//  SCREEN 3 — SCOREBOARD
// ============================================
function getCurrentRound() { return gameState.rounds.length + 1; }

function updateRoundDisplay() {
  $('round-display').textContent = getCurrentRound();
  $('el-badge').textContent = `El ${getCurrentRound()}`;
}

// ---- Main render ----
function renderScoreboard() {
  const content = $('scoreboard-content');
  const players = gameState.players;
  const count = gameState.playerCount;
  const rounds = gameState.rounds;
  const penalties = gameState.penalties;
  const colClass = `cols-${count}`;

  let html = '';

  // ===== PENALTY SECTION =====
  html += `<div class="section-card">`;
  html += `<div class="section-card-header penalty-header">`;
  html += `<h3>🔴 Cezalar</h3>`;
  html += `</div>`;

  // Grid with player columns
  html += `<div class="data-grid ${colClass}">`;
  players.forEach((player, pIdx) => {
    const playerPenalties = penalties.filter(p => p.playerIndex === pIdx);
    html += `<div class="data-column">`;
    html += `<div class="data-column-name">${esc(player.name)}</div>`;
    html += `<div class="data-column-values">`;
    if (playerPenalties.length === 0) {
      html += `<div class="data-column-empty">—</div>`;
    } else {
      playerPenalties.forEach(pen => {
        const cls = pen.value < 0 ? 'negative' : '';
        html += `<div class="data-value penalty-val ${cls}">${formatNum(pen.value)}</div>`;
      });
    }
    html += `</div></div>`;
  });
  html += `</div>`;

  // Add penalty button
  html += `<div class="penalty-add-row">`;
  html += `<button class="btn btn-danger btn-sm btn-block" onclick="openPenaltyModal()">+ Ceza Ekle</button>`;
  html += `</div>`;
  html += `</div>`;

  // ===== SCORE SECTION =====
  html += `<div class="section-card">`;
  html += `<div class="section-card-header score-header">`;
  html += `<h3>🟢 El Puanları</h3>`;
  html += `</div>`;

  if (rounds.length === 0) {
    html += `<div class="scoreboard-empty"><div class="empty-icon">📝</div><p>İlk elin puanlarını aşağıdan gir</p></div>`;
  } else {
    html += `<div class="data-grid ${colClass}">`;
    players.forEach((player, pIdx) => {
      html += `<div class="data-column">`;
      html += `<div class="data-column-name">${esc(player.name)}</div>`;
      html += `<div class="data-column-values">`;
      rounds.forEach((round, rIdx) => {
        const score = round.scores[pIdx];
        let cls = '';
        if (score < 0) cls = 'negative';
        else if (score === 0) cls = 'zero';
        else cls = 'positive';
        html += `<div class="data-value ${cls}"><small style="color:var(--text-muted);margin-right:3px">${rIdx + 1}.</small>${formatNum(score)}</div>`;
      });
      html += `</div></div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  content.innerHTML = html;
}

// ---- Round input form ----
function renderInputForm() {
  const grid = $('input-grid');
  const count = gameState.playerCount;
  grid.className = `input-grid players-${count}`;
  grid.innerHTML = '';

  gameState.players.forEach((player, i) => {
    const card = document.createElement('div');
    card.className = 'input-player-card';
    card.id = `input-card-${i}`;
    card.innerHTML = `
      <div class="player-name-label">${esc(player.name)}</div>
      <div class="input-row">
        <label for="score-input-${i}">Puan</label>
        <input type="number" id="score-input-${i}" class="num-input" placeholder="0" oninput="onScoreInput()">
      </div>
    `;
    grid.appendChild(card);
  });
  validateRoundInput();
}

function onScoreInput() {
  validateRoundInput();
  gameState.players.forEach((_, i) => {
    const card = $(`input-card-${i}`);
    const input = $(`score-input-${i}`);
    card.classList.toggle('has-value', input.value.trim() !== '');
  });
}

function validateRoundInput() {
  const allFilled = gameState.players.every((_, i) => $(`score-input-${i}`).value.trim() !== '');
  $('btn-save-round').disabled = !allFilled;
}

function submitRound() {
  const scores = gameState.players.map((_, i) => parseInt($(`score-input-${i}`).value) || 0);
  if (gameState.players.some((_, i) => $(`score-input-${i}`).value.trim() === '')) {
    showToast('Tüm puanları girin');
    return;
  }
  gameState.rounds.push({ scores });
  saveGame();
  renderScoreboard();
  renderInputForm();
  updateRoundDisplay();
  showToast(`El ${gameState.rounds.length} kaydedildi ✓`);
}

// ---- Penalty Modal ----
function openPenaltyModal() {
  const bodyEl = $('modal-body');
  let html = '<div class="penalty-modal-grid">';
  gameState.players.forEach((player, i) => {
    html += `
      <div class="penalty-modal-player">
        <span class="pm-name">${esc(player.name)}</span>
        <input type="number" id="penalty-modal-input-${i}" class="num-input" placeholder="0">
      </div>
    `;
  });
  html += '</div>';
  bodyEl.innerHTML = html;

  $('modal-icon').textContent = '🔴';
  $('modal-title').textContent = 'Ceza Ekle';
  $('modal-message').textContent = 'Ceza alan kişilerin yanına puanı yazın. Boş bırakılanlar atlanır.';
  $('modal-confirm-btn').textContent = 'Kaydet';
  $('modal-confirm-btn').onclick = savePenalties;
  $('modal-overlay').classList.add('active');
}

function savePenalties() {
  let added = 0;
  gameState.players.forEach((_, i) => {
    const input = $(`penalty-modal-input-${i}`);
    const val = input.value.trim();
    if (val !== '' && parseInt(val) !== 0) {
      gameState.penalties.push({ playerIndex: i, value: parseInt(val) });
      added++;
    }
  });

  if (added === 0) {
    showToast('En az bir ceza değeri girin');
    return;
  }

  saveGame();
  closeModal();
  renderScoreboard();
  showToast(`${added} ceza eklendi ✓`);
}

// ---- Finish / New Game ----
function confirmFinishGame() {
  if (gameState.rounds.length === 0) { showToast('Henüz hiç el oynanmadı'); return; }
  $('modal-body').innerHTML = '';
  showModal('🏁', 'Oyunu Bitir', `${gameState.rounds.length} el oynandı. Oyunu bitirip sonuçları görmek istiyor musunuz?`, 'Bitir', finishGame);
}

function finishGame() {
  gameState.isFinished = true;
  saveGame();
  closeModal();
  showScreen('results');
  renderResults();
}

function confirmNewGame() {
  if (gameState.rounds.length === 0 && gameState.penalties.length === 0) { resetGame(); return; }
  $('modal-body').innerHTML = '';
  showModal('⚠️', 'Yeni Oyun', 'Mevcut oyun verileri silinecek. Emin misiniz?', 'Evet, Yeni Oyun', resetGame);
}

// ============================================
//  SCREEN 4 — RESULTS
// ============================================
function calculateResults() {
  return gameState.players.map((player, i) => {
    let roundTotal = 0;
    gameState.rounds.forEach(r => roundTotal += r.scores[i]);

    let penaltyTotal = 0;
    const playerPenalties = gameState.penalties.filter(p => p.playerIndex === i);
    playerPenalties.forEach(p => penaltyTotal += p.value);

    return { name: player.name, index: i, roundTotal, penaltyTotal, grandTotal: roundTotal + penaltyTotal, penalties: playerPenalties };
  });
}

function renderResults() {
  const container = $('results-cards');
  const results = calculateResults();
  const emojis = ['♠️', '♥️', '♣️', '♦️'];

  const sorted = [...results].sort((a, b) => a.grandTotal - b.grandTotal);
  const winnerTotal = sorted[0].grandTotal;

  container.innerHTML = '';

  sorted.forEach((result, rank) => {
    const isWinner = result.grandTotal === winnerTotal;
    const card = document.createElement('div');
    card.className = `result-card${isWinner ? ' winner' : ''}`;
    card.id = `result-card-${result.index}`;

    // Score details
    let scoreDetailHtml = '';
    gameState.rounds.forEach((round, rIdx) => {
      const s = round.scores[result.index];
      scoreDetailHtml += `<div class="detail-item"><span class="round-label">El ${rIdx+1}:</span><span class="round-value ${s < 0 ? 'negative' : ''}">${formatNum(s)}</span></div>`;
    });

    // Penalty details
    let penaltyDetailHtml = '';
    result.penalties.forEach((pen, pIdx) => {
      penaltyDetailHtml += `<div class="detail-item penalty-item"><span class="round-label">${pIdx+1}.</span><span class="round-value ${pen.value < 0 ? 'negative' : ''}">${formatNum(pen.value)}</span></div>`;
    });

    card.innerHTML = `
      <div class="result-card-header" onclick="togglePlayerDetail(${result.index})">
        <div class="result-player-info">
          <div class="player-rank">${rank + 1}</div>
          <span class="player-name">${emojis[result.index]} ${esc(result.name)}</span>
          ${isWinner ? '<span class="winner-badge">👑</span>' : ''}
        </div>
        <div class="result-total-score">
          <span class="total-label">Toplam</span>
          <span class="total-value">${formatNum(result.grandTotal)}</span>
        </div>
        <span class="toggle-arrow">▼</span>
      </div>
      <div class="result-card-summary">
        <div class="result-summary-item">
          <span class="summary-label">El Toplamı</span>
          <span class="summary-value score-val">${formatNum(result.roundTotal)}</span>
        </div>
        <div class="result-summary-item">
          <span class="summary-label">Ceza Toplamı</span>
          <span class="summary-value penalty-val">${formatNum(result.penaltyTotal)}</span>
        </div>
        <div class="result-summary-item">
          <span class="summary-label">Genel Toplam</span>
          <span class="summary-value total-val">${formatNum(result.grandTotal)}</span>
        </div>
      </div>
      <div class="result-card-detail" id="detail-${result.index}">
        <div class="result-card-detail-inner">
          <div class="detail-section">
            <div class="detail-section-title">El Puanları</div>
            <div class="detail-list">${scoreDetailHtml}</div>
          </div>
          ${penaltyDetailHtml ? `
          <div class="detail-section">
            <div class="detail-section-title penalty-title">Cezalar</div>
            <div class="detail-list">${penaltyDetailHtml}</div>
          </div>` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function togglePlayerDetail(playerIndex) {
  const detail = $(`detail-${playerIndex}`);
  const card = $(`result-card-${playerIndex}`);
  detail.classList.toggle('open');
  card.classList.toggle('open');
}

let allDetailsOpen = false;
function toggleAllDetails() {
  allDetailsOpen = !allDetailsOpen;
  gameState.players.forEach((_, i) => {
    const d = $(`detail-${i}`);
    const c = $(`result-card-${i}`);
    if (d) { d.classList.toggle('open', allDetailsOpen); c.classList.toggle('open', allDetailsOpen); }
  });
}

// ============================================
//  DATA PERSISTENCE
// ============================================
const STORAGE_KEY = '101puan_game';
function saveGame() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)); } catch(e) {} }
function loadGame() { try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch(e) { return null; } }
function resetGame() {
  gameState = { playerCount: 0, players: [], rounds: [], penalties: [], isFinished: false };
  allDetailsOpen = false;
  localStorage.removeItem(STORAGE_KEY);
  closeModal();
  showScreen('welcome');
}

// ============================================
//  MODAL
// ============================================
function showModal(icon, title, message, confirmText, onConfirm) {
  $('modal-icon').textContent = icon;
  $('modal-title').textContent = title;
  $('modal-message').textContent = message;
  $('modal-confirm-btn').textContent = confirmText;
  $('modal-confirm-btn').onclick = onConfirm;
  $('modal-body').innerHTML = '';
  $('modal-overlay').classList.add('active');
}

function closeModal() {
  $('modal-overlay').classList.remove('active');
  $('modal-body').innerHTML = '';
}

$('modal-overlay')?.addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });

// ============================================
//  TOAST
// ============================================
let toastTimer = null;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ============================================
//  UTILITIES
// ============================================
function formatNum(n) { return n > 0 ? `+${n}` : `${n}`; }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
