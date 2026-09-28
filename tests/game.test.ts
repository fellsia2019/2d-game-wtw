import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { offerRewards } from '../src/core/rewards';
import { SaveService, type Checkpoint, type StorageLike } from '../src/core/save';
import type { HireKind } from '../src/core/types';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function play(sim: BattleSimulation, plan: HireKind[]): void {
  let purchase = 0;
  for (let i = 0; i < 420 * 30 && !sim.report; i++) {
    sim.step();
    if (plan.length && sim.hire(plan[purchase % plan.length])) purchase++;
  }
}

function playDirector(director: GameDirector, plan: HireKind[]): void {
  let purchase = 0;
  for (let i = 0; i < 420 * 30 && director.getState().phase === 'battle'; i++) {
    director.tick();
    if (director.hire(plan[purchase % plan.length])) purchase++;
  }
}

describe('battle simulation', () => {
  it('keeps move and attack states stable across steps and returns survivors to idle at result', () => {
    const sim = new BattleSimulation(0, [], 123);
    sim.resource = 100;
    expect(sim.hire('stoneShield')).toBe(true);
    const shield = sim.units[0];
    expect(shield.action).toBe('idle');
    expect(shield.facing).toBe(1);
    for (let i = 0; i < 8; i++) {
      sim.step();
      expect(shield.action).toBe('move');
      expect(shield.facing).toBe(1);
    }
    shield.x = 900;
    sim.step();
    expect(shield.action).toBe('attack');
    for (let i = 0; i < 4; i++) {
      sim.step();
      expect(shield.action).toBe('attack');
    }
    sim.enemyFortressHp = .5;
    for (let i = 0; i < 151; i++) { sim.enemyResource = 0; sim.step(); }
    shield.cooldown = 0;
    sim.step();
    expect(sim.report?.won).toBe(true);
    expect(shield.action).toBe('idle');
    sim.step();
    expect(shield.action).toBe('idle');
  });

  it('faces a target behind and marks healing as attack preparation', () => {
    const sim = new BattleSimulation(0, [], 8);
    sim.resource = 100;
    sim.hire('stoneShield'); sim.hire('stoneShaman');
    const [shield, medic] = sim.units;
    shield.x = 300; medic.x = 315;
    shield.hp -= 10;
    medic.cooldown = 0;
    sim.step();
    expect(medic.action).toBe('attack');
    expect(medic.facing).toBe(-1);
    expect(sim.events.some(e => e.type === 'heal' && e.sourceId === medic.id)).toBe(true);
  });

  it('publishes valid actions and facing for every playable and enemy archetype', () => {
    const kinds: HireKind[] = ['stoneShield', 'stoneSpear', 'stoneSlinger', 'stoneShaman', 'stoneScout', 'stoneThrower', 'stoneTotem', 'stoneRam'];
    for (const kind of kinds) {
      const sim = new BattleSimulation(1, [], 12, 'steel', kinds);
      sim.resource = 100;
      expect(sim.hire(kind)).toBe(true);
      sim.step();
      expect(sim.units[0].action).toBe('move');
      expect(sim.units[0].facing).toBe(1);
    }
    const sim = new BattleSimulation(1, [], 12);
    for (let i = 0; i < 20 * 30; i++) sim.step();
    expect(sim.units.some(u => u.team === 'enemy')).toBe(true);
    for (const enemy of sim.units.filter(u => u.team === 'enemy')) {
      expect(['idle', 'move', 'attack']).toContain(enemy.action);
      expect(enemy.facing).toBe(-1);
    }
  });

  it('replays the same actions and seed exactly', () => {
    const a = new BattleSimulation(0, [], 12345);
    const b = new BattleSimulation(0, [], 12345);
    const plan: HireKind[] = ['stoneShield', 'stoneSlinger', 'stoneSpear', 'stoneShaman'];
    play(a, plan); play(b, plan);
    expect(a.report).toEqual(b.report);
    expect(a.events).toEqual(b.events);
  });

  it('rejects unaffordable purchases and upgrades income beyond two levels', () => {
    const sim = new BattleSimulation(0, [], 1);
    expect(sim.hire('stoneShield')).toBe(false);
    expect(sim.hire('stoneRam')).toBe(false); // outside selected four-card roster
    sim.resource = 100;
    expect(sim.incomeUpgradeCost).toBe(40);
    expect(sim.upgradeIncome()).toBe(true);
    expect(sim.resource).toBe(60);
    expect(sim.incomeUpgradeCost).toBe(50);
    expect(sim.upgradeIncome()).toBe(true);
    expect(sim.resource).toBe(10);
    expect(sim.incomeUpgradeCost).toBe(60);
    expect(sim.upgradeIncome()).toBe(false);
    expect(sim.resource).toBe(10);
    expect(sim.incomeUpgrades).toBe(2);
    expect(sim.income).toBe(8);
    for (let i = 0; i < 18; i++) {
      const price = 60 + i * 10;
      expect(sim.incomeUpgradeCost).toBe(price);
      sim.resource = price - 1;
      expect(sim.upgradeIncome()).toBe(false);
      expect(sim.resource).toBe(price - 1);
      expect(sim.incomeUpgradeCost).toBe(price);
      sim.resource = price;
      expect(sim.upgradeIncome()).toBe(true);
      expect(sim.resource).toBe(0);
    }
    expect(sim.incomeUpgrades).toBe(20);
    expect(sim.income).toBe(26);
    expect(new BattleSimulation(0, [], 1).incomeUpgradeCost).toBe(40);
  });

  it('discounts only the first income upgrade with the workshop', () => {
    const sim = new BattleSimulation(0, ['workshop'], 1);
    sim.resource = 200;
    for (const price of [28, 50, 60]) {
      expect(sim.incomeUpgradeCost).toBe(price);
      const before = sim.resource;
      expect(sim.upgradeIncome()).toBe(true);
      expect(sim.resource).toBe(before - price);
    }
    expect(new BattleSimulation(0, ['workshop'], 1).incomeUpgradeCost).toBe(28);
  });

  it('recruits beyond twelve units and triggers the reserve for a large army', () => {
    const sim = new BattleSimulation(0, ['lastReserve'], 1);
    for (let i = 0; i < 40; i++) {
      sim.resource = 100;
      expect(sim.hire('stoneShield')).toBe(true);
    }
    expect(sim.allyCount).toBe(40);
    sim.allyFortressHp = sim.allyFortressMaxHp * .34;
    sim.step();
    expect(sim.allyCount).toBe(41);
    sim.step();
    expect(sim.allyCount).toBe(41);
  });

  it('does not cap enemy hires or discard a boss wave when the army is large', () => {
    const sim = new BattleSimulation(3, [], 1);
    for (let i = 0; i < 20; i++) sim.units.push({ id: 100 + i, kind: 'stoneBone', team: 'enemy', x: 895,
      hp: 70, maxHp: 70, cooldown: 100, action: 'idle', facing: -1 });
    sim.enemyResource = 100;
    sim.enemyFortressHp = 50;
    for (let i = 0; i < 5 * 30; i++) sim.step();
    expect(sim.enemyCount).toBeGreaterThanOrEqual(24);
    expect(sim.events.some(event => event.type === 'boss-assault')).toBe(true);
  });

  it('spawns the commander wave immediately at half fortress health', () => {
    const sim = new BattleSimulation(3, [], 1);
    sim.enemyFortressHp = 50;
    sim.step();
    expect(sim.bossPhase).toBe('assault');
    expect(sim.bossCountdown).toBe(0);
    expect(sim.events.some(e => e.type === 'boss-assault')).toBe(true);
    expect(sim.units.filter(u => u.team === 'enemy').length).toBe(4);
    sim.step();
    expect(sim.events.filter(e => e.type === 'boss-assault')).toHaveLength(1);
  });

  it('makes losing without hires explainable and retries the current battle', () => {
    const save = new SaveService(new MemoryStorage());
    const director = new GameDirector(save);
    director.startNewRun(99);
    director.selectDoctrine('steel'); director.beginRun();
    director.chooseContract(director.getState().contracts[0].id);
    const contract = director.getState().selectedContract;
    for (let i = 0; i < 420 * 30 && director.getState().phase === 'battle'; i++) director.tick();
    expect(director.getState().phase).toBe('defeat');
    expect(director.getState().report?.reason).toMatch(/крепост|время/i);
    expect(director.getState().canContinue).toBe(true);
    expect(save.load()?.phase).toBe('battle');
    expect(director.retryBattle()).toBe(true);
    expect(director.getState().phase).toBe('battle');
    expect(director.getState().battleIndex).toBe(0);
    expect(director.getState().selectedContract).toBe(contract);
  });
});

describe('run and persistence', () => {
  it('completes all four battles through rewards and restores each checkpoint', () => {
    const storage = new MemoryStorage();
    const profile = new SaveService(storage);
    profile.writeTalents({gold:0,levels:{damage:50,attackSpeed:50,health:50,supply:50},baseLevel:100});
    let director = new GameDirector(profile);
    director.startNewRun(23, 'stone');
    expect(director.beginRun()).toBe(false);
    expect(director.selectDoctrine('steel')).toBe(true);
    expect(director.beginRun()).toBe(true);
    for (let battle = 0; battle < 4; battle++) {
      const option = director.getState().contracts[0];
      expect(director.chooseContract(option.id)).toBe(true);
      const plan: HireKind[] = battle === 1
        ? ['stoneShield', 'stoneSpear', 'stoneSlinger', 'stoneSpear', 'stoneShaman', 'stoneSlinger']
        : ['stoneShield', 'stoneSlinger', 'stoneSlinger', 'stoneSpear', 'stoneShaman'];
      playDirector(director, plan);
      const state = director.getState();
      expect(state.report?.won, `battle ${battle + 1}: ${state.report?.reason}`).toBe(true);
      expect(state.report!.duration).toBeLessThan(300);
      if (battle < 3) {
        expect(state.phase).toBe('reward');
        expect(state.rewards).toHaveLength(3);
        director = new GameDirector(new SaveService(storage));
        director.continueRun();
        expect(director.getState().rewards).toEqual(state.rewards);
        expect(director.chooseReward(state.rewards[0].id)).toBe(true);
        director = new GameDirector(new SaveService(storage));
        director.continueRun();
        expect(director.getState().phase).toBe('contract');
        expect(director.getState().battleIndex).toBe(battle + 1);
      } else {
        expect(state.phase).toBe('victory');
        expect(state.records.wins).toBe(1);
        expect(new GameDirector(new SaveService(storage)).getState().canContinue).toBe(false);
      }
    }
  });

  it('keeps manual and external pauses independent', () => {
    const director = new GameDirector(new SaveService(null));
    director.startNewRun(1); director.selectDoctrine('steel'); director.beginRun();
    director.chooseContract(director.getState().contracts[0].id);
    director.togglePause(); director.setExternalPause(true, 'visibility'); director.togglePause();
    const before = director.getState().elapsed;
    const beforeActions = director.getState().units.map(u => u.action);
    director.tick(); expect(director.getState().elapsed).toBe(before);
    expect(director.getState().units.map(u => u.action)).toEqual(beforeActions);
    director.setExternalPause(false, 'visibility'); director.tick();
    expect(director.getState().elapsed).toBeGreaterThan(before);
  });

  it('unlocks the extended roster and preserves doctrine, loadout and battle settings', () => {
    const storage = new MemoryStorage();
    storage.setItem('arena-naemnikov-records-v1', JSON.stringify({ runs: 3, wins: 1, bestBattle: 4, bestTime: 200, marks: 8 }));
    let director = new GameDirector(new SaveService(storage));
    new SaveService(storage).writeEraProgress({unlocked:{stone:true,bronze:false},wins:{stone:4,bronze:0},challenges:{stone:false,bronze:false}});
    director = new GameDirector(new SaveService(storage));
    director.startNewRun(123, 'stone');
    expect(director.getState().unlockedUnits).toHaveLength(8);
    expect(director.setLoadout(['stoneShield', 'stoneScout', 'stoneThrower', 'stoneRam'])).toBe(true);
    expect(director.selectDoctrine('bargain')).toBe(true);
    expect(director.beginRun()).toBe(true);
    expect(director.getState().contracts).toHaveLength(1);
    const [standard] = director.getState().contracts;
    expect(director.chooseContract(standard.id)).toBe(true);
    director = new GameDirector(new SaveService(storage));
    director.continueRun();
    const state = director.getState();
    expect(state.selectedDoctrine).toBe('bargain');
    expect(state.roster).toEqual(['stoneShield', 'stoneScout', 'stoneThrower', 'stoneRam']);
    expect(state.selectedContract).toBe(standard.id);
    expect(state.enemyIncome).toBe(standard.enemyIncome);
    expect(state.resource).toBe(20);
    expect(state.allyFortressHp).toBe(1);
  });

  it('filters rewards by the active four-card roster', () => {
    for (let seed = 1; seed <= 24; seed++) {
      const ids = offerRewards(seed, 1, ['stoneShield', 'stoneScout', 'stoneThrower', 'stoneRam'], []);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(ids).not.toContain('arrows');
      expect(ids).not.toContain('bandages');
      expect(ids).not.toContain('pikes');
      expect(ids).not.toContain('standard');
    }
  });

  it('falls back to a current checkpoint and ignores the removed v1 campaign', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    const checkpoint: Checkpoint = { version: 3, eraId: 'stone', seed: 42, battleIndex: 1, phase: 'contract',
      doctrine: 'steel', roster: ['stoneShield', 'stoneSpear', 'stoneSlinger', 'stoneShaman'], upgrades: [], rewards: [],
      contracts: [], selectedContract: null, report: null, runTime: 20 };
    save.write(checkpoint); save.write({ ...checkpoint, battleIndex: 2 });
    storage.setItem('arena-naemnikov-run-v3', '{broken');
    expect(save.load()?.battleIndex).toBe(1);
    save.clear();
    storage.setItem('arena-naemnikov-run-v1', JSON.stringify({ version: 1, seed: 5, battleIndex: 1,
      phase: 'battle', upgrades: [], rewards: [], report: null }));
    expect(save.load()).toBeNull();
  });
});
