import * as THREE from 'three';
import Sizes from './size';
import Environment from './environment';
import Player from './player';
import Renderer from './render';
import Stats from 'stats.js';
import { EventEmitter } from 'events';
import { cache } from '@/Game/utils/model';
import { disposeNode } from './utils/dispose';
import { GameScene } from './scene';
import Camera from './camera';
import Time from './time';
// FPS ve performans istatistiklerini göstermek için Stats.js örneği
let stats = new Stats();
document.body.appendChild(stats.dom);

export default class Game extends EventEmitter {
    /**
     * Three.js tabanlı oyun çekirdeği.
     * - Sahne, kamera, renderer, ortam ve oyuncu kurulumunu yapar
     * - Zamanlayıcı ile her karede güncelleme döngüsünü tetikler
     * - Kaynak yükleme ilerlemesini event'lerle (progress) dışarıya iletir
     * - Tekil örnek (singleton) olarak tasarlanmıştır
     */
    static instance: Game;
    canvas: HTMLElement | undefined;
    sizes!: Sizes;
    time!: Time;
    renderer!: Renderer;
    scene!: THREE.Scene;
    camera!: Camera;
    environment: Environment | undefined;
    player: Player | undefined;
    clock: THREE.Clock = new THREE.Clock();
    windowResizeFn!: (e: Event) => void;
    constructor(canvas?: HTMLElement) {
        super();
        if (Game.instance) {
            return Game.instance;
        }
        Game.instance = this;
        this.canvas = canvas;
        // Boyut yönetimi (pencere boyutu ve oranlar)
        this.sizes = new Sizes();
        // Pencere yeniden boyutlandığında sahne/renkleyici/kamera ayarlarını güncelle
        this.sizes.on("resize", () => {
            this.resize();
        })
        this.time = new Time();
        // Her karede güncelleme döngüsünü çalıştır
        this.time.on("update", () => {
            this.update();
        })
        // Sahne (Scene)
        this.scene = new GameScene().scene;
        // Kamera (Camera)
        this.camera = new Camera();
        // Renderer (çizim yüzeyi ve WebGL bağlamı)
        this.renderer = new Renderer();
        // Çevre/ortam (ışıklar, yerleşim vb.)
        this.environment = new Environment();
        // Oyuncu kurulumu
        this.player = new Player();
        this.resize();
        // Kaynak yükleme izleyicilerini hazırla
        this.resource();
    }
    // Oyun döngüsü: her kare çağrılır
    update() {
        const delta = this.time.delta / 1000;
        stats.update();
        this.renderer.update();
        this.player?.update && this.player.update(delta);
    }
    // Three.js varsayılan yükleyici ile yükleme ilerlemesi event'leri
    resource() {
        THREE.DefaultLoadingManager.onLoad = () => {
            this.emit('progress', { type: 'successLoad' });
        };

        THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.emit('progress', { type: 'onProgress', url: url, itemsLoaded: itemsLoaded, itemsTotal: itemsTotal });
        };

        THREE.DefaultLoadingManager.onError = () => {
            this.emit('progress', { type: 'error' });
        };
    }
    // Kayıtlı window resize dinleyicisini kaldır
    removelistener() {
        window.removeEventListener('resize', this.windowResizeFn);
    }
    // Pencere boyutu değişiminde renderer ve kamerayı yeniden boyutlandır
    resize() {
        this.renderer.resize();
        this.camera.resize();
    }
    // Oyunu ve üç boyutlu nesneleri temizle (bellek sızıntılarını önleme)
    disposeGame() {
        cache?.clearCacheData();
        this.removelistener();
        disposeNode(this.scene);
        this.scene.clear();
        this.renderer.dispose();
        // this.renderer = null;
    }
}
