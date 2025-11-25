import './styles/main.css';
import { Player } from './game/Player';
import { EnemyManager } from './game/Enemy';
import { ProjectileManager } from './game/Projectile';
import { UpgradeManager } from './game/PowerUps';
import { AchievementManager } from './game/Achievements';
import { Leaderboard } from './game/Leaderboard';
import { InputManager } from './systems/InputManager';
import { AudioManager } from './systems/AudioManager';
import { ParticleSystem } from './systems/ParticleSystem';
import { UIManager } from './ui/UIManager';
import { ScreenShake } from './effects/ScreenShake';
import { BackgroundManager, Wreckage } from './effects/Background';
import { GAME_CONFIG } from './utils/constants';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Game state
  private gameActive: boolean = false;
  private isPaused: boolean = false;
  
  // Stats
  private score: number = 0;
  private wave: number = 1;
  private xp: number = 0;
  private level: number = 1;
  private nextLevelXp: number = GAME_CONFIG.INITIAL_XP_REQUIRED;
  private playerName: string = 'Pilot';
  private killsThisGame: number = 0;
  private bossKilledThisGame: boolean = false;
  
  // Managers
  private player: Player;
  private enemyManager: EnemyManager;
  private projectileManager: ProjectileManager;
  private upgradeManager: UpgradeManager;
  private achievementManager: AchievementManager;
  private leaderboard: Leaderboard;
  private inputManager: InputManager;
  private audioManager: AudioManager;
  private particleSystem: ParticleSystem;
  private uiManager: UIManager;
  private screenShake: ScreenShake;
  private backgroundManager: BackgroundManager;
  
  // Timers
  private spawnInterval: number | null = null;
  private waveInterval: number | null = null;
  
  // Visual
  private wreckage: Wreckage | null = null;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Initialize managers
    this.player = new Player(this.canvas.width, this.canvas.height);
    this.enemyManager = new EnemyManager();
    this.projectileManager = new ProjectileManager();
    this.upgradeManager = new UpgradeManager();
    this.achievementManager = new AchievementManager();
    this.leaderboard = new Leaderboard();
    this.inputManager = new InputManager(this.canvas);
    this.audioManager = new AudioManager();
    this.particleSystem = new ParticleSystem();
    this.uiManager = new UIManager();
    this.screenShake = new ScreenShake();
    this.backgroundManager = new BackgroundManager(this.canvas.width, this.canvas.height);
    
    this.setupEventHandlers();
    this.animate();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private setupEventHandlers(): void {
    // Start screen
    (window as any).checkNameAndShowSelection = () => {
      const input = document.getElementById('playerNameInput') as HTMLInputElement;
      if (!input.value.trim()) {
        alert('이름 입력 필수');
        return;
      }
      this.playerName = input.value.trim();
      this.uiManager.hideScreen('startScreen');
      this.uiManager.showScreen('onboardingScreen');
    };

    (window as any).showTutorial = () => {
      this.uiManager.hideScreen('onboardingScreen');
      this.uiManager.showScreen('tutorialScreen');
    };

    (window as any).playIntroSequence = () => {
      this.uiManager.hideScreen('onboardingScreen');
      this.uiManager.hideScreen('tutorialScreen');
      this.playIntro();
    };

    (window as any).triggerRespawn = () => {
      this.uiManager.hideScreen('gameOverScreen');
      this.playIntro();
    };

    (window as any).goToMainMenu = () => {
      this.uiManager.hideScreen('gameOverScreen');
      this.uiManager.showScreen('startScreen');
      this.wreckage = null;
      this.gameActive = false;
    };
  }

  private playIntro(): void {
    const intro = document.getElementById('introScreen')!;
    const txt = document.getElementById('storyText')!;
    const ship = document.getElementById('launchShip')!;
    
    intro.classList.remove('hidden');
    ship.style.bottom = '-100px';
    
    this.player.reset(this.canvas.width, this.canvas.height);
    ship.style.background = this.player.color;
    ship.style.boxShadow = `0 0 20px ${this.player.color}`;
    
    txt.innerHTML = `서기 2077년...<br><span style="color:${this.player.color}; font-size:24px;">${this.playerName}</span> 대원, 출격합니다.`;
    txt.style.opacity = '1';
    
    setTimeout(() => {
      txt.style.opacity = '0';
      ship.style.bottom = '120%';
    }, 2000);
    
    setTimeout(() => {
      intro.classList.add('hidden');
      this.startGame();
    }, 3500);
  }

  private startGame(): void {
    this.score = 0;
    this.wave = 1;
    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = GAME_CONFIG.INITIAL_XP_REQUIRED;
    this.killsThisGame = 0;
    this.bossKilledThisGame = false;
    
    this.player.reset(this.canvas.width, this.canvas.height);
    this.enemyManager.clear();
    this.projectileManager.clear();
    this.particleSystem.clear();
    this.wreckage = null;
    
    this.uiManager.showUI();
    this.updateUI();
    
    // Start with one upgrade
    this.showUpgrade(false);
    
    this.gameActive = true;
    this.startSpawning();
  }

  private startSpawning(): void {
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    if (this.waveInterval) clearInterval(this.waveInterval);
    
    this.spawnInterval = window.setInterval(() => {
      if (!this.gameActive || this.isPaused) return;
      
      // Boss wave
      if (this.wave % GAME_CONFIG.BOSS_WAVE_INTERVAL === 0 && !this.enemyManager.hasBoss()) {
        this.enemyManager.spawn(this.wave, this.canvas.width, this.canvas.height, true);
        this.uiManager.updateWave(this.wave, true);
        this.audioManager.playSound('boss');
        return;
      }
      
      // Regular spawning (reduced during boss)
      if (this.enemyManager.hasBoss() && Math.random() > 0.4) return;
      
      this.enemyManager.spawn(this.wave, this.canvas.width, this.canvas.height, false);
    }, GAME_CONFIG.ENEMY_SPAWN_INTERVAL);
    
    this.waveInterval = window.setInterval(() => {
      if (this.gameActive && !this.isPaused && !this.enemyManager.hasBoss()) {
        this.wave++;
        this.updateUI();
      }
    }, GAME_CONFIG.WAVE_DURATION);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    // Background
    this.ctx.fillStyle = `rgba(5, 5, 5, ${GAME_CONFIG.TRAIL_ALPHA})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.backgroundManager.update(this.ctx, this.canvas.width, this.canvas.height);
    this.backgroundManager.drawWreckage(this.ctx, this.wreckage);
    
    if (!this.gameActive || this.isPaused) {
      this.screenShake.apply(this.canvas);
      return;
    }
    
    this.gameLoop();
    this.screenShake.apply(this.canvas);
  };

  private gameLoop(): void {
    // Player movement
    const moveVec = this.inputManager.getMoveVector();
    this.player.move(moveVec.x, moveVec.y, this.canvas.width, this.canvas.height);
    this.player.angle = this.inputManager.getAimAngle(this.player.x, this.player.y);
    
    // Player shooting
    if (this.player.cooldown <= 0) {
      const spread = 0.2;
      const start = this.player.angle - ((this.player.projectileCount - 1) * spread) / 2;
      
      for (let i = 0; i < this.player.projectileCount; i++) {
        const angle = start + i * spread;
        this.projectileManager.addProjectile({
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * GAME_CONFIG.PROJECTILE_SPEED,
          vy: Math.sin(angle) * GAME_CONFIG.PROJECTILE_SPEED,
          size: GAME_CONFIG.PROJECTILE_SIZE * this.player.damageMult,
          type: 'bullet'
        });
      }
      
      this.player.cooldown = this.player.fireRate;
      this.audioManager.playSound('shoot');
    } else {
      this.player.cooldown--;
    }
    
    // Super powers
    this.updateSuperPowers();
    
    // Draw player
    this.player.draw(this.ctx, this.inputManager.isMoving());
    this.player.drawDrones(this.ctx);
    this.player.drawPlasmaField(this.ctx);
    
    // Update entities
    this.updateEntities();
    
    // Draw joysticks
    const touches = this.inputManager.getTouchState();
    if (touches.leftId !== null) {
      this.uiManager.drawJoystick(this.ctx, touches.leftStart, touches.leftCurrent, GAME_CONFIG.COLORS.CYAN);
    }
    
    // Particles
    this.particleSystem.update(this.ctx);
  }

  private updateSuperPowers(): void {
    const sp = this.player.superPowers;
    
    // Regen
    if (sp.regen) {
      sp.regenTimer++;
      if (sp.regenTimer > 180 && this.player.hp < this.player.maxHp) {
        this.player.heal(1);
        sp.regenTimer = 0;
        this.updateUI();
      }
    }
    
    // Hacking
    if (sp.hacking) {
      sp.hackingTimer++;
      if (sp.hackingTimer > 300) {
        const target = this.enemyManager.findHackableEnemy(this.player.x, this.player.y);
        if (target) {
          target.hacked = true;
          target.color = GAME_CONFIG.COLORS.WHITE;
          this.particleSystem.createBurst(target.x, target.y, GAME_CONFIG.COLORS.CYAN, 10);
          sp.hackingTimer = 0;
        }
      }
    }
    
    // Missiles
    if (sp.missiles) {
      sp.missileTimer++;
      if (sp.missileTimer > 180) {
        this.projectileManager.addProjectile({
          x: this.player.x,
          y: this.player.y,
          vx: 0,
          vy: 0,
          size: 6,
          type: 'missile'
        });
        sp.missileTimer = 0;
      }
    }
    
    // Drones
    this.player.drones.forEach(drone => {
      drone.cooldown--;
      if (drone.cooldown <= 0) {
        const target = this.enemyManager.findNearestEnemy(drone.x, drone.y, 300);
        if (target) {
          const angle = Math.atan2(target.y - drone.y, target.x - drone.x);
          this.projectileManager.addProjectile({
            x: drone.x,
            y: drone.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            size: 3,
            type: 'drone'
          });
          drone.cooldown = 40;
        }
      }
    });
  }

  private updateEntities(): void {
    // Update projectiles
    this.projectileManager.update(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      this.enemyManager.enemies,
      this.player.superPowers.timeShift
    );
    
    // Check projectile hits on player
    if (this.projectileManager.checkPlayerHit(this.player.x, this.player.y, this.player.radius)) {
      this.damagePlayer(10);
    }
    
    // Update enemies
    const { collisions } = this.enemyManager.update(
      this.ctx,
      this.player.x,
      this.player.y,
      this.player.radius,
      (dmg) => this.damagePlayer(dmg),
      (x, y, angle, isBoss) => this.enemyShoot(x, y, angle, isBoss),
      (x, y) => this.explode(x, y, 80, false),
      this.player.superPowers.plasma
    );
    
    // Handle enemy deaths
    collisions.forEach(enemy => {
      this.killsThisGame++;
      
      if (enemy.type === 'exploder' || this.player.superPowers.chain) {
        this.explode(enemy.x, enemy.y, enemy.type === 'exploder' ? 40 : 20, true);
      }
      
      if (enemy.type === 'boss') {
        this.bossKilledThisGame = true;
        this.particleSystem.createExplosion(enemy.x, enemy.y, 'gold', 50);
        this.uiManager.updateWave(this.wave, false);
        setTimeout(() => this.showUpgrade(true), 1000);
      } else {
        this.particleSystem.createBurst(enemy.x, enemy.y, enemy.color, 5);
      }
      
      this.score += enemy.xpVal;
      this.gainXp(enemy.xpVal);
    });
    
    // Check projectile collisions with enemies
    for (let i = this.projectileManager.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectileManager.projectiles[i];
      
      for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemyManager.enemies[j];
        
        if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < enemy.r + proj.size) {
          const damage = proj.type === 'missile' ? 20 : 1 * this.player.damageMult;
          enemy.hp -= damage;
          this.projectileManager.projectiles.splice(i, 1);
          this.particleSystem.createBurst(proj.x, proj.y, enemy.color, 3);
          break;
        }
      }
    }
  }

  private enemyShoot(x: number, y: number, angle: number, isBoss: boolean): void {
    if (isBoss) {
      this.audioManager.playSound('boss');
      for (let k = 0; k < 8; k++) {
        const ba = angle + (k * (Math.PI / 4));
        this.projectileManager.addEnemyProjectile({
          x,
          y,
          vx: Math.cos(ba) * 4,
          vy: Math.sin(ba) * 4
        });
      }
    } else {
      this.projectileManager.addEnemyProjectile({
        x,
        y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4
      });
    }
  }

  private explode(x: number, y: number, damage: number, harmlessToPlayer: boolean): void {
    this.particleSystem.createExplosion(x, y, 'orange', 20);
    this.audioManager.playSound('explosion');
    
    if (!harmlessToPlayer && Math.hypot(this.player.x - x, this.player.y - y) < 80) {
      this.damagePlayer(damage);
    }
    
    if (harmlessToPlayer || this.player.superPowers.chain) {
      this.enemyManager.enemies.forEach(e => {
        if (Math.hypot(e.x - x, e.y - y) < 80) {
          e.hp -= 20;
        }
      });
    }
  }

  private damagePlayer(amount: number): void {
    this.player.takeDamage(amount);
    this.updateUI();
    this.screenShake.trigger(10, 100);
    this.audioManager.playSound('hit');
    
    if (this.player.isDead()) {
      this.endGame();
    }
  }

  private gainXp(amount: number): void {
    this.xp += amount;
    
    if (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level++;
      this.nextLevelXp = Math.floor(this.nextLevelXp * GAME_CONFIG.XP_SCALING);
      this.audioManager.playSound('levelup');
      this.showUpgrade(false);
    }
    
    this.updateUI();
  }

  private showUpgrade(isElite: boolean): void {
    this.isPaused = true;
    const upgrades = this.upgradeManager.getRandomUpgrades(isElite, 3);
    
    this.uiManager.showUpgradeScreen(upgrades, isElite, (upgrade) => {
      upgrade.apply(this.player);
      this.audioManager.playSound('powerup');
      this.uiManager.hideUpgradeScreen();
      this.uiManager.showUI();
      this.isPaused = false;
      this.updateUI();
    });
  }

  private updateUI(): void {
    this.uiManager.updateScore(this.score);
    this.uiManager.updateLevel(this.level);
    this.uiManager.updateWave(this.wave, this.enemyManager.hasBoss());
    this.uiManager.updateHealth(this.player.hp, this.player.maxHp);
    this.uiManager.updateXP(this.xp, this.nextLevelXp);
  }

  private endGame(): void {
    this.gameActive = false;
    
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    if (this.waveInterval) clearInterval(this.waveInterval);
    
    this.wreckage = {
      x: this.player.x,
      y: this.player.y,
      angle: this.player.angle,
      alpha: 1
    };
    
    // Update achievements
    const newAchievements = this.achievementManager.updateStats(
      this.killsThisGame,
      this.wave,
      this.score,
      this.bossKilledThisGame
    );
    
    // Add to leaderboard
    this.leaderboard.addEntry(this.playerName, this.score, this.wave);
    
    const bestWave = this.achievementManager.getStats().highestWave;
    
    this.uiManager.hideUI();
    this.uiManager.showGameOver(this.score, bestWave);
    
    // Show achievement notifications
    if (newAchievements.length > 0) {
      setTimeout(() => {
        alert(`🏆 새로운 업적!\n${newAchievements.join('\n')}`);
      }, 500);
    }
  }
}

// Start the game
new Game();
