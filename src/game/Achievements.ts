export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  check: (stats: GameStats) => boolean;
}

export interface GameStats {
  totalKills: number;
  bossesKilled: number;
  highestWave: number;
  totalScore: number;
  gamesPlayed: number;
  totalPlayTime: number;
}

export class AchievementManager {
  private achievements: Achievement[] = [
    {
      id: 'first_blood',
      name: '첫 승리',
      description: '첫 번째 적 처치',
      icon: '🎯',
      unlocked: false,
      check: (stats) => stats.totalKills >= 1
    },
    {
      id: 'wave_5',
      name: '생존자',
      description: 'Wave 5 도달',
      icon: '🌊',
      unlocked: false,
      check: (stats) => stats.highestWave >= 5
    },
    {
      id: 'wave_10',
      name: '베테랑',
      description: 'Wave 10 도달',
      icon: '⭐',
      unlocked: false,
      check: (stats) => stats.highestWave >= 10
    },
    {
      id: 'boss_killer',
      name: '보스 헌터',
      description: '보스 처치',
      icon: '👑',
      unlocked: false,
      check: (stats) => stats.bossesKilled >= 1
    },
    {
      id: 'score_10k',
      name: '스코어 마스터',
      description: '10,000점 달성',
      icon: '💯',
      unlocked: false,
      check: (stats) => stats.totalScore >= 10000
    },
    {
      id: 'hundred_kills',
      name: '학살자',
      description: '총 100마리 처치',
      icon: '💀',
      unlocked: false,
      check: (stats) => stats.totalKills >= 100
    }
  ];

  private stats: GameStats;

  constructor() {
    this.stats = this.loadStats();
    this.loadAchievements();
  }

  private loadStats(): GameStats {
    const saved = localStorage.getItem('ngs_stats');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      totalKills: 0,
      bossesKilled: 0,
      highestWave: 0,
      totalScore: 0,
      gamesPlayed: 0,
      totalPlayTime: 0
    };
  }

  private saveStats(): void {
    localStorage.setItem('ngs_stats', JSON.stringify(this.stats));
  }

  private loadAchievements(): void {
    const saved = localStorage.getItem('ngs_achievements');
    if (saved) {
      const unlocked = JSON.parse(saved);
      this.achievements.forEach(a => {
        if (unlocked.includes(a.id)) {
          a.unlocked = true;
        }
      });
    }
  }

  private saveAchievements(): void {
    const unlocked = this.achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('ngs_achievements', JSON.stringify(unlocked));
  }

  updateStats(kills: number, wave: number, score: number, bossKilled: boolean): string[] {
    this.stats.totalKills += kills;
    if (wave > this.stats.highestWave) {
      this.stats.highestWave = wave;
    }
    this.stats.totalScore += score;
    if (bossKilled) {
      this.stats.bossesKilled++;
    }
    this.stats.gamesPlayed++;
    
    this.saveStats();
    
    // Check for new achievements
    const newlyUnlocked: string[] = [];
    this.achievements.forEach(a => {
      if (!a.unlocked && a.check(this.stats)) {
        a.unlocked = true;
        newlyUnlocked.push(a.name);
      }
    });
    
    if (newlyUnlocked.length > 0) {
      this.saveAchievements();
    }
    
    return newlyUnlocked;
  }

  getAchievements(): Achievement[] {
    return this.achievements;
  }

  getStats(): GameStats {
    return this.stats;
  }

  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  getTotalCount(): number {
    return this.achievements.length;
  }
}
