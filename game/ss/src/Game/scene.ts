import { Scene } from 'three';

export class GameScene {
  scene!: THREE.Scene;
  constructor() {
    // Oyun için ana Three.js sahnesi
    this.scene = new Scene();
  }

  // Sahne bazlı per-frame güncellemeler burada yapılabilir (şimdilik boş)
  update() { }
}