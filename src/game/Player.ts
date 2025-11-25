import { GAME_CONFIG, SCALE_FACTOR } from '../utils/constants';
import { ShipConfig } from './ShipSystem';

export interface SuperPowers {
  hacking: boolean;
  hackingTimer: number;
  regen: boolean;
  regenTimer: number;
  missiles: boolean;
  missileTimer: number;
  chain: boolean;
  timeShift: boolean;
  plasma: boolean;
}

export interface Drone {
  x: number;
  y: number;
  angle: number;
  cooldown: number;
}

export class Player {
  x: number;
  y: number;
  radius: number = 15 * SCALE_FACTOR;
  angle: number = -Math.PI / 2;
  color: string;
  
  // Stats
  maxHp: number = 100;
  hp: number = 100;
  speed: number = 5;
  damageMult: number = 1;
  fireRate: number = 15;
  cooldown: number = 0;
  projectileSize: number = 4;
  projectileCount: number = 1;
  
  // Super powers
  superPowers = {
    drones: false,
    hacking: false,
    missiles: false,
    plasma: false,
    regen: false,
    chain: false,
    timeShift: false,
    
    // Timers
    regenTimer: 0,
    hackingTimer: 0,
    missileTimer: 0
  };
  
  drones: Drone[] = [];

  constructor(canvasWidth: number, canvasHeight: number, shipConfig?: ShipConfig) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.color = GAME_CONFIG.COLORS.CYAN;
    this.reset(canvasWidth, canvasHeight, shipConfig);
  }

  update(vector: {x: number, y: number}, canvasWidth: number, canvasHeight: number): void {
    this.move(vector.x, vector.y, canvasWidth, canvasHeight);
  }

  reset(canvasWidth: number, canvasHeight: number, shipConfig?: ShipConfig): void {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.angle = -Math.PI / 2;
    this.hp = this.maxHp;
    this.cooldown = 0;
    
    // Reset powers
    this.superPowers = {
      drones: false,
      hacking: false,
      missiles: false,
      plasma: false,
      regen: false,
      chain: false,
      timeShift: false,
      regenTimer: 0,
      hackingTimer: 0,
      missileTimer: 0
    };
    this.drones = [];

    // Apply ship config
    if (shipConfig) {
      this.maxHp = shipConfig.maxHp;
      this.hp = this.maxHp;
      this.speed = shipConfig.speed;
      this.damageMult = shipConfig.damageMult;
      this.fireRate = shipConfig.fireRate;
      this.projectileSize = shipConfig.projectileSize;
      this.projectileCount = shipConfig.projectileCount;
      this.color = shipConfig.color;
    }
  }

  move(dx: number, dy: number, canvasWidth: number, canvasHeight: number): void {
    this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x + dx * this.speed));
    this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y + dy * this.speed));
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  draw(ctx: CanvasRenderingContext2D, isMoving: boolean): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Engine flame when moving
    if (isMoving) {
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-20, 5);
      ctx.lineTo(-20, -5);
      ctx.closePath();
      ctx.fillStyle = GAME_CONFIG.COLORS.ORANGE;
      ctx.fill();
    }
    
    ctx.restore();
  }

  drawDrones(ctx: CanvasRenderingContext2D): void {
    const time = Date.now() / 1000;
    this.drones.forEach((drone, i) => {
      const angle = time * 2 + (i * (Math.PI * 2 / this.drones.length));
      drone.x = this.x + Math.cos(angle) * 60;
      drone.y = this.y + Math.sin(angle) * 60;
      
      ctx.fillStyle = GAME_CONFIG.COLORS.CYAN;
      ctx.beginPath();
      ctx.arc(drone.x, drone.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawPlasmaField(ctx: CanvasRenderingContext2D): void {
    if (!this.superPowers.plasma) return;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 + Math.random() * 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
