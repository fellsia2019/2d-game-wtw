import { describe, expect, it } from 'vitest';
import { ERA_BATTLES, ERA_HIRE_KINDS, ERA_STARTER_KINDS, UNITS } from '../src/data/content';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import type { EraId, HireKind } from '../src/core/types';
import { CAMPAIGN_PLANS, completeCampaignBattle } from './helpers/campaign';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function play(sim: BattleSimulation, plan: HireKind[]) {
  let purchase = 0;
  for (let i = 0; i < 420 * 30 && !sim.report; i++) {
    sim.step();
    if (sim.hire(plan[purchase % plan.length])) purchase++;
  }
  return sim.report;
}

describe('first two eras', () => {
  it('defines separate rosters, enemies and bosses with distinct combat values', () => {
    for (const era of ['stone', 'bronze'] as EraId[]) {
      const allies = ERA_HIRE_KINDS[era];
      expect(allies).toHaveLength(8);
      expect(new Set(allies).size).toBe(8);
      expect(ERA_BATTLES[era]).toHaveLength(4);
      const enemies = new Set(ERA_BATTLES[era].flatMap(b => b.roster));
      expect(enemies.size).toBe(5);
      for (const id of [...allies, ...enemies]) expect(UNITS[id].hp).toBeGreaterThan(0);
    }
    expect(ERA_HIRE_KINDS.stone.filter(k => ERA_HIRE_KINDS.bronze.includes(k))).toHaveLength(0);
    expect(UNITS.stoneSlinger.range).toBeLessThan(UNITS.bronzeArcher.range);
    expect(UNITS.stoneShield.armor).toBeLessThan(UNITS.bronzeGuard.armor);
    expect(UNITS.stoneScout.speed).toBeLessThan(UNITS.bronzeChariot.speed);
  });

  it('uses epoch-specific enemy plans, recruits and boss waves', () => {
    for (const era of ['stone', 'bronze'] as EraId[]) {
      const sim = new BattleSimulation(3, [], 4, 'steel', ERA_STARTER_KINDS[era], undefined, era, undefined, 10000);
      expect(sim.hire(('shield' as unknown as typeof ERA_STARTER_KINDS.stone[number]))).toBe(false);
      for (let i = 0; i < 1000; i++) sim.step();
      expect(sim.units.filter(u => u.team === 'enemy').every(u => ERA_BATTLES[era][3].roster.includes(u.kind))).toBe(true);
      expect(sim.units.some(u => u.kind === (era === 'stone' ? 'stoneChief' : 'bronzeKing'))).toBe(false);
      sim.enemyFortressHp = 50;
      sim.step();
      expect(sim.bossPhase).toBe('assault');

      expect(sim.events.some(e => e.type === 'boss-assault')).toBe(true);
      expect(sim.units.some(u => u.kind === (era === 'stone' ? 'stoneChief' : 'bronzeKing'))).toBe(true);
    }
  });

  it('gives a stone scout one stronger opening hit against a ranged defender', () => {
    const sim = new BattleSimulation(0, [], 3, 'steel', ['stoneScout'], undefined, 'stone');
    sim.resource = 100;
    expect(sim.hire('stoneScout')).toBe(true);
    const scout = sim.units[0];
    scout.x = 400; scout.cooldown = 0;
    sim.units.push({ id: 999, kind: 'stoneEnemySlinger', team: 'enemy', x: 425,
      hp: 200, maxHp: 200, cooldown: 100, action: 'idle', facing: -1 });
    sim.step();
    const first = sim.events.find(event => event.type === 'attack' && event.sourceId === scout.id)?.amount;
    scout.cooldown = 0;
    sim.step();
    const strikes = sim.events.filter(event => event.type === 'attack' && event.sourceId === scout.id);
    expect(strikes).toHaveLength(2);
    expect(first).toBeGreaterThan(strikes[1].amount!);
  });

  it('makes a bronze guard resist more damage when a phalanx ally is nearby', () => {
    const damage = (formed: boolean) => {
      const sim = new BattleSimulation(0, [], 4, 'steel', ['bronzeGuard', 'bronzeSpear'], undefined, 'bronze');
      sim.resource = 100;
      sim.hire('bronzeGuard');
      const guard = sim.units[0];
      guard.x = 400; guard.cooldown = 100;
      if (formed) {
        sim.hire('bronzeSpear');
        sim.units[1].x = 460; sim.units[1].cooldown = 100;
      }
      sim.units.push({ id: 999, kind: 'bronzeRaider', team: 'enemy', x: 410,
        hp: 100, maxHp: 100, cooldown: 0, action: 'idle', facing: -1 });
      sim.step();
      return sim.events.find(event => event.type === 'attack' && event.sourceId === 999)?.amount;
    };
    expect(damage(true)).toBeLessThan(damage(false)!);
  });

  it('keeps a new player in stone and stores permanent unlocks independently of an active run', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    const game = new GameDirector(save);
    expect(game.getState().eraId).toBe('stone');
    expect(game.getState().unlockedEras.bronze).toBe(false);
    expect(game.selectEra('bronze')).toBe(false);
    game.startNewRun(1);
    expect(game.getState().roster).toEqual(ERA_STARTER_KINDS.stone);
    expect(game.setLoadout(ERA_STARTER_KINDS.bronze)).toBe(false);
    save.writeEraProgress({ unlocked: { stone: true, bronze: true }, wins: { stone: 4, bronze: 1 }, challenges: { stone: false, bronze: false } });
    const restored = new GameDirector(save);
    expect(restored.getState().unlockedEras.bronze).toBe(true);
    expect(restored.getState().eraProgress.stone).toBe(4);
    expect(restored.selectEra('bronze')).toBe(true);
    restored.startNewRun(2);
    expect(restored.getState().roster).toEqual(ERA_STARTER_KINDS.bronze);
    expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS.bronze.slice(0, 5));
    const next = new GameDirector(save);
    next.continueRun();
    expect(next.getState().eraId).toBe('bronze');
    expect(next.getState().roster).toEqual(ERA_STARTER_KINDS.bronze);
  });

  it('ignores the removed prototype campaign in v2 saves', () => {
    const storage = new MemoryStorage();
    storage.setItem('arena-naemnikov-run-v2', JSON.stringify({ version: 2, seed: 42, battleIndex: 2,
      phase: 'contract', doctrine: 'steel', roster: ['stoneShield', 'stoneSpear', 'stoneSlinger', 'stoneShaman'], upgrades: [], rewards: [],
      contracts: [], selectedContract: null, report: null, runTime: 42 }));
    const game = new GameDirector(new SaveService(storage));
    game.continueRun();
    expect(game.getState().eraId).toBe('stone');
    expect(game.getState().canContinue).toBe(false);
    expect(game.getState().battleIndex).toBe(0);
    expect(game.getState().roster).toEqual(ERA_STARTER_KINDS.stone);
  });
});

describe('era campaign smoke', () => {
  it.each(['stone', 'bronze', 'iron'] as const)('%s starter lineup with progression can finish four battles', era => {
    const roster = ERA_STARTER_KINDS[era];
    const results = [];
    for (let index = 0; index < 4; index++) {
      const { tier, order } = CAMPAIGN_PLANS[era][index];
      const sim = new BattleSimulation(index, [], 23, 'steel', roster, undefined, era,
        { damage: tier, health: tier, attackSpeed: tier, supply: tier }, 1 + tier * 10);
      const result = play(sim, [...order].map(i => roster[Number(i)]));
      results.push({ won: result?.won, duration: result?.duration, reason: result?.reason });
    }
    expect(results.map(r => r.won), JSON.stringify(results)).toEqual([true, true, true, true]);
  });
});

describe('era transition', () => {
  it('returns from menu pages without losing the saved preparation, contract or reward', () => {
    const save = new SaveService(new MemoryStorage());
    const game = new GameDirector(save);
    game.startNewRun(23);
    expect(game.returnToMenu()).toBe(true);
    expect(game.getState().phase).toBe('menu');
    expect(game.getState().canContinue).toBe(true);
    game.continueRun();
    expect(game.getState().phase).toBe('preparation');
    game.selectDoctrine('steel'); game.beginRun();
    expect(game.returnToMenu()).toBe(true);
    game.continueRun();
    expect(game.getState().phase).toBe('contract');
    game.chooseContract(game.getState().contracts[0].id);
    expect(game.returnToMenu()).toBe(true);
    expect(game.getState().phase).toBe('menu');
    game.continueRun();
    expect(game.getState().phase).toBe('battle');
    const roster = ERA_STARTER_KINDS.stone;
    const plan = [roster[0], roster[1], roster[2]];
    let purchase = 0;
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) {
      game.tick();
      if (game.hire(plan[purchase % plan.length])) purchase++;
    }
    expect(game.getState().phase).toBe('reward');
    const rewards = game.getState().rewards;
    expect(game.returnToMenu()).toBe(true);
    game.continueRun();
    expect(game.getState().phase).toBe('reward');
    expect(game.getState().rewards).toEqual(rewards);
  });

  it('unlocks bronze after the stone boss and preserves both campaigns across reloads', () => {
    const storage = new MemoryStorage();
    let game = new GameDirector(new SaveService(storage));
    game.startNewRun(23);
    expect(game.selectDoctrine('steel')).toBe(true);
    expect(game.beginRun()).toBe(true);
    for (let battle = 0; battle < 4; battle++) {
      completeCampaignBattle(game, battle);
      const state = game.getState();
      expect(state.report?.won, `stone battle ${battle + 1}: ${state.report?.reason}`).toBe(true);
      expect(state.eraProgress.stone).toBe(battle + 1);
      if (battle < 3) {
        expect(state.phase).toBe('reward');
        game = new GameDirector(new SaveService(storage));
        game.continueRun();
        expect(game.getState().eraId).toBe('stone');
        expect(game.chooseReward(game.getState().rewards[0].id)).toBe(true);
      }
    }
    expect(game.getState().phase).toBe('victory');
    expect(game.getState().gold).toBeGreaterThan(0);
    expect(game.getState().unlockedEras.bronze).toBe(true);
    expect(game.selectEra('bronze')).toBe(true);
    game.startNewRun(24);
    expect(game.getState().eraId).toBe('bronze');
    expect(game.getState().roster).toEqual(ERA_STARTER_KINDS.bronze);
    game = new GameDirector(new SaveService(storage));
    game.continueRun();
    expect(game.getState().eraId).toBe('bronze');
    expect(game.getState().unlockedEras.bronze).toBe(true);
    expect(game.getState().unlockedUnits).toEqual(ERA_STARTER_KINDS.bronze);
  });
});

describe('era mastery', () => {
  it('unlocks the seventh card after the third victory and preserves the unlock', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    save.writeEraProgress({ unlocked: { stone: true, bronze: false }, wins: { stone: 2, bronze: 0 }, challenges: { stone: false, bronze: false } });
    let game = new GameDirector(save);
    game.startNewRun(23); game.selectDoctrine('steel'); game.beginRun();
    expect(game.getState().unlockedUnits).not.toContain(ERA_HIRE_KINDS.stone[6]);
    save.write({ ...save.load()!, battleIndex: 2, contracts: [] });
    game = new GameDirector(save); game.continueRun();
    completeCampaignBattle(game, 2);
    expect(game.getState().report?.won).toBe(true);
    expect(game.getState().eraProgress.stone).toBe(3);
    expect(game.getState().unlockedUnits).toContain(ERA_HIRE_KINDS.stone[6]);
    game = new GameDirector(new SaveService(storage));
    expect(game.getState().eraProgress.stone).toBe(3);
    game.startNewRun(12);
    expect(game.getState().unlockedUnits).toContain(ERA_HIRE_KINDS.stone[6]);
  });
});

describe('bronze campaign persistence', () => {
  it('unlocks Iron after the bronze commandant and preserves that transition', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    save.writeEraProgress({ unlocked: { stone: true, bronze: true },
      wins: { stone: 4, bronze: 0 }, challenges: { stone: false, bronze: false } });
    let game = new GameDirector(save);
    expect(game.selectEra('bronze')).toBe(true);
    game.startNewRun(23);
    game.selectDoctrine('steel'); game.beginRun();
    for (let battle = 0; battle < 4; battle++) {
      completeCampaignBattle(game, battle);
      expect(game.getState().report?.won, `bronze battle ${battle + 1}`).toBe(true);
      if (battle < 3) expect(game.chooseReward(game.getState().rewards[0].id)).toBe(true);
    }
    expect(game.getState().phase).toBe('victory');
    expect(game.getState().eraProgress.bronze).toBe(4);
    expect(Object.keys(game.getState().unlockedEras)).toEqual(['stone', 'bronze', 'iron', 'antique', 'medieval', 'high-medieval']);
    expect(game.getState().unlockedEras.iron).toBe(true);
    game = new GameDirector(save);
    expect(game.getState().eraProgress.bronze).toBe(4);
    expect(game.selectEra('bronze')).toBe(true);
    game.startNewRun(24);
    expect(game.getState().unlockedUnits).toContain('bronzeRam');
  });

  it('retains epoch unlocks and mastery when a later run is lost', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    save.writeEraProgress({ unlocked: { stone: true, bronze: true },
      wins: { stone: 4, bronze: 2 }, challenges: { stone: true, bronze: true } });
    let game = new GameDirector(save);
    game.selectEra('bronze'); game.startNewRun(3);
    game.selectDoctrine('steel'); game.beginRun(); game.chooseContract(game.getState().contracts[0].id);
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) game.tick();
    expect(game.getState().phase).toBe('defeat');
    game = new GameDirector(save);
    expect(game.getState().unlockedEras.bronze).toBe(true);
    expect(game.getState().eraChallenges.bronze).toBe(true);
    expect(game.getState().eraProgress.bronze).toBe(2);
    expect(game.getState().canContinue).toBe(true);
    game.continueRun();
    expect(game.getState().phase).toBe('battle');
    expect(game.getState().battleIndex).toBe(0);
  });

  it('keeps the second battle after defeat and applies a purchased talent on retry', () => {
    const save = new SaveService(new MemoryStorage());
    let game = new GameDirector(save);
    game.startNewRun(23);
    game.selectDoctrine('steel'); game.beginRun();
    game.chooseContract(game.getState().contracts[0].id);
    const plan = ['012'].flatMap(order => [...order].map(i => ERA_STARTER_KINDS.stone[Number(i)]));
    let purchase = 0;
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) {
      game.tick();
      if (game.hire(plan[purchase % plan.length])) purchase++;
    }
    expect(game.getState().phase).toBe('reward');
    expect(game.chooseReward(game.getState().rewards[0].id)).toBe(true);
    expect(game.getState().battleIndex).toBe(1);
    const upgrades = game.getState().chosenUpgrades;
    expect(game.chooseContract(game.getState().contracts[0].id)).toBe(true);
    const contract = game.getState().selectedContract;
    const originalIncome = game.getState().income;
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) game.tick();
    expect(game.getState().phase).toBe('defeat');
    expect(game.getState().battleIndex).toBe(1);
    expect(game.getState().canContinue).toBe(true);
    expect(save.load()?.battleIndex).toBe(1);
    expect(game.buyTalent('supply')).toBe(true);
    expect(game.retryBattle()).toBe(true);
    expect(game.getState().phase).toBe('battle');
    expect(game.getState().battleIndex).toBe(1);
    expect(game.getState().selectedContract).toBe(contract);
    expect(game.getState().chosenUpgrades).toEqual(upgrades);
    expect(game.getState().income).toBeCloseTo(originalIncome * 1.05);
    game = new GameDirector(save);
    game.continueRun();
    expect(game.getState().phase).toBe('battle');
    expect(game.getState().battleIndex).toBe(1);
    expect(game.getState().selectedContract).toBe(contract);
    expect(game.getState().chosenUpgrades).toEqual(upgrades);
    expect(game.getState().income).toBeCloseTo(originalIncome * 1.05);
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) game.tick();
    expect(game.getState().phase).toBe('defeat');
    expect(game.returnToMenu()).toBe(true);
    expect(game.getState().canContinue).toBe(true);
    expect(game.getState().battleIndex).toBe(1);
    game.continueRun();
    expect(game.getState().phase).toBe('battle');
    expect(game.getState().battleIndex).toBe(1);
    expect(game.getState().chosenUpgrades).toEqual(upgrades);
  });
});

describe('debug battle speed', () => {
  it('accepts x1–x5, keeps fixed simulation steps and respects pause', () => {
    const save = new SaveService(new MemoryStorage());
    const game = new GameDirector(save);
    expect(game.getState().battleSpeed).toBe(1);
    for (const speed of [0, 6, 1.5, NaN, Infinity]) expect(game.setBattleSpeed(speed)).toBe(false);
    expect(game.setBattleSpeed(5)).toBe(true);
    game.startNewRun(23);
    game.selectDoctrine('steel'); game.beginRun();
    game.chooseContract(game.getState().contracts[0].id);
    for (let i = 0; i < 150; i++) game.tick();
    expect(game.getState().elapsed).toBeCloseTo(5);
    expect(game.getState().gold).toBe(5);
    game.togglePause();
    const before = game.getState();
    for (let i = 0; i < 150; i++) game.tick();
    expect(game.getState().elapsed).toBe(before.elapsed);
    expect(game.getState().gold).toBe(before.gold);
    expect(game.setBattleSpeed(1)).toBe(true);
    game.togglePause();
    for (let i = 0; i < 30; i++) game.tick();
    expect(game.getState().elapsed).toBeCloseTo(6);
    expect(new GameDirector(save).getState().battleSpeed).toBe(1);
  });
});
