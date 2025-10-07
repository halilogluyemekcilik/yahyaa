// =================== DİLİMLER ===================
const PRIZES = [
    "Promo Kod", "7500 ₺", "100 ₺", "1500 ₺", "750 ₺", "Promo Kod", "5000 ₺", "250 ₺", "2500 ₺", "500 ₺"
];
//çarkın stokları,Mega ödül sırası,çarkın dönme süresi,çarkın tur sayısı, arama yaparak ilgili yere gidebilirsiniz.


// Ödül stokları: aynı etiketli dilimler ortak stok paylaşır. Değer verilmezse sınırsız kabul edilir.
// Örnek başlangıç stokları (dilediğiniz gibi düzenleyin) ve kalıcı depolama
//çarkın stokları
const DEFAULT_PRIZE_STOCK = new Map([
    ["Promo Kod", 600],
    ["7500 ₺", 1],
    ["5000 ₺", 2],
    ["2500 ₺", 5],
    ["1500 ₺", 10],
    ["750 ₺", 10],
    ["500 ₺", 20],
    ["250 ₺", 50],
    ["100 ₺", 100],
]);

const STOCK_STORAGE_KEY = 'wheel.prizeStock.v1';

function mapToObject(map) {
    const obj = Object.create(null);
    for (const [k, v] of map.entries()) obj[k] = v;
    return obj;
}
function objectToMap(obj) {
    const m = new Map();
    if (obj && typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
            const num = Number(obj[k]);
            if (!Number.isNaN(num)) m.set(k, Math.max(0, Math.floor(num)));
        }
    }
    return m;
}
function loadPrizeStock(defaultsMap) {
    try {
        const raw = localStorage.getItem(STOCK_STORAGE_KEY);
        if (!raw) return new Map(defaultsMap);
        const parsed = JSON.parse(raw);
        const loaded = objectToMap(parsed);
        // defaults ile birleştir: eksik anahtarlar için default kullan
        for (const [label, defVal] of defaultsMap.entries()) {
            if (!loaded.has(label)) loaded.set(label, defVal);
        }
        return loaded;
    } catch (_) {
        return new Map(defaultsMap);
    }
}
function savePrizeStock(map) {
    try { localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(mapToObject(map))); } catch (_) { }
}

let PRIZE_STOCK_BY_LABEL = loadPrizeStock(DEFAULT_PRIZE_STOCK);

function getPrizeLabel(index) { return PRIZES[index]; }
function getLabelStock(label) {
    const v = PRIZE_STOCK_BY_LABEL.get(label);
    return (typeof v === 'number') ? v : Infinity;
}
function isPrizeAvailable(index) { return getLabelStock(getPrizeLabel(index)) > 0; }
// Ağırlıklı seçim: etiketin kalan stoku kadar ağırlık ver (olasılık ~ stok)
function chooseAvailableIndex() {
    // Etikete göre gruplandır
    const labelToIndices = new Map();
    for (let i = 0; i < PRIZES.length; i++) {
        if (!isPrizeAvailable(i)) continue;
        const label = getPrizeLabel(i);
        if (!labelToIndices.has(label)) labelToIndices.set(label, []);
        labelToIndices.get(label).push(i);
    }
    const labels = Array.from(labelToIndices.keys());
    if (labels.length === 0) return null;

    // Ağırlıklar = kalan stok (>=1)
    const weights = labels.map(l => Math.max(1, getLabelStock(l)));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosenLabel = labels[0];
    for (let idx = 0; idx < labels.length; idx++) {
        r -= weights[idx];
        if (r <= 0) { chosenLabel = labels[idx]; break; }
    }
    // Seçilen etiketin dilimleri arasından biri
    const candidates = labelToIndices.get(chosenLabel) || [];
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}
function decrementStockForLabel(label) {
    if (!PRIZE_STOCK_BY_LABEL.has(label)) return;
    const left = Math.max(0, getLabelStock(label) - 1);
    PRIZE_STOCK_BY_LABEL.set(label, left);
    savePrizeStock(PRIZE_STOCK_BY_LABEL);
}

// Elemanlar
const canvas = document.getElementById('wheel'), ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('resultModal');
const modalCard = document.querySelector('#resultModal .modal-card');
const resultTitle = document.getElementById('resultTitle');
const resultDesc = document.getElementById('resultDesc');
const closeModalBtn = document.getElementById('closeModal');
const spinAgainBtn = document.getElementById('spinAgain');
const stage = document.getElementById('wheelStage');
const titleToggle = document.getElementById('titleToggle');
const bgVideo = document.getElementById('bgVideo');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const fsToggle = document.getElementById('fsToggle');
// bgMusic kaldırıldı
const spinSfx = document.getElementById('spinSfx');
const tickSfx = document.getElementById('tickSfx');
const masterVolume = document.getElementById('masterVolume');
// musicToggle kaldırıldı
const autoCloseToggle = document.getElementById('autoCloseToggle');
const autoCloseContainer = document.getElementById('autoCloseContainer');
const autoCloseFill = document.getElementById('autoCloseFill');
const pointerEl = document.getElementById('pointer');
const installModal = document.getElementById('installModal');
const confirmInstall = document.getElementById('confirmInstall');
const dismissInstall = document.getElementById('dismissInstall');
const stageOffsetY = document.getElementById('stageOffsetY');
const resetStockBtn = document.getElementById('resetStockBtn');
const pinModal = document.getElementById('pinModal');
const pinField = document.getElementById('pinField');
const pinCancel = document.getElementById('pinCancel');
const pinView = document.getElementById('pinView');
const pinManage = document.getElementById('pinManage');
const stockList = document.getElementById('stockList');
const resetStockConfirm = document.getElementById('resetStockConfirm');
const stockClose = document.getElementById('stockClose');
const stockSummary = document.getElementById('stockSummary');
const stockTotal = document.getElementById('stockTotal');
let deferredPrompt = null;

// Autoplay
function ensureVideoPlays() { /* bgVideo kullanılmıyor */ }
document.removeEventListener('click', ensureVideoPlays);
document.removeEventListener('touchstart', ensureVideoPlays);

function ensureAudioReady() {
    try {
        spinSfx.volume = (Number(masterVolume.value) || 80) / 100;
        tickSfx.volume = (Number(masterVolume.value) || 80) / 100 * 2;
    } catch (e) { }
}
document.addEventListener('click', ensureAudioReady, { once: true });
document.addEventListener('touchstart', ensureAudioReady, { once: true });
document.addEventListener('keydown', (e) => { if (e.key === 'Enter') ensureAudioReady(); }, { once: true });

// Engelleme
window.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
window.addEventListener('gesturestart', e => e.preventDefault());

// Canvas ölçüleri
let size = 600, radius = 280, dpr = Math.max(1, Math.min(1.75, window.devicePixelRatio || 1));
let rotation = 0, spinning = false, winnerIndex = null, animFrame = null, glowTick = 0;
let lastTickIndex = null;
let modalAutoCloseTimer = null;

function setupCanvas() {
    const rect = stage.getBoundingClientRect();
    size = Math.min(rect.width, rect.height);
    radius = (size / 2) - Math.max(10, size * 0.02);
    dpr = Math.max(1, Math.min(1.75, window.devicePixelRatio || 1));
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = Math.floor(size) + 'px';
    canvas.style.height = Math.floor(size) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}
window.addEventListener('resize', setupCanvas);

// yardımcılar
// 8 dilim için özelleştirilebilir renk paleti (hex). Bu diziyi dilediğiniz gibi düzenleyin.
//çarkın renkleri
const SEGMENT_COLORS = [
    "#EAEAEA", // beyaz
    "#3643ba", // mavi
    "#EAEAEA", // beyaz
    "#3643ba", // mavi
    "#EAEAEA", // beyaz
    "#3643ba", // mavi
    "#EAEAEA", // beyaz
    "#3643ba", // mavi
    "#EAEAEA", // beyaz
    "#3643ba", // mavi
];

function toRGBA(h, s = 70, l = 54, a = 1) { return `hsla(${h}deg,${s}%,${l}%,${a})`; }

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
function adjustLightnessHex(hex, deltaL) {
    const rgb = hexToRgb(hex); if (!rgb) return hex;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const nl = Math.max(0, Math.min(100, hsl.l + deltaL));
    return hslToHex(hsl.h, hsl.s, nl);
}
function perceivedLightnessFromHex(hex) {
    const rgb = hexToRgb(hex); if (!rgb) return 60;
    // WCAG relative luminance -> approx lightness in 0..100
    const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return lum * 100;
}

function segmentColor(i, n) {
    // Palet tanımlıysa, dilim sayısından bağımsız olarak paleti döngüsel kullan
    if (Array.isArray(SEGMENT_COLORS) && SEGMENT_COLORS.length > 0) {
        const baseHex = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
        const light = perceivedLightnessFromHex(baseHex);
        return { base: baseHex, hue: 0, light, customHex: true };
    }
    const hue = (i * (360 / n)) % 360; const light = 52 + 6 * Math.sin(i * 1.2);
    return { base: toRGBA(hue, 75, light), hue, light };
}
function isLight(l) { return l > 58; }
function wrapText(ctx, text, maxWidth, maxLines) {
    const words = String(text).split(/\s+/); const lines = []; let line = '';
    for (const w of words) {
        const test = line ? (line + ' ' + w) : w;
        if (ctx.measureText(test).width <= maxWidth) { line = test; }
        else { if (line) lines.push(line); line = w; if (lines.length === maxLines - 1) break; }
    }
    if (line) lines.push(line); return lines.slice(0, maxLines);
}

function drawWheel() {
    const n = PRIZES.length, slice = (Math.PI * 2) / n, cx = size / 2, cy = size / 2;
    ctx.save(); ctx.translate(cx, cy);

    // Dilimler
    for (let i = 0; i < n; i++) {
        const start = rotation + i * slice - slice / 2 - Math.PI / 2;
        const end = start + slice;
        const { base, hue, light, customHex } = segmentColor(i, n);

        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, start, end); ctx.closePath();

        const mid = (start + end) / 2, gx = Math.cos(mid) * radius * 0.5, gy = Math.sin(mid) * radius * 0.5;
        const grad = ctx.createRadialGradient(gx, gy, radius * 0.1, 0, 0, radius);
        if (customHex) {
            const c0 = adjustLightnessHex(base, +8);
            const c1 = base;
            const c2 = adjustLightnessHex(base, -6);
            grad.addColorStop(0, c0);
            grad.addColorStop(0.65, c1);
            grad.addColorStop(1, c2);
        } else {
            grad.addColorStop(0, `hsla(${hue}deg,78%,${Math.min(92, light + 8)}%,0.9)`);
            grad.addColorStop(0.65, base);
            grad.addColorStop(1, `hsla(${hue}deg,68%,${Math.max(36, light - 6)}%,1)`);
        }
        ctx.fillStyle = grad; ctx.fill();

        // Metin alanı (dikdörtgen)
        const padAngle = slice * 0.08;
        const startAng = start + padAngle;
        const endAng = end - padAngle;
        const outerR = radius * 0.98;
        const innerR = radius * 0.48;

        const effSlice = Math.max(0.001, (endAng - startAng));
        const radiusCenter = (innerR + outerR) / 2;
        const margin = Math.max(size * 0.008, 4);
        const halfRadialMax = Math.max(1, (outerR - innerR) / 2 - margin);
        const halfTangentialMax = Math.max(1, radiusCenter * Math.tan(effSlice / 2) - margin);
        const halfBase = Math.max(1, Math.min(halfRadialMax, halfTangentialMax));
        const halfX = Math.max(1, halfBase * 1.40);
        const halfY = Math.max(1, halfBase * 0.88);
        const maxRight = outerR - margin;
        const radiusCenterRect = maxRight - halfX;

        // Clip dikdörtgeni
        ctx.save();
        ctx.rotate(mid);
        ctx.beginPath();
        ctx.rect(radiusCenterRect - halfX, -halfY, halfX * 2, halfY * 2);
        ctx.clip();

        // Metin ölç ve sığdır
        ctx.save();
        const baseTextRadius = radiusCenterRect;
        const chord = halfX * 2;
        const bandH = halfY * 2;
        const maxH3 = bandH * 0.98;

        let fontPxMax = Math.min(34, Math.max(10, radius * (n >= 12 ? 0.11 : 0.13)));
        let fontPxMin = 10;
        let fontPx = fontPxMin;
        let lines = [];
        function widestWidth(ls) { let w = 0; for (const s of ls) { const m = ctx.measureText(s).width; if (m > w) w = m; } return w; }

        const MAX_LINES = 4;
        function fitsWithLines(testPx) {
            ctx.font = `700 ${testPx}px system-ui`;
            const ls = wrapText(ctx, PRIZES[i], chord, MAX_LINES);
            const totalH = ls.length * testPx * 1.02;
            return { ok: (widestWidth(ls) <= chord && totalH <= maxH3), ls };
        }

        (function binarySearchFont() {
            let lo = fontPxMin, hi = fontPxMax; let bestPx = fontPxMin, bestLs = wrapText(ctx, PRIZES[i], chord, MAX_LINES);
            for (let k = 0; k < 18; k++) {
                const midPx = (lo + hi) / 2;
                const res = fitsWithLines(midPx);
                if (res.ok) { bestPx = midPx; bestLs = res.ls; lo = midPx; } else { hi = midPx; }
            }
            fontPx = bestPx; lines = bestLs;
        })();

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = isLight(light) ? '#1a1a1a' : '#fff';
        ctx.strokeStyle = isLight(light) ? '#ffffff40' : '#00000030';
        ctx.lineWidth = 1.6;
        ctx.lineJoin = 'round';

        const metricProbe = ctx.measureText('Mg');
        const ascent = metricProbe.actualBoundingBoxAscent || fontPx * 0.78;
        const descent = metricProbe.actualBoundingBoxDescent || fontPx * 0.22;
        const lineGap = fontPx * 0.12;
        const lineH = ascent + descent + lineGap;
        const totalH2 = lines.length > 0 ? (lines.length * lineH - lineGap) : 0;
        const startY = -totalH2 / 2 + ascent;
        const textX = baseTextRadius;
        for (let li = 0; li < lines.length; li++) {
            const y = startY + li * lineH;
            ctx.save(); ctx.translate(textX, y); ctx.fillText(lines[li], 0, 0); ctx.strokeText(lines[li], 0, 0); ctx.restore();
        }
        ctx.restore();
        ctx.restore();
    }

    // LED noktalar
    const dots = Math.max(36, Math.round(radius / 9));
    for (let i = 0; i < dots; i++) {
        const a = (i / dots) * Math.PI * 2;
        const x = Math.cos(a) * (radius + Math.max(6, size * 0.02));
        const y = Math.sin(a) * (radius + Math.max(6, size * 0.02));
        const on = (i % 2 === 0);
        ctx.fillStyle = on ? '#ffd76a' : '#93e1ff';
        ctx.globalAlpha = on ? (0.9 - 0.2 * Math.abs(Math.sin((glowTick / 500) + (i * 0.2)))) : 0.65;
        ctx.beginPath(); ctx.arc(x, y, Math.max(2.4, size * 0.0065), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
}

function draw(now = performance.now()) {
    glowTick = now;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawWheel();
}
// Modal başlık ve ödül metni için otomatik sığdırma
function fitTextToHeight(el, maxHeightPx, minPx, maxPx) {
    if (!el) return;
    const style = el.style;
    let lo = minPx, hi = maxPx, best = minPx;
    for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        style.fontSize = mid + 'px';
        // Reflow
        const h = el.scrollHeight;
        if (h <= maxHeightPx) { best = mid; lo = mid; }
        else { hi = mid; }
    }
    style.fontSize = best + 'px';
}

function fitModalTexts() {
    if (!modalCard || !resultTitle || !resultDesc) return;
    // Modal iç boşluklarını hesaba kat
    const available = modalCard.clientHeight - 32; // güvenli pay
    // Başlık ve ödül alanlarını oranla bölüştürelim
    const titleMax = Math.max(20, Math.floor(available * 0.22));
    const prizeMax = Math.max(20, Math.floor(available * 0.32));

    // Varsayılan küçük bir font ayarla ki ölçüm doğru başlasın
    resultTitle.style.fontSize = '20px';
    resultDesc.style.fontSize = '20px';

    // Sığdırma (ikisini de kendi maksimumlarına)
    fitTextToHeight(resultTitle, titleMax, 16, 64);
    fitTextToHeight(resultDesc, prizeMax, 18, 72);
}

window.addEventListener('resize', () => {
    if (modal && modal.classList.contains('show')) {
        try { fitModalTexts(); } catch (e) { }
    }
});

// Dikey konum ayarı: CSS değişkeni ile sahneyi kaydır
if (stageOffsetY) {
    const applyOffset = () => {
        const val = Number(stageOffsetY.value) || 0;
        document.documentElement.style.setProperty('--stage-offset-y', val + 'px');
    };
    stageOffsetY.addEventListener('input', applyOffset);
    stageOffsetY.addEventListener('change', applyOffset);
    // Başlangıçta ~%10 ekran yüksekliği kadar yukarı al
    try {
        if (!stageOffsetY.dataset.init) {
            const defaultPx = Math.round(-window.innerHeight * 0.10);
            stageOffsetY.value = String(defaultPx);
            stageOffsetY.dataset.init = '1';
        }
    } catch (e) { }
    applyOffset();
}

// Animasyon & yardımcılar
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function mod(a, n) { return ((a % n) + n) % n; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// =================== DAĞITIM (100'LÜK DÖNGÜ + MEGA SIRASI) ===================
const DIST_STORAGE_KEY = 'wheel.distribution.v1';
//Mega ödül sırası
const MEGA_SEQ = [
    "5000 ₺", // 1
    "2500 ₺", // 2
    "2500 ₺", // 3
    "2500 ₺", // 4
    "5000 ₺", // 5
    "2500 ₺", // 6
    "7500 ₺", // 7
    "2500 ₺", // 8
];
const CYCLE_QUOTAS_DEFAULT = { promo: 79, small: 15, big: 5, mega: 1 };

function loadDistributionState() {
    try {
        const raw = localStorage.getItem(DIST_STORAGE_KEY);
        if (!raw) return { spinsInCycle: 0, quotas: { ...CYCLE_QUOTAS_DEFAULT }, megaStep: 0 };
        const parsed = JSON.parse(raw);
        const spinsInCycle = Number(parsed.spinsInCycle) || 0;
        const megaStep = Number(parsed.megaStep) || 0;
        const q = parsed.quotas && typeof parsed.quotas === 'object' ? parsed.quotas : {};
        const quotas = {
            promo: Math.max(0, Math.floor(Number(q.promo))) || 0,
            small: Math.max(0, Math.floor(Number(q.small))) || 0,
            big: Math.max(0, Math.floor(Number(q.big))) || 0,
            mega: Math.max(0, Math.floor(Number(q.mega))) || 0,
        };
        return { spinsInCycle, quotas, megaStep };
    } catch (_) {
        return { spinsInCycle: 0, quotas: { ...CYCLE_QUOTAS_DEFAULT }, megaStep: 0 };
    }
}
function saveDistributionState(state) {
    try { localStorage.setItem(DIST_STORAGE_KEY, JSON.stringify(state)); } catch (_) { }
}

let DIST_STATE = loadDistributionState();

function getCategoryForLabel(label) {
    if (label === 'Promo Kod') return 'promo';
    if (label === '100 ₺' || label === '250 ₺') return 'small';
    if (label === '500 ₺' || label === '750 ₺' || label === '1500 ₺') return 'big';
    if (label === '2500 ₺' || label === '5000 ₺' || label === '7500 ₺') return 'mega';
    return null;
}

function getAvailableIndicesForCategory(cat) {
    const indices = [];
    for (let i = 0; i < PRIZES.length; i++) {
        const label = PRIZES[i];
        if (getCategoryForLabel(label) !== cat) continue;
        if (!isPrizeAvailable(i)) continue;
        indices.push(i);
    }
    return indices;
}

function pickMegaLabelForCurrentStep() {
    // İstenen sıradaki mega ödülü dene, stok yoksa sıradaki uygun olana kay
    const start = DIST_STATE.megaStep % MEGA_SEQ.length;
    for (let k = 0; k < MEGA_SEQ.length; k++) {
        const label = MEGA_SEQ[(start + k) % MEGA_SEQ.length];
        if (getLabelStock(label) > 0) return label;
    }
    return null;
}

function chooseIndexByDistribution() {
    // Döngü reset kontrolü
    const totalLeft = (DIST_STATE.quotas.promo + DIST_STATE.quotas.small + DIST_STATE.quotas.big + DIST_STATE.quotas.mega);
    if (DIST_STATE.spinsInCycle >= 100 || totalLeft <= 0) {
        DIST_STATE = { spinsInCycle: 0, quotas: { ...CYCLE_QUOTAS_DEFAULT }, megaStep: DIST_STATE.megaStep % MEGA_SEQ.length };
        saveDistributionState(DIST_STATE);
    }

    // Kategoriler arasından kalan kota kadar ağırlıklı seçim
    const cats = ['promo', 'small', 'big', 'mega'];
    const weights = cats.map(c => Math.max(0, DIST_STATE.quotas[c] || 0));
    let weightSum = weights.reduce((a, b) => a + b, 0);
    // Kota kalmadıysa klasik seçim
    if (weightSum <= 0) return chooseAvailableIndex();

    function pickCategoryWeighted() {
        let r = Math.random() * weightSum;
        for (let i = 0; i < cats.length; i++) {
            r -= weights[i];
            if (r <= 0) return cats[i];
        }
        return cats[0];
    }

    function findIndexForCategory(cat) {
        if (cat === 'mega') {
            const targetLabel = pickMegaLabelForCurrentStep();
            if (targetLabel) {
                // Bu etikete sahip bir dilim seç
                const candidates = [];
                for (let i = 0; i < PRIZES.length; i++) {
                    if (PRIZES[i] === targetLabel && isPrizeAvailable(i)) candidates.push(i);
                }
                if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
            }
            // Belirlenen etikette stok yoksa mevcut mega etiketlerinden birini dene
            const megaCandidates = getAvailableIndicesForCategory('mega');
            if (megaCandidates.length > 0) return megaCandidates[Math.floor(Math.random() * megaCandidates.length)];
            return null;
        }
        const candidates = getAvailableIndicesForCategory(cat);
        if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
        return null;
    }

    // Önce seçilen kategori, yoksa kalan kotası ve stoğu olan başka kategori, yoksa genel seçim
    let attempts = 0;
    while (attempts < 4) {
        const cat = pickCategoryWeighted();
        const idx = findIndexForCategory(cat);
        if (idx !== null) return idx;
        // Seçilen kategoride uygun dilim yoksa, o kategorinin ağırlığını sıfırla ve tekrar dene
        const ci = cats.indexOf(cat);
        if (ci >= 0) { weightSum -= weights[ci]; weights[ci] = 0; }
        if (weightSum <= 0) break;
        attempts++;
    }
    // Hâlâ bulunamadıysa, herhangi bir uygun dilimi seç
    return chooseAvailableIndex();
}

function spin() {
    if (spinning) return;
    const n = PRIZES.length, slice = (Math.PI * 2) / n;

    // Dağıtıma uygun hedef seç (stok + kotalar)
    const chosen = chooseIndexByDistribution();
    if (chosen === null) {
        alert('Üzgünüz, tüm ödüllerin stoğu tükendi.');
        return;
    }

    spinning = true; spinBtn.disabled = true; winnerIndex = null; lastTickIndex = null;
    try { ensureAudioReady(); spinSfx.currentTime = 0; const p = spinSfx.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }

    const current = mod(rotation, Math.PI * 2);
    const targetMod = mod(-chosen * slice, Math.PI * 2);
    //çarkın tur sayısı
    const spins = randInt(15, 20);
    let delta = spins * Math.PI * 2 + (targetMod - current);
    if (delta <= 0) delta += Math.PI * 2;
    //çarkın dönme süresi
    const duration = randInt(10000, 12500);
    const startTime = performance.now(), startRot = rotation, endRot = startRot + delta;

    function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        rotation = startRot + delta * easeOutCubic(t);
        draw(now);
        const currentMod = mod(rotation, Math.PI * 2);
        const angle = mod(-currentMod, Math.PI * 2);
        const currentIndex = Math.floor(angle / slice);
        if (currentIndex !== lastTickIndex) {
            if (lastTickIndex !== null) {
                try {
                    ensureAudioReady();
                    const t = tickSfx.cloneNode(true);
                    t.volume = tickSfx.volume;
                    t.play().catch(() => { });
                } catch (e) { }
            }
            lastTickIndex = currentIndex;
        }

        if (t < 1) { animFrame = requestAnimationFrame(step); }
        else {
            rotation = endRot;
            const final = mod(rotation, Math.PI * 2);
            winnerIndex = mod(Math.round(-final / slice), n);
            draw(now);
            const wonLabel = PRIZES[winnerIndex];
            decrementStockForLabel(wonLabel);
            // Dağıtım sayaçlarını güncelle
            const cat = getCategoryForLabel(wonLabel);
            if (cat) {
                if (DIST_STATE.quotas[cat] > 0) DIST_STATE.quotas[cat] -= 1;
                DIST_STATE.spinsInCycle += 1;
                if (cat === 'mega') { DIST_STATE.megaStep = (DIST_STATE.megaStep + 1) % MEGA_SEQ.length; }
                // 100 tamamlandıysa / kotalar bittiyse sıfırla
                const left = (DIST_STATE.quotas.promo + DIST_STATE.quotas.small + DIST_STATE.quotas.big + DIST_STATE.quotas.mega);
                if (DIST_STATE.spinsInCycle >= 100 || left <= 0) {
                    DIST_STATE.spinsInCycle = 0;
                    DIST_STATE.quotas = { ...CYCLE_QUOTAS_DEFAULT };
                }
                saveDistributionState(DIST_STATE);
            }
            try { updateStockSummaryInline(); } catch (_) { }
            showResult(wonLabel);
            spinning = false; spinBtn.disabled = false;
        }
    }
    cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(step);
}

// Modal
let modalCanAutoClose = false;
function showResult(text) {
    resultDesc.textContent = text;
    modal.classList.add('show');
    // Metinleri modal alanına sığacak en büyük boyuta büyüt
    try { fitModalTexts(); } catch (e) { }
    modalCanAutoClose = false;
    setTimeout(() => { modalCanAutoClose = true; }, 1500);
    setTimeout(() => closeModalBtn.focus(), 0);
    // Auto-close ayarı aktifse 3 sn sonra kapat
    if (modalAutoCloseTimer) { clearTimeout(modalAutoCloseTimer); modalAutoCloseTimer = null; }
    if (autoCloseToggle && autoCloseToggle.checked) {
        if (autoCloseContainer) autoCloseContainer.setAttribute('aria-hidden', 'false');
        if (autoCloseFill) {
            autoCloseFill.style.transition = 'none';
            autoCloseFill.style.width = '100%';
            // reflow
            void autoCloseFill.offsetWidth;
            autoCloseFill.style.transition = 'width linear 3s';
            autoCloseFill.style.width = '0%';
        }
        modalAutoCloseTimer = setTimeout(() => {
            if (modal.classList.contains('show')) { closeModal(); }
        }, 3000);
    }
}
function closeModal() {
    modal.classList.remove('show');
    modalCanAutoClose = false;
    if (modalAutoCloseTimer) { clearTimeout(modalAutoCloseTimer); modalAutoCloseTimer = null; }
    if (autoCloseContainer) autoCloseContainer.setAttribute('aria-hidden', 'true');
    if (autoCloseFill) {
        autoCloseFill.style.transition = 'none';
        autoCloseFill.style.width = '100%';
    }
}

// FS toggle
async function toggleFullscreen() {
    const el = document.documentElement;
    try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
            if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
    } catch (e) { }
}
function setFsClass() {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
    document.body.classList.toggle('fullscreen', isFS);
}
document.addEventListener('fullscreenchange', setFsClass);
document.addEventListener('webkitfullscreenchange', setFsClass);

// Events
spinBtn.addEventListener('click', spin);
if (titleToggle) {
    titleToggle.addEventListener('click', () => { document.body.classList.toggle('settings-hidden'); });
}
fsToggle.addEventListener('click', toggleFullscreen);
closeModalBtn.addEventListener('click', closeModal);

// Klavye: Enter ile kontrol
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const isModalShown = modal.classList.contains('show');
    if (isModalShown) {
        if (modalCanAutoClose) closeModal();
        return;
    }
    if (!spinning) {
        spin();
    }
});

function toggleSettings() {
    const show = !settingsPanel.classList.contains('show');
    settingsPanel.classList.toggle('show', show);
    settingsBtn.setAttribute('aria-expanded', String(show));
    // müzik ayarı kaldırıldı
    try { updateStockSummaryInline(); } catch (_) { }
}
settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSettings(); });
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
        settingsPanel.classList.remove('show');
        settingsBtn.setAttribute('aria-expanded', 'false');
    }
});
// Modal dışına tıklanınca (3 sn sonra) kapat
document.addEventListener('click', (e) => {
    if (!modal.classList.contains('show')) return;
    if (!modalCanAutoClose) return;
    const card = document.querySelector('.modal-card');
    if (card && !card.contains(e.target)) { closeModal(); }
});

// PIN modal numpad davranışı
function showPinModal() {
    if (!pinModal) return;
    if (pinView) pinView.style.display = '';
    if (pinManage) pinManage.style.display = 'none';
    pinModal.style.display = 'grid';
    setTimeout(() => { try { pinField.focus(); } catch (_) { } }, 0);
}
function hidePinModal() {
    if (!pinModal) return;
    pinModal.style.display = 'none';
    try { pinField.value = ''; } catch (_) { }
}
function updateStockSummaryInline() {
    if (!stockSummary) return;
    try {
        let total = 0;
        for (const v of PRIZE_STOCK_BY_LABEL.values()) total += (typeof v === 'number' ? v : 0);
        stockSummary.textContent = `Toplam kalan: ${total}`;
    } catch (_) { stockSummary.textContent = ''; }
}
function renderStockList() {
    if (!stockList) return;
    stockList.innerHTML = '';
    const items = Array.from(PRIZE_STOCK_BY_LABEL.entries());
    function labelToValue(label) {
        // Etiketten parasal değeri çıkar (örn: "7500 ₺" -> 7500). Para değilse Infinity.
        const m = String(label).match(/(\d+)/);
        if (!m) return Infinity;
        const v = Number(m[1]);
        return Number.isFinite(v) ? v : Infinity;
    }
    items.sort((a, b) => {
        const va = labelToValue(a[0]);
        const vb = labelToValue(b[0]);
        if (va !== vb) return va - vb; // küçükten büyüğe
        return String(a[0]).localeCompare(String(b[0]), 'tr');
    });
    let total = 0;
    for (const [label, qty] of items) {
        const row = document.createElement('div');
        row.className = 'stock-item';
        const l = document.createElement('div'); l.className = 'label'; l.textContent = label;
        const q = document.createElement('div'); q.className = 'qty'; q.textContent = String(qty);
        row.appendChild(l); row.appendChild(q);
        stockList.appendChild(row);
        total += (typeof qty === 'number' ? qty : 0);
    }
    if (stockTotal) stockTotal.textContent = `Toplam kalan: ${total}`;
}
function handlePadPress(key) {
    if (!pinField) return;
    if (key === 'clear') { pinField.value = ''; return; }
    if (key === 'ok') {
        const val = String(pinField.value || '').trim();
        if (val === '5454') {
            // Yönetim görünümüne geç ve stok listesini göster
            if (pinView) pinView.style.display = 'none';
            if (pinManage) pinManage.style.display = '';
            renderStockList();
        } else {
            alert('Hatalı şifre');
        }
        return;
    }
    if (pinField.value.length < 4 && /^[0-9]$/.test(key)) {
        pinField.value += key;
    }
}

if (resetStockBtn) {
    resetStockBtn.addEventListener('click', (e) => { e.stopPropagation(); showPinModal(); });
}
if (pinCancel) {
    pinCancel.addEventListener('click', (e) => { e.stopPropagation(); hidePinModal(); });
}
if (resetStockConfirm) {
    resetStockConfirm.addEventListener('click', () => {
        PRIZE_STOCK_BY_LABEL = new Map(DEFAULT_PRIZE_STOCK);
        savePrizeStock(PRIZE_STOCK_BY_LABEL);
        renderStockList();
        updateStockSummaryInline();
        alert('Stoklar varsayılana resetlendi');
    });
}
if (stockClose) {
    stockClose.addEventListener('click', () => hidePinModal());
}
updateStockSummaryInline();
document.addEventListener('click', (e) => {
    const np = document.querySelector('.numpad');
    if (!pinModal || pinModal.style.display === 'none') return;
    if (np && np.contains(e.target)) {
        const btn = e.target.closest('.pad');
        if (btn && btn.dataset && btn.dataset.key) {
            handlePadPress(btn.dataset.key);
        }
    }
});

masterVolume.addEventListener('input', () => {
    const v = (Number(masterVolume.value) || 0) / 100;
    spinSfx.volume = v;
    tickSfx.volume = v * 5;
});

// Auto close toggle davranışı
if (autoCloseToggle) {
    autoCloseToggle.addEventListener('change', () => {
        if (!modal.classList.contains('show')) return;
        if (modalAutoCloseTimer) { clearTimeout(modalAutoCloseTimer); modalAutoCloseTimer = null; }
        if (autoCloseToggle.checked) {
            if (autoCloseContainer) autoCloseContainer.setAttribute('aria-hidden', 'false');
            if (autoCloseFill) {
                autoCloseFill.style.transition = 'none';
                autoCloseFill.style.width = '100%';
                void autoCloseFill.offsetWidth;
                autoCloseFill.style.transition = 'width linear 3s';
                autoCloseFill.style.width = '0%';
            }
            modalAutoCloseTimer = setTimeout(() => {
                if (modal.classList.contains('show')) { closeModal(); }
            }, 3000);
        } else {
            if (autoCloseContainer) autoCloseContainer.setAttribute('aria-hidden', 'true');
            if (autoCloseFill) {
                autoCloseFill.style.transition = 'none';
                autoCloseFill.style.width = '100%';
            }
        }
    });
}

// Başlat
setupCanvas();


// Pointer: gizli tuş ile ayarlar ikonunu devre dışı/etkin yap
if (pointerEl) {
    pointerEl.setAttribute('role', 'button');
    pointerEl.setAttribute('tabindex', '0');

    function toggleSettingsIconVisibility() {
        const hidden = document.body.classList.toggle('settings-hidden');
        pointerEl.setAttribute('aria-pressed', String(hidden));
        pointerEl.setAttribute('aria-label', hidden ? 'Ayarlar ikonu gizli' : 'Ayarlar ikonu görünür');
        pointerEl.title = hidden ? 'Ayarlar ikonu gizli' : 'Ayarlar ikonu görünür';

        if (hidden) {
            // İkonu devre dışı bırak ve paneli kapat
            settingsPanel.classList.remove('show');
            settingsBtn.setAttribute('aria-expanded', 'false');
            settingsBtn.setAttribute('tabindex', '-1');
            settingsBtn.setAttribute('aria-hidden', 'true');
        } else {
            // İkonu tekrar etkin yap
            settingsBtn.removeAttribute('tabindex');
            settingsBtn.setAttribute('aria-hidden', 'false');
        }
    }

    function onPointerActivate(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        toggleSettingsIconVisibility();
    }

    pointerEl.addEventListener('click', onPointerActivate);
    pointerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { onPointerActivate(e); }
    });
}


// PWA Yükleme Akışı (popup)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installModal) installModal.style.display = 'grid';
});

if (confirmInstall) {
    confirmInstall.addEventListener('click', async () => {
        if (!deferredPrompt) { if (installModal) installModal.style.display = 'none'; return; }
        try {
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
        } catch (e) { }
        deferredPrompt = null;
        if (installModal) installModal.style.display = 'none';
    });
}
if (dismissInstall) {
    dismissInstall.addEventListener('click', () => {
        if (installModal) installModal.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    if (installModal) installModal.style.display = 'none';
});

