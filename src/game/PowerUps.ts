import { Player } from './Player';

export interface Upgrade {
  name: string;
  desc: string;
  icon: string;
  apply: (player: Player) => void;
  isElite?: boolean;
}

export const COMMON_UPGRADES: Upgrade[] = [
  {
    name: '멀티 샷',
    desc: '발사체 +1',
    icon: '☄️',
    apply: (p) => p.projectileCount++
  },
  {
    name: '광속 장전',
    desc: '공속 +15%',
    icon: '⚡',
    apply: (p) => p.fireRate *= 0.85
  },
  {
    name: '화력 증강',
    desc: '데미지 UP',
    icon: '💥',
    apply: (p) => p.damageMult += 0.15
  },
  {
    name: '부스터',
    desc: '이동속도 UP',
    icon: '🚀',
    apply: (p) => p.speed *= 1.15
  },
  {
    name: '선체 수리',
    desc: '체력 50% 회복',
    icon: '❤️',
    apply: (p) => p.heal(50)
  },
  {
    name: '쉴드 확장',
    desc: '최대체력 UP',
    icon: '🛡️',
    apply: (p) => {
      p.maxHp *= 1.2;
      p.heal(20);
    }
  },
  {
    name: '확산 탄막',
    desc: '발사체 +2',
    icon: '💫',
    apply: (p) => p.projectileCount += 2
  },
  {
    name: '폭발탄',
    desc: '투사체 크기 +50%',
    icon: '🎯',
    apply: (p) => p.projectileSize *= 1.5
  },
  {
    name: '에너지 쉴드',
    desc: '체력 100% 회복',
    icon: '💚',
    apply: (p) => p.heal(p.maxHp)
  },
  {
    name: '연사 시스템',
    desc: '공속 +30%',
    icon: '🔫',
    apply: (p) => p.fireRate *= 0.7
  },
  {
    name: '강화 선체',
    desc: '최대체력 +50',
    icon: '🏰',
    apply: (p) => {
      p.maxHp += 50;
      p.heal(50);
    }
  },
  {
    name: '과부하',
    desc: '데미지 1.5배, 최대HP -20%',
    icon: '⚠️',
    apply: (p) => {
      p.damageMult *= 1.5;
      p.maxHp *= 0.8;
      if (p.hp > p.maxHp) p.hp = p.maxHp;
    }
  }
];

export const ELITE_UPGRADES: Upgrade[] = [
  {
    name: '윙맨',
    desc: '공격 드론 소환',
    icon: '🛰️',
    isElite: true,
    apply: (p) => {
      p.drones.push({ x: 0, y: 0, angle: 0, cooldown: 0 });
    }
  },
  {
    name: '브레인 잭',
    desc: '주기적 적 해킹',
    icon: '🧠',
    isElite: true,
    apply: (p) => {
      p.superPowers.hacking = true;
    }
  },
  {
    name: '플라즈마 필드',
    desc: '주변 지속 피해',
    icon: '⚡',
    isElite: true,
    apply: (p) => {
      p.superPowers.plasma = true;
    }
  },
  {
    name: '스마트 미사일',
    desc: '유도 미사일 발사',
    icon: '🚀',
    isElite: true,
    apply: (p) => {
      p.superPowers.missiles = true;
    }
  },
  {
    name: '나노 머신',
    desc: '체력 자동 회복',
    icon: '💉',
    isElite: true,
    apply: (p) => {
      p.superPowers.regen = true;
    }
  },
  {
    name: '연쇄 반응',
    desc: '적 처치 시 폭발',
    icon: '💣',
    isElite: true,
    apply: (p) => {
      p.superPowers.chain = true;
    }
  },
  {
    name: '타임 시프트',
    desc: '적 탄환 감속',
    icon: '⏳',
    isElite: true,
    apply: (p) => {
      p.superPowers.timeShift = true;
    }
  }
];

export class UpgradeManager {
  getRandomUpgrades(isElite: boolean, count: number = 3): Upgrade[] {
    const pool = isElite ? ELITE_UPGRADES : COMMON_UPGRADES;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
