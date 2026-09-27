import { ERA_HIRE_KINDS, HIRE_KINDS, STARTER_KINDS, UPGRADES } from '../data/content';
import type { BattleReport, ContractOption, DoctrineId, EraChallenges, EraId, EraProgress, EraUnlocks, HireKind, Records, UpgradeId } from './types';
import { emptyTalentProgress, MAX_TALENT_LEVEL, TALENTS, type TalentProgress } from './talents';

export interface Checkpoint {
  version: 2 | 3;
  eraId?: EraId;
  seed: number;
  battleIndex: number;
  phase: 'preparation' | 'contract' | 'reward' | 'battle';
  doctrine: DoctrineId | null;
  roster: HireKind[];
  upgrades: UpgradeId[];
  rewards: UpgradeId[];
  contracts: ContractOption[];
  selectedContract: ContractOption | null;
  report: BattleReport | null;
  runTime: number;
}

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
const KEY = 'arena-naemnikov-run-v3';
const PREVIOUS_KEY = 'arena-naemnikov-run-v2';
const BACKUP = 'arena-naemnikov-run-v3-backup';
const PREVIOUS_BACKUP = 'arena-naemnikov-run-v2-backup';
const OLD_KEY = 'arena-naemnikov-run-v1';
const ERA_PROGRESS = 'arena-naemnikov-eras-v1';
const TALENT_PROGRESS = 'arena-naemnikov-talents-v1';
const RECORDS = 'arena-naemnikov-records-v1';
const EMPTY: Records = { runs: 0, wins: 0, bestBattle: 0, bestTime: null, marks: 0 };

export class SaveService {
  constructor(private storage: StorageLike | null) {}

  load(): Checkpoint | null {
    if (!this.storage) return null;
    for (const key of [KEY, BACKUP, PREVIOUS_KEY, PREVIOUS_BACKUP, OLD_KEY]) {
      try {
        const value = this.storage.getItem(key);
        if (!value) continue;
        const data: unknown = JSON.parse(value);
        if (valid(data)) return data;
        if (legacy(data)) {
          const v = data as { seed: number; battleIndex: number; phase: 'reward' | 'battle'; upgrades: UpgradeId[]; rewards: UpgradeId[]; report: BattleReport | null };
          return { version: 2, seed: v.seed, battleIndex: v.battleIndex, phase: v.phase, doctrine: 'steel',
            roster: [...STARTER_KINDS], upgrades: v.upgrades, rewards: v.rewards, contracts: [],
            selectedContract: null, report: v.report, runTime: 0 };
        }
      } catch { /* storage may be unavailable or damaged */ }
    }
    return null;
  }

  write(checkpoint: Checkpoint): void {
    if (!this.storage) return;
    try {
      const old = this.storage.getItem(KEY);
      if (old) this.storage.setItem(BACKUP, old);
      this.storage.setItem(KEY, JSON.stringify(checkpoint));
      this.storage.removeItem(OLD_KEY);
      this.storage.removeItem(PREVIOUS_KEY);
      this.storage.removeItem(PREVIOUS_BACKUP);
    } catch { /* game remains playable if storage is blocked */ }
  }

  clear(): void {
    if (!this.storage) return;
    try { this.storage.removeItem(KEY); this.storage.removeItem(BACKUP); this.storage.removeItem(PREVIOUS_KEY); this.storage.removeItem(PREVIOUS_BACKUP); this.storage.removeItem(OLD_KEY); } catch { /* ignored */ }
  }


  loadEraProgress(): { unlocked: EraUnlocks; wins: EraProgress; challenges: EraChallenges } {
    const fallback = { unlocked: { stone: true, bronze: false, legacy: true }, wins: { stone: 0, bronze: 0, legacy: 0 }, challenges: { stone: false, bronze: false, legacy: false } };
    if (!this.storage) return fallback;
    try {
      const raw: unknown = JSON.parse(this.storage.getItem(ERA_PROGRESS) ?? 'null');
      if (!raw || typeof raw !== 'object') return fallback;
      const data = raw as { unlocked?: Partial<EraUnlocks>; wins?: Partial<EraProgress> };
      if (!data.unlocked || !data.wins || !['stone', 'bronze', 'legacy'].every(id => {
        const era = id as EraId;
        return typeof data.unlocked?.[era] === 'boolean' && Number.isInteger(data.wins?.[era]) && data.wins![era]! >= 0;
      })) return fallback;
      const challenges = (raw as { challenges?: Partial<EraChallenges> }).challenges;
      return { unlocked: { stone: true, bronze: data.unlocked.bronze!, legacy: true }, wins: { stone: data.wins.stone!, bronze: data.wins.bronze!, legacy: data.wins.legacy! },
        challenges: { stone: challenges?.stone === true, bronze: challenges?.bronze === true, legacy: challenges?.legacy === true } };
    } catch { return fallback; }
  }

  writeEraProgress(progress: { unlocked: EraUnlocks; wins: EraProgress; challenges: EraChallenges }): void {
    try { this.storage?.setItem(ERA_PROGRESS, JSON.stringify(progress)); } catch { /* storage may be blocked */ }
  }

  loadTalents(): TalentProgress {
    const fallback = emptyTalentProgress();
    if (!this.storage) return fallback;
    try {
      const stored = this.storage.getItem(TALENT_PROGRESS);
      if (stored === null) {
        fallback.points = Math.min(60, this.loadRecords().marks);
        this.writeTalents(fallback);
        return fallback;
      }
      const raw: unknown = JSON.parse(stored);
      if (!raw || typeof raw !== 'object') return fallback;
      const data = raw as Partial<TalentProgress>;
      if (!Number.isSafeInteger(data.points) || data.points! < 0 || !data.levels ||
        !Object.keys(TALENTS).every(id => {
          const level = data.levels?.[id as keyof typeof TALENTS];
          return Number.isInteger(level) && level! >= 0 && level! <= MAX_TALENT_LEVEL;
        })) return fallback;
      return { points: data.points!, levels: { ...fallback.levels, ...data.levels } };
    } catch { return fallback; }
  }

  writeTalents(progress: TalentProgress): void {
    try { this.storage?.setItem(TALENT_PROGRESS, JSON.stringify(progress)); } catch { /* game remains playable */ }
  }

  loadRecords(): Records {
    if (!this.storage) return { ...EMPTY };
    try {
      const v: unknown = JSON.parse(this.storage.getItem(RECORDS) ?? 'null');
      if (v && typeof v === 'object') {
        const r = v as Records;
        if ([r.runs, r.wins, r.bestBattle, r.marks].every(n => Number.isInteger(n) && n >= 0)
          && (r.bestTime === null || (Number.isFinite(r.bestTime) && r.bestTime > 0))) return { ...r };
      }
    } catch { /* ignored */ }
    return { ...EMPTY };
  }

  writeRecords(records: Records): void {
    try { this.storage?.setItem(RECORDS, JSON.stringify(records)); } catch { /* ignored */ }
  }
}

function valid(value: unknown): value is Checkpoint {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Checkpoint>;
  const ids = Object.keys(UPGRADES) as UpgradeId[];
  return (v.version === 2 || v.version === 3) && (v.version === 2 || (v.eraId !== undefined && ['stone', 'bronze', 'legacy'].includes(v.eraId))) && Number.isInteger(v.seed) && Number.isInteger(v.battleIndex)
    && v.battleIndex! >= 0 && v.battleIndex! < 4
    && ['preparation', 'contract', 'reward', 'battle'].includes(v.phase ?? '')
    && (v.doctrine === null || ['steel', 'arrow', 'bargain'].includes(v.doctrine ?? ''))
    && Array.isArray(v.roster) && v.roster.length === 4 && new Set(v.roster).size === 4 && v.roster.every(id => (v.version === 2 ? HIRE_KINDS : ERA_HIRE_KINDS[v.eraId!]).includes(id))
    && Array.isArray(v.upgrades) && v.upgrades.every(id => ids.includes(id))
    && Array.isArray(v.rewards) && v.rewards.every(id => ids.includes(id))
    && Array.isArray(v.contracts) && v.contracts.every(c => !!c && typeof c.id === 'string' && typeof c.name === 'string')
    && (!v.selectedContract || typeof v.selectedContract.id === 'string')
    && Number.isFinite(v.runTime) && v.runTime! >= 0
    && (v.phase !== 'reward' || (v.rewards.length === 3 && !!v.report));
}

function legacy(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && Number.isInteger(v.seed) && Number.isInteger(v.battleIndex)
    && (v.battleIndex as number) >= 0 && (v.battleIndex as number) < 3
    && (v.phase === 'reward' || v.phase === 'battle') && Array.isArray(v.upgrades) && Array.isArray(v.rewards);
}
