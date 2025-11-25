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
      // Or better, let's just modify the context and let the next frame clear handle it?
      // Wait, if we translate, the next frame clear (fillRect) will be offset too if we don't reset.
      
      // Let's rely on the fact that we should reset the transform.
      setTimeout(() => {
        this.ctx.translate(-dx, -dy);
      }, 0);
    }
  }
}
