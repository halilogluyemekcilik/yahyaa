/************ AYARLAR ************/
const ARKA_BASE_DIR = "./assets/arka/img"; // görsellerin klasörü
// Buraya istediğin PNG'leri ekle (sadece bu liste kullanılır)
const ARKA_MANUAL_IMAGES = [
    "image1.png", "image2.png", "image3.png", "image4.png", "image5.png",
    "image6.png", "image7.png", "image8.png", "image9.png", "image10.png"
];

// Fizik ve davranış (arka plan için optimize)
const ARKA_GRAVITY = 0.35;
const ARKA_SPAWN_INTERVAL_MS = 400;
const ARKA_MAX_ACTIVE_FALLING = 18;
const ARKA_COL_COUNT_BASE = 18;
const ARKA_MIN_WIDTH = 48;
const ARKA_MAX_WIDTH = 160;
const ARKA_MAX_ROTATION_DEG = 12;
const ARKA_HALF_FILL_RATIO = 1.0;      // ekran dolunca reset
const ARKA_COMET_SPEED_X = 6.0;
const ARKA_COMET_ENTRY_Y_RATIO = 0.6;
const ARKA_COMET_SIZE = 140;
const ARKA_COMET_BOB_AMP = 22;
const ARKA_COMET_BOB_SPEED = 0.035;
const ARKA_ATTRACT_SPEED = 8.0;
const ARKA_ATTRACT_RADIUS = 36;
const ARKA_ATTRACT_SWIRL = 0.16;
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

let arkaIsCollecting = false;
let arkaComet = null;         // { el, x, y, baseY, bob }
let arkaCollectingPieces = []; // { el, x, y, w, h }
let arkaAttractionActive = false;

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

    const col = Math.floor(arkaRand(0, arkaColCount));
    const x = Math.round(col * arkaColWidth + (arkaColWidth - targetW) / 2);
    const rot = arkaRand(-ARKA_MAX_ROTATION_DEG, ARKA_MAX_ROTATION_DEG);

    const el = document.createElement('img');
    el.className = 'arka-piece';
    el.src = srcImage.src;
    el.width = targetW; el.height = targetH; el.alt = '';
    el.style.transform = `translate(${x}px, -${targetH}px) rotate(${rot}deg)`;
    arkaStage.appendChild(el);

    arkaFalling.push({ el, x, y: -targetH, w: targetW, h: targetH, vy: arkaRand(1.2, 3.0), col, rot });
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

    // Kuyruklu yıldız ekle
    const img = document.createElement('img');
    img.className = 'arka-comet';
    img.src = './assets/arka/drive.png';
    img.width = ARKA_COMET_SIZE;
    img.height = ARKA_COMET_SIZE;
    img.alt = 'comet';

    const entryY = Math.round(window.innerHeight * ARKA_COMET_ENTRY_Y_RATIO);
    arkaComet = { el: img, x: -ARKA_COMET_SIZE, y: entryY, baseY: entryY, bob: 0 };
    img.style.transform = `translate(${arkaComet.x}px, ${arkaComet.y}px)`;
    arkaStage.appendChild(img);

    // İlk iz
    arkaSpawnTrail(arkaComet.x + ARKA_COMET_SIZE * .5, arkaComet.y + ARKA_COMET_SIZE * .5);
}

/************ ANA DÖNGÜ ************/
function arkaTick(ts) {
    if (!arkaLastSpawn) arkaLastSpawn = ts;
    if (!arkaIsCollecting && ts - arkaLastSpawn >= ARKA_SPAWN_INTERVAL_MS) {
        arkaSpawnPiece();
        arkaLastSpawn = ts;
    }

    let maxStack = 0;

    if (!arkaIsCollecting) {
        // düşüş
        for (let i = arkaFalling.length - 1; i >= 0; i--) {
            const p = arkaFalling[i];
            p.vy += ARKA_GRAVITY;
            p.y += p.vy;

            const groundY = ARKA_H - arkaColumns[p.col] - p.h;
            if (p.y >= groundY) {
                p.y = groundY;
                arkaColumns[p.col] += p.h;
                p.vy = 0;
                arkaFalling.splice(i, 1);
            } else {
                p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
            }
        }
        for (let c = 0; c < arkaColumns.length; c++) maxStack = Math.max(maxStack, arkaColumns[c]);
        // Dolduğunda direkt sıfırla (toplama sekansını atla)
        if (maxStack >= ARKA_H * ARKA_HALF_FILL_RATIO) {
            arkaHardReset();
            requestAnimationFrame(arkaTick);
            return;
        }

    } else {
        // kuyruklu yıldız hareketi
        // Toplama sekansı devre dışı: direkt resetlendiği için bu blok kullanılmaz
        // Arka uyumluluk için hiçbir şey yapma

        // parçaları çek
        // Toplama sekansı devre dışı: çekim uygulanmaz

        // Toplama sekansı kaldırıldı: burada ek iş yapılmaz
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
