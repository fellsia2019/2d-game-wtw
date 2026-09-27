import { BATTLES, DOCTRINES, STARTER_KINDS, UNITS, UNLOCKS, UPGRADES } from '../data/content';
import { BattleSimulation } from './BattleSimulation';
import { offerRewards } from './rewards';
import { SaveService, type Checkpoint } from './save';
import type { ContractOption, DoctrineId, GameApp, GamePhase, GameState, HireKind, Records, UpgradeId } from './types';

const FIXED_STEP = 1 / 30;

export class GameDirector implements GameApp {
  private listeners = new Set<(state: GameState) => void>();
  private checkpointAvailable: boolean;
  private simulation: BattleSimulation | null = null;
  private phase: GamePhase = 'menu';
  private seed = 0;
  private battleIndex = 0;
  private doctrine: DoctrineId | null = null;
  private roster: HireKind[] = [...STARTER_KINDS];
  private upgrades: UpgradeId[] = [];
  private rewards: UpgradeId[] = [];
  private contracts: ContractOption[] = [];
  private selectedContract: ContractOption | null = null;
  private report: GameState['report'] = null;
  private runTime = 0;
  private records: Records;
  private paused = false;
  private pauseSources = new Set<string>();
  private muted = false;
  private platform: GameState['platform'] = { sdk: 'loading', online: true };

  constructor(private save: SaveService) {
    this.checkpointAvailable = !!save.load();
    this.records = save.loadRecords();
  }

  getState(): GameState {
    const sim = this.simulation;
    const battle = BATTLES[this.battleIndex];
    const cards = this.roster.map(kind => ({ kind, name: UNITS[kind].name, role: UNITS[kind].role,
      cost: sim?.hireCost(kind) ?? UNITS[kind].cost,
      canHire: this.phase === 'battle' && !this.paused && !this.externallyPaused && !!sim
        && sim.resource >= sim.hireCost(kind) && sim.allyCount < 12 }));
    return {
      phase: this.phase, seed: this.seed, battleIndex: this.battleIndex, arenaId: battle.arenaId,
      battleName: this.selectedContract?.name ?? battle.name,
      threat: this.selectedContract?.threat ?? battle.threat,
      elapsed: sim?.elapsed ?? this.report?.duration ?? 0,
      resource: sim?.resource ?? 0, resourceMax: sim?.resourceMax ?? 100, income: sim?.income ?? 6,
      enemyIncome: sim?.enemyIncome ?? this.selectedContract?.enemyIncome ?? battle.enemyIncome,
      bossPhase: sim?.bossPhase ?? 'none', bossCountdown: sim?.bossCountdown ?? 0,
      incomeUpgrades: sim?.incomeUpgrades ?? 0, incomeUpgradeCost: sim?.incomeUpgradeCost ?? 40,
      allyFortressHp: sim?.allyFortressHp ?? this.report?.allyFortressHp ?? 100,
      enemyFortressHp: sim?.enemyFortressHp ?? this.report?.enemyFortressHp ?? 100,
      fortressMaxHp: 100, allyCount: sim?.allyCount ?? 0, allyLimit: 12,
      units: sim?.units.map(u => ({ ...u })) ?? [], events: sim?.events.map(e => ({ ...e })) ?? [], cards,
      roster: [...this.roster], unlockedUnits: this.unlockedUnits(),
      doctrines: DOCTRINES.map(d => ({ ...d })), selectedDoctrine: this.doctrine,
      contracts: this.contracts.map(c => ({ ...c, roster: [...c.roster] })), selectedContract: this.selectedContract?.id ?? null,
      rewards: this.rewards.map(id => ({ id, name: UPGRADES[id].name, description: UPGRADES[id].description })),
      chosenUpgrades: [...this.upgrades], report: this.report ? { ...this.report } : null,
      paused: this.paused || this.externallyPaused, muted: this.muted, canContinue: this.checkpointAvailable,
      records: { ...this.records }, platform: { ...this.platform }
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  startNewRun(seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0): void {
    this.seed = seed >>> 0;
    this.battleIndex = 0;
    this.doctrine = null;
    this.roster = [...STARTER_KINDS];
    this.upgrades = [];
    this.rewards = [];
    this.contracts = [];
    this.selectedContract = null;
    this.report = null;
    this.simulation = null;
    this.runTime = 0;
    this.paused = false;
    this.phase = 'preparation';
    this.records.runs++;
    this.save.writeRecords(this.records);
    this.persist();
    this.emit();
  }

  continueRun(): void {
    const checkpoint = this.save.load();
    if (!checkpoint) { this.checkpointAvailable = false; this.emit(); return; }
    this.seed = checkpoint.seed;
    this.battleIndex = checkpoint.battleIndex;
    this.doctrine = checkpoint.doctrine;
    this.roster = [...checkpoint.roster];
    this.upgrades = [...checkpoint.upgrades];
    this.rewards = [...checkpoint.rewards];
    this.contracts = checkpoint.contracts.map(c => ({ ...c, roster: [...c.roster] }));
    this.selectedContract = checkpoint.selectedContract ? { ...checkpoint.selectedContract, roster: [...checkpoint.selectedContract.roster] } : null;
    this.report = checkpoint.report;
    this.runTime = checkpoint.runTime;
    this.paused = false;
    this.simulation = null;
    this.phase = checkpoint.phase;
    if (this.phase === 'battle') {
      if (!this.selectedContract) this.selectedContract = this.makeContracts()[0];
      this.beginBattle(false);
    } else {
      if (this.phase === 'contract' && this.contracts.length !== 2) this.contracts = this.makeContracts();
      this.emit();
    }
  }

  selectDoctrine(id: DoctrineId): boolean {
    if (this.phase !== 'preparation' || !DOCTRINES.some(d => d.id === id)) return false;
    this.doctrine = id;
    this.persist(); this.emit();
    return true;
  }

  setLoadout(kinds: HireKind[]): boolean {
    if (this.phase !== 'preparation' && this.phase !== 'contract') return false;
    const unlocked = this.unlockedUnits();
    if (kinds.length !== 4 || new Set(kinds).size !== 4 || !kinds.every(k => unlocked.includes(k))) return false;
    this.roster = [...kinds];
    this.persist(); this.emit();
    return true;
  }

  beginRun(): boolean {
    if (this.phase !== 'preparation' || !this.doctrine || this.roster.length !== 4) return false;
    this.phase = 'contract';
    this.contracts = this.makeContracts();
    this.persist(); this.emit();
    return true;
  }

  chooseContract(id: string): boolean {
    if (this.phase !== 'contract') return false;
    const chosen = this.contracts.find(c => c.id === id);
    if (!chosen) return false;
    this.selectedContract = chosen;
    this.report = null;
    this.rewards = [];
    this.beginBattle(true);
    return true;
  }

  hire(kind: HireKind): boolean {
    if (this.phase !== 'battle' || this.paused || this.externallyPaused || !this.simulation) return false;
    const success = this.simulation.hire(kind);
    if (success) this.emit();
    return success;
  }

  upgradeIncome(): boolean {
    if (this.phase !== 'battle' || this.paused || this.externallyPaused || !this.simulation) return false;
    const success = this.simulation.upgradeIncome();
    if (success) this.emit();
    return success;
  }

  chooseReward(id: UpgradeId): boolean {
    if (this.phase !== 'reward' || !this.rewards.includes(id)) return false;
    this.upgrades.push(id);
    this.rewards = [];
    this.report = null;
    this.simulation = null;
    this.selectedContract = null;
    this.battleIndex++;
    this.contracts = this.makeContracts();
    this.phase = 'contract';
    this.persist(); this.emit();
    return true;
  }

  togglePause(): void { if (this.phase === 'battle') { this.paused = !this.paused; this.emit(); } }
  toggleMute(): void { this.muted = !this.muted; this.emit(); }
  setExternalPause(value: boolean, source = 'external'): void {
    const before = this.externallyPaused;
    if (value) this.pauseSources.add(source); else this.pauseSources.delete(source);
    if (before !== this.externallyPaused) this.emit();
  }
  setPlatformStatus(status: Partial<GameState['platform']>): void {
    this.platform = { ...this.platform, ...status };
    this.emit();
  }
  dispose(): void { this.listeners.clear(); }

  tick(): void {
    if (this.phase !== 'battle' || this.paused || this.externallyPaused || !this.simulation) return;
    this.simulation.step();
    if (this.simulation.report) this.endBattle();
    this.emit();
  }

  fixedStep(): number { return FIXED_STEP; }
  private get externallyPaused(): boolean { return this.pauseSources.size > 0; }

  private unlockedUnits(): HireKind[] {
    return [...STARTER_KINDS, ...UNLOCKS.filter(u => this.records.marks >= u.marks).map(u => u.kind)];
  }

  private makeContracts(): ContractOption[] {
    const battle = BATTLES[this.battleIndex];
    return [
      { id: `${this.battleIndex}-standard`, name: battle.name, threat: battle.threat, roster: [...battle.roster],
        condition: 'Обычные припасы противника', reward: '1 знак контракта', enemyIncome: battle.enemyIncome,
        marks: 1, risk: 'standard' },
      { id: `${this.battleIndex}-daring`, name: `${battle.name}: дерзкий контракт`, threat: battle.threat,
        roster: [...battle.roster], condition: 'Враг начинает с 20 припасами и получает +0,7/с',
        reward: '2 знака контракта', enemyIncome: battle.enemyIncome + .7, marks: 2, risk: 'daring' }
    ];
  }

  private beginBattle(saveBefore: boolean): void {
    this.simulation = new BattleSimulation(this.battleIndex, this.upgrades, this.seed,
      this.doctrine ?? 'steel', this.roster, this.selectedContract ?? undefined);
    this.phase = 'battle';
    if (saveBefore) this.persist();
    this.emit();
  }

  private endBattle(): void {
    const report = this.simulation!.report!;
    this.report = { ...report };
    this.runTime += report.duration;
    if (!report.won) {
      this.phase = 'defeat';
      this.save.clear();
      this.checkpointAvailable = false;
      return;
    }
    this.records.bestBattle = Math.max(this.records.bestBattle, this.battleIndex + 1);
    this.records.marks += this.selectedContract?.marks ?? 1;
    if (this.battleIndex === BATTLES.length - 1) {
      this.records.wins++;
      this.records.bestTime = this.records.bestTime === null ? this.runTime : Math.min(this.records.bestTime, this.runTime);
      this.save.writeRecords(this.records);
      this.phase = 'victory';
      this.save.clear();
      this.checkpointAvailable = false;
      return;
    }
    this.save.writeRecords(this.records);
    this.phase = 'reward';
    this.rewards = offerRewards(this.seed, this.battleIndex, this.roster, this.upgrades);
    this.persist();
  }

  private persist(): void {
    if (this.phase !== 'preparation' && this.phase !== 'contract' && this.phase !== 'reward' && this.phase !== 'battle') return;
    const checkpoint: Checkpoint = {
      version: 2, seed: this.seed, battleIndex: this.battleIndex, phase: this.phase,
      doctrine: this.doctrine, roster: [...this.roster], upgrades: [...this.upgrades],
      rewards: [...this.rewards], contracts: this.contracts.map(c => ({ ...c, roster: [...c.roster] })),
      selectedContract: this.selectedContract ? { ...this.selectedContract, roster: [...this.selectedContract.roster] } : null,
      report: this.report ? { ...this.report } : null, runTime: this.runTime
    };
    this.save.write(checkpoint);
    this.checkpointAvailable = true;
  }

  private emit(): void {
    if (!this.listeners.size) return;
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}
