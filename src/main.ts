import './styles/main.css';
import { Player } from './game/Player';
import { EnemyManager } from './game/Enemy';
import { ProjectileManager } from './game/Projectile';
import { ParticleSystem } from './systems/ParticleSystem';
import { InputManager } from './systems/InputManager';
import { UIManager } from './ui/UIManager';
import { AudioManager } from './systems/AudioManager';
import { UpgradeManager } from './game/PowerUps';
import { ShipManager } from './game/ShipSystem';
import { ScreenShake } from './systems/ScreenShake.ts';
import { BackgroundManager } from './effects/Background';
import { GAME_CONFIG } from './utils/constants';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private enemyManager: EnemyManager;
  private projectileManager: ProjectileManager;
  private particleSystem: ParticleSystem;
  private inputManager: InputManager;
  private uiManager: UIManager;
  private audioManager: AudioManager;
  private upgradeManager: UpgradeManager;
  private shipManager: ShipManager;
  private screenShake: ScreenShake;
  private backgroundManager: BackgroundManager;

  private score: number = 0;
  private wave: number = 1;
  private gameActive: boolean = false;
  private isPaused: boolean = false;
  
  private spawnInterval: number | null = null;
  private waveInterval: number | null = null;
  
  // Leveling
  private xp: number = 0;
  private level: number = 1;
  private nextLevelXp: number = 100;
  
  private wreckage: { x: number, y: number } | null = null;
  private playerName: string = 'Pilot';
  
  private bossSpawnedThisWave: boolean = false;
  private killsThisGame: number = 0;
  private bossKilledThisGame: boolean = false;
  private pendingBossUpgrade: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.shipManager = new ShipManager();
    this.player = new Player(this.canvas.width, this.canvas.height, this.shipManager.getSelectedShip());
    this.enemyManager = new EnemyManager();
    this.projectileManager = new ProjectileManager();
    this.particleSystem = new ParticleSystem();
    this.inputManager = new InputManager(this.canvas);
    this.uiManager = new UIManager();
    this.audioManager = new AudioManager();
    this.upgradeManager = new UpgradeManager();
    this.screenShake = new ScreenShake(this.ctx);
    this.backgroundManager = new BackgroundManager(this.canvas.width, this.canvas.height, 100);

    this.setupEventHandlers();
    this.updateShipSelectionUI();
    
    // Start loop
    this.animate();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private setupEventHandlers(): void {
    // Start screen
    (window as any).checkNameAndShowSelection = () => {
      const name = (document.getElementById('playerNameInput') as HTMLInputElement).value.trim();
      this.playerName = name || 'Pilot';
      this.uiManager.hideScreen('startScreen');
      
      // Check if user has already selected difficulty before
      const savedDifficulty = localStorage.getItem('neon_galaxy_difficulty');
      if (savedDifficulty) {
        // Skip selection, use saved difficulty
        this.playIntroSequence();
      } else {
        // Show difficulty selection for first time
        this.uiManager.showScreen('onboardingScreen');
      }
    };

    (window as any).showTutorial = () => {
      // Save difficulty choice (beginner)
      localStorage.setItem('neon_galaxy_difficulty', 'beginner');
      this.uiManager.hideScreen('onboardingScreen');
      this.uiManager.showScreen('tutorialScreen');
    };

    (window as any).playIntroSequence = () => {
      // Save difficulty choice (veteran) if not already saved
      if (!localStorage.getItem('neon_galaxy_difficulty')) {
        localStorage.setItem('neon_galaxy_difficulty', 'veteran');
      }
      this.uiManager.hideScreen('onboardingScreen');
      this.uiManager.hideScreen('tutorialScreen');
      
      // Play Intro Story
      this.playIntroStory();
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
      this.updateShipSelectionUI(); // Update UI when returning to main menu
    };
    
    // Ship Selection
    (window as any).openShipSelection = () => {
      this.updateShipSelectionUI();
      this.uiManager.hideScreen('startScreen');
      this.uiManager.showScreen('shipSelectionScreen');
    };
    
    (window as any).closeShipSelection = () => {
      this.uiManager.hideScreen('shipSelectionScreen');
      this.uiManager.showScreen('startScreen');
    };
    
    (window as any).selectShip = (shipId: string) => {
      this.shipManager.selectShip(shipId as any);
      this.updateShipSelectionUI();
      // Visual feedback
      this.audioManager.playSound('shoot');
    };
    
    // Story
    (window as any).nextStory = () => {
      // This is handled by the callback passed to showStory
    };
  }

  // Helper to call window methods from within class if needed (though usually called from HTML)
  private goToMainMenu(): void {
    (window as any).goToMainMenu();
  }

  private playIntroSequence(): void {
    (window as any).playIntroSequence();
  }

  private playIntro(): void {
    const intro = document.getElementById('introScreen')!;
    const txt = document.getElementById('storyText')!;
    const ship = document.getElementById('launchShip')!;
    
    intro.classList.remove('hidden');
    ship.style.bottom = '-100px';
    
    this.player.reset(this.canvas.width, this.canvas.height, this.shipManager.getSelectedShip());
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
  
  private triggerLevelUpEffect(): void {
    // Visual effect
    this.particleSystem.createExplosion(this.player.x, this.player.y, GAME_CONFIG.COLORS.CYAN, 30);
    this.screenShake.trigger(5, 200);
    
    // Gameplay effect: Stun enemies near player (no damage)
    this.enemyManager.enemies.forEach(e => {
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist < 400) {
        // e.hp -= 10; // Removed damage
        e.stunTimer = 60; // 1 second (60 frames)
        this.particleSystem.createBurst(e.x, e.y, '#fff', 5);
      }
    });
  }
  
  private updateShipSelectionUI(): void {
    const container = document.getElementById('shipList');
    if (!container) return;
    
    container.innerHTML = '';
    const ships = this.shipManager.getAllShips();
    const currentShip = this.shipManager.getSelectedShip();
    
    ships.forEach(ship => {
      const isUnlocked = this.shipManager.isUnlocked(ship.id);
      const isSelected = currentShip.id === ship.id;
      
      const card = document.createElement('div');
      card.className = `ship-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`;
      
      card.innerHTML = `
        <div class="ship-icon" style="background: ${ship.color}; box-shadow: 0 0 15px ${ship.color}"></div>
        <div class="ship-info">
          <h3>${ship.name}</h3>
          <p>${ship.description}</p>
          ${!isUnlocked ? `<div class="lock-condition">🔒 ${ship.unlockCondition}</div>` : ''}
        </div>
      `;
      
      if (isUnlocked) {
        card.onclick = () => (window as any).selectShip(ship.id);
      }
      
      container.appendChild(card);
    });
  }

  private startGame(): void {
    this.score = 0;
    this.wave = 1;
    this.xp = 0;
    this.level = 1;
    this.nextLevelXp = 100;
    this.killsThisGame = 0;
    this.bossKilledThisGame = false;
    this.bossSpawnedThisWave = false;
    
    // Reset difficulty multiplier
    this.enemyManager.difficultyMultiplier = 1.0;
    
    this.player.reset(this.canvas.width, this.canvas.height, this.shipManager.getSelectedShip());
    this.enemyManager.clear();
    this.projectileManager.clear();
    this.particleSystem.clear();
    this.wreckage = null;
    
    // Reset input states to fix mobile restart bug
    this.inputManager.reset();
    
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
      
      // Boss Wave Logic: Every 5 waves
      const isBossWave = this.wave % 5 === 0;
      
      if (isBossWave) {
        // Only spawn 1 boss if not already spawned
        if (this.enemyManager.enemies.length === 0 && !this.bossSpawnedThisWave) {
          this.enemyManager.spawn(this.wave, this.canvas.width, this.canvas.height, true);
          this.bossSpawnedThisWave = true;
          this.uiManager.showBossWarning(); // Assuming we might want a warning
        }
      } else {
        // Normal wave spawning - increased spawn rate
        if (Math.random() < 0.05 * this.wave + 0.02) {
          this.enemyManager.spawn(this.wave, this.canvas.width, this.canvas.height, false);
        }
      }
    }, GAME_CONFIG.ENEMY_SPAWN_INTERVAL);
    
    this.waveInterval = window.setInterval(() => {
      if (this.gameActive && !this.isPaused && !this.enemyManager.hasBoss()) {
        this.wave++;
        this.updateUI();
        
        // Batch spawn enemies at wave start (5-10 enemies)
        const batchCount = Math.min(10, 5 + Math.floor(this.wave / 2));
        for (let i = 0; i < batchCount; i++) {
          setTimeout(() => {
            if (this.gameActive && !this.isPaused) {
              this.enemyManager.spawn(this.wave, this.canvas.width, this.canvas.height, false);
            }
          }, i * 200); // Stagger spawns
        }
      }
    }, GAME_CONFIG.WAVE_DURATION);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    // Background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw stars
    this.backgroundManager.update(this.ctx, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    
    // Screen shake
    this.screenShake.update();
    
    if (this.wreckage) {
      // Draw wreckage
      this.ctx.save();
      this.ctx.translate(this.wreckage.x, this.wreckage.y);
      this.ctx.fillStyle = '#555';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      this.particleSystem.update(this.ctx);
      this.ctx.restore(); // Restore main context
      return;
    }

    if (!this.gameActive || this.isPaused) {
      this.ctx.restore(); // Restore main context
      return;
    }

    // Player logic
    this.player.update(this.inputManager.getMoveVector(), this.canvas.width, this.canvas.height);
    
    // Update player angle to aim at mouse/touch
    this.player.angle = this.inputManager.getAimAngle(this.player.x, this.player.y);
    
    // Shooting
    if (this.inputManager.isShooting()) {
      if (this.player.cooldown <= 0) {
        const start = this.player.angle - (this.player.projectileCount - 1) * 0.1;
        const spread = 0.2;
        
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
    
    // Draw joysticks for visual feedback
    const touches = this.inputManager.getTouchState();
    if (touches.leftId !== null) {
      this.uiManager.drawJoystick(this.ctx, touches.leftStart, touches.leftCurrent, GAME_CONFIG.COLORS.CYAN);
    }
    if (touches.rightId !== null) {
      this.uiManager.drawJoystick(this.ctx, touches.rightStart, touches.rightCurrent, GAME_CONFIG.COLORS.MAGENTA);
    }
    
    // Particles
    this.particleSystem.update(this.ctx);
    
    this.ctx.restore(); // Restore main context
  }

  private updateSuperPowers(): void {
    const sp = this.player.superPowers;
    
    // Regen
    if (sp.regen) {
      sp.regenTimer++;
      if (sp.regenTimer > 180 && this.player.hp < this.player.maxHp) {
        this.player.heal(1);
        sp.regenTimer = 0;
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
      
      if (enemy.type === 'exploder') {
        this.explode(enemy.x, enemy.y, 40, true);
      } else if (this.player.superPowers.chain) {
        // Chain reaction: Deal damage to nearby enemies instead of instant kill
        this.enemyManager.enemies.forEach(e => {
          if (e !== enemy && Math.hypot(e.x - enemy.x, e.y - enemy.y) < 150) {
            e.hp -= 10 * this.player.damageMult; // Chain damage
            this.particleSystem.createBurst(e.x, e.y, GAME_CONFIG.COLORS.CYAN, 3);
          }
        });
      }
      
      // Boss kill logic
      if (enemy.type === 'boss') {
        this.bossKilledThisGame = true;
        this.audioManager.playSound('explosion'); // Big sound
        this.particleSystem.createExplosion(enemy.x, enemy.y, 'gold', 50);
        
        // Boss Stage Clear: Next Wave immediately
        setTimeout(() => {
          // Check for Ending (Wave 20 Clear)
          if (this.wave >= 20) {
            this.playEndingStory();
            return;
          }
          
          this.wave++;
          this.bossSpawnedThisWave = false; // Reset for next boss
          this.enemyManager.difficultyMultiplier += 0.2; // Enemies get stronger
          this.uiManager.updateWave(this.wave);
          this.uiManager.showMessage(`WAVE ${this.wave} START!`);
          
          // If player is already in upgrade screen (level up), queue boss upgrade
          if (this.isPaused) {
            this.pendingBossUpgrade = true;
          } else {
            this.showUpgrade(true); // Offer upgrade after boss
          }
        }, 2000);
      } else {
        this.particleSystem.createBurst(enemy.x, enemy.y, enemy.color, 5);
      }
      
      this.score += enemy.xpVal;
      this.gainXp(enemy.xpVal);
      this.killsThisGame++; // Track kills properly
      
      // Update UI to show new score
      this.updateUI();
      
      // Balance: Heal 1 HP on kill
      if (this.player.hp < this.player.maxHp) {
        this.player.heal(1);
      }
    });
    
    // Check projectile collisions with enemies
    for (let i = this.projectileManager.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectileManager.projectiles[i];
      
      for (let j = this.enemyManager.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemyManager.enemies[j];
        
        if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < enemy.r + proj.size) {
          // Damage scaling based on projectile size
          // Base damage: 1 * damageMult
          // Size scaling: (size / 4) * damageMult
          const sizeMult = proj.size / 4;
          const damage = proj.type === 'missile' ? 20 : (1 * this.player.damageMult * sizeMult);
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
      
      // Boss Attack Patterns
      const boss = this.enemyManager.enemies.find(e => e.type === 'boss');
      const pattern = boss?.attackPattern || 'normal';
      
      if (pattern === 'rapid') {
        // Fast single shots
        this.projectileManager.addEnemyProjectile({
          x, y,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8
        });
      } else if (pattern === 'shotgun') {
        // 3-way spread
        for (let k = -1; k <= 1; k++) {
          const ba = angle + (k * 0.2);
          this.projectileManager.addEnemyProjectile({
            x, y,
            vx: Math.cos(ba) * 5,
            vy: Math.sin(ba) * 5
          });
        }
      } else if (pattern === 'final') {
        // Spiral hell
        for (let k = 0; k < 12; k++) {
          const ba = angle + (k * (Math.PI / 6));
          this.projectileManager.addEnemyProjectile({
            x, y,
            vx: Math.cos(ba) * 6,
            vy: Math.sin(ba) * 6
          });
        }
      } else {
        // Normal 8-way (Alpha/Omega)
        for (let k = 0; k < 8; k++) {
          const ba = angle + (k * (Math.PI / 4));
          this.projectileManager.addEnemyProjectile({
            x, y,
            vx: Math.cos(ba) * 4,
            vy: Math.sin(ba) * 4
          });
        }
      }
    } else {
      this.projectileManager.addEnemyProjectile({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3
      });
    }
  }

  private damagePlayer(amount: number): void {
    if (this.player.hp <= 0) return;
    
    this.player.hp -= amount;
    this.uiManager.updateHealth(this.player.hp, this.player.maxHp);
    this.screenShake.trigger(10, 300);
    this.particleSystem.createBurst(this.player.x, this.player.y, '#f00', 10);
    
    if (this.player.hp <= 0) {
      this.endGame();
    }
  }

  private explode(x: number, y: number, radius: number, harmlessToPlayer: boolean): void {
    this.particleSystem.createExplosion(x, y, GAME_CONFIG.COLORS.ORANGE, 20);
    this.screenShake.trigger(5, 200);
    this.audioManager.playSound('explosion');
    
    if (!harmlessToPlayer) {
      const dist = Math.hypot(this.player.x - x, this.player.y - y);
      if (dist < radius + this.player.radius) {
        this.damagePlayer(20);
      }
    }
    
    // Damage enemies
    this.enemyManager.enemies.forEach(e => {
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < radius + e.r) {
        e.hp -= 50;
      }
    });
  }

  private gainXp(amount: number): void {
    this.xp += amount;
    if (this.xp >= this.nextLevelXp) {
      this.levelUp();
    }
    this.uiManager.updateXP(this.xp, this.nextLevelXp);
  }

  private levelUp(): void {
    this.level++;
    this.xp = 0;
    this.nextLevelXp = Math.floor(this.nextLevelXp * 1.2);
    
    this.audioManager.playSound('levelup');
    this.triggerLevelUpEffect();
    this.uiManager.updateLevel(this.level);
    
    this.isPaused = true;
    this.showUpgrade(false);
  }

  private showUpgrade(isElite: boolean): void {
    this.isPaused = true;
    const upgrades = this.upgradeManager.getRandomUpgrades(isElite);
    
    this.uiManager.showUpgradeScreen(upgrades, isElite, (upgrade) => {
      upgrade.apply(this.player);
      this.uiManager.hideUpgradeScreen();
      this.isPaused = false;
      this.audioManager.playSound('powerup');
      
      // Check if there's a pending boss upgrade to show
      if (this.pendingBossUpgrade) {
        this.pendingBossUpgrade = false;
        setTimeout(() => {
          this.showUpgrade(true); // Show elite upgrade after level-up upgrade
        }, 300);
      }
    });
  }
  
  private updateUI(): void {
    this.uiManager.updateScore(this.score);
    this.uiManager.updateLevel(this.level);
    this.uiManager.updateWave(this.wave);
    this.uiManager.updateHealth(this.player.hp, this.player.maxHp);
    this.uiManager.updateXP(this.xp, this.nextLevelXp);
  }

  private endGame(): void {
    this.gameActive = false;
    this.wreckage = { x: this.player.x, y: this.player.y };
    
    // Check for ship unlocks
    const newUnlocks = this.shipManager.checkUnlocks({
      maxWave: this.wave,
    });
    
    this.shipManager.updateGlobalStats(this.killsThisGame, this.score, this.bossKilledThisGame ? 1 : 0);
    
    if (newUnlocks.length > 0) {
      setTimeout(() => {
        alert(`🚀 새로운 기체 해금!\n${newUnlocks.join('\n')}`);
      }, 500);
    }
    
    setTimeout(() => {
      this.uiManager.showGameOver(this.score, this.wave);
    }, 2000);
  }

  private playIntroStory(): void {
    const story = `서기 2077년, 인류는 외계 문명 '네온'의 침공을 받았다.
    
    지구방위군(EDF)은 궤멸되었고, 남은 것은 당신의 프로토타입 전투기 한 대뿐.
    
    적들의 모선이 지구 궤도에 진입했다.
    놈들의 지휘관 '오메가'를 처치하고 지구를 구하라.
    
    행운을 빈다, 파일럿.`;
    
    this.uiManager.showStory("MISSION BRIEFING", story, () => {
      this.uiManager.hideScreen('storyScreen');
      this.playIntro();
    });
  }

  private playEndingStory(): void {
    this.gameActive = false;
    const story = `2077년 12월 25일, 23:47
    
적 함대의 지휘함 OMEGA가 폭발했다.
하늘을 뒤덮었던 네온 빛이 사라지고, 다시 푸른 하늘이 드러났다.
    
지구 전역의 사람들이 환호성을 지른다.
당신은 인류를 구한 영웅이 되었다.
    
"잘했다, ${this.playerName}. 넌 최고의 파일럿이야."
지구방위군 본부에서 통신이 들어온다.
    
MISSION ACCOMPLISHED.
Welcome home, pilot.`;
    
    this.uiManager.showStory("VICTORY", story, () => {
      this.uiManager.hideScreen('storyScreen');
      this.goToMainMenu();
    });
  }
}

new Game();
