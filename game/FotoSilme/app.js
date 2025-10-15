(function () {
    const qs = (s, root = document) => root.querySelector(s);
    const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));
    const hide = (el, h = true) => el.classList.toggle('hide', h);

    const state = {
        photos: [],
        currentIndex: 0,
        drag: { x: 0, y: 0, isDragging: false, startX: 0, startY: 0 },
        toDelete: [],
        kept: [],
        isDownloading: false,
        deferredPrompt: null,
        showInstall: false,
    };

    // Elements
    const el = {
        counter: qs('#counter'),
        cntDel: qs('#cnt-del'),
        cntKeep: qs('#cnt-keep'),
        progress: qs('#progress'),
        wrapper: qs('#state-wrapper'),
        perm: qs('#state-permission'),
        empty: qs('#state-empty'),
        swipeArea: qs('#swipe-area'),
        card: qs('#card'),
        img: qs('#media-image'),
        vid: qs('#media-video'),
        filename: qs('#filename'),
        stampDel: qs('#stamp-del'),
        stampKeep: qs('#stamp-keep'),
        btnPick: qs('#btn-pick'),
        btnPickAgain: qs('#btn-pick-again'),
        btnDel: qs('#btn-del'),
        btnKeep: qs('#btn-keep'),
        installBanner: qs('#install-banner'),
        btnInstall: qs('#btn-install'),
        // results
        results: qs('#results'),
        delCount: qs('#del-count'),
        btnShare: qs('#btn-share'),
        btnRestart: qs('#btn-restart'),
        preview: qs('#preview'),
        previewGrid: qs('#preview-grid'),
        nameList: qs('#name-list'),
        namesUl: qs('#names-ul'),
    };

    function updateTopBar() {
        el.counter.textContent = `${Math.min(state.currentIndex + 1, state.photos.length)} / ${state.photos.length}`;
        el.cntDel.textContent = state.toDelete.length;
        el.cntKeep.textContent = state.kept.length;
        const pct = state.photos.length ? ((state.currentIndex + 1) / state.photos.length) * 100 : 0;
        el.progress.style.width = `${pct}%`;
    }

    function showPermission() { hide(el.perm, false); hide(el.empty, true); hide(el.swipeArea, true); }
    function showEmpty() { hide(el.perm, true); hide(el.empty, false); hide(el.swipeArea, true); }
    function showSwipe() { hide(el.perm, true); hide(el.empty, true); hide(el.swipeArea, false); }

    function renderCurrent() {
        if (state.photos.length === 0) { showEmpty(); updateTopBar(); return; }
        if (state.currentIndex >= state.photos.length) { showResults(); return; }
        const current = state.photos[state.currentIndex];
        el.filename.textContent = current.name || '';
        if (current.type && current.type.indexOf('image/') === 0) {
            hide(el.vid, true); hide(el.img, false);
            el.img.src = current.url;
            el.img.alt = current.name || '';
        } else {
            hide(el.img, true); hide(el.vid, false);
            el.vid.src = current.url;
        }
        applyCardTransform(0, 0, false);
        showSwipe();
        updateTopBar();
    }

    function applyCardTransform(x, y, dragging) {
        const rotation = x * 0.1;
        const opacity = Math.max(0, 1 - Math.abs(x) / 300);
        el.card.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        el.card.style.opacity = String(opacity);
        el.card.style.transition = dragging ? 'none' : 'all 0.3s ease-out';
        el.stampDel.style.opacity = (x < -50) ? '1' : '0';
        el.stampKeep.style.opacity = (x > 50) ? '1' : '0';
    }

    function nextPhoto() {
        if (state.currentIndex < state.photos.length - 1) {
            state.currentIndex += 1;
            renderCurrent();
        } else {
            showResults();
        }
    }

    function markDelete() {
        const current = state.photos[state.currentIndex];
        state.toDelete.push(current);
        nextPhoto();
        updateTopBar();
    }
    function markKeep() {
        const current = state.photos[state.currentIndex];
        state.kept.push(current);
        nextPhoto();
        updateTopBar();
    }

    function showResults() {
        hide(qs('main'), true);
        hide(el.results, false);
        el.delCount.textContent = String(state.toDelete.length);

        // preview
        if (state.toDelete.length) {
            hide(el.preview, false);
            el.previewGrid.innerHTML = '';
            state.toDelete.forEach((p, idx) => {
                const cell = document.createElement('div');
                cell.className = 'relative aspect-square bg-gray-100 rounded-lg overflow-hidden';
                if (p.type && p.type.indexOf('image/') === 0) {
                    const im = document.createElement('img');
                    im.src = p.url; im.className = 'w-full h-full object-cover';
                    im.alt = `Silinecek ${idx + 1}`;
                    cell.appendChild(im);
                } else {
                    const vd = document.createElement('video');
                    vd.src = p.url; vd.className = 'w-full h-full object-cover';
                    cell.appendChild(vd);
                }
                const badge = document.createElement('div');
                badge.className = 'absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded';
                badge.textContent = String(idx + 1);
                badge.title = p.name || '';
                const name = document.createElement('div');
                name.className = 'absolute bottom-1 left-1 right-1 pointer-events-none';
                name.innerHTML = `<div class="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded truncate">${p.name || ''}</div>`;
                cell.appendChild(badge);
                cell.appendChild(name);
                el.previewGrid.appendChild(cell);
            });
        } else {
            hide(el.preview, true);
        }

        // names list
        if (state.toDelete.length) {
            hide(el.nameList, false);
            el.namesUl.innerHTML = '';
            state.toDelete.forEach((p, i) => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 flex items-center gap-3';
                li.innerHTML = `<span class="text-xs text-gray-500 w-8">${i + 1}.</span><span class="text-sm text-gray-800 truncate" title="${p.name || ''}">${p.name || ''}</span>`;
                el.namesUl.appendChild(li);
            });
        } else {
            hide(el.nameList, true);
        }
    }

    // File pick
    function pickFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,video/*';
        input.style.display = 'none';

        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) {
                showEmpty();
                return;
            }

            const processedFiles = files.map(file => ({
                file,
                url: URL.createObjectURL(file),
                type: file.type,
                name: file.name,
                originalFile: file,
            }));

            const shuffled = processedFiles.sort(() => Math.random() - 0.5);
            state.photos = shuffled;
            state.currentIndex = 0;
            state.toDelete = [];
            state.kept = [];

            if (state.photos.length === 0) {
                showEmpty();
            } else {
                renderCurrent();
            }
        };

        input.onerror = () => {
            console.error('File input error');
            showEmpty();
        };

        // Add to DOM temporarily for better mobile support
        document.body.appendChild(input);
        input.click();

        // Clean up after a delay
        setTimeout(() => {
            if (document.body.contains(input)) {
                document.body.removeChild(input);
            }
        }, 1000);
    }

    // Share or download list
    async function shareOrDownload() {
        if (state.toDelete.length === 0) return;
        // Try Web Share API with files (limited platforms)
        if (navigator.share) {
            try {
                const files = await Promise.all(state.toDelete.slice(0, 10).map(async (p) => {
                    const res = await fetch(p.url);
                    const blob = await res.blob();
                    return new File([blob], `silinecek_${p.name}`, { type: p.type || blob.type || 'application/octet-stream' });
                }));
                await navigator.share({ files, title: 'Silinecek Fotoğraflar', text: `${state.toDelete.length} fotoğraf silinecek` });
                return;
            } catch (e) {
                // fallback
            }
        }
        // Fallback: download one by one
        state.isDownloading = true;
        for (let i = 0; i < state.toDelete.length; i++) {
            const p = state.toDelete[i];
            const a = document.createElement('a');
            a.href = p.url;
            a.download = `silinecek_${i + 1}_${p.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            await new Promise(r => setTimeout(r, 100));
        }
        state.isDownloading = false;
        alert('Tüm fotoğraflar indirildi! Şimdi iOS Fotoğraflar uygulamasından bu indirilen fotoğrafları seçip silebilirsiniz.');
    }

    // Drag handlers
    function onStart(e) {
        state.drag.isDragging = true;
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        state.drag.startX = clientX; state.drag.startY = clientY;
    }
    function onMove(e) {
        if (!state.drag.isDragging) return;
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const dx = clientX - state.drag.startX;
        const dy = clientY - state.drag.startY;
        state.drag.x = dx; state.drag.y = dy;
        applyCardTransform(dx, dy, true);
    }
    function onEnd() {
        if (!state.drag.isDragging) return;
        state.drag.isDragging = false;
        const threshold = 100;
        if (Math.abs(state.drag.x) > threshold) {
            if (state.drag.x < 0) markDelete(); else markKeep();
        }
        state.drag.x = 0; state.drag.y = 0;
        applyCardTransform(0, 0, false);
    }

    // Buttons
    el.btnPick.addEventListener('click', pickFiles);
    el.btnPickAgain.addEventListener('click', pickFiles);
    el.btnDel.addEventListener('click', markDelete);
    el.btnKeep.addEventListener('click', markKeep);
    el.btnShare.addEventListener('click', shareOrDownload);
    // Copy newline-separated list of names
    function copyNames() {
        if (!state.toDelete.length) return;
        const text = state.toDelete.map(p => p.name || '').join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Liste kopyalandı. iOS kısayolunda yapıştırabilirsiniz.');
            }).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }
    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select(); ta.setSelectionRange(0, text.length);
        try { document.execCommand('copy'); alert('Liste kopyalandı.'); }
        catch (_) { alert('Kopyalama başarısız. Metni elle seçip kopyalayın.'); }
        document.body.removeChild(ta);
    }
    const btnCopy = document.getElementById('btn-copy');
    if (btnCopy) btnCopy.addEventListener('click', copyNames);
    el.btnRestart.addEventListener('click', () => {
        hide(el.results, true); hide(qs('main'), false);
        state.currentIndex = 0; state.toDelete = []; state.kept = [];
        if (state.photos.length) renderCurrent(); else showEmpty();
    });

    // Card events
    el.card.addEventListener('mousedown', onStart);
    el.card.addEventListener('mousemove', onMove);
    el.card.addEventListener('mouseup', onEnd);
    el.card.addEventListener('mouseleave', onEnd);
    el.card.addEventListener('touchstart', onStart, { passive: true });
    el.card.addEventListener('touchmove', onMove, { passive: true });
    el.card.addEventListener('touchend', onEnd);

    // PWA install banner
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        state.showInstall = true;
        hide(el.installBanner, false);
    });

    window.addEventListener('appinstalled', () => {
        state.deferredPrompt = null;
        state.showInstall = false;
        hide(el.installBanner, true);
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        hide(el.installBanner, true);
    }

    el.btnInstall.addEventListener('click', async () => {
        if (!state.deferredPrompt) {
            // Fallback for iOS Safari
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                alert('iOS\'ta ana ekrana eklemek için Safari menüsünden "Ana Ekrana Ekle" seçeneğini kullanın.');
            }
            return;
        }

        try {
            state.deferredPrompt.prompt();
            const choiceResult = await state.deferredPrompt.userChoice;
            console.log('User choice:', choiceResult.outcome);
        } catch (error) {
            console.error('Install prompt error:', error);
        }

        state.deferredPrompt = null;
        state.showInstall = false;
        hide(el.installBanner, true);
    });

    // Mobile-specific improvements
    function preventZoom() {
        document.addEventListener('touchstart', function (event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (state.photos.length > 0 && state.currentIndex < state.photos.length) {
                renderCurrent();
            }
        }, 100);
    });

    // Prevent pull-to-refresh
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Init
    preventZoom();
    showPermission();
    updateTopBar();
})();
