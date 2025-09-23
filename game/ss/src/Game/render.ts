import Game from "./index";
import * as THREE from "three";

export default class Renderer {
  // Oyun bağlamı ve render için gerekli referanslar
  game;
  sizes;
  scene;
  canvas;
  camera;
  renderer!: THREE.WebGLRenderer;
  constructor() {
    this.game = new Game();
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.canvas = this.game.canvas;
    this.camera = this.game.camera.perspectiveCamera;
    this.setRenderer();
  }

  // WebGL renderer kurulumu ve temel görsel ayarlar
  setRenderer() {
    this.renderer = new THREE.WebGL1Renderer({
      canvas: this.canvas,
      // Performans için antialias kapalı (oynanışı etkilemez)
      antialias: false
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    // Gölgeleri kapat (performans için)
    this.renderer.shadowMap.enabled = false;
    this.renderer.setClearColor(new THREE.Color(0.529, 0.808, 0.922), 1);
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    // Pixel oranını kısıtla: yüksek DPI cihazlarda GPU yükünü düşürür
    this.renderer.setPixelRatio(Math.min(this.sizes.pixelRatio, 1.5));
  }

  // Pencere boyutu değişimlerinde renderer ayarlarını güncelle
  resize() {
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
  }

  // Her karede sahneyi kamerayla birlikte çiz
  update() {
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.renderer.dispose();
  }
}