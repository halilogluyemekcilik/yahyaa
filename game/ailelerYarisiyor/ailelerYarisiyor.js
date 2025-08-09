// Basit Aileler Yarışıyor oyunu

// Durum
const state = {
  teams: [
    { name: 'Takım 1', score: 0 },
    { name: 'Takım 2', score: 0 },
  ],
  currentTeamIndex: 0,
  wrongCount: 0,
  currentQuestion: null, // { text: string, answers: [{text, points, revealed}] }
  revealedCount: 0,
  usedQuestionFiles: new Set(),
};

// Yardımcılar
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function setHidden(id, hidden) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  el.classList.toggle('hidden', hidden);
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// UI Güncellemeleri
function renderScoreboard() {
  $('#team-0-name').textContent = state.teams[0].name;
  $('#team-1-name').textContent = state.teams[1].name;
  $('#team-0-score').textContent = state.teams[0].score;
  $('#team-1-score').textContent = state.teams[1].score;
  $('#starter-team-0').textContent = state.teams[0].name;
  $('#starter-team-1').textContent = state.teams[1].name;
}

function renderTurn() {
  $('#current-team-name').textContent = state.teams[state.currentTeamIndex].name;
}

function renderWrongBoxes() {
  const boxes = $$('#wrong-boxes .wrong-box');
  boxes.forEach((box, idx) => {
    box.textContent = idx < state.wrongCount ? 'X' : '-';
  });
}

function renderQuestion() {
  if (!state.currentQuestion) return;
  $('#question-text').textContent = state.currentQuestion.text;

  const board = $('#answers-board');
  board.innerHTML = '';

  state.currentQuestion.answers.forEach((ans, idx) => {
    const li = document.createElement('li');
    li.dataset.index = String(idx);
    const left = document.createElement('span');
    const right = document.createElement('span');
    left.className = 'answer-text';
    right.className = 'answer-points';

    if (ans.revealed) {
      li.classList.add('revealed');
      left.textContent = ans.text;
      right.textContent = ans.points;
    } else {
      left.innerHTML = `<span class="placeholder">Cevap ${idx + 1}</span>`;
      right.textContent = '';
    }

    li.appendChild(left);
    li.appendChild(right);
    board.appendChild(li);
  });
}

function updateUIAll() {
  renderScoreboard();
  renderTurn();
  renderWrongBoxes();
  renderQuestion();
}

// Oyun akışı
async function loadRandomQuestion() {
  // sorular klasöründe soru1.txt, soru2.txt ... gibi dosyalar bekleniyor
  // Basitçe 1-20 arası deneyelim ve mevcut olanlardan rastgele seçelim
  const possible = Array.from({ length: 50 }, (_, i) => `sorular/soru${i + 1}.txt`);

  const existing = [];
  // fetch ile dene; başarısız olanları atla
  await Promise.all(
    possible.map(async (p) => {
      try {
        const res = await fetch(p, { cache: 'no-store' });
        if (res.ok) {
          existing.push(p);
        }
      } catch (e) {
        // yok say
      }
    })
  );

  const available = existing.filter((p) => !state.usedQuestionFiles.has(p));
  if (available.length === 0) {
    // hepsi kullanıldıysa sıfırla
    state.usedQuestionFiles.clear();
  }
  const pool = available.length > 0 ? available : existing;
  if (pool.length === 0) {
    throw new Error('Hiç soru bulunamadı. Lütfen sorular klasörüne dosya ekleyin.');
  }

  const file = pool[Math.floor(Math.random() * pool.length)];
  const text = await (await fetch(file, { cache: 'no-store' })).text();
  state.usedQuestionFiles.add(file);

  const parsed = parseQuestionFile(text);
  state.currentQuestion = parsed;
  state.wrongCount = 0;
  state.revealedCount = parsed.answers.filter((a) => a.revealed).length;

  setHidden('round-controls', true);
  setHidden('steal-section', true);
  setHidden('answer-input-area', false);

  updateUIAll();
}

function parseQuestionFile(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const [question, ...rest] = lines;
  const answers = rest.slice(0, 5).map((line) => {
    // format: "cevap puan"
    // cevabın içinde boşluk olabilir, bu yüzden sonda sayı arayalım
    const match = line.match(/^(.*)\s+(\d+)$/);
    if (!match) {
      return { text: line, points: 0, revealed: false };
    }
    const ansText = match[1].trim();
    const points = parseInt(match[2], 10) || 0;
    return { text: ansText, points, revealed: false };
  });

  // 5'ten azsa doldur
  while (answers.length < 5) {
    answers.push({ text: '-', points: 0, revealed: false });
  }

  // puan yüksekten düşüğe sıralayalım (görsel tutarlılık)
  answers.sort((a, b) => b.points - a.points);

  return { text: question || 'Soru bulunamadı', answers };
}

function normalize(str) {
  return (str || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tryRevealAnswer(guessRaw, awardTeamIndex = state.currentTeamIndex) {
  const guess = normalize(guessRaw);
  const answers = state.currentQuestion.answers;
  let found = false;
  for (const ans of answers) {
    if (ans.revealed) continue;
    if (normalize(ans.text) === guess) {
      ans.revealed = true;
      state.revealedCount += 1;
      state.teams[awardTeamIndex].score += ans.points;
      found = true;
      break;
    }
  }
  if (found) {
    renderScoreboard();
    renderQuestion();
  }
  return found;
}

function isRoundComplete() {
  return state.revealedCount >= 5 || state.currentQuestion.answers.every((a) => a.revealed || a.points === 0);
}

function handleWrongAnswer() {
  state.wrongCount += 1;
  renderWrongBoxes();
  if (state.wrongCount >= 3) {
    // Çalma hakkı diğer takıma
    const other = state.currentTeamIndex === 0 ? 1 : 0;
    $('#steal-team-name').textContent = state.teams[other].name;
    setHidden('answer-input-area', true);
    setHidden('steal-section', false);
    $('#steal-input').focus();
  }
}

function showStarterSelection() {
  // Radyo butonlarını varsayılan ilk takıma çekelim
  const radios = $$('#starter-form input[name="starter"]');
  if (radios[0]) radios[0].checked = true;
  if (radios[1]) radios[1].checked = false;
  setHidden('game', true);
  setHidden('choose-starter', false);
}

function endRound() {
  setHidden('answer-input-area', true);
  setHidden('steal-section', true);
  setHidden('round-controls', true);
  showStarterSelection();
}

// Event listeners
function wireEvents() {
  $('#names-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const a = $('#team-a-input').value.trim();
    const b = $('#team-b-input').value.trim();
    if (!a || !b) return;
    state.teams[0].name = a;
    state.teams[1].name = b;
    renderScoreboard();
    setHidden('setup-names', true);
    setHidden('choose-starter', false);
  });

  $('#starter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    state.currentTeamIndex = Number(formData.get('starter')) || 0;
    setHidden('choose-starter', true);
    setHidden('game', false);
    renderTurn();
    renderWrongBoxes();
    await loadRandomQuestion();
    $('#answer-input').focus();
  });

  $('#answer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#answer-input');
    const guess = input.value.trim();
    if (!guess) return;
    input.value = '';

    const ok = tryRevealAnswer(guess);
    if (!ok) {
      handleWrongAnswer();
    } else if (isRoundComplete()) {
      endRound();
    }
  });

  $('#steal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#steal-input');
    const guess = input.value.trim();
    if (!guess) return;
    input.value = '';

    const other = state.currentTeamIndex === 0 ? 1 : 0;
    const ok = tryRevealAnswer(guess, other);

    endRound();
  });

  $('#next-question').addEventListener('click', async () => {
    // Artık yeni soru için başlangıç takımı tekrar sorulacak
    endRound();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderScoreboard();
  wireEvents();
});


