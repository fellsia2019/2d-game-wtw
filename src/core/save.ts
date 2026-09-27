import { HIRE_KINDS, STARTER_KINDS, UPGRADES } from '../data/content';
import type { BattleReport, ContractOption, DoctrineId, HireKind, Records, UpgradeId } from './types';

export interface Checkpoint {
  version: 2;
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
const KEY = 'arena-naemnikov-run-v2';
const BACKUP = 'arena-naemnikov-run-v2-backup';
const OLD_KEY = 'arena-naemnikov-run-v1';
const RECORDS = 'arena-naemnikov-records-v1';
const EMPTY: Records = { runs: 0, wins: 0, bestBattle: 0, bestTime: null, marks: 0 };

export class SaveService {
  constructor(private storage: StorageLike | null) {}

  load(): Checkpoint | null {
    if (!this.storage) return null;
    for (const key of [KEY, BACKUP, OLD_KEY]) {
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
    } catch { /* game remains playable if storage is blocked */ }
  }

  clear(): void {
    if (!this.storage) return;
    try { this.storage.removeItem(KEY); this.storage.removeItem(BACKUP); this.storage.removeItem(OLD_KEY); } catch { /* ignored */ }
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
  return v.version === 2 && Number.isInteger(v.seed) && Number.isInteger(v.battleIndex)
    && v.battleIndex! >= 0 && v.battleIndex! < 4
    && ['preparation', 'contract', 'reward', 'battle'].includes(v.phase ?? '')
    && (v.doctrine === null || ['steel', 'arrow', 'bargain'].includes(v.doctrine ?? ''))
    && Array.isArray(v.roster) && v.roster.length === 4 && new Set(v.roster).size === 4 && v.roster.every(id => HIRE_KINDS.includes(id))
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
