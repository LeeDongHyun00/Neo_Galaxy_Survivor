import { GAME_CONFIG } from '../utils/constants';

export type EnemyType = 'basic' | 'shooter' | 'exploder' | 'tank' | 'boss';

export interface Enemy {
  x: number;
  y: number;
  r: number;
  type: EnemyType;
  color: string;
  speed: number;
  hp: number;
  maxHp?: number;
  xpVal: number;
  shootTimer: number;
  hacked: boolean;
}

export class EnemyManager {
  enemies: Enemy[] = [];

  spawn(wave: number, canvasWidth: number, canvasHeight: number, isBoss: boolean = false): void {
    if (isBoss) {
      this.enemies.push({
        x: canvasWidth / 2,
        y: -100,
        r: 50,
        type: 'boss',
        color: GAME_CONFIG.COLORS.MAGENTA,
        hp: 150 + wave * 15,
        maxHp: 150 + wave * 15,
        speed: 0.8,
        xpVal: 1000,
        shootTimer: 80,
        hacked: false
      });
      return;
    }

    const r = Math.random();
    let type: EnemyType = 'basic';
    
    if (wave >= 5 && r < 0.05) type = 'tank';
    else if (wave >= 4 && r < 0.1) type = 'exploder';
    else if (wave >= 2 && r < 0.2) type = 'shooter';

    let x: number, y: number;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -50 : canvasWidth + 50;
      y = Math.random() * canvasHeight;
    } else {
      x = Math.random() * canvasWidth;
      y = Math.random() < 0.5 ? -50 : canvasHeight + 50;
    }

    const enemy: Enemy = {
      x,
      y,
      type,
      r: type === 'tank' ? 24 : 12,
      color: type === 'tank' ? '#444' : type === 'shooter' ? '#f44' : type === 'exploder' ? '#fa0' : '#0fa',
      speed: type === 'tank' ? 1.5 : type === 'exploder' ? 5 : 3 + wave * 0.1,
      hp: type === 'tank' ? 20 + wave : type === 'basic' ? 2 + wave : 5 + wave,
      xpVal: type === 'tank' ? 50 : type === 'basic' ? 10 : 20,
      shootTimer: Math.random() * 100,
      hacked: false
    };

    this.enemies.push(enemy);
  }

  update(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    playerRadius: number,
    onPlayerDamage: (amount: number) => void,
    onEnemyShoot: (x: number, y: number, angle: number, isBoss: boolean) => void,
    onExplode: (x: number, y: number) => void,
    plasmaActive: boolean
  ): { collisions: Enemy[], exploded: Enemy[] } {
    const collisions: Enemy[] = [];
    const exploded: Enemy[] = [];

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dist = Math.hypot(playerX - e.x, playerY - e.y);

      // Hacked enemy logic
      if (e.hacked) {
        const target = this.enemies.find(other => other !== e && !other.hacked);
        if (target) {
          const angle = Math.atan2(target.y - e.y, target.x - e.x);
          e.x += Math.cos(angle) * e.speed;
          e.y += Math.sin(angle) * e.speed;
          
          if (Math.hypot(target.x - e.x, target.y - e.y) < e.r + target.r) {
            target.hp -= 0.5;
          }
        }
      } else {
        // Normal movement
        const angle = Math.atan2(playerY - e.y, playerX - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;

        // Shooting
        if (e.type === 'shooter' || e.type === 'boss') {
          e.shootTimer--;
          if (e.shootTimer <= 0) {
            onEnemyShoot(e.x, e.y, angle, e.type === 'boss');
            e.shootTimer = e.type === 'boss' ? 80 : 120;
          }
        }

        // Collision with player
        if (dist < playerRadius + e.r) {
          if (e.type === 'exploder') {
            onExplode(e.x, e.y);
            exploded.push(e);
            this.enemies.splice(i, 1);
            continue;
          } else {
            onPlayerDamage(e.type === 'boss' ? 20 : 10);
            if (e.type !== 'boss' && e.type !== 'tank') {
              this.enemies.splice(i, 1);
              continue;
            }
          }
        }

        // Plasma damage
        if (plasmaActive && dist < 80) {
          e.hp -= 0.2;
        }
      }

      // Draw enemy
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = e.hacked ? GAME_CONFIG.COLORS.WHITE : e.color;
      ctx.fill();

      // Boss health bar
      if (e.type === 'boss') {
        ctx.fillStyle = 'red';
        ctx.fillRect(e.x - 40, e.y - 60, 80, 8);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(e.x - 40, e.y - 60, 80 * (e.hp / (e.maxHp || 1)), 8);
      }

      // Remove if dead
      if (e.hp <= 0) {
        collisions.push(e);
        this.enemies.splice(i, 1);
      }
    }

    return { collisions, exploded };
  }

  clear(): void {
    this.enemies = [];
  }

  hasBoss(): boolean {
    return this.enemies.some(e => e.type === 'boss');
  }

  findNearestEnemy(x: number, y: number, maxDistance: number): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = maxDistance;

    for (const e of this.enemies) {
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }

    return nearest;
  }

  findHackableEnemy(playerX: number, playerY: number): Enemy | null {
    return this.enemies.find(
      e => e.type !== 'boss' && !e.hacked && Math.hypot(playerX - e.x, playerY - e.y) < 400
    ) || null;
  }
}
