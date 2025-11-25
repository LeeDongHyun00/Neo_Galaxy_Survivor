export interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
  date: string;
}

export class Leaderboard {
  private entries: LeaderboardEntry[] = [];
  private maxEntries: number = 10;

  constructor() {
    this.load();
  }

  private load(): void {
    const saved = localStorage.getItem('ngs_leaderboard');
    if (saved) {
      this.entries = JSON.parse(saved);
    }
  }

  private save(): void {
    localStorage.setItem('ngs_leaderboard', JSON.stringify(this.entries));
  }

  addEntry(name: string, score: number, wave: number): boolean {
    const entry: LeaderboardEntry = {
      name,
      score,
      wave,
      date: new Date().toISOString()
    };

    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    
    const wasInTop = this.entries.indexOf(entry) < this.maxEntries;
    
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    this.save();
    return wasInTop;
  }

  getEntries(): LeaderboardEntry[] {
    return [...this.entries];
  }

  isHighScore(score: number): boolean {
    if (this.entries.length < this.maxEntries) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  getRank(score: number): number {
    let rank = 1;
    for (const entry of this.entries) {
      if (score <= entry.score) rank++;
    }
    return rank;
  }

  clear(): void {
    this.entries = [];
    this.save();
  }
}
