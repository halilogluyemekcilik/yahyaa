// utils.js — Fuzzy Matching & Turkish Text Normalization

/**
 * Türkçe karakterleri normalize eder, küçük harfe çevirir.
 * Klavye sorunu yaşayan kullanıcılar etkilenmez.
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * İki string arasındaki Levenshtein mesafesini hesaplar.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      if (i === 0) dp[i][j] = j;
      else if (j === 0) dp[i][j] = i;
      else dp[i][j] = 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Kelime uzunluğuna göre tolerans döndürür.
 * Çok kısa kelimeler sıkı tutulur.
 */
function getTolerance(len) {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 2;
}

/**
 * Girdi ile hedef kelimeyi fuzzy olarak karşılaştırır.
 */
function fuzzyMatch(input, target) {
  const normInput = normalizeText(input);
  const normTarget = normalizeText(target);
  if (!normInput || !normTarget) return false;

  // Tam eşleşme
  if (normInput === normTarget) return true;

  // İçerme kontrolü (≥3 karakter girişi için)
  if (normInput.length >= 3 && normTarget.includes(normInput)) return true;

  // Levenshtein mesafesi
  const maxLen = Math.max(normInput.length, normTarget.length);
  const tolerance = getTolerance(maxLen);
  return levenshtein(normInput, normTarget) <= tolerance;
}

/**
 * Kullanıcı girdisini tüm cevapların acceptedInputs listesiyle karşılaştırır.
 * Eşleşen cevabın index'ini döndürür, eşleşme yoksa -1.
 */
function checkAnswer(inputText, answers, revealedIndices) {
  for (let i = 0; i < answers.length; i++) {
    if (revealedIndices.includes(i)) continue;
    for (const accepted of answers[i].acceptedInputs) {
      if (fuzzyMatch(inputText, accepted)) {
        return i;
      }
    }
  }
  return -1;
}
