import { validEnemyBalance, type EnemyBalance, type EnemyBalanceOverrides } from './enemyBalance';
import { ERA_HIRE_KINDS, ERA_ORDER, UPGRADES, UNITS } from '../data/content';
import type { BattleReport, ContractOption, DoctrineId, EraChallenges, EraId, EraProgress, EraUnlocks, HireKind, Records, UpgradeId } from './types';
import { emptyTalentProgress, emptyGlobalTalents, LEGACY_POINT_GOLD, TALENTS, type TalentProgress, type GlobalTalentProgress } from './talents';

export interface Checkpoint {
  version: 3;
  eraId: EraId;
  seed: number;
  battleIndex: number;
  phase: 'preparation' | 'contract' | 'reward' | 'battle';
  doctrine: DoctrineId | null;
  roster: HireKind[];
  upgrades: UpgradeId[];
  rewards: UpgradeId[];
  contracts: ContractOption[];
  selectedContract: ContractOption | null;
  contractRisk?: 'standard' | 'daring' | null;
  report: BattleReport | null;
  runTime: number;
}

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
const KEY = 'arena-naemnikov-run-v3';
const PREVIOUS_KEY = 'arena-naemnikov-run-v2';
const BACKUP = 'arena-naemnikov-run-v3-backup';
const PREVIOUS_BACKUP = 'arena-naemnikov-run-v2-backup';
const OLD_KEY = 'arena-naemnikov-run-v1';
const SELECTED_ERA = 'arena-naemnikov-selected-era-v1';
const ERA_PROGRESS = 'arena-naemnikov-eras-v1';
const TALENT_PROGRESS = 'arena-naemnikov-talents-v2';
const OLD_TALENT_PROGRESS = 'arena-naemnikov-talents-v1';
const GLOBAL_TALENTS = 'arena-naemnikov-global-talents-v1';
const RECORDS = 'arena-naemnikov-records-v1';
const EMPTY: Records = { runs: 0, wins: 0, bestBattle: 0, bestTime: null, marks: 0 };

export class SaveService {
  constructor(private storage: StorageLike | null) {}

  loadAudio(): { muted: boolean; musicMuted: boolean } {
    try {
      const value = JSON.parse(this.storage?.getItem('arena-naemnikov-audio-v1') ?? 'null');
      return { muted: typeof value?.muted === 'boolean' ? value.muted : true,
        musicMuted: typeof value?.musicMuted === 'boolean' ? value.musicMuted : true };
    } catch { return { muted: true, musicMuted: true }; }
  }

  writeAudio(settings: { muted: boolean; musicMuted: boolean }): void {
    try { this.storage?.setItem('arena-naemnikov-audio-v1', JSON.stringify(settings)); } catch { /* Local audio preferences are optional. */ }
  }

  load(): Checkpoint | null {
    if (!this.storage) return null;
    for (const key of [KEY, BACKUP, PREVIOUS_KEY, PREVIOUS_BACKUP, OLD_KEY]) {
      try {
        const value = this.storage.getItem(key);
        if (!value) continue;
        const data: unknown = JSON.parse(value);
        if (valid(data)) return data;
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


  loadEnemyBalance(): EnemyBalanceOverrides {
    try {
      const raw = JSON.parse(this.storage?.getItem('arena-naemnikov-debug-balance-v1') ?? '{}');
      const result: EnemyBalanceOverrides = {};
      for (const era of ERA_ORDER) {
        if (Array.isArray(raw?.[era]) && raw[era].length === 4 && raw[era].every(validEnemyBalance))
          result[era] = raw[era].map((row: EnemyBalance) => ({ ...row }));
      }
      return result;
    } catch { return {}; }
  }

  writeEnemyBalance(value: EnemyBalanceOverrides): void {
    try { this.storage?.setItem('arena-naemnikov-debug-balance-v1', JSON.stringify(value)); } catch { /* ignored */ }
  }

  loadSelectedEra(): EraId | null {
    try {
      const id = this.storage?.getItem(SELECTED_ERA);
      return ERA_ORDER.includes(id as EraId) ? id as EraId : null;
    } catch { return null; }
  }

  writeSelectedEra(id: EraId): void {
    try { this.storage?.setItem(SELECTED_ERA, id); } catch { /* game remains playable */ }
  }

  loadEraProgress(): { unlocked: EraUnlocks; wins: EraProgress; challenges: EraChallenges } {
    const fallback = { unlocked: { stone: true, bronze: false, iron: false, antique: false, medieval: false }, wins: { stone: 0, bronze: 0, iron: 0, antique: 0, medieval: 0 }, challenges: { stone: false, bronze: false, iron: false, antique: false, medieval: false } };
    if (!this.storage) return fallback;
    try {
      const raw: unknown = JSON.parse(this.storage.getItem(ERA_PROGRESS) ?? 'null');
      if (!raw || typeof raw !== 'object') return fallback;
      const data = raw as { unlocked?: Partial<EraUnlocks>; wins?: Partial<EraProgress> };
      if (!data.unlocked || !data.wins || !['stone', 'bronze'].every(id => {
        const era = id as EraId;
        return typeof data.unlocked?.[era] === 'boolean' && Number.isInteger(data.wins?.[era]) && data.wins![era]! >= 0;
      })) return fallback;
      const challenges = (raw as { challenges?: Partial<EraChallenges> }).challenges;
      // Old two-era profiles acquire an empty Iron wallet and preserve all existing fields.
      const antiqueWins = Number.isInteger(data.wins.antique) && data.wins.antique! >= 0 ? data.wins.antique! : 0;
      const ironUnlocked = data.unlocked.bronze! && (data.unlocked.iron === true || data.wins.bronze! >= 4);
      const ironWins = Number.isInteger(data.wins.iron) && data.wins.iron! >= 0 ? data.wins.iron! : 0;
      const antiqueUnlocked = ironUnlocked && (data.unlocked.antique === true || ironWins >= 4);
      const medievalWins = Number.isInteger(data.wins.medieval) && data.wins.medieval! >= 0 ? data.wins.medieval! : 0;
      return { unlocked: { stone: true, bronze: data.unlocked.bronze!, iron: ironUnlocked, antique: antiqueUnlocked, medieval: antiqueUnlocked && (data.unlocked.medieval === true || antiqueWins >= 4) },
        wins: { stone: data.wins.stone!, bronze: data.wins.bronze!, iron: ironWins, antique: antiqueWins, medieval: medievalWins },
        challenges: { stone: challenges?.stone === true, bronze: challenges?.bronze === true, iron: challenges?.iron === true, antique: challenges?.antique === true, medieval: challenges?.medieval === true } };
    } catch { return fallback; }
  }

  writeEraProgress(progress: { unlocked: Partial<EraUnlocks>; wins: Partial<EraProgress>; challenges: Partial<EraChallenges> }): void {
    try { this.storage?.setItem(ERA_PROGRESS, JSON.stringify(progress)); } catch { /* storage may be blocked */ }
  }

  loadTalents(eraId: EraId = 'stone'): TalentProgress {
    return this.loadTalentWallets()[eraId];
  }

  loadGlobalTalents(): GlobalTalentProgress {
    const fallback = emptyGlobalTalents();
    try {
      const stored = this.storage?.getItem(GLOBAL_TALENTS);
      if (!stored) {
        // Honour a transition already completed in the previous game version.
        const progress = this.loadEraProgress(), checkpoint = this.load();
        for (const era of ERA_ORDER.slice(1)) {
          if (progress.wins[era] > 0 || (checkpoint && ERA_ORDER.indexOf(checkpoint.eraId) >= ERA_ORDER.indexOf(era))) {
            fallback.points++; fallback.advancedEras.push(era);
          }
        }
        this.writeGlobalTalents(fallback);
        return fallback;
      }
      const raw = JSON.parse(stored) as GlobalTalentProgress | null;
      if (!raw || !validTalents({ gold: raw.points, levels: raw.levels })
        || !Array.isArray(raw.advancedEras) || raw.advancedEras.some(id => !ERA_ORDER.slice(1).includes(id as EraId))
        || new Set(raw.advancedEras).size !== raw.advancedEras.length) return fallback;
      return { points: raw.points, levels: { ...raw.levels }, advancedEras: [...raw.advancedEras] };
    } catch { return fallback; }
  }

  writeGlobalTalents(progress: GlobalTalentProgress): void {
    try { this.storage?.setItem(GLOBAL_TALENTS, JSON.stringify(progress)); } catch { /* game remains playable */ }
  }

  private loadTalentWallets(): Record<EraId, TalentProgress> {
    const wallets = { stone: emptyTalentProgress(), bronze: emptyTalentProgress(), iron: emptyTalentProgress(), antique: emptyTalentProgress(), medieval: emptyTalentProgress() };
    if (!this.storage) return wallets;
    try {
      const current = this.storage.getItem(TALENT_PROGRESS);
      if (current !== null) {
        const raw = JSON.parse(current) as { version?: number; eras?: Partial<Record<EraId, TalentProgress>> } | null;
        if (raw?.version !== 2 || !raw.eras) return wallets;
        for (const era of ERA_ORDER) {
          const progress = raw.eras[era];
          if (validTalents(progress)) wallets[era] = { gold: progress.gold, levels: { ...progress.levels }, ...(progress.baseLevel !== undefined ? { baseLevel: progress.baseLevel } : {}) };
        }
        return wallets;
      }
      // Transfer the old global profile once, into its current campaign only.
      // Newly entered eras always begin with an empty wallet and no talents.
      const checkpoint = this.load();
      const era = checkpoint ? checkpoint.eraId ?? 'stone'
        : this.loadEraProgress().wins.bronze > 0 ? 'bronze' : 'stone';
      const stored = this.storage.getItem(OLD_TALENT_PROGRESS);
      if (stored !== null) {
        const old = JSON.parse(stored) as { points?: number; levels?: TalentProgress['levels'] } | null;
        const progress = { gold: (old?.points ?? NaN) * LEGACY_POINT_GOLD, levels: old?.levels };
        if (validTalents(progress)) wallets[era] = { gold: progress.gold, levels: { ...progress.levels }, ...(progress.baseLevel !== undefined ? { baseLevel: progress.baseLevel } : {}) };
      } else wallets[era].gold = Math.min(60, this.loadRecords().marks) * LEGACY_POINT_GOLD;
      this.storage.setItem(TALENT_PROGRESS, JSON.stringify({ version: 2, eras: wallets }));
      return wallets;
    } catch { return wallets; }
  }

  writeTalents(progress: TalentProgress, eraId: EraId = 'stone'): void {
    if (!validTalents(progress)) return;
    const wallets = this.loadTalentWallets();
    wallets[eraId] = { gold: progress.gold, levels: { ...progress.levels }, ...(progress.baseLevel !== undefined ? { baseLevel: progress.baseLevel } : {}) };
    try { this.storage?.setItem(TALENT_PROGRESS, JSON.stringify({ version: 2, eras: wallets })); } catch { /* game remains playable */ }
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

function validTalents(value: unknown): value is TalentProgress {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<TalentProgress>;
  return Number.isSafeInteger(data.gold) && data.gold! >= 0 && !!data.levels
    && (data.baseLevel === undefined || (Number.isSafeInteger(data.baseLevel) && data.baseLevel >= 0))
    && Object.keys(TALENTS).every(id => {
      const level = data.levels?.[id as keyof typeof TALENTS];
      return Number.isSafeInteger(level) && level! >= 0;
    });
}

function valid(value: unknown): value is Checkpoint {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Checkpoint>;
  const ids = Object.keys(UPGRADES) as UpgradeId[];
  return v.version === 3 && v.eraId !== undefined && ERA_ORDER.includes(v.eraId) && Number.isInteger(v.seed) && Number.isInteger(v.battleIndex)
    && v.battleIndex! >= 0 && v.battleIndex! < 4
    && ['preparation', 'contract', 'reward', 'battle'].includes(v.phase ?? '')
    && (v.doctrine === null || ['steel', 'arrow', 'bargain'].includes(v.doctrine ?? ''))
    && Array.isArray(v.roster) && v.roster.length === 4 && new Set(v.roster).size === 4 && v.roster.every(id => ERA_HIRE_KINDS[v.eraId!].includes(id))
    && Array.isArray(v.upgrades) && v.upgrades.every(id => ids.includes(id))
    && Array.isArray(v.rewards) && v.rewards.every(id => ids.includes(id))
    && (v.contractRisk === undefined || v.contractRisk === null || v.contractRisk === 'standard' || v.contractRisk === 'daring')
    && Array.isArray(v.contracts) && v.contracts.every(c => !!c && typeof c.id === 'string' && typeof c.name === 'string' && Array.isArray(c.roster) && c.roster.every(id => Object.hasOwn(UNITS,id) && id.startsWith(v.eraId!)))
    && (!v.selectedContract || (typeof v.selectedContract.id === 'string' && Array.isArray(v.selectedContract.roster) && v.selectedContract.roster.every(id => Object.hasOwn(UNITS,id) && id.startsWith(v.eraId!))))
    && Number.isFinite(v.runTime) && v.runTime! >= 0
    && (v.phase !== 'reward' || (v.rewards.length === 3 && !!v.report));
}
