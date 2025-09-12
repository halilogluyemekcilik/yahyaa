class CandyMatch3Game {

    constructor() {

        // --- HURRY-UP (son 10 sn) ---

        // --- HURRY (son 10 sn) ---
        this.tickAudio = new Audio('tick.mp3'); // Kendi mevcut "tık" sesinin yolunu yaz
        this.tickAudio.volume = 1.0;
        this.isHurryUp = false;
        this.hurryInterval = null;
        this.finalCountdownInterval = null; // New property for enhanced countdown effects
        ////////////////////////
        this.isDragging = false;
        this.dragStart = null;           // {row, col, x, y}
        this.dragThreshold = 10;         // piksel
        this._suppressNextClick = false; // drag sonrası tıklamayı bastır
        //
        this.canvas = null;
        this.ctx = null;
        this.gridWidth = 8;
        this.gridHeight = 12;
        this.cellSize = 80;  // Increased from 60 to 80 for better candy fit
        this.offsetX = 15;   // 15px offset keeps the grid centered in 670px canvas
        this.grid = [];
        this.selectedCell = null;
        this.score = 0;
        this.timeLeft = 30;
        this.gameRunning = false;
        this.playerName = 'Oyuncu';
        this.animating = false;
        this.swapAnimating = false;
        this.swapAnimation = null;
        this.timerInterval = null;
        this.animationLockTimer = null;

        this.candyImages = [];

        this.imagesLoaded = false;

        this.candyTypes = [0, 1, 2, 3, 4];
        this.candyColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

        this.candyImagePaths = [
            'img/candy1.png',
            'img/candy2.png',
            'img/candy3.png',
            'img/candy4.png',
            'img/candy5.png'
        ];


        this.particles = [];
        this.candySizeAdjustments = { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0 };
        // --- YENİ EKLENEN SES KODU BAŞLANGICI ---
        console.log("Ses efektleri yükleniyor...");
        this.explosionSound = new Audio('pop.ogg'); // Pop SFX
        this.explosionSound.volume = 0.4; // Başlangıç: slider ile senkronlanacak
        this.explosionSound.muted = false;
        // Oyunu ve dinleyicileri BAŞLAT
        // --- bg music ---
        this.backgroundMusic = new Audio('turkcell-bg.mp3');
        this.backgroundMusic.loop = true; // Müziğin sürekli dönmesini sağlar
        this.backgroundMusic.volume = 0.4; // Arka plan müziği daha kısık olmalı

        this.isMuted = false; // Tüm sesleri kontrol edecek ana değişken
        this.musicStarted = false; // Müziğin kullanıcı etkileşimiyle başladığını kontrol etmek için
        this.initializeGame();
    }


    // CONSTRUCTOR'DAN SONRA BU YENİ FONKSİYONU EKLEYİN
    resetGame() {
        console.log("Oyun durumu sıfırlanıyor...");

        // Zamanlayıcıyı temizle
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.stopHurryUp();

        // Oyun durumu değişkenlerini sıfırla
        this.score = 0;
        this.timeLeft = 30;
        this.gameRunning = false;

        // Kilitlenmeye neden olan en önemli değişkenleri sıfırla
        this.animating = false;
        this.swapAnimating = false;
        this.selectedCell = null;

        // Oyun alanını ve parçacıkları temizle
        this.grid = [];
        this.particles = [];

        // Arayüzü (UI) sıfırla
        if (document.getElementById('score')) {
            document.getElementById('score').textContent = '0';
        }
        if (document.getElementById('timer')) {
            document.getElementById('timer').textContent = '30';
        }
    }

    initializeGame() {
        // Canvas & context
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas (#game-canvas) bulunamadı. HTML’de id doğru mu ve script doğru zamanda mı yükleniyor?');
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // === CLICK ile seçim/değişim (mevcut mantık) ===
        this.canvas.addEventListener('click', (e) => {
            // Drag sonrası istemsiz click'i bastır
            if (this._suppressNextClick) { this._suppressNextClick = false; return; }

            if (!this.gameRunning || this.animating || this.swapAnimating) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / this.cellSize);
            const row = Math.floor(y / this.cellSize);

            if (col >= 0 && col < this.gridWidth && row >= 0 && row < this.gridHeight) {
                this.handleCellClick(row, col);
            }
        });

        // === DRAG (sürükleyerek swap) için pointer olayları ===
        const getCanvasPos = (ev) => {
            const rect = this.canvas.getBoundingClientRect();
            const cx = (ev.clientX ?? (ev.touches?.[0]?.clientX)) - rect.left - this.offsetX;
            const cy = (ev.clientY ?? (ev.touches?.[0]?.clientY)) - rect.top;
            return { cx, cy };
        };

        // Mobil kaydırmayı engellemek için (CSS'te de #game-canvas { touch-action: none })
        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';

        this.canvas.addEventListener('pointerdown', (e) => {
            if (!this.gameRunning || this.animating || this.swapAnimating) return;

            this.canvas.setPointerCapture?.(e.pointerId);
            const { cx, cy } = getCanvasPos(e);
            const col = Math.floor(cx / this.cellSize);
            const row = Math.floor(cy / this.cellSize);
            if (col < 0 || col >= this.gridWidth || row < 0 || row >= this.gridHeight) return;

            this.isDragging = true;
            this.dragStart = { row, col, x: cx, y: cy };
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isDragging || !this.dragStart) return;
            if (!this.gameRunning || this.animating || this.swapAnimating) return;

            const { cx, cy } = getCanvasPos(e);
            const dx = cx - this.dragStart.x;
            const dy = cy - this.dragStart.y;

            // Küçük titreşimleri filtrele
            if (Math.max(Math.abs(dx), Math.abs(dy)) < this.dragThreshold) return;

            // Yön: yatay mı dikey mi?
            let targetRow = this.dragStart.row;
            let targetCol = this.dragStart.col;

            if (Math.abs(dx) > Math.abs(dy)) {
                targetCol += dx > 0 ? 1 : -1;   // sağ / sol
            } else {
                targetRow += dy > 0 ? 1 : -1;   // aşağı / yukarı
            }

            // Sınır kontrolü
            if (
                targetCol >= 0 && targetCol < this.gridWidth &&
                targetRow >= 0 && targetRow < this.gridHeight
            ) {
                // Yalnızca bir kez tetikleyelim
                this.isDragging = false;
                this._suppressNextClick = true;      // drag bitince tetiklenebilecek click'i yut
                this.swapCandies(this.dragStart.row, this.dragStart.col, targetRow, targetCol);
                this.selectedCell = null;            // görsel seçim varsa sıfırla
            }
        });

        const endDrag = (e) => {
            this.isDragging = false;
            this.dragStart = null;
            try { this.canvas.releasePointerCapture?.(e.pointerId); } catch { }
        };

        this.canvas.addEventListener('pointerup', endDrag);
        this.canvas.addEventListener('pointercancel', endDrag);
        this.canvas.addEventListener('pointerleave', () => { this.isDragging = false; this.dragStart = null; });

        // === Görselleri yükle + diğer UI dinleyicileri kur ===
        // Projenizde zaten bulunan akışa uyuyor:
        this.loadImages().then(() => {
            this.setupEventListeners();
        }).catch((err) => {
            console.error('Görseller yüklenirken hata:', err);
            // Fallback sisteminiz varsa burada devreye girer
            this.setupEventListeners();
        });
    }


    async loadImages() {



        // 2) Candy görsellerini tek tek yükle (partial success destekli)
        const results = await Promise.allSettled(
            this.candyImagePaths.map((p) => this.loadImage(p))
        );

        // Başarılı olanları diziye koy, başarısızlar için null bırak
        this.candyImages = results.map((r, i) => {
            if (r.status === 'fulfilled') {
                console.log(`✅ Candy ${i + 1} yüklendi`);
                return r.value;
            } else {
                console.warn(`⚠️ Candy ${i + 1} yüklenemedi:`, r.reason?.message || r.reason);
                return null; // bu index için fallback devam edecek
            }
        });

        // En az 1 tane başarıyla yüklendiyse artık PNG modunu açabiliriz
        const pngCount = this.candyImages.filter(Boolean).length;
        if (pngCount > 0) {
            this.imagesLoaded = true;
            console.log(`🍬 ${pngCount}/${this.candyImages.length} candy PNG aktif`);
        } else {
            // Hiçbiri yüklenmediyse emoji fallback’e kal
            this.imagesLoaded = true; // render akışı için true kalsın
            this.candyTypes = ['❤️', '✈️', '⭐', '💎', '⚡'];
            console.warn('❌ Candy PNG bulunamadı; emoji fallback kullanılacak.');
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src; // Yol: index.html’e göre relative
        });
    }

    setupEventListeners() {

        // Settings functionality (replaces mute button) - Toggle on click
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        const musicToggle = document.getElementById('music-toggle');
        const fullscreenToggle = document.getElementById('fullscreen-toggle');

        // Debug: Check if elements are found
        console.log('Settings elements found:');
        console.log('settingsBtn:', settingsBtn);
        console.log('settingsPanel:', settingsPanel);
        console.log('volumeSlider:', volumeSlider);
        console.log('musicToggle:', musicToggle);

        // Toggle settings panel when clicking settings button
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked!');
            console.log('Panel classes before toggle:', settingsPanel.className);
            settingsPanel.classList.toggle('hidden');
            console.log('Panel classes after toggle:', settingsPanel.className);
        });

        // Close settings when clicking outside the panel
        settingsPanel.addEventListener('click', (e) => {
            if (e.target === settingsPanel) {
                settingsPanel.classList.add('hidden');
            }
        });

        // Close settings with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !settingsPanel.classList.contains('hidden')) {
                settingsPanel.classList.add('hidden');
            }
        });

        // Volume control
        // Initialize from current slider value
        this.musicVolume = (Number(volumeSlider.value) || 40) / 100;
        this.backgroundMusic.volume = this.musicVolume;
        this.explosionSound.volume = this.musicVolume;
        // Tick base volume (hurry-up will boost slightly per tick)
        this.tickAudio.volume = this.musicVolume;

        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.musicVolume = volume;
            this.backgroundMusic.volume = volume;
            this.explosionSound.volume = volume;
            // Optional: keep tick close to music volume; final boost is applied when ticking
            this.tickAudio.volume = volume;
            volumeValue.textContent = `${e.target.value}%`;

            // Update visual progress for the slider
            volumeSlider.style.setProperty('--slider-progress', `${e.target.value}%`);
        });

        // Initialize slider progress on load
        volumeSlider.style.setProperty('--slider-progress', `${volumeSlider.value}%`);

        // Music toggle
        musicToggle.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                // Hard mute everything
                this.backgroundMusic.pause();
                this.backgroundMusic.muted = true;
                try { this.explosionSound.pause(); } catch { }
                this.explosionSound.muted = true;
                try { this.tickAudio.pause(); } catch { }
                this.tickAudio.muted = true;
                musicToggle.textContent = '🔇 KAPALI';
                musicToggle.classList.add('off');
            } else {
                // Unmute and restore volumes
                this.backgroundMusic.muted = false;
                this.backgroundMusic.volume = this.musicVolume;
                if (this.musicStarted) {
                    this.backgroundMusic.play().catch(() => { });
                }
                this.explosionSound.muted = false;
                this.explosionSound.volume = this.musicVolume;
                this.tickAudio.muted = false;
                this.tickAudio.volume = this.musicVolume;
                musicToggle.textContent = '🎵 ON';
                musicToggle.classList.remove('off');
            }
        });

        // Fullscreen toggle from settings
        fullscreenToggle.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Virtual keyboard (removed)
        // Name input handling (removed)

        // Start game button - no name required
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame('Oyuncu');
        });

        // Play again button
        document.getElementById('play-again-btn-popup').addEventListener('click', () => {
            this.showStartScreen();
        });

        // Removed leaderboard functionality

        // Close score popup when clicking outside - go back to start
        document.getElementById('score-popup').addEventListener('click', (e) => {
            if (e.target.id === 'score-popup') {
                this.hideScorePopup();
                this.showStartScreen();
            }
        });

        // Close score popup with Escape key - go back to start
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const scorePopup = document.getElementById('score-popup');
                if (!scorePopup.classList.contains('hidden')) {
                    this.hideScorePopup();
                    this.showStartScreen();
                }
            }
        });

        // Removed leaderboard delete functionality

        // Removed name input enter key handling

        // Fullscreen toggling is available in settings; standalone button removed
    }

    startGame(playerName) {
        // --- EN ÖNEMLİ DEĞİŞİKLİK ---
        // Oyuna başlamadan önce her şeyi sıfırla
        this.resetGame();
        // ...içinde startGame fonksiyonu...
        if (!this.musicStarted && !this.isMuted) {
            const playPromise = this.backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // Müzik başarıyla başladı.
                    this.musicStarted = true;
                    console.log("Arka plan müziği başarıyla başlatıldı.");
                }).catch(error => {
                    // Tarayıcı otomatik oynatmayı engelledi.
                    console.error("Arka plan müziği başlatılamadı:", error);
                    this.musicStarted = false; // Başlatılamadığı için durumu false yapalım.
                });
            }
        }
        // ...
        // --- KOD SONU ---
        if (!this.imagesLoaded) {
            console.log('Images still loading, waiting...');
            setTimeout(() => this.startGame(playerName), 100);
            return;
        }

        console.log('🎮 Starting game for player:', playerName);

        this.playerName = playerName;
        this.gameRunning = true; // resetGame'den sonra tekrar true yap

        document.getElementById('player-display').textContent = `Oyuncu: ${playerName}`;

        this.showGameScreen();

        this.generateGrid();
        this.startGameTimer();
        this.gameLoop();
    }

    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-screen').style.opacity = '1'; // Reset opacity
        document.getElementById('score-popup').classList.add('hidden'); // Hide score popup
    }

    showGameScreen() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    }

    showScorePopup() {
        // Hide game screen but keep it as background
        document.getElementById('game-screen').style.opacity = '0.3';

        // Update popup content
        document.getElementById('final-score-value').textContent = this.score;
        document.getElementById('final-player-name').textContent = this.playerName;

        // Update header
        const headerElement = document.querySelector('.score-popup-header h2');
        headerElement.textContent = ' TEBRIKLER! ';
        headerElement.style.color = '#183E95';

        // Show popup with animation
        const popup = document.getElementById('score-popup');
        popup.classList.remove('hidden');

        // Add celebration effect
        setTimeout(() => {
            this.createCelebrationEffect();
        }, 300);
    }

    hideScorePopup() {
        document.getElementById('score-popup').classList.add('hidden');
        document.getElementById('game-screen').style.opacity = '1';
    }

    createCelebrationEffect() {
        // Create firework-style particles around the score
        const popup = document.getElementById('score-popup');
        const rect = popup.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create multiple bursts
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                this.createFireworkBurst(centerX, centerY, burst);
            }, burst * 400);
        }
    }

    createFireworkBurst(x, y, burstIndex) {
        const colors = ['#FFC403', '#FFD700', '#FFA500', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
        const particleCount = 12;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 80 + Math.random() * 40;
            const particle = document.createElement('div');

            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 15px currentColor;
                transform: translate(-50%, -50%);
                transition: all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            `;

            document.body.appendChild(particle);

            // Animate particle
            setTimeout(() => {
                particle.style.transform = `translate(
                    ${Math.cos(angle) * distance}px,
                    ${Math.sin(angle) * distance + 50}px
                ) scale(0)`;
                particle.style.opacity = '0';
            }, 10);

            // Remove particle
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }

    // Removed leaderboard screen function

    initializeCanvas() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning || this.animating || this.swapAnimating) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / this.cellSize);
            const row = Math.floor(y / this.cellSize);

            if (col >= 0 && col < this.gridWidth && row >= 0 && row < this.gridHeight) {
                this.handleCellClick(row, col);
            }
        });
    }

    generateGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                let candyType;
                do {
                    candyType = Math.floor(Math.random() * this.candyTypes.length);
                } while (this.wouldCreateMatch(row, col, candyType));

                this.grid[row][col] = {
                    type: candyType,
                    x: col * this.cellSize + this.offsetX,
                    y: row * this.cellSize,
                    targetX: col * this.cellSize + this.offsetX,
                    targetY: row * this.cellSize,
                    falling: false,
                    swapping: false
                };
            }
        }
    }

    wouldCreateMatch(row, col, type) {
        // Check horizontal match
        let horizontalCount = 1;

        // Check left
        for (let c = col - 1; c >= 0 && this.grid[row] && this.grid[row][c] && this.grid[row][c].type === type; c--) {
            horizontalCount++;
        }

        // Check right
        for (let c = col + 1; c < this.gridWidth && this.grid[row] && this.grid[row][c] && this.grid[row][c].type === type; c++) {
            horizontalCount++;
        }

        if (horizontalCount >= 3) return true;

        // Check vertical match
        let verticalCount = 1;

        // Check up
        for (let r = row - 1; r >= 0 && this.grid[r] && this.grid[r][col] && this.grid[r][col].type === type; r--) {
            verticalCount++;
        }

        // Check down
        for (let r = row + 1; r < this.gridHeight && this.grid[r] && this.grid[r][col] && this.grid[r][col].type === type; r++) {
            verticalCount++;
        }

        return verticalCount >= 3;
    }

    handleCellClick(row, col) {
        if (!this.selectedCell) {
            this.selectedCell = { row, col };
        } else {
            const { row: selectedRow, col: selectedCol } = this.selectedCell;

            if (row === selectedRow && col === selectedCol) {
                this.selectedCell = null;
            } else if (this.areAdjacent(selectedRow, selectedCol, row, col)) {
                this.swapCandies(selectedRow, selectedCol, row, col);
                this.selectedCell = null;
            } else {
                this.selectedCell = { row, col };
            }
        }
    }

    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapCandies(row1, col1, row2, col2) {
        // Start swap animation
        this.swapAnimating = true;

        const candy1 = this.grid[row1][col1];
        const candy2 = this.grid[row2][col2];

        // Set animation targets
        candy1.targetX = col2 * this.cellSize + this.offsetX;
        candy1.targetY = row2 * this.cellSize;
        candy1.swapping = true;

        candy2.targetX = col1 * this.cellSize + this.offsetX;
        candy2.targetY = row1 * this.cellSize;
        candy2.swapping = true;

        // Store swap animation data
        this.swapAnimation = {
            candy1: candy1,
            candy2: candy2,
            row1: row1,
            col1: col1,
            row2: row2,
            col2: col2,
            originalX1: candy1.x,
            originalY1: candy1.y,
            originalX2: candy2.x,
            originalY2: candy2.y
        };
    }

    findMatches() {
        const matches = new Set();

        // Check horizontal matches
        for (let row = 0; row < this.gridHeight; row++) {
            let count = 1;
            let currentType = this.grid[row][0].type;

            for (let col = 1; col < this.gridWidth; col++) {
                if (this.grid[row][col].type === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let c = col - count; c < col; c++) {
                            matches.add(`${row}-${c}`);
                        }
                    }
                    count = 1;
                    currentType = this.grid[row][col].type;
                }
            }

            if (count >= 3) {
                for (let c = this.gridWidth - count; c < this.gridWidth; c++) {
                    matches.add(`${row}-${c}`);
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < this.gridWidth; col++) {
            let count = 1;
            let currentType = this.grid[0][col].type;

            for (let row = 1; row < this.gridHeight; row++) {
                if (this.grid[row][col].type === currentType) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let r = row - count; r < row; r++) {
                            matches.add(`${r}-${col}`);
                        }
                    }
                    count = 1;
                    currentType = this.grid[row][col].type;
                }
            }

            if (count >= 3) {
                for (let r = this.gridHeight - count; r < this.gridHeight; r++) {
                    matches.add(`${r}-${col}`);
                }
            }
        }

        return Array.from(matches).map(match => {
            const [row, col] = match.split('-').map(Number);
            return { row, col };
        });
    }

    processMatches(matches) {
        // Eğer ses varsa ve hazırsa, başa sar ve çal (mute ve volume'ye bağlı)
        if (this.explosionSound && !this.isMuted) {
            try {
                this.explosionSound.pause();
                this.explosionSound.currentTime = 0;
                this.explosionSound.volume = this.musicVolume;
                this.explosionSound.play().catch(() => { });
            } catch (_) { }
        }
        // Create explosion particles with staggered timing for better effect
        matches.forEach(({ row, col }, index) => {
            setTimeout(() => {
                this.createExplosionParticles((col * this.cellSize + this.offsetX) + this.cellSize / 2, row * this.cellSize + this.cellSize / 2);

                // Add screen shake effect
                this.canvas.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
                setTimeout(() => {
                    this.canvas.style.transform = 'translate(0, 0)';
                }, 100);
            }, index * 50);
        });

        // Remove matched candies and update score with animation
        setTimeout(() => {
            matches.forEach(({ row, col }) => {
                if (this.grid[row][col]) {
                    // Animate candy disappearing
                    this.grid[row][col].disappearing = true;
                }
            });

            // Actually remove candies after animation
            setTimeout(() => {
                matches.forEach(({ row, col }) => {
                    this.grid[row][col] = null;
                });

                this.score += matches.length * 10;
                document.getElementById('score').textContent = this.score;

                // Apply gravity and fill empty spaces
                this.applyGravity();
                this.fillEmptySpaces();

                // Check for new matches after a delay
                setTimeout(() => {
                    const newMatches = this.findMatches();
                    if (newMatches.length > 0) {
                        this.processMatches(newMatches);
                    } else {
                        this.animating = false;
                    }
                }, 300);
            }, 200);
        }, 300);
    }

    createExplosionParticles(x, y) {
        const particleCount = 15;
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

        // Create burst particles
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 3 + Math.random() * 7;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.015,
                size: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: 'burst'
            });
        }

        // Create sparkle particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.01,
                size: 1 + Math.random() * 2,
                color: '#ffff00',
                type: 'sparkle'
            });
        }

        // Create shockwave
        this.particles.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 40,
            life: 1.0,
            decay: 0.05,
            color: '#ffffff',
            type: 'shockwave'
        });
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            if (particle.type === 'shockwave') {
                particle.radius += 3;
                particle.life -= particle.decay;
                return particle.life > 0 && particle.radius < particle.maxRadius;
            } else {
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.type === 'burst') {
                    particle.vy += 0.3; // gravity
                    particle.vx *= 0.98; // air resistance
                    particle.vy *= 0.98;
                } else if (particle.type === 'sparkle') {
                    particle.vy += 0.1; // less gravity for sparkles
                    particle.vx *= 0.95;
                    particle.vy *= 0.95;
                }

                particle.life -= particle.decay;
                return particle.life > 0;
            }
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;

            if (particle.type === 'shockwave') {
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (particle.type === 'sparkle') {
                this.ctx.fillStyle = particle.color;
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 5;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw sparkle cross
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x - particle.size * 2, particle.y);
                this.ctx.lineTo(particle.x + particle.size * 2, particle.y);
                this.ctx.moveTo(particle.x, particle.y - particle.size * 2);
                this.ctx.lineTo(particle.x, particle.y + particle.size * 2);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = particle.color;
                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = 3;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    updateSwapAnimation() {
        if (!this.swapAnimating || !this.swapAnimation) return;

        const speed = 6;
        const { candy1, candy2 } = this.swapAnimation;

        // Update candy1 position
        const dx1 = candy1.targetX - candy1.x;
        const dy1 = candy1.targetY - candy1.y;
        const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        if (distance1 > speed) {
            candy1.x += (dx1 / distance1) * speed;
            candy1.y += (dy1 / distance1) * speed;
        } else {
            candy1.x = candy1.targetX;
            candy1.y = candy1.targetY;
        }

        // Update candy2 position
        const dx2 = candy2.targetX - candy2.x;
        const dy2 = candy2.targetY - candy2.y;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (distance2 > speed) {
            candy2.x += (dx2 / distance2) * speed;
            candy2.y += (dy2 / distance2) * speed;
        } else {
            candy2.x = candy2.targetX;
            candy2.y = candy2.targetY;
        }

        // Check if animation is complete
        if (distance1 <= speed && distance2 <= speed) {
            if (this.swapAnimation.returningToOriginal) {
                this.completeReturnAnimation();
            } else {
                this.completeSwapAnimation();
            }
        }
    }

    completeSwapAnimation() {
        const { candy1, candy2, row1, col1, row2, col2, originalX1, originalY1, originalX2, originalY2 } = this.swapAnimation;

        // Actually swap the candies in the grid
        this.grid[row1][col1] = candy2;
        this.grid[row2][col2] = candy1;

        // Reset animation flags
        candy1.swapping = false;
        candy2.swapping = false;

        // Check for matches
        const matches = this.findMatches();

        if (matches.length > 0) {
            // Valid swap - matches found
            this.swapAnimating = false;
            this.swapAnimation = null;
            this.animating = true;
            this.processMatches(matches);
        } else {
            // Invalid swap - no matches, animate back to original positions
            candy1.targetX = originalX1;
            candy1.targetY = originalY1;
            candy1.swapping = true;

            candy2.targetX = originalX2;
            candy2.targetY = originalY2;
            candy2.swapping = true;

            // Swap them back in the grid
            this.grid[row1][col1] = candy1;
            this.grid[row2][col2] = candy2;

            this.swapAnimation = {
                candy1: candy1,
                candy2: candy2,
                row1: row1,
                col1: col1,
                row2: row2,
                col2: col2,
                originalX1: originalX1,
                originalY1: originalY1,
                originalX2: originalX2,
                originalY2: originalY2,
                returningToOriginal: true
            };
        }
    }

    completeReturnAnimation() {
        const { candy1, candy2 } = this.swapAnimation;

        candy1.swapping = false;
        candy2.swapping = false;

        this.swapAnimating = false;
        this.swapAnimation = null;
    }

    applyGravity() {
        for (let col = 0; col < this.gridWidth; col++) {
            let writePos = this.gridHeight - 1;

            for (let row = this.gridHeight - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (writePos !== row) {
                        this.grid[writePos][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                        this.grid[writePos][col].targetX = col * this.cellSize + this.offsetX;
                        this.grid[writePos][col].targetY = writePos * this.cellSize;
                        this.grid[writePos][col].falling = true;
                    }
                    writePos--;
                }
            }
        }
    }

    fillEmptySpaces() {
        for (let col = 0; col < this.gridWidth; col++) {
            for (let row = 0; row < this.gridHeight; row++) {
                if (this.grid[row][col] === null) {
                    let candyType;
                    do {
                        candyType = Math.floor(Math.random() * this.candyTypes.length);
                    } while (this.wouldCreateMatch(row, col, candyType));

                    this.grid[row][col] = {
                        type: candyType,
                        x: col * this.cellSize + this.offsetX,
                        y: -this.cellSize,
                        targetX: col * this.cellSize + this.offsetX,
                        targetY: row * this.cellSize,
                        falling: true,
                        swapping: false
                    };
                }
            }
        }
    }

    startGameTimer() {
        // Önceki zamanlayıcının temizlendiğinden emin ol
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Yeni zamanlayıcıyı sınıf değişkenine ata
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            document.getElementById('timer').textContent = this.timeLeft;

            if (this.timeLeft === 10) this.startHurryUp();


            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval); // Kendini temizle
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.stopHurryUp();
        this.gameRunning = false;
        this.showScorePopup();
    }

    // Removed all leaderboard functionality
    // saveScore, loadLeaderboard, updateLeaderboard, deleteLeaderboardEntry functions removed

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Canvas is now transparent - CSS background shows through
        // No background drawing needed on canvas

        // Draw subtle grid lines only (no background fills)
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const x = col * this.cellSize + this.offsetX;
                const y = row * this.cellSize;

                // Draw black grid lines to separate candy icons
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; /** GRID RENK */
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }

        // Highlight selected cell
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            this.ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
            this.ctx.fillRect(col * this.cellSize + this.offsetX, row * this.cellSize, this.cellSize, this.cellSize);
        }

        // Draw candies
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const candy = this.grid[row][col];
                if (candy) {
                    // Animate falling candies
                    if (candy.falling && !candy.swapping) {
                        const speed = 8;
                        if (candy.y < candy.targetY) {
                            candy.y += speed;
                            if (candy.y >= candy.targetY) {
                                candy.y = candy.targetY;
                                candy.falling = false;
                            }
                        }
                    }

                    const x = candy.x + this.cellSize / 2;
                    const y = candy.y + this.cellSize / 2;

                    // Handle disappearing animation
                    let scale = 1;
                    let alpha = 1;
                    if (candy.disappearing) {
                        scale = 0.5;
                        alpha = 0.3;
                    }

                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.translate(x, y);
                    this.ctx.scale(scale, scale);

                    if (this.imagesLoaded && this.candyImages && this.candyImages[candy.type]) {
                        // Draw candy image with individual size adjustment
                        const baseSizeMultiplier = 0.75;  // Reduced from 0.8 to 0.75 for better fit
                        const individualAdjustment = this.candySizeAdjustments[candy.type] || 1.0;
                        const imageSize = this.cellSize * baseSizeMultiplier * individualAdjustment;

                        this.ctx.drawImage(
                            this.candyImages[candy.type],
                            -imageSize / 2,
                            -imageSize / 2,
                            imageSize,
                            imageSize
                        );
                    } else {
                        // Fallback to emoji/colored circles
                        // Draw candy background
                        this.ctx.fillStyle = this.candyColors[candy.type];
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, this.cellSize / 3, 0, Math.PI * 2);
                        this.ctx.fill();

                        // Add glow effect
                        this.ctx.shadowColor = this.candyColors[candy.type];
                        this.ctx.shadowBlur = 10;
                        this.ctx.fill();

                        // Draw candy emoji (if using fallback)
                        if (typeof this.candyTypes[candy.type] === 'string') {
                            this.ctx.shadowBlur = 0;
                            this.ctx.font = `${this.cellSize / 2}px Arial`;
                            this.ctx.textAlign = 'center';
                            this.ctx.textBaseline = 'middle';
                            this.ctx.fillStyle = '#333';
                            this.ctx.fillText(this.candyTypes[candy.type], 0, 0);
                        }
                    }

                    this.ctx.restore();
                }
            }
        }

        // Draw particles
        this.drawParticles();
    }

    gameLoop() {
        if (this.gameRunning) {
            this.updateParticles();
            this.updateSwapAnimation();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.mozFullScreenElement &&
            !document.msFullscreenElement) {
            // Enter fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    updateFullscreenButton() {
        const fullscreenIcon = document.getElementById('fullscreen-icon');
        const isFullscreen = document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement;

        if (isFullscreen) {
            fullscreenIcon.textContent = '❏'; // Exit fullscreen icon
            document.getElementById('fullscreen-btn').title = 'Exit Fullscreen';
        } else {
            fullscreenIcon.textContent = '⛶'; // Enter fullscreen icon
            document.getElementById('fullscreen-btn').title = 'Enter Fullscreen';
        }
    }

    // Method to adjust individual candy sizes for uniform appearance
    adjustCandySize(candyType, sizeMultiplier) {
        if (candyType >= 0 && candyType < this.candyTypes.length) {
            this.candySizeAdjustments[candyType] = sizeMultiplier;
            console.log(`Candy ${candyType} size adjusted to ${sizeMultiplier}x`);
        }
    }

    //Son 10 saniye

    startHurryUp() {
        if (this.isHurryUp) return; // ikinci kez kurulmasın
        this.isHurryUp = true;

        console.log('🚨 HURRY UP mode activated! Last 10 seconds!');

        const timerEl = document.getElementById('timer');
        const timerBox = document.querySelector('.timer-container');
        const canvasEl = document.getElementById('game-canvas');
        const gameContainer = document.getElementById('game-container');
        const scoreContainer = document.querySelector('.score-container');
        const playerInfo = document.querySelector('.player-info');

        // Add hurry classes to multiple elements for dramatic effect
        timerEl && timerEl.classList.add('hurry');
        timerBox && timerBox.classList.add('hurry');
        canvasEl && canvasEl.classList.add('hurry');
        gameContainer && gameContainer.classList.add('hurry');
        scoreContainer && scoreContainer.classList.add('hurry');
        playerInfo && playerInfo.classList.add('hurry');

        // Create screen shake effect
        this.createScreenShake();

        // Add urgent sound effect interval
        this.hurryInterval = setInterval(() => {
            if (!this.isMuted) {
                try {
                    // Reset and play tick sound
                    this.tickAudio.pause();
                    this.tickAudio.currentTime = 0;
                    this.tickAudio.volume = Math.min(1.0, this.musicVolume + 0.3); // Slightly louder
                    this.tickAudio.play().catch(() => { });

                    // Add extra dramatic effects on every tick
                    this.createUrgentFlash();

                } catch (e) {
                    console.warn('Tick audio playback failed:', e);
                }
            }
        }, 1000);

        // Add countdown-specific effects for final seconds
        this.finalCountdownInterval = setInterval(() => {
            if (this.timeLeft <= 5) {
                this.createFinalCountdownEffect();
            }
        }, 500);
    }

    stopHurryUp() {
        if (this.hurryInterval) {
            clearInterval(this.hurryInterval);
            this.hurryInterval = null;
        }
        if (this.finalCountdownInterval) {
            clearInterval(this.finalCountdownInterval);
            this.finalCountdownInterval = null;
        }
        this.isHurryUp = false;

        const timerEl = document.getElementById('timer');
        const timerBox = document.querySelector('.timer-container');
        const canvasEl = document.getElementById('game-canvas');
        const gameContainer = document.getElementById('game-container');
        const scoreContainer = document.querySelector('.score-container');
        const playerInfo = document.querySelector('.player-info');

        // Remove all hurry classes
        timerEl && timerEl.classList.remove('hurry');
        timerBox && timerBox.classList.remove('hurry');
        canvasEl && canvasEl.classList.remove('hurry');
        gameContainer && gameContainer.classList.remove('hurry');
        scoreContainer && scoreContainer.classList.remove('hurry');
        playerInfo && playerInfo.classList.remove('hurry');

        // Stop sound safely
        try {
            this.tickAudio.pause();
            this.tickAudio.currentTime = 0;
        } catch (e) {
            console.warn('Failed to stop tick audio:', e);
        }

        console.log('🔇 HURRY UP mode deactivated');
    }

    // Enhanced visual effects for hurry-up mode
    createScreenShake() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.animation = 'timerShake 0.3s ease-in-out';
            setTimeout(() => {
                if (gameContainer.style) {
                    gameContainer.style.animation = '';
                }
            }, 300);
        }
    }

    createUrgentFlash() {
        // Create a temporary flash overlay
        const flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(255,0,0,0.1), transparent);
            pointer-events: none;
            z-index: 9999;
            animation: urgentBlink 0.2s ease-in-out;
        `;

        document.body.appendChild(flashOverlay);

        setTimeout(() => {
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
            }
        }, 200);
    }

    createFinalCountdownEffect() {
        if (this.timeLeft <= 0) return;

        // Intense visual feedback for final 5 seconds
        const canvas = document.getElementById('game-canvas');
        const timer = document.getElementById('timer');

        if (canvas) {
            // Add extra intense border flash
            canvas.style.borderColor = this.timeLeft % 2 === 0 ? '#ff1744' : '#ff6b6b';
        }

        if (timer && this.timeLeft <= 3) {
            // Show countdown numbers with dramatic effect
            timer.style.fontSize = this.timeLeft <= 3 ? '2em' : '1.2em';
            timer.style.fontWeight = '900';

            // Add number-specific colors
            switch (this.timeLeft) {
                case 3:
                    timer.style.color = '#ffeb3b';
                    break;
                case 2:
                    timer.style.color = '#ff9800';
                    break;
                case 1:
                    timer.style.color = '#f44336';
                    break;
            }
        }

        // Create particle burst effect around timer
        if (this.timeLeft <= 3) {
            const timerContainer = document.querySelector('.timer-container');
            if (timerContainer) {
                const rect = timerContainer.getBoundingClientRect();
                this.createUrgentParticles(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );
            }
        }
    }

    createUrgentParticles(x, y) {
        // Create dramatic particle effects for final countdown
        const colors = ['#ff1744', '#ff6b6b', '#ffeb3b', '#ff9800'];

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 30 + Math.random() * 20;

            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: 6px;
                height: 6px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 10px currentColor;
                animation: urgentBlink 0.5s ease-out;
                transform: translate(
                    ${Math.cos(angle) * distance}px,
                    ${Math.sin(angle) * distance}px
                ) scale(0);
                transition: all 0.5s ease-out;
            `;

            document.body.appendChild(particle);

            // Animate particle
            setTimeout(() => {
                particle.style.transform = `translate(
                    ${Math.cos(angle) * distance * 2}px,
                    ${Math.sin(angle) * distance * 2}px
                ) scale(1)`;
                particle.style.opacity = '0';
            }, 10);

            // Remove particle
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 500);
        }
    }









}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.candyGame = new CandyMatch3Game();

    // Make candy size adjustment function available globally for testing
    window.adjustCandySize = (candyType, size) => {
        if (window.candyGame) {
            window.candyGame.adjustCandySize(candyType, size);
        }
    };

    console.log('🎮 Candy Match-3 Game initialized!');
    console.log('🔧 Use adjustCandySize(candyType, size) to adjust candy sizes');
    console.log('Example: adjustCandySize(0, 1.3) to make candy1 30% larger');
});


