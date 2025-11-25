import { SCALE_FACTOR } from '../utils/constants';

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
  damageDealtCount: number; // For hacking limit
  stunTimer: number; // For level up effect
  attackPattern?: string; // For boss attack types
}

export class EnemyManager {
  enemies: Enemy[] = [];
  difficultyMultiplier: number = 1.0;

  constructor() {}

  spawn(wave: number, canvasWidth: number, canvasHeight: number, isBoss: boolean = false): void {
    if (isBoss) {
      // Boss Types based on wave (every 5 waves)
      const bossIndex = (Math.floor(wave / 5) - 1) % 5;
      const bossTypes = [
        // Wave 5: Balanced
        { name: 'ALPHA', color: '#ff0000', hpMult: 1, speed: 1, size: 60, pattern: 'normal' },
        // Wave 10: Fast & Agile
        { name: 'BETA', color: '#ff00ff', hpMult: 0.8, speed: 3, size: 50, pattern: 'rapid' },
        // Wave 15: Tank & Shotgun
        { name: 'GAMMA', color: '#00ff00', hpMult: 1.5, speed: 0.5, size: 80, pattern: 'shotgun' },
        // Wave 20: Final Boss (Massive)
        { name: 'DELTA', color: '#ffff00', hpMult: 2.0, speed: 0.8, size: 100, pattern: 'final' },
        // Loop (Omega)
        { name: 'OMEGA', color: '#ffffff', hpMult: 2.5, speed: 1.2, size: 70, pattern: 'normal' }
      ];
      
      const bossConfig = bossTypes[bossIndex] || bossTypes[4];
      
      // Boss HP: Reduced by 50% globally
      let hp = (500 + wave * 50) * bossConfig.hpMult * 0.5;

      this.enemies.push({
        x: canvasWidth / 2,
        y: -100,
        type: 'boss',
        r: bossConfig.size * SCALE_FACTOR,
        color: bossConfig.color,
        speed: bossConfig.speed,
        hp: hp,
        xpVal: 1000 * (bossIndex + 1),
        shootTimer: 100,
        hacked: false,
        damageDealtCount: 0,
        stunTimer: 0,
        attackPattern: bossConfig.pattern
      } as Enemy); // Cast to Enemy to allow new property
      return;
    }

    const r = Math.random();
    let type: EnemyType = 'basic';
    
    if (wave >= 5 && r < 0.05) type = 'tank';
    else if (wave >= 4 && r < 0.1) type = 'exploder';
    else if (wave >= 2 && r < 0.2) type = 'shooter';

    // Spawn edge
    let x: number, y: number;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -50 : canvasWidth + 50;
      y = Math.random() * canvasHeight;
    } else {
      x = Math.random() * canvasWidth;
      y = Math.random() < 0.5 ? -50 : canvasHeight + 50;
    }

    const baseRadius = type === 'tank' ? 24 : 12;

    const enemy: Enemy = {
      x,
      y,
      type,
      r: baseRadius * SCALE_FACTOR,
      color: type === 'tank' ? '#444' : type === 'shooter' ? '#f44' : type === 'exploder' ? '#fa0' : '#0fa',
      speed: (type === 'tank' ? 1.5 : type === 'exploder' ? 5 : 3 + wave * 0.1) * this.difficultyMultiplier,
      hp: (type === 'tank' ? 20 + wave : type === 'basic' ? 2 + wave : 5 + wave) * this.difficultyMultiplier,
      xpVal: type === 'tank' ? 50 : type === 'basic' ? 10 : 20,
      shootTimer: Math.random() * 100,
      hacked: false,
      damageDealtCount: 0,
      stunTimer: 0
    };
    
    this.enemies.push(enemy);
  }

  update(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    playerRadius: number,
    onDamage: (amount: number) => void,
    onEnemyShoot: (x: number, y: number, angle: number, isBoss: boolean) => void,
    onExplode: (x: number, y: number) => void,
    hasPlasma: boolean
  ): { collisions: Enemy[] } {
    const collisions: Enemy[] = [];
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dist = Math.hypot(playerX - e.x, playerY - e.y);

      // Handle stun
      if (e.stunTimer > 0) {
        e.stunTimer--;
        
        // Draw stunned effect
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; // Flash white when stunned
        ctx.fill();
        ctx.closePath();
        
        // Skip movement and shooting if stunned
        continue;
      }

      // Hacked enemy logic
      if (e.hacked) {
        const target = this.enemies.find(other => other !== e && !other.hacked);
        if (target) {
          const angle = Math.atan2(target.y - e.y, target.x - e.x);
          e.x += Math.cos(angle) * e.speed;
          e.y += Math.sin(angle) * e.speed;
          
          if (Math.hypot(target.x - e.x, target.y - e.y) < target.r + e.r) {
            target.hp -= 1;
            onExplode(target.x, target.y);
            
            // Hacking limit: 5 hits then die
            e.damageDealtCount++;
            if (e.damageDealtCount >= 5) {
              e.hp = 0; // Destroy self
              onExplode(e.x, e.y);
            }
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
          onDamage(e.type === 'boss' ? 20 : 10);
          // Don't remove boss on collision - only regular enemies
          if (e.type !== 'boss') {
            collisions.push(e);
            this.enemies.splice(i, 1);
            continue;
          }
        }
      }
      
      // Plasma field damage
      if (hasPlasma && dist < 150) {
        e.hp -= 0.5;
      }

      // Draw enemy
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = e.hacked ? '#fff' : e.color;
      ctx.fill();
      ctx.closePath();
      
      // Draw HP bar for boss/tank
      if (e.type === 'boss' || e.type === 'tank') {
        const maxHp = e.type === 'boss' ? 500 : 20; // Approximate max HP for bar
        const hpPercent = Math.max(0, e.hp / maxHp);
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - 20, e.y - e.r - 10, 40, 5);
        ctx.fillStyle = '#f00';
        ctx.fillRect(e.x - 20, e.y - e.r - 10, 40 * hpPercent, 5);
      }

      // Remove if dead
      if (e.hp <= 0) {
        collisions.push(e);
        this.enemies.splice(i, 1);
      }
    }

    return { collisions };
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
