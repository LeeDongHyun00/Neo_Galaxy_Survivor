import { GAME_CONFIG } from '../utils/constants';

export enum ShipType {
  DEFAULT = 'default',
  SPEEDSTER = 'speedster',
  TANK = 'tank',
  SNIPER = 'sniper',
  ENGINEER = 'engineer'
}

export interface ShipConfig {
  id: ShipType;
  name: string;
  description: string;
  unlockCondition: string;
  
  // Stats
  maxHp: number;
  speed: number;
  damageMult: number;
  fireRate: number; // Lower is faster
  projectileSize: number;
  projectileCount: number;
  color: string;
}

export const SHIPS: Record<ShipType, ShipConfig> = {
  [ShipType.DEFAULT]: {
    id: ShipType.DEFAULT,
    name: "MK-1 파이오니어",
    description: "균형 잡힌 표준형 기체입니다.",
    unlockCondition: "기본 지급",
    maxHp: 100,
    speed: 5,
    damageMult: 1,
    fireRate: 15,
    projectileSize: 4,
    projectileCount: 1,
    color: GAME_CONFIG.COLORS.CYAN
  },
  [ShipType.SPEEDSTER]: {
    id: ShipType.SPEEDSTER,
    name: "VX-9 레이서",
    description: "빠른 이동 + 공속 20% 증가",
    unlockCondition: "Wave 8 도달",
    maxHp: 60,
    speed: 8,
    damageMult: 0.8,
    fireRate: 10, // Faster fire rate (was 12)
    projectileSize: 3,
    projectileCount: 1,
    color: GAME_CONFIG.COLORS.YELLOW
  },
  [ShipType.TANK]: {
    id: ShipType.TANK,
    name: "G-05 포트리스",
    description: "고체력 + 투사체 크기 50% 증가",
    unlockCondition: "총 500킬 달성",
    maxHp: 200,
    speed: 3,
    damageMult: 1.5,
    fireRate: 25,
    projectileSize: 9, // Increased from 6
    projectileCount: 1,
    color: GAME_CONFIG.COLORS.GREEN
  },
  [ShipType.SNIPER]: {
    id: ShipType.SNIPER,
    name: "S-77 팬텀",
    description: "고화력 + 투사체 크기 25% 증가",
    unlockCondition: "Wave 5 클리어",
    maxHp: 80,
    speed: 6,
    damageMult: 2.5,
    fireRate: 40,
    projectileSize: 7, // Increased from 5
    projectileCount: 1,
    color: GAME_CONFIG.COLORS.PURPLE
  },
  [ShipType.ENGINEER]: {
    id: ShipType.ENGINEER,
    name: "T-404 드론",
    description: "기본적으로 2발을 발사하지만 데미지가 낮습니다.",
    unlockCondition: "총 점수 50,000점 달성",
    maxHp: 120,
    speed: 4,
    damageMult: 0.6,
    fireRate: 18,
    projectileSize: 3,
    projectileCount: 2,
    color: GAME_CONFIG.COLORS.ORANGE
  }
};

export class ShipManager {
  private unlockedShips: Set<ShipType>;
  private selectedShip: ShipType;
  private readonly STORAGE_KEY = 'neon_galaxy_unlocks';
  private readonly SELECTED_KEY = 'neon_galaxy_selected_ship';

  private globalStats = {
    totalKills: 0,
    totalScore: 0,
    totalBossKills: 0
  };

  constructor() {
    this.unlockedShips = new Set([ShipType.DEFAULT]);
    this.selectedShip = ShipType.DEFAULT;
    this.load();
  }

  private load(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => {
            if (Object.values(ShipType).includes(id)) {
              this.unlockedShips.add(id);
            }
          });
        }
      } catch (e) {
        console.error('Failed to load ship unlocks', e);
      }
    }

    const selected = localStorage.getItem(this.SELECTED_KEY);
    if (selected && Object.values(ShipType).includes(selected as ShipType)) {
      if (this.isUnlocked(selected as ShipType)) {
        this.selectedShip = selected as ShipType;
      }
    }
    
    const stats = localStorage.getItem('neon_galaxy_stats');
    if (stats) {
      try {
        this.globalStats = JSON.parse(stats);
      } catch (e) {}
    }
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlockedShips)));
    localStorage.setItem(this.SELECTED_KEY, this.selectedShip);
    localStorage.setItem('neon_galaxy_stats', JSON.stringify(this.globalStats));
  }

  updateGlobalStats(kills: number, score: number, bossKills: number): void {
    this.globalStats.totalKills += kills;
    this.globalStats.totalScore += score;
    this.globalStats.totalBossKills += bossKills;
    this.save();
  }

  unlock(type: ShipType): boolean {
    if (!this.unlockedShips.has(type)) {
      this.unlockedShips.add(type);
      this.save();
      return true; // Newly unlocked
    }
    return false;
  }

  isUnlocked(type: ShipType): boolean {
    return this.unlockedShips.has(type);
  }

  selectShip(type: ShipType): void {
    if (this.isUnlocked(type)) {
      this.selectedShip = type;
      this.save();
    }
  }

  getSelectedShip(): ShipConfig {
    return SHIPS[this.selectedShip];
  }

  getAllShips(): ShipConfig[] {
    return Object.values(SHIPS);
  }

  // Check unlock conditions based on game stats
  checkUnlocks(currentRunStats: { maxWave: number }): string[] {
    const newUnlocks: string[] = [];

    if (currentRunStats.maxWave >= 8 && this.unlock(ShipType.SPEEDSTER)) {
      newUnlocks.push(SHIPS[ShipType.SPEEDSTER].name);
    }
    if (this.globalStats.totalKills >= 500 && this.unlock(ShipType.TANK)) {
      newUnlocks.push(SHIPS[ShipType.TANK].name);
    }
    if (currentRunStats.maxWave >= 6 && this.unlock(ShipType.SNIPER)) {
      newUnlocks.push(SHIPS[ShipType.SNIPER].name);
    }
    if (this.globalStats.totalScore >= 50000 && this.unlock(ShipType.ENGINEER)) {
      newUnlocks.push(SHIPS[ShipType.ENGINEER].name);
    }

    return newUnlocks;
  }
}
