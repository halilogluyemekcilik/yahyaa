// =================== DİLİMLER ===================
const PRIZES = [
    "Defter", "Kalem", "Termos", "Ajanda", "Stres Çarkı", "Kitap", "250 TL Hediye Çeki", "Bilet", "Tekrar Çevir"
];

// Elemanlar
const canvas = document.getElementById('wheel'), ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('resultModal');
const resultDesc = document.getElementById('resultDesc');
const closeModalBtn = document.getElementById('closeModal');
const spinAgainBtn = document.getElementById('spinAgain');
const stage = document.getElementById('wheelStage');
const titleToggle = document.getElementById('titleToggle');
const bgVideo = document.getElementById('bgVideo');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const fsToggle = document.getElementById('fsToggle');
const bgMusic = document.getElementById('bgMusic');
const spinSfx = document.getElementById('spinSfx');
const tickSfx = document.getElementById('tickSfx');
const masterVolume = document.getElementById('masterVolume');
const musicToggle = document.getElementById('musicToggle');
const autoCloseToggle = document.getElementById('autoCloseToggle');
const autoCloseContainer = document.getElementById('autoCloseContainer');
const autoCloseFill = document.getElementById('autoCloseFill');
const pointerEl = document.getElementById('pointer');
const installBtn = document.getElementById('installBtn');
let deferredPrompt = null;

// Autoplay
function ensureVideoPlays() {
    if (!bgVideo) return;
    try {
        if (bgVideo.paused) {
            bgVideo.muted = true;
            const p = bgVideo.play();
            if (p && p.catch) p.catch(() => { });
        }
    } catch (e) { }
}
document.addEventListener('click', ensureVideoPlays, { once: true });
document.addEventListener('touchstart', ensureVideoPlays, { once: true });

function ensureAudioReady() {
    try {
        bgMusic.volume = ((Number(masterVolume.value) || 80) / 100) * 0.1;
        spinSfx.volume = (Number(masterVolume.value) || 80) / 100;
        tickSfx.volume = (Number(masterVolume.value) || 80) / 100 * 2;
        if (musicToggle.checked) {
            const p = bgMusic.play();
            if (p && p.catch) p.catch(() => { });
        }
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
// 12 dilim için özelleştirilebilir renk paleti (hex). Bu diziyi dilediğiniz gibi düzenleyin.
const SEGMENT_COLORS = [
    "#EAEAEA", // beyaz
    "#0033ff", // mavi
    "#ffc200", // sarı
    "#EAEAEA", // beyaz
    "#0033ff", // mavi
    "#ffc200", // sarı
    "#EAEAEA", // beyaz
    "#0033ff", // mavi
    "#ffc200", // sarı
    "#EAEAEA", // beyaz
    "#0033ff", // mavi
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

        let fontPxMax = Math.min(44, Math.max(10, radius * (n >= 12 ? 0.11 : 0.13)));
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

// Animasyon & yardımcılar
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function mod(a, n) { return ((a % n) + n) % n; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function spin() {
    if (spinning) return;
    const n = PRIZES.length, slice = (Math.PI * 2) / n;

    spinning = true; spinBtn.disabled = true; winnerIndex = null; lastTickIndex = null;
    try { ensureAudioReady(); spinSfx.currentTime = 0; const p = spinSfx.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }

    const current = mod(rotation, Math.PI * 2);
    const chosen = Math.floor(Math.random() * n);
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
            showResult(PRIZES[winnerIndex]);
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
    if (show) { musicToggle.checked = !bgMusic.paused; }
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

masterVolume.addEventListener('input', () => {
    const v = (Number(masterVolume.value) || 0) / 100;
    bgMusic.volume = v * 0.5;
    spinSfx.volume = v;
    tickSfx.volume = v * 5;
});
musicToggle.addEventListener('change', () => {
    if (musicToggle.checked) { const p = bgMusic.play(); if (p && p.catch) p.catch(() => { }); }
    else { try { bgMusic.pause(); } catch (e) { } }
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


// PWA Yükleme Akışı
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        installBtn.disabled = true;
        try {
            const choice = await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
        } catch (e) { }
        deferredPrompt = null;
        installBtn.style.display = 'none';
        installBtn.disabled = false;
    });
}

window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
});

