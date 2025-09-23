
import { EventEmitter } from 'events';
export default class Time extends EventEmitter {
  // Basit oyun döngüsü zamanlayıcısı: delta, elapsed ve update event'i
  public start;
  public current;
  public elapsed;
  public delta;
  constructor() {
    super();
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;
    this.update();
  }

  public update() {
    const currentTime = Date.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;
    super.emit("update");
    window.requestAnimationFrame(() => {
      this.update();
    })
  }
}