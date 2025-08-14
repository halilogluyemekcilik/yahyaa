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
  roundPoints: 0, // Bu el için toplanan puanlar
  stealAttempted: false, // Çalma hakkı kullanıldı mı?
  stealTeamIndex: -1, // Çalma hakkı olan takım
  firstTeamRoundPoints: 0, // İlk takımın bu elden aldığı puanlar
  allAnswersRevealed: false, // Tüm cevaplar gösterildi mi?
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
  
  // Eğer 5 cevap bulunduysa "Yeni Ele Geç" butonunu yanıp sönen ve nefes alan yap
  if (state.revealedCount >= 5) {
    const nextBtn = document.getElementById('next-question');
    if (nextBtn) {
      nextBtn.classList.add('breathing');
    }
    
    // 5 cevap bulunduğunda "Tüm Cevapları Gör" butonundan nefes efektini kaldır
    const showAllAnswersBtn = document.getElementById('show-all-answers');
    if (showAllAnswersBtn) {
      showAllAnswersBtn.classList.remove('breathing');
    }
  }
  
  // "Diğer Cevapları Gör" butonunu sadece çalma hakkı kullanıldıktan sonra göster
  const showAnswersBtn = document.getElementById('show-answers');
  if (showAnswersBtn) {
    if (state.stealAttempted && state.revealedCount < 5) {
      showAnswersBtn.style.display = 'inline-block';
    } else {
      showAnswersBtn.style.display = 'none';
    }
  }
  
  // "Tüm Cevapları Gör" butonunu her zaman göster (5 cevap bulunmadıysa)
  const showAllAnswersBtn = document.getElementById('show-all-answers');
  if (showAllAnswersBtn) {
    if (state.revealedCount < 5) {
      showAllAnswersBtn.style.display = 'inline-block';
    } else {
      showAllAnswersBtn.style.display = 'none';
    }
  }
  

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
    persistUsedQuestions();
  }
  const pool = available.length > 0 ? available : existing;
  if (pool.length === 0) {
    throw new Error('Hiç soru bulunamadı. Lütfen sorular klasörüne dosya ekleyin.');
  }

  const file = pool[Math.floor(Math.random() * pool.length)];
  const text = await (await fetch(file, { cache: 'no-store' })).text();
  state.usedQuestionFiles.add(file);
  persistUsedQuestions();

  const parsed = parseQuestionFile(text);
  state.currentQuestion = parsed;
  state.wrongCount = 0;
  state.revealedCount = 0; // Yeni soru için 0 olmalı

  setHidden('round-controls', false);
  setHidden('steal-section', true);
  setHidden('answer-input-area', false);

  // "Diğer Cevapları Gör" butonunu gizle
  const showAnswersBtn = document.getElementById('show-answers');
  if (showAnswersBtn) {
    showAnswersBtn.style.display = 'none';
  }

  // "Tüm Cevapları Gör" butonunu gizle
  const showAllAnswersBtn = document.getElementById('show-all-answers');
  if (showAllAnswersBtn) {
    showAllAnswersBtn.style.display = 'none';
  }

  // Cevapla butonunu aktif hale getir
  const answerBtn = document.querySelector('#answer-form button[type="submit"]');
  if (answerBtn) {
    answerBtn.disabled = false;
    answerBtn.style.opacity = '1';
    answerBtn.style.cursor = 'pointer';
  }

  // Çal butonunu deaktif yap (3 yanlış yapılana kadar)
  const stealBtn = document.querySelector('#steal-form button[type="submit"]');
  if (stealBtn) {
    stealBtn.disabled = true;
    stealBtn.style.opacity = '0.5';
    stealBtn.style.cursor = 'not-allowed';
  }

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
      
      // Eğer çalma hakkı kullanılıyorsa puanı roundPoints'e ekle
      if (state.stealAttempted && state.stealTeamIndex === awardTeamIndex) {
        state.roundPoints += ans.points;
      } else {
        // Normal oyun - puanı direkt takıma ekle ve firstTeamRoundPoints'e de ekle
        state.teams[awardTeamIndex].score += ans.points;
        state.firstTeamRoundPoints += ans.points;
      }
      
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
  
  // 3 yanlış yapıldığında ve henüz çalma hakkı kullanılmadıysa
  if (state.wrongCount >= 3 && !state.stealAttempted) {
    // Çalma hakkı diğer takıma
    const other = state.currentTeamIndex === 0 ? 1 : 0;
    state.stealTeamIndex = other;
    state.stealAttempted = true;
    
    $('#steal-team-name').textContent = state.teams[other].name;
    setHidden('answer-input-area', true);
    setHidden('steal-section', false);
    $('#steal-input').focus();
    
    // Cevapla butonunu deaktif yap
    const answerBtn = document.querySelector('#answer-form button[type="submit"]');
    if (answerBtn) {
      answerBtn.disabled = true;
      answerBtn.style.opacity = '0.5';
      answerBtn.style.cursor = 'not-allowed';
    }
    
    // Çal butonunu aktif hale getir (3 yanlış yapıldığında)
    const stealBtn = document.querySelector('#steal-form button[type="submit"]');
    if (stealBtn) {
      stealBtn.disabled = false;
      stealBtn.style.opacity = '1';
      stealBtn.style.cursor = 'pointer';
    }
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



function showAllAnswers() {
  // Tüm cevapları göster
  state.currentQuestion.answers.forEach(ans => {
    if (!ans.revealed) {
      ans.revealed = true;
    }
  });
  state.revealedCount = 5; // Tüm cevaplar gösterildi
  state.allAnswersRevealed = true;
  
  // UI'ı güncelle
  renderQuestion();
  
  // "Yeni Ele Geç" butonunu yanıp sönen ve nefes alan yap
  const nextBtn = document.getElementById('next-question');
  if (nextBtn) {
    nextBtn.classList.add('breathing');
  }
  
  // "Tüm Cevapları Gör" butonundan nefes efektini kaldır (artık gerekli değil)
  const showAllAnswersBtn = document.getElementById('show-all-answers');
  if (showAllAnswersBtn) {
    showAllAnswersBtn.classList.remove('breathing');
  }
}



function endRound() {
  // Eğer çalma hakkı kullanıldıysa ve puan toplandıysa
  if (state.stealAttempted && state.roundPoints > 0) {
    // Çalan takıma tüm el puanlarını ekle (önceki + yeni bulunan)
    const totalRoundPoints = state.roundPoints + state.firstTeamRoundPoints;
    state.teams[state.stealTeamIndex].score += totalRoundPoints;
    
    // İlk takımın o elden aldığı puanları geri al
    if (state.firstTeamRoundPoints > 0) {
      state.teams[state.currentTeamIndex].score -= state.firstTeamRoundPoints;
    }
    
    renderScoreboard();
  }
  
  // Round state'ini sıfırla
  state.roundPoints = 0;
  state.firstTeamRoundPoints = 0;
  state.stealAttempted = false;
  state.stealTeamIndex = -1;
  state.allAnswersRevealed = false;
  
  // Breathing animasyonunu kaldır
  const nextBtn = document.getElementById('next-question');
  if (nextBtn) {
    nextBtn.classList.remove('breathing');
  }
  
  setHidden('answer-input-area', true);
  setHidden('steal-section', true);
  setHidden('round-controls', true);
  
  // "Diğer Cevapları Gör" butonunu gizle
  const showAnswersBtn = document.getElementById('show-answers');
  if (showAnswersBtn) {
    showAnswersBtn.style.display = 'none';
  }

  // "Tüm Cevapları Gör" butonunu gizle
  const showAllAnswersBtn = document.getElementById('show-all-answers');
  if (showAllAnswersBtn) {
    showAllAnswersBtn.style.display = 'none';
  }
  
  showStarterSelection();
}

function changeQuestionInRound() {
  // Aynı tur içinde yeni rastgele soru getirir, önceki soru "kullanıldı" olarak kalır
  // Round state'ini sıfırla
  state.roundPoints = 0;
  state.firstTeamRoundPoints = 0;
  state.stealAttempted = false;
  state.stealTeamIndex = -1;
  state.allAnswersRevealed = false;
  
  loadRandomQuestion();
  $('#answer-input').focus();
  
  // Cevapla butonunu aktif hale getir
  const answerBtn = document.querySelector('#answer-form button[type="submit"]');
  if (answerBtn) {
    answerBtn.disabled = false;
    answerBtn.style.opacity = '1';
    answerBtn.style.cursor = 'pointer';
  }

  // Çal butonunu deaktif yap (3 yanlış yapılana kadar)
  const stealBtn = document.querySelector('#steal-form button[type="submit"]');
  if (stealBtn) {
    stealBtn.disabled = true;
    stealBtn.style.opacity = '0.5';
    stealBtn.style.cursor = 'not-allowed';
  }
}

function endGameAndRestart() {
  // Takım isimlerini yeniden sor, skorları sıfırla. Sorulan sorular korunur.
  // Önce bitiş ekranında skorları göster
  $('#end-team-0-name').textContent = state.teams[0].name;
  $('#end-team-1-name').textContent = state.teams[1].name;
  $('#end-team-0-score').textContent = state.teams[0].score;
  $('#end-team-1-score').textContent = state.teams[1].score;

  setHidden('game', true);
  setHidden('choose-starter', true);
  setHidden('setup-names', true);
  setHidden('end-screen', false);
}

// Basit yerel depolama ile sorulan soru listesini koru (sayfa yenilenirse de kalsın)
function persistUsedQuestions() {
  try {
    const arr = Array.from(state.usedQuestionFiles);
    localStorage.setItem('ay_usedQuestions', JSON.stringify(arr));
  } catch (_) { /* yok say */ }
}

function restoreUsedQuestions() {
  try {
    const raw = localStorage.getItem('ay_usedQuestions');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        state.usedQuestionFiles = new Set(arr);
      }
    }
  } catch (_) { /* yok say */ }
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
      // 5 cevap bulundu, "Yeni El" butonunu yanıp sönen yap
      updateUIAll();
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

    // Çal butonunu deaktif yap (bir kere kullanıldı)
    const stealBtn = document.querySelector('#steal-form button[type="submit"]');
    if (stealBtn) {
      stealBtn.disabled = true;
      stealBtn.style.opacity = '0.5';
      stealBtn.style.cursor = 'not-allowed';
    }

    // Çalma hakkı kullanıldı
    if (ok) {
      // Doğru cevap verildi
      if (state.revealedCount >= 5) {
        // 5 cevap bulundu, "Yeni Ele Geç" butonunu yanıp sönen yap
        updateUIAll();
      } else {
        // 5 cevap bulunmadıysa "Tüm Cevapları Gör" ve "Yeni Ele Geç" butonlarına nefes efekti ekle
        const showAllAnswersBtn = document.getElementById('show-all-answers');
        const nextBtn = document.getElementById('next-question');
        
        if (showAllAnswersBtn) {
          showAllAnswersBtn.classList.add('breathing');
        }
        if (nextBtn) {
          nextBtn.classList.add('breathing');
        }
      }
    } else {
      // Yanlış cevap verildiyse "Tüm Cevapları Gör" ve "Yeni Ele Geç" butonlarına nefes efekti ekle
      const showAllAnswersBtn = document.getElementById('show-all-answers');
      const nextBtn = document.getElementById('next-question');
      
      if (showAllAnswersBtn) {
        showAllAnswersBtn.classList.add('breathing');
      }
      if (nextBtn) {
        nextBtn.classList.add('breathing');
      }
    }
  });

  // Diğer cevapları gör butonu
  const showAnswersBtn = document.getElementById('show-answers');
  if (showAnswersBtn) {
    showAnswersBtn.addEventListener('click', () => {
      showAllAnswers();
    });
  }

  // Tüm cevapları gör butonu
  const showAllAnswersBtn = document.getElementById('show-all-answers');
  if (showAllAnswersBtn) {
    showAllAnswersBtn.addEventListener('click', () => {
      showAllAnswers();
    });
  }

  $('#next-question').addEventListener('click', async () => {
    // Yeni el için başlangıç takımı tekrar sorulacak
    endRound();
  });

  const changeBtn = document.getElementById('change-question');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      // Soru değiştir butonu sadece soru değiştirmek için
      changeQuestionInRound();
    });
  }

  const endBtn = document.getElementById('end-game');
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      endGameAndRestart();
    });
  }

  const restartBtn = document.getElementById('restart-game');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      // Skor ve takım isimlerini sıfırla, isimleri tekrar sor
      state.teams = [
        { name: 'Takım 1', score: 0 },
        { name: 'Takım 2', score: 0 },
      ];
      state.currentTeamIndex = 0;
      state.wrongCount = 0;
      state.currentQuestion = null;
      state.revealedCount = 0;
      state.roundPoints = 0;
      state.firstTeamRoundPoints = 0;
      state.stealAttempted = false;
      state.stealTeamIndex = -1;
      state.allAnswersRevealed = false;
      renderScoreboard();

      // Ekranları düzenle
      setHidden('end-screen', true);
      setHidden('choose-starter', true);
      setHidden('game', true);
      setHidden('setup-names', false);
      
      // "Diğer Cevapları Gör" butonunu gizle
      const showAnswersBtn = document.getElementById('show-answers');
      if (showAnswersBtn) {
        showAnswersBtn.style.display = 'none';
      }

      // "Tüm Cevapları Gör" butonunu gizle
      const showAllAnswersBtn = document.getElementById('show-all-answers');
      if (showAllAnswersBtn) {
        showAllAnswersBtn.style.display = 'none';
      }

      // Cevapla butonunu aktif hale getir
      const answerBtn = document.querySelector('#answer-form button[type="submit"]');
      if (answerBtn) {
        answerBtn.disabled = false;
        answerBtn.style.opacity = '1';
        answerBtn.style.cursor = 'pointer';
      }

      // Çal butonunu deaktif yap (3 yanlış yapılana kadar)
      const stealBtn = document.querySelector('#steal-form button[type="submit"]');
      if (stealBtn) {
        stealBtn.disabled = true;
        stealBtn.style.opacity = '0.5';
        stealBtn.style.cursor = 'not-allowed';
      }

      // isim inputlarını temizle
      const a = $('#team-a-input');
      const b = $('#team-b-input');
      if (a) a.value = '';
      if (b) b.value = '';
    });
  }
}

// Nasıl Oynanır butonu için fonksiyon
function showHowToPlay() {
  const rules = `
🎯 Aileler Yarışıyor Oyun Kuralları

📝 Oynanış:
• Her el için 5 doğru cevap bulunmalı
• Her takım sırayla cevap vermeye çalışır
• 3 yanlış yapıldığında çalma hakkı diğer takıma geçer
• Çalma hakkında doğru cevap verilirse, o elin TÜM puanları çalınır

⚠️ Dikkat Edilmesi Gerekenler:
• Cevaplar tam olarak yazılmalı (büyük-küçük harf önemli değil)
• Çalma hakkı sadece 3 yanlıştan sonra aktif olur
• Çalma hakkı bir kez kullanılabilir
• Puanlar el sonunda eklenir, çalma durumunda tüm puanlar çalınır

🔍 Sıkça Sorulan Sorular:
• Soru değiştir ne için? Aynı soru gelirse yarışma esnasında değiştirmek için
• Çalma hakkı ne zaman gelir? 3 yanlış yapıldığında otomatik olarak
• Puanlar ne zaman eklenir? El bittiğinde, çalma durumunda tüm puanlar çalınır
• 5 cevap bulunamazsa ne olur? "Tüm Cevapları Gör" butonu ile tüm cevaplar açılır
  `;
  
  alert(rules);
}

document.addEventListener('DOMContentLoaded', () => {
  restoreUsedQuestions();
  renderScoreboard();
  wireEvents();
});


