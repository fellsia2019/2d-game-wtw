import { enemyBalanceDefaults, validEnemyBalance, type EnemyBalance, type EnemyBalanceOverrides } from './enemyBalance';
import { DOCTRINES, ERA_BATTLES, ERA_HIRE_KINDS, ERA_STARTER_KINDS, ERA_ORDER, ERA_INCOME, victoryGold, nextEra, UNITS, UPGRADES } from '../data/content';
import { BattleSimulation } from './BattleSimulation';
import { offerRewards } from './rewards';
import { SaveService, type Checkpoint } from './save';
import { talentCost, globalTalentCost, combinedTalents, baseHealth, baseHealthCost, type TalentId, type TalentProgress, type GlobalTalentProgress } from './talents';
import type { ContractOption, DoctrineId, EraChallenges, EraId, EraProgress, EraUnlocks, GameApp, GamePhase, GameState, HireKind, Records, UpgradeId } from './types';

const FIXED_STEP = 1 / 30;

export class GameDirector implements GameApp {
  private listeners = new Set<(state: GameState) => void>();
  private checkpointAvailable: boolean;
  private checkpointEra: EraId | null;
  private simulation: BattleSimulation | null = null;
  private creditedBattleGold = 0;
  private phase: GamePhase = 'menu';
  private seed = 0;
  private eraId: EraId = 'stone';
  private unlockedEras: EraUnlocks;
  private eraProgress: EraProgress;
  private eraChallenges: EraChallenges;
  private talentProgress: TalentProgress;
  private talentWallets = new Map<EraId, TalentProgress>();
  private globalTalentProgress: GlobalTalentProgress;
  private battleIndex = 0;
  private doctrine: DoctrineId | null = null;
  private roster: HireKind[] = [...ERA_STARTER_KINDS.stone];
  private upgrades: UpgradeId[] = [];
  private rewards: UpgradeId[] = [];
  private contracts: ContractOption[] = [];
  private selectedContract: ContractOption | null = null;
  private contractRisk: 'standard' | 'daring' | null = 'standard';
  private report: GameState['report'] = null;
  private runTime = 0;
  private records: Records;
  private paused = false;
  private battleSpeed = 1;
  private enemyBalanceOverrides: EnemyBalanceOverrides;
  private pauseSources = new Set<string>();
  private muted = true;
  private musicMuted = true;
  private platform: GameState['platform'] = { sdk: 'loading', online: true };

  constructor(private save: SaveService) {
    this.enemyBalanceOverrides = save.loadEnemyBalance();
    const checkpoint = save.load();
    this.checkpointAvailable = !!checkpoint;
    this.checkpointEra = checkpoint ? checkpoint.eraId ?? 'stone' : null;
    this.records = save.loadRecords();
    const audio = save.loadAudio();
    this.muted = audio.muted; this.musicMuted = audio.musicMuted;
    const progress = save.loadEraProgress();
    this.unlockedEras = progress.unlocked;
    this.eraProgress = progress.wins;
    this.eraChallenges = progress.challenges;
    const selected = save.loadSelectedEra();
    this.eraId = selected && this.unlockedEras[selected] ? selected
      : [...ERA_ORDER].reverse().find(id => this.unlockedEras[id]) ?? 'stone';
    this.roster = [...ERA_STARTER_KINDS[this.eraId]];
    save.writeSelectedEra(this.eraId);
    this.talentProgress = save.loadTalents(this.eraId);
    this.talentWallets.set(this.eraId, this.talentProgress);
    this.globalTalentProgress = save.loadGlobalTalents();
  }

  getState(): GameState {
    const sim = this.simulation;
    const battle = ERA_BATTLES[this.eraId][this.battleIndex];
    const cards = this.roster.map(kind => ({ kind, name: UNITS[kind].name, role: UNITS[kind].role,
      cost: sim?.hireCost(kind) ?? UNITS[kind].cost,
      canHire: this.phase === 'battle' && !this.paused && !this.externallyPaused && !!sim
        && sim.resource >= sim.hireCost(kind) }));
    return {
      phase: this.phase, seed: this.seed, eraId: this.eraId, unlockedEras: { ...this.unlockedEras }, eraProgress: { ...this.eraProgress }, eraChallenges: { ...this.eraChallenges }, gold: this.talentProgress.gold, battleGold: sim?.goldEarned ?? this.report?.goldEarned ?? 0, talents: { ...this.talentProgress.levels }, battleIndex: this.battleIndex, arenaId: battle.arenaId,
      baseLevel: this.talentProgress.baseLevel ?? 0,
      globalTalentPoints: this.globalTalentProgress.points, globalTalents: { ...this.globalTalentProgress.levels },
      battleName: this.selectedContract?.name ?? battle.name,
      threat: this.selectedContract?.threat ?? battle.threat,
      elapsed: sim?.elapsed ?? this.report?.duration ?? 0,
      resource: sim?.resource ?? 0, income: sim?.income ?? ERA_INCOME[this.eraId],
      enemyIncome: sim?.enemyIncome ?? this.selectedContract?.enemyIncome ?? this.enemyBalances()[this.battleIndex].income,
      bossPhase: sim?.bossPhase ?? 'none', bossCountdown: sim?.bossCountdown ?? 0, enemyGlyphRemaining: sim?.enemyGlyphRemaining ?? 0,
      incomeUpgrades: sim?.incomeUpgrades ?? 0, incomeUpgradeCost: sim?.incomeUpgradeCost ?? 40,
      allyFortressHp: sim?.allyFortressHp ?? this.report?.allyFortressHp ?? baseHealth(this.talentProgress.baseLevel ?? 0),
      enemyFortressHp: sim?.enemyFortressHp ?? this.report?.enemyFortressHp ?? 100,
      allyFortressMaxHp: sim?.allyFortressMaxHp ?? baseHealth(this.talentProgress.baseLevel ?? 0),
      fortressMaxHp: 100, allyCount: sim?.allyCount ?? 0,
      units: sim?.units.map(u => ({ ...u })) ?? [], droneStrikes: sim?.droneStrikes.map(strike => ({ ...strike })) ?? [], events: sim?.events.map(e => ({ ...e })) ?? [], cards,
      roster: [...this.roster], unlockedUnits: this.unlockedUnits(),
      doctrines: DOCTRINES.map(d => ({ ...d })), selectedDoctrine: this.doctrine,
      contracts: this.contracts.map(c => ({ ...c, roster: [...c.roster] })), selectedContract: this.selectedContract?.id ?? null, contractRisk: this.contractRisk,
      rewards: this.rewards.map(id => ({ id, name: UPGRADES[id].name, description: UPGRADES[id].description })),
      chosenUpgrades: [...this.upgrades], report: this.report ? { ...this.report } : null,
      battleSpeed: this.battleSpeed, debugEnemyBalance: this.enemyBalances().map(row => ({ ...row })), paused: this.paused || this.externallyPaused, muted: this.muted, musicMuted: this.musicMuted, canContinue: this.checkpointAvailable && this.checkpointEra === this.eraId,
      records: { ...this.records }, platform: { ...this.platform }
    };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  selectEra(id: EraId): boolean {
    if (!['menu', 'victory', 'defeat'].includes(this.phase) || !ERA_ORDER.includes(id) || !this.unlockedEras[id]) return false;
    this.eraId = id;
    this.save.writeSelectedEra(id);
    this.talentProgress = this.eraTalents(id);
    this.phase = 'menu';
    this.battleIndex = 0;
    this.roster = [...ERA_STARTER_KINDS[id]];
    this.selectedContract = null;
    this.report = null;
    this.simulation = null;
    this.emit();
    return true;
  }

  returnToMenu(): boolean {
    if (this.phase === 'menu') return false;
    if (this.phase === 'victory') {
      const selected = this.save.loadSelectedEra();
      if (selected && selected !== this.eraId && this.unlockedEras[selected]) return this.selectEra(selected);
    }
    if (['preparation', 'contract', 'reward', 'battle'].includes(this.phase)) this.persist();
    else if (this.phase !== 'defeat') {
      this.battleIndex = 0;
      this.roster = [...ERA_STARTER_KINDS[this.eraId]];
      this.report = null;
      this.simulation = null;
      this.selectedContract = null;
    }
    this.phase = 'menu';
    this.paused = false;
    this.emit();
    return true;
  }

  buyTalent(id: TalentId): boolean {
    if (!this.canBuyTalents() || !Object.hasOwn(this.talentProgress.levels, id)) return false;
    const level = this.talentProgress.levels[id];
    const cost = talentCost(level);
    if (!Number.isSafeInteger(cost) || this.talentProgress.gold < cost) return false;
    this.talentProgress.levels[id] = level + 1;
    this.talentProgress.gold -= cost;
    this.save.writeTalents(this.talentProgress, this.eraId);
    this.updateBattleTalents();
    this.emit();
    return true;
  }

  startNewRun(seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0, eraId: EraId = this.eraId): void {
    if (!this.unlockedEras[eraId]) return;
    this.eraId = eraId;
    this.save.writeSelectedEra(eraId);
    this.talentProgress = this.eraTalents(eraId);
    this.awardEraTransition();
    this.seed = seed >>> 0;
    this.battleIndex = 0;
    this.doctrine = null;
    this.roster = [...ERA_STARTER_KINDS[this.eraId]];
    this.upgrades = [];
    this.rewards = [];
    this.contracts = [];
    this.selectedContract = null;
    this.contractRisk = 'standard';
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
    this.eraId = checkpoint.eraId ?? 'stone';
    this.save.writeSelectedEra(this.eraId);
    this.talentProgress = this.eraTalents(this.eraId);
    this.awardEraTransition();
    this.seed = checkpoint.seed;
    this.battleIndex = checkpoint.battleIndex;
    this.doctrine = checkpoint.doctrine;
    this.roster = [...checkpoint.roster];
    this.upgrades = [...checkpoint.upgrades];
    this.rewards = [...checkpoint.rewards];
    this.contracts = checkpoint.contracts.map(c => ({ ...c, roster: [...c.roster] }));
    this.selectedContract = checkpoint.selectedContract ? { ...checkpoint.selectedContract, roster: [...checkpoint.selectedContract.roster] } : null;
    this.contractRisk = 'standard';
    this.contracts = this.makeContracts();
    if (this.selectedContract) this.selectedContract = this.contracts.find(c => c.risk === this.selectedContract!.risk) ?? this.contracts[0];
    this.report = checkpoint.report;
    this.runTime = checkpoint.runTime;
    this.paused = false;
    this.simulation = null;
    this.phase = checkpoint.phase;
    if (this.phase === 'battle') {
      if (!this.selectedContract) this.selectedContract = this.makeContracts()[0];
      this.beginBattle(false);
    } else {
      if (this.phase === 'contract') this.contracts = this.makeContracts();
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
    if (!chosen || (this.contractRisk && chosen.risk !== this.contractRisk)) return false;
    this.contractRisk = chosen.risk;
    this.selectedContract = chosen;
    this.report = null;
    this.rewards = [];
    this.beginBattle(true);
    return true;
  }

  retryBattle(): boolean {
    if (this.phase !== 'defeat' || !this.selectedContract) return false;
    this.report = null;
    this.simulation = null;
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

  private enemyBalances(): EnemyBalance[] {
    return this.enemyBalanceOverrides[this.eraId] ?? enemyBalanceDefaults(this.eraId);
  }

  setEnemyBalance(battleIndex: number, balance: EnemyBalance): boolean {
    if (!Number.isInteger(battleIndex) || battleIndex < 0 || battleIndex >= ERA_BATTLES[this.eraId].length || !validEnemyBalance(balance)) return false;
    const rows = this.enemyBalances().map(row => ({ ...row }));
    rows[battleIndex] = { ...balance };
    this.enemyBalanceOverrides[this.eraId] = rows;
    this.save.writeEnemyBalance(this.enemyBalanceOverrides);
    this.emit();
    return true;
  }

  resetEnemyBalance(): void {
    delete this.enemyBalanceOverrides[this.eraId];
    this.save.writeEnemyBalance(this.enemyBalanceOverrides);
    this.emit();
  }

  startDebugBattle(battleIndex: number): boolean {
    if (!Number.isInteger(battleIndex) || battleIndex < 0 || battleIndex >= ERA_BATTLES[this.eraId].length) return false;
    this.battleIndex = battleIndex;
    this.doctrine ??= 'steel';
    this.report = null;
    this.rewards = [];
    this.paused = false;
    this.contractRisk = 'standard';
    this.contracts = this.makeContracts();
    this.selectedContract = this.contracts[0];
    this.save.writeSelectedEra(this.eraId);
    this.awardEraTransition();
    this.beginBattle(true);
    return true;
  }

  addDebugGold(amount: number): boolean {
    const activeBattle = this.phase === 'battle' && this.simulation && !this.simulation.report ? this.simulation : null;
    if (![50, 100, 200, 500, 2000].includes(amount)
      || !Number.isSafeInteger(this.talentProgress.gold + amount)
      || (activeBattle && !Number.isSafeInteger(activeBattle.goldEarned + amount))) return false;
    this.talentProgress.gold += amount;
    if (activeBattle) {
      activeBattle.goldEarned += amount;
      this.creditedBattleGold += amount;
    }
    this.save.writeTalents(this.talentProgress, this.eraId);
    this.emit();
    return true;
  }

  setBattleSpeed(speed: number): boolean {
    if (!Number.isInteger(speed) || speed < 1 || speed > 5) return false;
    this.battleSpeed = speed;
    this.emit();
    return true;
  }

  togglePause(): void { if (this.phase === 'battle') { this.paused = !this.paused; this.emit(); } }
  toggleMute(): void { this.muted = !this.muted; this.saveAudio(); this.emit(); }
  toggleMusic(): void { this.musicMuted = !this.musicMuted; this.saveAudio(); this.emit(); }
  private saveAudio(): void { this.save.writeAudio({ muted: this.muted, musicMuted: this.musicMuted }); }
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
    const earned = this.simulation.goldEarned - this.creditedBattleGold;
    if (earned > 0) {
      this.talentProgress.gold += earned;
      this.creditedBattleGold = this.simulation.goldEarned;
      this.save.writeTalents(this.talentProgress, this.eraId);
    }
    if (this.simulation.report) this.endBattle();
    this.emit();
  }

  fixedStep(): number { return FIXED_STEP; }
  private get externallyPaused(): boolean { return this.pauseSources.size > 0; }

  private eraTalents(id: EraId): TalentProgress {
    let progress = this.talentWallets.get(id);
    if (!progress) { progress = this.save.loadTalents(id); this.talentWallets.set(id, progress); }
    return progress;
  }

  buyGlobalTalent(id: TalentId): boolean {
    if (!this.canBuyTalents()
      || !Object.hasOwn(this.globalTalentProgress.levels, id)) return false;
    const cost = globalTalentCost();
    if (!Number.isSafeInteger(cost) || this.globalTalentProgress.points < cost) return false;
    this.globalTalentProgress.points -= cost;
    this.globalTalentProgress.levels[id]++;
    this.save.writeGlobalTalents(this.globalTalentProgress);
    this.updateBattleTalents();
    this.emit();
    return true;
  }

  buyBaseHealth(): boolean {
    if (!this.canBuyTalents()) return false;
    const level = this.talentProgress.baseLevel ?? 0, cost = baseHealthCost(level);
    if (!Number.isSafeInteger(baseHealth(level + 1)) || this.talentProgress.gold < cost) return false;
    this.talentProgress.gold -= cost; this.talentProgress.baseLevel = level + 1;
    this.save.writeTalents(this.talentProgress, this.eraId); this.updateBattleTalents(); this.emit(); return true;
  }

  private canBuyTalents(): boolean {
    return this.phase === 'battle' ? this.paused
      : ['menu', 'preparation', 'contract', 'reward', 'victory', 'defeat'].includes(this.phase);
  }

  private updateBattleTalents(): void {
    if (this.phase === 'battle' && this.simulation) this.simulation.updateTalents(
      combinedTalents(this.talentProgress.levels, this.globalTalentProgress.levels),
      baseHealth(this.talentProgress.baseLevel ?? 0));
  }

  private awardEraTransition(): void {
    if (ERA_ORDER.indexOf(this.eraId) <= 0 || this.globalTalentProgress.advancedEras.includes(this.eraId)) return;
    this.globalTalentProgress.points++;
    this.globalTalentProgress.advancedEras.push(this.eraId);
    this.save.writeGlobalTalents(this.globalTalentProgress);
  }

  private unlockedUnits(): HireKind[] {
    const kinds = ERA_HIRE_KINDS[this.eraId];
    return [...kinds.slice(0, 4), ...kinds.slice(4).filter((_, i) => this.eraProgress[this.eraId] >= i + 1 || (i === 2 && this.eraChallenges[this.eraId]))];
  }

  private makeContracts(): ContractOption[] {
    const battle = ERA_BATTLES[this.eraId][this.battleIndex];
    return [{ id: `${this.battleIndex}-standard`, name: battle.name, threat: battle.threat,
      roster: [...battle.roster], condition: '', reward: `+${victoryGold(this.eraId)} золота за победу`,
      enemyIncome: this.enemyBalances()[this.battleIndex].income, marks: 1, risk: 'standard' }];
  }

  private beginBattle(saveBefore: boolean): void {
    this.creditedBattleGold = 0;
    this.simulation = new BattleSimulation(this.battleIndex, this.upgrades, this.seed,
      this.doctrine ?? 'steel', this.roster, this.selectedContract ?? undefined, this.eraId,
      combinedTalents(this.talentProgress.levels, this.globalTalentProgress.levels), baseHealth(this.talentProgress.baseLevel ?? 0), this.enemyBalances()[this.battleIndex]);
    this.phase = 'battle';
    if (saveBefore) this.persist();
    this.emit();
  }

  private endBattle(): void {
    const report = this.simulation!.report!;
    this.report = { ...report };
    if (!report.won) {
      this.phase = 'defeat';
      return;
    }
    this.runTime += report.duration;
    this.records.bestBattle = Math.max(this.records.bestBattle, this.battleIndex + 1);
    this.records.marks += this.selectedContract?.marks ?? 1;
    this.eraProgress[this.eraId] = Math.max(this.eraProgress[this.eraId], this.battleIndex + 1);
    const next = nextEra(this.eraId);
    if (next && this.battleIndex === 3 && !this.unlockedEras[next]) {
      this.unlockedEras[next] = true;
      this.save.writeSelectedEra(next);
    }
    this.save.writeEraProgress({ unlocked: this.unlockedEras, wins: this.eraProgress, challenges: this.eraChallenges });
    if (this.battleIndex === ERA_BATTLES[this.eraId].length - 1) {
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
      version: 3, eraId: this.eraId, seed: this.seed, battleIndex: this.battleIndex, phase: this.phase,
      doctrine: this.doctrine, roster: [...this.roster], upgrades: [...this.upgrades],
      rewards: [...this.rewards], contracts: this.contracts.map(c => ({ ...c, roster: [...c.roster] })),
      contractRisk: this.contractRisk, selectedContract: this.selectedContract ? { ...this.selectedContract, roster: [...this.selectedContract.roster] } : null,
      report: this.report ? { ...this.report } : null, runTime: this.runTime
    };
    this.save.write(checkpoint);
    this.checkpointAvailable = true;
    this.checkpointEra = this.eraId;
  }

  private emit(): void {
    if (!this.listeners.size) return;
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}
