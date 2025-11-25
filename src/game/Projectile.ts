import { GAME_CONFIG } from '../utils/constants';

export type ProjectileType = 'bullet' | 'drone' | 'missile';

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: ProjectileType;
  target?: any; // For missiles
}

export interface EnemyProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class ProjectileManager {
  projectiles: Projectile[] = [];
  enemyProjectiles: EnemyProjectile[] = [];

  update(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, enemies: any[], timeShiftActive: boolean): void {
    // Player projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      
      if (p.type === 'missile') {
        // Missile homing logic
        if (!p.target || (p.target as any).hp <= 0) {
          p.target = enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < 400);
        }
        
        if (p.target) {
          const angle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
          p.vx += Math.cos(angle) * 0.5;
          p.vy += Math.sin(angle) * 0.5;
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else {
          p.vx *= 1.05;
          p.vy *= 1.05;
        }
      }
      
      p.x += p.vx;
      p.y += p.vy;
      
      // Draw
      ctx.fillStyle = p.type === 'missile' ? GAME_CONFIG.COLORS.YELLOW : GAME_CONFIG.COLORS.CYAN;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Remove if out of bounds
      if (p.x < 0 || p.x > canvasWidth || p.y < 0 || p.y > canvasHeight) {
        this.projectiles.splice(i, 1);
      }
    }
    
    // Enemy projectiles
    const speedMult = timeShiftActive ? 0.6 : 1.0;
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.x += ep.vx * speedMult;
      ep.y += ep.vy * speedMult;
      
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = GAME_CONFIG.COLORS.RED;
      ctx.fill();
      
      if (ep.x < 0 || ep.x > canvasWidth || ep.y < 0 || ep.y > canvasHeight) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  addProjectile(projectile: Projectile): void {
    this.projectiles.push(projectile);
  }

  addEnemyProjectile(projectile: EnemyProjectile): void {
    this.enemyProjectiles.push(projectile);
  }

  clear(): void {
    this.projectiles = [];
    this.enemyProjectiles = [];
  }

  checkPlayerHit(playerX: number, playerY: number, playerRadius: number): boolean {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      if (Math.hypot(playerX - ep.x, playerY - ep.y) < playerRadius + 6) {
        this.enemyProjectiles.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}
