export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private startTime: number = 0;

  trigger(intensity: number, duration: number): void {
    this.intensity = intensity;
    this.duration = duration;
    this.startTime = Date.now();
  }

  apply(element: HTMLElement): void {
    if (this.duration <= 0) {
      element.style.transform = 'translate(0, 0)';
      return;
    }

    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.duration) {
      this.duration = 0;
      element.style.transform = 'translate(0, 0)';
      return;
    }

    const progress = 1 - elapsed / this.duration;
    const currentIntensity = this.intensity * progress;
    const x = (Math.random() - 0.5) * currentIntensity * 2;
    const y = (Math.random() - 0.5) * currentIntensity * 2;
    
    element.style.transform = `translate(${x}px, ${y}px)`;
  }

  isActive(): boolean {
    return this.duration > 0 && Date.now() - this.startTime < this.duration;
  }
}
