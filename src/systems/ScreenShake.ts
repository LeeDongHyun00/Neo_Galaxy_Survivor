export class ScreenShake {
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  trigger(intensity: number, durationMs: number): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = durationMs / 16; // Convert ms to frames (approx)
  }

  update(): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }
  }
}
