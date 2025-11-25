import { Upgrade } from '../game/PowerUps';

export class UIManager {
  private scoreBoard: HTMLElement;
  private levelBoard: HTMLElement;
  private waveBoard: HTMLElement;
  private healthBar: HTMLElement;
  private xpBar: HTMLElement;
  private uiLayer: HTMLElement;

  constructor() {
    this.scoreBoard = document.getElementById('scoreBoard')!;
    this.levelBoard = document.getElementById('levelBoard')!;
    this.waveBoard = document.getElementById('waveBoard')!;
    this.healthBar = document.getElementById('healthBar')!;
    this.xpBar = document.getElementById('xpBar')!;
    this.uiLayer = document.getElementById('uiLayer')!;
  }

  updateScore(score: number): void {
    this.scoreBoard.innerText = `SCORE: ${score}`;
  }

  updateLevel(level: number): void {
    this.levelBoard.innerText = `LV: ${level}`;
  }

  updateWave(wave: number, isBoss: boolean = false): void {
    if (isBoss) {
      this.waveBoard.innerText = `WAVE: ${wave} (BOSS!)`;
      this.waveBoard.classList.add('boss-warning');
    } else {
      this.waveBoard.innerText = `WAVE: ${wave}`;
      this.waveBoard.classList.remove('boss-warning');
    }
  }

  updateHealth(current: number, max: number): void {
    const percent = Math.max(0, (current / max) * 100);
    this.healthBar.style.width = `${percent}%`;
  }

  updateXP(current: number, required: number): void {
    const percent = Math.min(100, (current / required) * 100);
    this.xpBar.style.width = `${percent}%`;
  }

  showUI(): void {
    this.uiLayer.classList.remove('hidden');
  }

  hideUI(): void {
    this.uiLayer.classList.add('hidden');
  }

  showScreen(screenId: string): void {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.remove('hidden');
    }
  }

  hideScreen(screenId: string): void {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('hidden');
    }
  }

  showUpgradeScreen(upgrades: Upgrade[], isElite: boolean, onSelect: (upgrade: Upgrade) => void): void {
    const container = document.getElementById('cardContainer')!;
    const title = document.getElementById('upgradeTitle')!;
    
    container.innerHTML = '';
    title.innerText = isElite ? 'ELITE MODULE DETECTED' : 'SYSTEM UPGRADE';
    title.style.color = isElite ? '#ffd700' : '#fff';

    upgrades.forEach(upgrade => {
      const card = document.createElement('div');
      card.className = isElite ? 'card elite' : 'card';
      card.innerHTML = `
        <div class="icon">${upgrade.icon}</div>
        <h3>${upgrade.name}</h3>
        <p style="font-size:12px; margin:0; color:#aaa;">${upgrade.desc}</p>
      `;
      card.onclick = (e) => {
        e.stopPropagation();
        onSelect(upgrade);
      };
      container.appendChild(card);
    });

    this.showScreen('upgradeScreen');
  }

  hideUpgradeScreen(): void {
    this.hideScreen('upgradeScreen');
  }

  showGameOver(score: number, bestWave: number): void {
    document.getElementById('finalScoreDisplay')!.innerText = `SCORE: ${score}`;
    document.getElementById('bestWaveDisplay')!.innerText = `BEST WAVE: ${bestWave}`;
    this.showScreen('gameOverScreen');
  }

  drawJoystick(ctx: CanvasRenderingContext2D, start: {x: number, y: number}, current: {x: number, y: number}, color: string): void {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.arc(start.x, start.y, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
