import { GAME_CONFIG, PLAYER_COLORS } from '../utils/constants';

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
  cooldown: number;
}

export class Player {
  x: number;
  y: number;
  radius: number = GAME_CONFIG.PLAYER_RADIUS;
  color: string;
  speed: number = GAME_CONFIG.PLAYER_SPEED;
  hp: number = GAME_CONFIG.PLAYER_MAX_HP;
  maxHp: number = GAME_CONFIG.PLAYER_MAX_HP;
  projectileCount: number = 1;
  fireRate: number = GAME_CONFIG.PLAYER_FIRE_RATE;
  damageMult: number = 1;
  cooldown: number = 0;
  angle: number = -Math.PI / 2;
  
  drones: Drone[] = [];
  superPowers: SuperPowers = {
    hacking: false,
    hackingTimer: 0,
    regen: false,
    regenTimer: 0,
    missiles: false,
    missileTimer: 0,
    chain: false,
    timeShift: false,
    plasma: false
  };

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.hp = GAME_CONFIG.PLAYER_MAX_HP;
    this.maxHp = GAME_CONFIG.PLAYER_MAX_HP;
    this.projectileCount = 1;
    this.fireRate = GAME_CONFIG.PLAYER_FIRE_RATE;
    this.damageMult = 1;
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.drones = [];
    this.superPowers = {
      hacking: false,
      hackingTimer: 0,
      regen: false,
      regenTimer: 0,
      missiles: false,
      missileTimer: 0,
      chain: false,
      timeShift: false,
      plasma: false
    };
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
