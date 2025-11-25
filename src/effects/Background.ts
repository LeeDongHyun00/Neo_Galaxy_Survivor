export class Star {
  x: number;
  y: number;
  r: number;
  s: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.r = Math.random() * 1.5;
    this.s = Math.random() * 0.5 + 0.1;
  }

  update(canvasHeight: number, canvasWidth: number): void {
    this.y += this.s;
    if (this.y > canvasHeight) {
      this.y = 0;
      this.x = Math.random() * canvasWidth;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface Wreckage {
  x: number;
  y: number;
  angle: number;
  alpha: number;
}

export class BackgroundManager {
  private stars: Star[] = [];

  constructor(canvasWidth: number, canvasHeight: number, count: number = 80) {
    for (let i = 0; i < count; i++) {
      this.stars.push(new Star(canvasWidth, canvasHeight));
    }
  }

  update(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    this.stars.forEach(star => {
      star.update(canvasHeight, canvasWidth);
      star.draw(ctx);
    });
  }

  drawWreckage(ctx: CanvasRenderingContext2D, wreckage: Wreckage | null): void {
    if (!wreckage || wreckage.alpha <= 0) return;

    ctx.save();
    ctx.translate(wreckage.x, wreckage.y);
    ctx.rotate(wreckage.angle);
    ctx.globalAlpha = wreckage.alpha;
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-4, 2);
    ctx.lineTo(-15, -8);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;

    wreckage.alpha -= 0.005;
  }
}
