// app.js — Ana Oyun Mantığı

// ── STATE ──────────────────────────────────────────────────────────────────
const state = {
  teams: [{ name: 'Takım 1', score: 0 }, { name: 'Takım 2', score: 0 }],
  currentTeam: 0,
  stealTeam: null,
  usedIds: [],
  question: null,
  revealed: [],
  wrongs: 0,
  accumulated: 0,
  isSteal: false,
  stealDone: false,
  isX2: false,
  roundOver: false,
  questionIndex: 0,
  settings: { timerOn: false, timerSec: 30, x2Enabled: false },
  timer: { id: null, remaining: 30, total: 30 },
  winnerTeam: null,
};

// ── AUDIO ──────────────────────────────────────────────────────────────────
const AC = window.AudioContext || window.webkitAudioContext;
let ac;
function getAC() { if (!ac) ac = new AC(); return ac; }

function playTone(freq, dur, type = 'sine', vol = 0.3) {
  try {
    const ctx = getAC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) {}
}
function soundCorrect() { playTone(880, .12); setTimeout(() => playTone(1100, .18), 100); }
function soundWrong() { playTone(120, .45, 'sawtooth', .35); }
function soundBip() { playTone(660, .08, 'square', .15); }
function soundReveal() { playTone(440, .08); setTimeout(() => playTone(550, .1), 90); }

// ── SCREEN NAV ─────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active', 'fade-in');
    s.style.display = 'none';
  });
  const s = document.getElementById(id);
  s.style.display = 'flex';
  requestAnimationFrame(() => { s.classList.add('active', 'fade-in'); });
}

// ── MODALS ─────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
});

// ── SETTINGS ──────────────────────────────────────────────────────────────
const timerToggle = document.getElementById('timer-toggle');
const timerSecRow = document.getElementById('timer-sec-row');
const timerSecInput = document.getElementById('timer-sec-input');
const fullscreenToggle = document.getElementById('fullscreen-toggle');

timerToggle.addEventListener('change', () => {
  timerSecRow.classList.toggle('hidden', !timerToggle.checked);
});

fullscreenToggle.addEventListener('change', () => {
  if (fullscreenToggle.checked) {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        fullscreenToggle.checked = false;
      });
    }
  } else {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
});

document.addEventListener('fullscreenchange', () => {
  if (fullscreenToggle) {
    fullscreenToggle.checked = !!document.fullscreenElement;
  }
});

document.getElementById('btn-settings').addEventListener('click', () => {
  timerToggle.checked = state.settings.timerOn;
  timerSecInput.value = state.settings.timerSec;
  timerSecRow.classList.toggle('hidden', !state.settings.timerOn);
  document.getElementById('x2-toggle').checked = state.settings.x2Enabled;
  fullscreenToggle.checked = !!document.fullscreenElement;
  openModal('modal-settings');
});
document.getElementById('btn-rules').addEventListener('click', () => openModal('modal-rules'));
document.getElementById('btn-save-settings').addEventListener('click', () => {
  state.settings.timerOn = timerToggle.checked;
  state.settings.timerSec = Math.max(5, parseInt(timerSecInput.value) || 30);
  state.settings.x2Enabled = document.getElementById('x2-toggle').checked;
  // X2 butonunu ayara göre göster/gizle
  const x2Btn = document.getElementById('btn-x2');
  x2Btn.classList.toggle('hidden', !state.settings.x2Enabled);
  // Eğer X2 kapatıldıysa modu da sıfırla
  if (!state.settings.x2Enabled && state.isX2) {
    state.isX2 = false;
    x2Btn.classList.remove('active');
    document.getElementById('x2-badge').classList.add('hidden');
  }
  closeModal('modal-settings');
});


// ── WELCOME ────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => showScreen('screen-setup'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('screen-welcome'));

// ── SETUP ─────────────────────────────────────────────────────────────────
let selectedStarter = null;

function syncStarterNames() {
  const n0 = document.getElementById('team1-name').value.trim() || 'Takım 1';
  const n1 = document.getElementById('team2-name').value.trim() || 'Takım 2';
  document.getElementById('starter-name-0').textContent = n0;
  document.getElementById('starter-name-1').textContent = n1;
}

['team1-name', 'team2-name'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    syncStarterNames();
    checkPlayReady();
  });
});

document.querySelectorAll('.starter-btn[data-team]').forEach(btn => {
  if (btn.id.startsWith('starter-btn')) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#screen-setup .starter-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedStarter = parseInt(btn.dataset.team);
      checkPlayReady();
    });
  }
});

function checkPlayReady() {
  const ok = selectedStarter !== null;
  document.getElementById('btn-play').disabled = !ok;
}

document.getElementById('btn-play').addEventListener('click', () => {
  state.teams[0].name = document.getElementById('team1-name').value.trim() || 'Takım 1';
  state.teams[1].name = document.getElementById('team2-name').value.trim() || 'Takım 2';
  state.teams[0].score = 0;
  state.teams[1].score = 0;
  state.usedIds = [];
  state.questionIndex = 0;
  state.currentTeam = selectedStarter;
  startRound();
  showScreen('screen-game');
});

// ── ROUND START ────────────────────────────────────────────────────────────
function startRound() {
  const remaining = QUESTIONS.filter(q => !state.usedIds.includes(q.id));
  if (remaining.length === 0) { endGame(); return; }

  const q = remaining[Math.floor(Math.random() * remaining.length)];
  state.usedIds.push(q.id);
  state.question = q;
  state.revealed = [];
  state.wrongs = 0;
  state.accumulated = 0;
  state.isSteal = false;
  state.stealDone = false;
  state.isX2 = false;
  state.roundOver = false;
  state.questionIndex++;

  renderHeader();
  renderQuestion();
  renderCards();
  renderWrongs();
  updateBanner();
  updateControlPanel();
  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').disabled = false;
  document.getElementById('btn-submit').disabled = false;

  if (state.settings.timerOn) startTimer();
  else document.getElementById('timer-wrap').classList.add('hidden');
}

// ── RENDER ─────────────────────────────────────────────────────────────────
function renderHeader() {
  document.getElementById('hdr-name-0').textContent = state.teams[0].name;
  document.getElementById('hdr-name-1').textContent = state.teams[1].name;
  animateScore('hdr-score-0', state.teams[0].score);
  animateScore('hdr-score-1', state.teams[1].score);
  document.getElementById('team-block-0').classList.toggle('active', state.currentTeam === 0);
  document.getElementById('team-block-1').classList.toggle('active', state.currentTeam === 1);
}

function renderQuestion() {
  document.getElementById('question-num').textContent =
    `Soru ${state.questionIndex} / ${QUESTIONS.length}`;
  document.getElementById('question-text').textContent = state.question.question;
}

function renderCards() {
  const grid = document.getElementById('answers-grid');
  grid.innerHTML = '';
  state.question.answers.forEach((ans, i) => {
    const card = document.createElement('div');
    card.className = 'answer-card';
    card.id = `card-${i}`;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">${i + 1}</div>
        <div class="card-back">
          <div class="c-text">${ans.text}</div>
          <div class="c-pts">${ans.points} pt</div>
        </div>
      </div>`;
    // Tur bittikten sonra açılmamış kartlara tıklanınca aç
    card.addEventListener('click', () => {
      if (state.roundOver && !state.revealed.includes(i)) {
        card.classList.remove('clickable-reveal');
        revealCardOnly(i);
        // Tüm kartlar açıldıysa show-remaining butonunu gizle
        if (state.revealed.length === state.question.answers.length) {
          document.getElementById('btn-show-remaining').classList.add('hidden');
        }
      }
    });
    grid.appendChild(card);
  });
}

function renderWrongs() {
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`ws-${i}`);
    slot.classList.remove('lit');
    slot.textContent = '';
  }
}

function updateBanner() {
  const banner = document.getElementById('active-banner');
  const t = state.isSteal ? state.stealTeam : state.currentTeam;
  const icons = ['🔵', '🔴'];
  const label = state.isSteal
    ? `${icons[t]} ${state.teams[t].name} — ÇALMA TURU!`
    : `${icons[t]} ${state.teams[t].name} oynuyor`;
  document.getElementById('active-banner-text').textContent = label;
  banner.style.color = t === 0 ? '#3b82f6' : '#ef4444';
}

function updateControlPanel() {
  const over = state.roundOver;
  document.getElementById('btn-x2').classList.toggle('active', state.isX2);
  document.getElementById('x2-badge').classList.toggle('hidden', !state.isX2);
  document.getElementById('btn-show-remaining').classList.toggle('hidden', !over || state.revealed.length === 5);
  document.getElementById('btn-next-q').classList.toggle('hidden', !over);
}

// ── SCORE ANIMATION ────────────────────────────────────────────────────────
function animateScore(id, target) {
  const el = document.getElementById(id);
  const from = parseInt(el.textContent) || 0;
  const diff = target - from;
  if (diff === 0) { el.textContent = target; return; }
  const steps = 25;
  let i = 0;
  const iv = setInterval(() => {
    i++;
    el.textContent = Math.round(from + (diff * i / steps));
    if (i >= steps) { el.textContent = target; clearInterval(iv); }
  }, 20);
}

function animateAcc(val) {
  const el = document.getElementById('acc-points');
  const from = parseInt(el.textContent) || 0;
  const steps = 20;
  let i = 0;
  const iv = setInterval(() => {
    i++;
    el.textContent = Math.round(from + ((val - from) * i / steps));
    if (i >= steps) { el.textContent = val; clearInterval(iv); }
  }, 18);
}

// ── REVEAL CARD (puanlı) ────────────────────────────────────────────────────
function revealCard(index) {
  const card = document.getElementById(`card-${index}`);
  if (!card) return;
  card.classList.add('revealed');
  card.classList.remove('clickable-reveal');
  state.revealed.push(index);
  const pts = state.question.answers[index].points;
  const added = state.isX2 ? pts * 2 : pts;
  state.accumulated += added;
  animateAcc(state.accumulated);
  soundCorrect();
}

// ── REVEAL CARD ONLY (puan vermeden — tur bitti sonrası) ─────────────────────
function revealCardOnly(index) {
  const card = document.getElementById(`card-${index}`);
  if (!card || state.revealed.includes(index)) return;
  card.classList.add('revealed');
  state.revealed.push(index);
  soundReveal();
}

// ── ANSWER SUBMIT ──────────────────────────────────────────────────────────
document.getElementById('btn-submit').addEventListener('click', submitAnswer);
document.getElementById('answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAnswer();
});
function submitAnswer() {
  const input = document.getElementById('answer-input');
  const txt = input.value.trim();
  if (!txt || state.roundOver) return;

  const idx = checkAnswer(txt, state.question.answers, state.revealed);
  input.value = '';
  input.focus();

  if (idx !== -1) {
    // ✅ DOĞRU — kartı aç
    revealCard(idx);

    if (state.isSteal) {
      finishSteal(true);
      return;
    }
    if (state.revealed.length === state.question.answers.length) {
      endRound(state.currentTeam);
    } else {
      // Doğru cevap verildi ve tur bitmediyse süreyi sıfırla/yeniden başlat
      if (state.settings.timerOn && !state.isSteal) {
        startTimer();
      }
    }
  } else {
    // ❌ YANLIŞ — otomatik X ver
    giveWrong();
  }
}

// ── WRONG BUTTON ──────────────────────────────────────────────────────────

function giveWrong() {
  if (state.roundOver) return;

  if (state.isSteal) {
    finishSteal(false);
    return;
  }

  soundWrong();
  const slot = document.getElementById(`ws-${state.wrongs}`);
  if (slot) {
    slot.textContent = '✗';
    slot.classList.add('lit');
  }
  state.wrongs++;

  // Ekran sallama
  document.getElementById('screen-game').classList.add('shaking');
  setTimeout(() => document.getElementById('screen-game').classList.remove('shaking'), 400);

  if (state.wrongs >= 3) {
    stopTimer();
    triggerSteal();
  } else {
    // Yanlış cevap verildiğinde süreyi sıfırla/yeniden başlat
    if (state.settings.timerOn) {
      startTimer();
    }
  }
}


// ── STEAL ──────────────────────────────────────────────────────────────────
function triggerSteal() {
  state.isSteal = true;
  state.stealTeam = state.currentTeam === 0 ? 1 : 0;
  document.getElementById('steal-team-name').textContent = state.teams[state.stealTeam].name;
  document.getElementById('overlay-steal').classList.remove('hidden');
  // Çalma turunda süre sayacını gizle ve durdur
  stopTimer();
  document.getElementById('timer-wrap').classList.add('hidden');
  // Input & wrong button disable during overlay
  document.getElementById('answer-input').disabled = true;
  document.getElementById('btn-submit').disabled = true;
}

document.getElementById('btn-steal-ok').addEventListener('click', () => {
  document.getElementById('overlay-steal').classList.add('hidden');
  document.getElementById('answer-input').disabled = false;
  document.getElementById('btn-submit').disabled = false;
  updateBanner();
  document.getElementById('answer-input').focus();
});

function finishSteal(success) {
  stopTimer();
  state.stealDone = true;
  const winner = success ? state.stealTeam : state.currentTeam;
  const banner = document.getElementById('active-banner');
  const bannerText = document.getElementById('active-banner-text');

  if (success) {
    // Kart zaten submitAnswer içinde açıldı
    bannerText.textContent = `✅ DOĞRU! ${state.teams[state.stealTeam].name} bu turu kazandı! Kalan cevapları görmek için bekleyin...`;
    banner.style.color = '#22c55e';
    banner.style.background = 'rgba(34,197,94,.15)';
  } else {
    soundWrong();
    bannerText.textContent = `❌ YANLIŞ! Puan ${state.teams[state.currentTeam].name}'e geçiyor... Kalan cevapları görmek için bekleyin.`;
    banner.style.color = '#ef4444';
    banner.style.background = 'rgba(239,68,68,.15)';
    document.getElementById('screen-game').classList.add('shaking');
    setTimeout(() => document.getElementById('screen-game').classList.remove('shaking'), 400);
  }

  endRound(winner);
}

// ── ROUND END ──────────────────────────────────────────────────────────────
function endRound(winnerTeam) {
  state.roundOver = true;
  state.winnerTeam = winnerTeam;
  state.teams[winnerTeam].score += state.accumulated;
  renderHeader();

  // Durdur ve gizle
  stopTimer();
  document.getElementById('timer-wrap').classList.add('hidden');

  // Disable input
  document.getElementById('answer-input').disabled = true;
  document.getElementById('btn-submit').disabled = true;

  // Açılmamış kartları tıklanabilir yap
  state.question.answers.forEach((_, i) => {
    if (!state.revealed.includes(i)) {
      const card = document.getElementById(`card-${i}`);
      if (card) card.classList.add('clickable-reveal');
    }
  });

  updateControlPanel();
  // ❗ Özet overlay burada açılmıyor — kullanıcı "Sonraki Soru" butonuna basana kadar bekler
}


// ── ROUND SUMMARY ──────────────────────────────────────────────────────────
function showRoundSummary(winnerTeam) {
  const s0 = state.teams[0].score;
  const s1 = state.teams[1].score;
  document.getElementById('rs-name-0').textContent = state.teams[0].name;
  document.getElementById('rs-name-1').textContent = state.teams[1].name;
  document.getElementById('rs-score-0').textContent = s0;
  document.getElementById('rs-score-1').textContent = s1;
  document.getElementById('rs-card-0').classList.toggle('leading', s0 > s1);
  document.getElementById('rs-card-1').classList.toggle('leading', s1 > s0);
  const wName = state.teams[winnerTeam].name;
  const earned = state.accumulated;
  document.getElementById('round-winner-text').textContent =
    earned > 0
      ? `${wName} bu turda ${earned} puan kazandı! 🎉`
      : `Bu tur puansız geçti.`;
  document.getElementById('overlay-round-summary').classList.remove('hidden');
}

// ── SHOW REMAINING ─────────────────────────────────────────────────────────
document.getElementById('btn-show-remaining').addEventListener('click', () => {
  let delay = 0;
  state.question.answers.forEach((_, i) => {
    if (!state.revealed.includes(i)) {
      setTimeout(() => { revealCardOnly(i); }, delay);
      delay += 300;
    }
  });
  document.getElementById('btn-show-remaining').classList.add('hidden');
});

// Sonraki Soru butonu → summary overlay aç
document.getElementById('btn-next-q').addEventListener('click', () => {
  const remaining = QUESTIONS.filter(q => !state.usedIds.includes(q.id));
  if (remaining.length === 0) { endGame(); return; }
  showRoundSummary(state.winnerTeam ?? state.currentTeam);
});

// Summary overlay → devam → team pick
document.getElementById('btn-summary-continue').addEventListener('click', () => {
  document.getElementById('overlay-round-summary').classList.add('hidden');
  document.getElementById('pick-name-0').textContent = state.teams[0].name;
  document.getElementById('pick-name-1').textContent = state.teams[1].name;
  openModal('modal-team-pick');
});

// ── X2 MODE ────────────────────────────────────────────────────────────────
document.getElementById('btn-x2').addEventListener('click', () => {
  if (state.roundOver || !state.settings.x2Enabled) return;
  state.isX2 = !state.isX2;
  document.getElementById('btn-x2').classList.toggle('active', state.isX2);
  document.getElementById('x2-badge').classList.toggle('hidden', !state.isX2);
});




document.querySelectorAll('#modal-team-pick .starter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.currentTeam = parseInt(btn.dataset.team);
    closeModal('modal-team-pick');
    startRound();
  });
});

// ── TIMER ──────────────────────────────────────────────────────────────────
function startTimer() {
  if (state.isSteal || state.roundOver) {
    document.getElementById('timer-wrap').classList.add('hidden');
    return;
  }

  const wrap = document.getElementById('timer-wrap');
  const ring = document.getElementById('timer-ring');
  const num = document.getElementById('timer-num');
  const total = state.settings.timerSec;
  const circumference = 276.46;

  state.timer.total = total;
  state.timer.remaining = total;
  wrap.classList.remove('hidden');
  ring.className = 'timer-ring';
  ring.style.strokeDashoffset = '0';
  num.textContent = total;

  clearInterval(state.timer.id);
  state.timer.id = setInterval(() => {
    state.timer.remaining--;
    const r = state.timer.remaining;
    num.textContent = r;

    const pct = r / total;
    ring.style.strokeDashoffset = circumference * (1 - pct);

    // Color states
    ring.className = 'timer-ring';
    if (pct <= 0.25) ring.classList.add('danger');
    else if (pct <= 0.5) ring.classList.add('warn');

    // Shake at critical
    if (pct <= 0.25) {
      wrap.classList.add('shaking');
      setTimeout(() => wrap.classList.remove('shaking'), 400);
    }

    // Flash + bip at last 5 sec
    if (r <= 5 && r > 0) {
      soundBip();
      document.getElementById('screen-game').classList.add('flash-danger');
      setTimeout(() => document.getElementById('screen-game').classList.remove('flash-danger'), 500);
    }

    if (r <= 0) {
      stopTimer();
      showTimesUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer.id);
  state.timer.id = null;
}

function showTimesUp() {
  const ov = document.getElementById('overlay-timesup');
  ov.classList.remove('hidden');
  playTone(200, .6, 'sawtooth', .4);
  setTimeout(() => {
    ov.classList.add('hidden');
    if (!state.roundOver) {
      giveWrong();
    }
  }, 2000);
}


// ── GAME OVER ──────────────────────────────────────────────────────────────
function endGame() {
  stopTimer();
  const s0 = state.teams[0].score;
  const s1 = state.teams[1].score;
  document.getElementById('final-name-0').textContent = state.teams[0].name;
  document.getElementById('final-name-1').textContent = state.teams[1].name;
  document.getElementById('final-score-0').textContent = s0;
  document.getElementById('final-score-1').textContent = s1;

  const w = s0 > s1 ? 0 : s1 > s0 ? 1 : -1;
  document.getElementById('final-card-0').classList.toggle('winner-card', w === 0);
  document.getElementById('final-card-1').classList.toggle('winner-card', w === 1);
  document.getElementById('winner-text').textContent =
    w === -1 ? "🤝 Berabere! Harika bir yarışma!" :
    `🎉 Kazanan: ${state.teams[w].name}! Tebrikler! 🎉`;

  showScreen('screen-gameover');
}

document.getElementById('btn-end-game-manual').addEventListener('click', () => {
  if (confirm("Oyunu bitirmek ve puan tablosunu görmek istediğinize emin misiniz?")) {
    endGame();
  }
});

document.getElementById('btn-restart').addEventListener('click', () => {
  selectedStarter = null;
  document.querySelectorAll('.starter-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-play').disabled = true;
  syncStarterNames();
  showScreen('screen-welcome');
});

// ── INIT ────────────────────────────────────────────────────────────────────
showScreen('screen-welcome');
