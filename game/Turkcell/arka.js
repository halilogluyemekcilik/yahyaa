/************ AYARLAR ************/
const ARKA_BASE_DIR = "./img"; // görsellerin klasörü
// Buraya istediğin PNG'leri ekle (sadece bu liste kullanılır)
const ARKA_MANUAL_IMAGES = [
    "image1.png", "image2.png", "image3.png", "image4.png", "image5.png",
    "image6.png", "image7.png", "image8.png", "image9.png", "image10.png"
];

// Fizik ve davranış (arka plan için optimize)
const ARKA_GRAVITY = 0.55; // daha hızlı düşüş
const ARKA_SPAWN_INTERVAL_MS = 280; // daha hızlı spawn
const ARKA_MAX_ACTIVE_FALLING = 18;
const ARKA_COL_COUNT_BASE = 20;
const ARKA_MIN_WIDTH = 48;
const ARKA_MAX_WIDTH = 160;
const ARKA_MAX_ROTATION_DEG = 12;
const ARKA_HALF_FILL_RATIO = 1.0;      // ekran dolunca reset
const ARKA_COMET_SPEED_X = 24.0; // drive.png daha da hızlı ilerlesin
const ARKA_COMET_ENTRY_Y_RATIO = 0.6;
const ARKA_COMET_SIZE = 140;
const ARKA_COMET_BOB_AMP = 22;
const ARKA_COMET_BOB_SPEED = 0.035;
const ARKA_ATTRACT_SPEED = 22.0; // daha hızlı toplama
const ARKA_ATTRACT_RADIUS = 72;  // daha geniş çekim alanı
const ARKA_ATTRACT_SWIRL = 0.12; // daha az girdap, daha direkt çekiş
const ARKA_ATTRACT_ACTIVATE_X_RATIO = 0.0;

/************ UTIL ************/
const arkaRand = (min, max) => Math.random() * (max - min) + min;
const arkaChoice = arr => arr[Math.floor(Math.random() * arr.length)];

/************ DOM ************/
const arkaStage = document.getElementById("arka-stage");
let ARKA_W = window.innerWidth, ARKA_H = window.innerHeight;

/************ DURUMLAR ************/
let arkaColumns = [], arkaColWidth = 0, arkaColCount = 0;
let arkaPool = [];            // yüklü Image nesneleri
let arkaManifestReady = false;
let arkaFalling = [];
let arkaLastSpawn = 0;

// Eski toplama sekansı değişkenleri (devre dışı bırakılacak)
let arkaIsCollecting = false;
let arkaComet = null;         // { el, x, y, baseY, bob }
let arkaCollectingPieces = []; // { el, x, y, w, h }
let arkaAttractionActive = false;

// Yeni: VORTEX sekansı
let arkaIsVortexing = false;
let arkaVortexPieces = []; // geçmişten kalan
let arkaVortexTarget = { x: 0, y: 0 };

// Scatter (dağıtma) modu
let arkaIsScattering = false;
let arkaScatterPieces = []; // { el, x, y, vx, vy, rot, omega, scale, alpha }

/************ GRID ************/
function arkaSetupGrid() {
    ARKA_W = window.innerWidth; ARKA_H = window.innerHeight;
    arkaColCount = Math.max(8, Math.round((ARKA_W / 1280) * ARKA_COL_COUNT_BASE));
    arkaColumns = new Array(arkaColCount).fill(0);
    arkaColWidth = ARKA_W / arkaColCount;
}

function arkaHardReset() {
    // sahnedeki tüm görsel ve efektleri kaldır
    for (const el of arkaStage.querySelectorAll('.arka-piece, .arka-trail, .arka-comet')) el.remove();

    // durumlar
    arkaFalling = [];
    arkaCollectingPieces = [];
    arkaIsCollecting = false;
    arkaAttractionActive = false;
    arkaIsVortexing = false;
    arkaVortexPieces = [];
    arkaIsScattering = false;
    arkaScatterPieces = [];

    // kuyruklu yıldız referansını da temizle
    if (arkaComet && arkaComet.el) { try { arkaComet.el.remove(); } catch (e) { } }
    arkaComet = null;

    // grid
    arkaSetupGrid();

    // yeniden spawn için zamanlayıcı
    arkaLastSpawn = 0;
}

/************ HELPERS ************/
function arkaParseTranslate(el) {
    const tr = el.style.transform || '';
    const m = tr.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
    if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
    return { x: 0, y: 0 };
}

function arkaSpawnTrail(cx, cy) {
    const t = document.createElement('div');
    t.className = 'arka-trail';
    t.style.left = `${cx}px`;
    t.style.top = `${cy}px`;
    arkaStage.appendChild(t);
    setTimeout(() => t.remove(), 650);
}

// VORTEX sekansını başlat: tüm parçaları hortum noktasına çek
function arkaStartVortexSequence() {
    if (arkaIsVortexing) return;
    // Vortex yerine scatter talep edildiği için doğrudan scatter başlat
    arkaStartScatterSequence();
}

// Dağıtma sekansı: tüm parçaları merkezin etrafından dışa doğru savur
function arkaStartScatterSequence() {
    if (arkaIsScattering) return;
    arkaIsScattering = true;

    // Mevcut tüm parçaları yakala
    arkaScatterPieces = [];
    for (const el of arkaStage.querySelectorAll('.arka-piece')) {
        const { x, y } = arkaParseTranslate(el);
        // merkez referansı
        const cx = window.innerWidth * 0.5;
        const cy = window.innerHeight * 0.5;
        const ang = Math.random() * Math.PI * 2;
        const speed = 14 + Math.random() * 18; // 14..32 px/frame
        const vx = Math.cos(ang) * speed + (Math.random() * 2 - 1) * 2;
        const vy = Math.sin(ang) * speed + (Math.random() * 2 - 1) * 2;
        const omega = (Math.random() * 2 - 1) * 18; // -18..18 derece/frame
        arkaScatterPieces.push({ el, x, y, vx, vy, rot: 0, omega, scale: 1, alpha: 1 });
        el.style.willChange = 'transform, filter, opacity';
    }

    // Düşmeyi durdur
    arkaFalling = [];
}

/************ YÜKLEME ************/
function arkaTryLoad(src) {
    return new Promise((resolve) => {
        const full = `${ARKA_BASE_DIR}/${src}`;
        const im = new Image();
        im.onload = () => resolve({ ok: true, image: im, src });
        im.onerror = () => resolve({ ok: false, src });

        const isHttp = location.protocol === 'http:' || location.protocol === 'https:';
        im.src = isHttp ? (full + `?v=${Date.now()}`) : full; // cache-buster (http/https)
    });
}

async function arkaBuildPool() {
    arkaPool = [];
    for (const name of ARKA_MANUAL_IMAGES) {
        const r = await arkaTryLoad(name);
        if (r.ok) arkaPool.push(r.image);
    }
    arkaManifestReady = true;
}

/************ SPAWN ************/
function arkaSpawnPiece() {
    if (!arkaManifestReady || arkaPool.length === 0) return;
    if (arkaFalling.length >= ARKA_MAX_ACTIVE_FALLING) return;

    const srcImage = arkaChoice(arkaPool);
    const targetW = Math.round(arkaRand(ARKA_MIN_WIDTH, ARKA_MAX_WIDTH));
    const ratio = srcImage.naturalHeight / srcImage.naturalWidth || 1;
    const targetH = Math.max(24, Math.round(targetW * ratio));

    const span = Math.max(1, Math.round(targetW / arkaColWidth));
    const safeMaxStart = Math.max(0, arkaColCount - span);
    const col = Math.floor(arkaRand(0, safeMaxStart + 0.999));
    const x = Math.round(col * arkaColWidth + (Math.min(span, 1) * arkaColWidth - targetW) / 2);
    const rot = arkaRand(-ARKA_MAX_ROTATION_DEG, ARKA_MAX_ROTATION_DEG);

    const el = document.createElement('img');
    el.className = 'arka-piece';
    el.src = srcImage.src;
    el.width = targetW; el.height = targetH; el.alt = '';
    el.style.transform = `translate(${x}px, -${targetH}px) rotate(${rot}deg)`;
    arkaStage.appendChild(el);

    arkaFalling.push({ el, x, y: -targetH, w: targetW, h: targetH, vy: arkaRand(1.2, 3.0), col, span, rot });
}

/************ TOPLAMA SEANSI ************/
function arkaStartCollectSequence() {
    if (arkaIsCollecting) return;
    arkaIsCollecting = true;

    // Mevcut tüm parçaları yakala
    arkaCollectingPieces = [];
    for (const el of arkaStage.querySelectorAll('.arka-piece')) {
        const { x, y } = arkaParseTranslate(el);
        arkaCollectingPieces.push({ el, x, y, w: el.width || 0, h: el.height || 0 });
    }

    // Kuyruklu yıldız GÖRSELİ OLMADAN başlat (sadece koordinatlar ve iz/çekim)
    const entryY = Math.round(window.innerHeight * ARKA_COMET_ENTRY_Y_RATIO);
    arkaComet = { el: null, x: -ARKA_COMET_SIZE, y: entryY, baseY: entryY, bob: 0 };
    // İlk iz (görsel olmasa da animasyon izi görünsün)
    arkaSpawnTrail(arkaComet.x + ARKA_COMET_SIZE * .5, arkaComet.y + ARKA_COMET_SIZE * .5);
}

/************ ANA DÖNGÜ ************/
function arkaTick(ts) {
    if (!arkaLastSpawn) arkaLastSpawn = ts;
    if (!arkaIsCollecting && !arkaIsVortexing && !arkaIsScattering && ts - arkaLastSpawn >= ARKA_SPAWN_INTERVAL_MS) {
        arkaSpawnPiece();
        arkaLastSpawn = ts;
    }

    let maxStack = 0;

    if (!arkaIsCollecting && !arkaIsVortexing && !arkaIsScattering) {
        // düşüş
        const STACK_GAP = 2; // px: parçalar arasında min boşluk
        for (let i = arkaFalling.length - 1; i >= 0; i--) {
            const p = arkaFalling[i];
            p.vy += ARKA_GRAVITY;
            p.y += p.vy;

            // Parçanın kapladığı sütun aralığına göre zemini hesapla
            const c0 = Math.max(0, Math.min(arkaColCount - 1, p.col));
            const c1 = Math.max(c0, Math.min(arkaColCount - 1, p.col + Math.max(1, p.span) - 1));
            let baseStack = 0;
            for (let c = c0; c <= c1; c++) { if (arkaColumns[c] > baseStack) baseStack = arkaColumns[c]; }
            const groundY = ARKA_H - baseStack - p.h - STACK_GAP;
            if (p.y >= groundY) {
                p.y = groundY;
                // Parça oturdu: kapladığı tüm sütunlara yüksekliği ekle
                for (let c = c0; c <= c1; c++) { arkaColumns[c] += p.h + STACK_GAP; }
                p.vy = 0;
                arkaFalling.splice(i, 1);
            } else {
                p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
            }
        }
        for (let c = 0; c < arkaColumns.length; c++) maxStack = Math.max(maxStack, arkaColumns[c]);
        // Dolduğunda SCATTER animasyonu oynat, ardından resetle
        if (maxStack >= ARKA_H * ARKA_HALF_FILL_RATIO) {
            arkaStartVortexSequence();
        }

    } else if (arkaIsScattering) {
        // SCATTER animasyonu: her parça rastgele yönlerde dışarı doğru savrulsun
        const FRICTION = 0.98;      // hız sönümleme
        const SCALE_DECAY = 0.965;  // ölçek sönümleme
        const ALPHA_DECAY = 0.94;   // saydamlık sönümleme
        const SWIRL = 0.06;         // küçük girdap etkisi (hız vektörünü biraz döndür)

        const cx = window.innerWidth * 0.5;
        const cy = window.innerHeight * 0.5;

        for (let i = arkaScatterPieces.length - 1; i >= 0; i--) {
            const p = arkaScatterPieces[i];

            // hafif girdap: hız vektörünü merkeze göre dön
            const angToCenter = Math.atan2(p.y - cy, p.x - cx) + Math.PI * 0.5; // teğetsel
            p.vx += Math.cos(angToCenter) * SWIRL;
            p.vy += Math.sin(angToCenter) * SWIRL;

            // konum güncelle
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= FRICTION;
            p.vy *= FRICTION;

            // dönüş ve ölçek/saydamlık azaltma
            p.rot += p.omega;
            p.omega *= 0.99;
            p.scale *= SCALE_DECAY;
            p.alpha *= ALPHA_DECAY;

            // uygula
            p.el.style.opacity = String(Math.max(0, Math.min(1, p.alpha)));
            p.el.style.filter = `drop-shadow(0 10px 18px rgba(0,0,0,.35))`;
            p.el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) rotate(${p.rot}deg) scale(${p.scale})`;

            // ekran dışı/çok küçükse kaldır
            const offX = p.x < -200 || p.x > window.innerWidth + 200;
            const offY = p.y < -200 || p.y > window.innerHeight + 200;
            if (offX || offY || p.alpha < 0.05 || p.scale < 0.15) {
                try { p.el.remove(); } catch (e) { }
                arkaScatterPieces.splice(i, 1);
                continue;
            }
        }

        // Bittiğinde resetle ve döngüyü sürdür
        if (arkaScatterPieces.length === 0) {
            arkaHardReset();
            requestAnimationFrame(arkaTick);
            return;
        }

    } else {
        // Toplama sekansı devre dışı: burada bir şey yapma

        // Toplama sekansı devre dışı: çekim uygulanmaz

        // Toplama sekansı kaldırıldı: burada ek işlem yapılmaz
    }

    requestAnimationFrame(arkaTick);
}

/************ OLAYLAR ************/
let arkaResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(arkaResizeTimer);
    arkaResizeTimer = setTimeout(() => arkaHardReset(), 150);
});

/************ BAŞLAT ************/
(async function arkaInit() {
    arkaSetupGrid();
    await arkaBuildPool();
    requestAnimationFrame(arkaTick);
})();
