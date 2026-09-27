export type Team = 'ally' | 'enemy';
export type HireKind = 'shield' | 'spear' | 'archer' | 'medic' | 'raider' | 'thrower' | 'banner' | 'siege';
export type UnitKind = HireKind | 'bulwark' | 'enemyArcher';
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
export interface BattleReport {
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
  battleIndex: number; // zero based; 0..3
  arenaId: 'ash' | 'iron' | 'arrows' | 'citadel';
  battleName: string;
  threat: string;
  elapsed: number;
  resource: number;
  resourceMax: number;
  income: number;
  enemyIncome: number;
  bossPhase: BossPhase;
  bossCountdown: number;
  incomeUpgrades: number;
  incomeUpgradeCost: number;
  allyFortressHp: number;
  enemyFortressHp: number;
  fortressMaxHp: number;
  allyCount: number;
  allyLimit: number;
  units: UnitState[];
  events: BattleEvent[]; // recent events, keyed by id for one-shot visuals
  cards: { kind: HireKind; name: string; role: string; cost: number; canHire: boolean }[];
  roster: HireKind[];
  unlockedUnits: HireKind[];
  doctrines: DoctrineOption[];
  selectedDoctrine: DoctrineId | null;
  contracts: ContractOption[];
  selectedContract: string | null;
  rewards: RewardOption[];
  chosenUpgrades: UpgradeId[];
  report: BattleReport | null;
  paused: boolean;
  muted: boolean;
  canContinue: boolean;
  records: Records;
  platform: { sdk: 'available' | 'unavailable' | 'loading'; online: boolean };
}

export interface GameApp {
  getState(): GameState;
  subscribe(listener: (state: GameState) => void): () => void;
  startNewRun(seed?: number): void;
  continueRun(): void;
  selectDoctrine(id: DoctrineId): boolean;
  setLoadout(kinds: HireKind[]): boolean;
  beginRun(): boolean;
  chooseContract(id: string): boolean;
  hire(kind: HireKind): boolean;
  upgradeIncome(): boolean;
  chooseReward(id: UpgradeId): boolean;
  togglePause(): void;
  toggleMute(): void;
  dispose(): void;
}
