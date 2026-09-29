import type { EnemyBalance } from './enemyBalance';
import type { TalentId, TalentLevels } from './talents';
export type Team = 'ally' | 'enemy';
export type EraId = 'stone' | 'bronze' | 'iron' | 'antique' | 'medieval' | 'high-medieval';
export type UnitRole = 'shield' | 'spear' | 'archer' | 'medic' | 'raider' | 'thrower' | 'banner' | 'siege';
export type StoneHireKind = 'stoneShield' | 'stoneSpear' | 'stoneSlinger' | 'stoneShaman' | 'stoneScout' | 'stoneThrower' | 'stoneTotem' | 'stoneRam';
export type BronzeHireKind = 'bronzeGuard' | 'bronzeSpear' | 'bronzeArcher' | 'bronzeHealer' | 'bronzeChariot' | 'bronzePitch' | 'bronzeHerald' | 'bronzeRam';
export type IronHireKind = 'ironShield' | 'ironSpear' | 'ironArcher' | 'ironMedic' | 'ironRaider' | 'ironThrower' | 'ironBanner' | 'ironSiege';
export type AntiqueHireKind = 'antiqueLegionary' | 'antiqueHoplite' | 'antiquePeltast' | 'antiqueSurgeon' | 'antiqueRider' | 'antiqueScorpion' | 'antiqueCenturion' | 'antiqueBallista';
export type MedievalHireKind = 'medievalGuard' | 'medievalPikeman' | 'medievalLongbow' | 'medievalHealer' | 'medievalBerserker' | 'medievalThrower' | 'medievalHorn' | 'medievalRam';
export type HighMedievalHireKind = 'highKnight' | 'highHalberd' | 'highCrossbow' | 'highMonk' | 'highRider' | 'highPitch' | 'highHerald' | 'highTrebuchet';
export type HireKind = StoneHireKind | BronzeHireKind | IronHireKind | AntiqueHireKind | MedievalHireKind | HighMedievalHireKind;
export type UnitKind = HireKind | 'stoneHunter' | 'stoneBone' | 'stoneEnemySlinger' | 'stoneWolf' | 'stoneChief' | 'bronzeEnemySpear' | 'bronzeRaider' | 'bronzeEnemyArcher' | 'bronzeGate' | 'bronzeKing' | 'ironGate' | 'ironCommandant' | 'antiqueLegate' | 'medievalJarl' | 'highCastellan';
export type UpgradeId = 'supply' | 'wagon' | 'banner' | 'arrows' | 'bandages' | 'contract' | 'pikes' | 'workshop' | 'boots' | 'siegecraft' | 'lastReserve' | 'standard';
export type DoctrineId = 'steel' | 'arrow' | 'bargain';
export type GamePhase = 'menu' | 'preparation' | 'contract' | 'battle' | 'reward' | 'victory' | 'defeat';
export type BossPhase = 'none' | 'warning' | 'assault' | 'spent';
export type UnitAction = 'idle' | 'move' | 'attack';

export interface UnitState {
  id: number;
  kind: UnitKind;
  team: Team;
  x: number; // world coordinate, 0..1000
  hp: number;
  maxHp: number;
  cooldown: number; // seconds until next attack/heal
  action: UnitAction; // stable across render frames until the next simulation step
  facing: 1 | -1; // world direction, right or left
}

export interface BattleEvent {
  id: number;
  type: 'spawn' | 'attack' | 'heal' | 'block' | 'death' | 'fortress' | 'income' | 'result' | 'boss-warning' | 'boss-assault';
  x: number;
  team: Team;
  amount?: number;
  sourceId?: number;
  targetId?: number;
}

export interface RewardOption { id: UpgradeId; name: string; description: string; }
export interface DoctrineOption { id: DoctrineId; name: string; description: string; }
export interface ContractOption {
  id: string;
  name: string;
  threat: string;
  roster: UnitKind[];
  condition: string;
  reward: string;
  enemyIncome: number;
  marks: number;
  risk: 'standard' | 'daring';
}
export interface Records { runs: number; wins: number; bestBattle: number; bestTime: number | null; marks: number; }
export type EraProgress = Record<EraId, number>;
export type EraUnlocks = Record<EraId, boolean>;
export type EraChallenges = EraUnlocks;
export interface BattleReport {
  goldEarned?: number; // absent in older saved reports
  won: boolean;
  reason: string;
  duration: number;
  allyFortressHp: number;
  enemyFortressHp: number;
  hires: number;
  damageDealt: number;
  damageTaken: number;
  blocked: number;
  healed: number;
  survivors: number;
}

export interface GameState {
  phase: GamePhase;
  seed: number;
  eraId: EraId;
  unlockedEras: EraUnlocks;
  eraProgress: EraProgress;
  eraChallenges: EraChallenges;
  gold: number;
  battleGold: number;
  baseLevel: number;
  globalTalentPoints: number;
  globalTalents: TalentLevels;
  talents: TalentLevels;
  battleIndex: number; // zero based; 0..3
  arenaId: 'ash' | 'iron' | 'arrows' | 'citadel';
  battleName: string;
  threat: string;
  elapsed: number;
  resource: number;
  income: number;
  enemyIncome: number;
  bossPhase: BossPhase;
  bossCountdown: number;
  enemyGlyphRemaining: number;
  incomeUpgrades: number;
  incomeUpgradeCost: number;
  allyFortressHp: number;
  enemyFortressHp: number;
  fortressMaxHp: number;
  allyFortressMaxHp: number;
  allyCount: number;
  units: UnitState[];
  events: BattleEvent[]; // recent events, keyed by id for one-shot visuals
  cards: { kind: HireKind; name: string; role: string; cost: number; canHire: boolean }[];
  roster: HireKind[];
  unlockedUnits: HireKind[];
  doctrines: DoctrineOption[];
  selectedDoctrine: DoctrineId | null;
  contracts: ContractOption[];
  selectedContract: string | null;
  contractRisk: 'standard' | 'daring' | null;
  rewards: RewardOption[];
  chosenUpgrades: UpgradeId[];
  report: BattleReport | null;
  battleSpeed: number;
  debugEnemyBalance: EnemyBalance[];
  paused: boolean;
  muted: boolean;
  musicMuted: boolean;
  canContinue: boolean;
  records: Records;
  platform: { sdk: 'available' | 'unavailable' | 'loading'; online: boolean };
}

export interface GameApp {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
  selectEra(id: EraId): boolean;
  returnToMenu(): boolean;
  buyTalent(id: TalentId): boolean;
  buyGlobalTalent(id: TalentId): boolean;
  buyBaseHealth(): boolean;
  startNewRun(seed?: number, eraId?: EraId): void;
  continueRun(): void;
  selectDoctrine(id: DoctrineId): boolean;
  setLoadout(kinds: HireKind[]): boolean;
  beginRun(): boolean;
  chooseContract(id: string): boolean;
  retryBattle(): boolean;
  hire(kind: HireKind): boolean;
  upgradeIncome(): boolean;
  chooseReward(id: UpgradeId): boolean;
  setBattleSpeed(speed: number): boolean;
  setExternalPause(paused: boolean, source?: string): void;
  startDebugBattle(battleIndex: number): boolean;
  addDebugGold(amount: number): boolean;
  setEnemyBalance(battleIndex: number, balance: EnemyBalance): boolean;
  resetEnemyBalance(): void;
  togglePause(): void;
  toggleMute(): void;
  toggleMusic(): void;
  dispose(): void;
}
