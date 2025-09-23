import Game from ".";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class Camera {
  // Oyun bağlamı ve sahne/kamera ile ilgili referanslar
  game: Game;
  sizes;
  scene;
  canvas;
  perspectiveCamera!: THREE.PerspectiveCamera;
  controls: any;


  constructor() {
    this.game = new Game();
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.canvas = this.game.canvas;
    this.createPerspectiveCamera();
    // this.setOrbitControls();
  }

  // Perspektif kamera oluşturur ve sahneye ekler
  public createPerspectiveCamera() {
    this.perspectiveCamera = new THREE.PerspectiveCamera(45, this.sizes.aspect, 0.1, 200);
    // this.game.camera = this.perspectiveCamera;
    this.scene.add(this.perspectiveCamera);
  }


  // İsteğe bağlı: OrbitControls ile kamera kontrolü
  setOrbitControls() {
    this.controls = new OrbitControls(this.perspectiveCamera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
  }
  // Pencere oranı değişince projeksiyon matrisini güncelle
  resize() {
    this.perspectiveCamera.aspect = this.sizes.aspect;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  // Her karede yapılacak kamera güncellemeleri (şimdilik boş)
  update() {
  }
}