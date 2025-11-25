// Game Constants
export const GAME_CONFIG = {
  CANVAS_BG: '#050505',
  TRAIL_ALPHA: 0.4,
  STAR_COUNT: 80,
  
  // Player
  PLAYER_RADIUS: 15,
  PLAYER_SPEED: 5,
  PLAYER_MAX_HP: 100,
  PLAYER_FIRE_RATE: 15,
  
  // Projectiles
  PROJECTILE_SPEED: 12,
  PROJECTILE_SIZE: 4,
  
  // Enemies
  ENEMY_SPAWN_INTERVAL: 800,
  WAVE_DURATION: 20000,
  BOSS_WAVE_INTERVAL: 5,
  
  // XP
  INITIAL_XP_REQUIRED: 100,
  XP_SCALING: 1.5,
  
  // Colors
  COLORS: {
    CYAN: '#00ffff',
    MAGENTA: '#ff00ff',
    YELLOW: '#ffff00',
    GREEN: '#00ff00',
    RED: '#ff3333',
    WHITE: '#ffffff',
    GOLD: '#ffd700',
    ORANGE: '#ffaa00'
  }
} as const;

export const PLAYER_COLORS = [
  '#00ffff', '#ff00ff', '#ffff00', 
  '#00ff00', '#ff3333', '#ffffff'
] as const;

export type GameColor = typeof GAME_CONFIG.COLORS[keyof typeof GAME_CONFIG.COLORS];
