import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { emptyTalentProgress, talentCost, combinedTalents, type TalentId, type TalentLevels } from '../src/core/talents';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function combat(levels: TalentLevels) {
  const sim = new BattleSimulation(0, [], 7, 'steel', ['stoneShield'], undefined, 'stone', levels);
  sim.resource = 100;
  expect(sim.hire('stoneShield')).toBe(true);
  const ally = sim.units[0];
  ally.x = 400; ally.cooldown = 0;
  sim.units.push({ id: 900, kind: 'stoneBone', team: 'enemy', x: 420,
    hp: 200, maxHp: 200, cooldown: 100, action: 'idle', facing: -1 });
  sim.step();
  return { sim, ally, damage: sim.events.find(e => e.type === 'attack' && e.sourceId === ally.id)?.amount };
}

describe('permanent talents', () => {
  it('applies four 5% bonuses to allies in the deterministic battle simulation', () => {
    const base = emptyTalentProgress().levels;
    const normal = combat(base);
    const enhanced = combat({ damage: 1, attackSpeed: 1, health: 1, supply: 1 });
    expect(enhanced.damage).toBeGreaterThan(normal.damage!);
    expect(enhanced.ally.cooldown).toBeLessThan(normal.ally.cooldown);
    expect(enhanced.ally.maxHp).toBeGreaterThan(normal.ally.maxHp);
    expect(enhanced.sim.income).toBeCloseTo(normal.sim.income * 1.05);
    expect(enhanced.sim.enemyIncome).toBe(normal.sim.enemyIncome);
    expect(enhanced.sim.units.find(u => u.team === 'enemy')?.maxHp).toBe(200);
  });

  it('saves kill gold during battle and after a loss, then buys a talent for the retry', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    const game = new GameDirector(save);
    expect(game.getState().gold).toBe(0);
    expect(game.buyTalent('damage')).toBe(false);
    game.startNewRun(23); game.selectDoctrine('steel'); game.beginRun();
    game.chooseContract(game.getState().contracts[0].id);
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) {
      game.tick();
      if (game.getState().battleGold < 10) game.hire('stoneSpear');
      if (game.getState().gold > 0) {
        expect(save.loadTalents().gold).toBe(game.getState().gold);
        if (game.getState().phase === 'battle') expect(game.buyTalent('damage')).toBe(false);
      }
    }
    expect(game.getState().phase).toBe('defeat');
    const earned = game.getState().gold;
    expect(earned).toBeGreaterThanOrEqual(talentCost(0));
    expect(game.getState().report?.goldEarned).toBe(earned);
    expect(game.getState().globalTalentPoints).toBe(0);
    expect(game.buyTalent('damage')).toBe(true);
    expect(game.getState().gold).toBe(earned - talentCost(0));
    const restored = new GameDirector(save);
    expect(restored.getState().talents.damage).toBe(1);
    expect(restored.getState().gold).toBe(earned - talentCost(0));
    expect(game.retryBattle()).toBe(true);
    expect(game.getState().battleGold).toBe(0);
    expect(game.getState().gold).toBe(earned - talentCost(0));
  });

  it('counts direct and splash kills once, excludes allies and uses era bounties', () => {
    for (const era of ['stone', 'bronze'] as const) {
      const sim = new BattleSimulation(0, [], 7, 'steel', undefined, undefined, era);
      sim.units.push({ id: 10, kind: 'stoneThrower', team: 'ally', x: 400,
        hp: 20, maxHp: 20, cooldown: 0, action: 'idle', facing: 1 });
      for (const id of [11, 12, 13]) sim.units.push({ id, kind: 'stoneEnemySlinger', team: 'enemy', x: 420,
        hp: 1, maxHp: 20, cooldown: 100, action: 'idle', facing: -1 });
      sim.units.push({ id: 14, kind: 'stoneShield', team: 'ally', x: 100,
        hp: 0, maxHp: 50, cooldown: 100, action: 'idle', facing: 1 });
      sim.step();
      expect(sim.goldEarned).toBe(era === 'bronze' ? 6 : 3);
      sim.step();
      expect(sim.goldEarned).toBe(era === 'bronze' ? 6 : 3);
    }
  });

  it('awards the common victory bonus once', () => {
    const sim = new BattleSimulation(0, [], 7);
    sim.enemyFortressHp = 0; sim.step();
    expect(sim.report?.won).toBe(true);
    expect(sim.report?.goldEarned).toBe(25);
    expect(sim.goldEarned).toBe(25);
  });

  it('has no five-rank cap and charges increasing gold prices', () => {
    const save = new SaveService(new MemoryStorage());
    save.writeTalents({ gold: 1000, levels: emptyTalentProgress().levels });
    const game = new GameDirector(save);
    for (let i = 0; i < 8; i++) expect(game.buyTalent('health')).toBe(true);
    expect(game.getState().talents.health).toBe(8);
    expect(game.getState().gold).toBe(1000 - Array.from({ length: 8 }, (_, i) => talentCost(i)).reduce((a, b) => a + b, 0));
    expect(new GameDirector(save).getState().talents.health).toBe(8);
    expect(Array.from({ length: 6 }, (_, i) => talentCost(i))).toEqual([10, 20, 35, 55, 80, 110]);
  });

  it('starts a new era at zero and awards a global point only on the first transition', () => {
    const save = new SaveService(new MemoryStorage());
    save.writeEraProgress({ unlocked: { stone: true, bronze: true },
      wins: { stone: 4, bronze: 0 }, challenges: { stone: false, bronze: false } });
    save.writeTalents({ gold: 87, levels: { ...emptyTalentProgress().levels, damage: 3 } });
    let game = new GameDirector(save);
    expect(game.selectEra('bronze')).toBe(true);
    expect(game.getState().gold).toBe(0);
    expect(game.getState().talents.damage).toBe(0);
    expect(game.getState().globalTalentPoints).toBe(0);
    game.startNewRun(99);
    expect(game.getState().globalTalentPoints).toBe(1);
    expect(game.buyGlobalTalent('supply')).toBe(true);
    expect(game.getState().globalTalentPoints).toBe(0);
    expect(game.getState().globalTalents.supply).toBe(1);
    expect(game.buyGlobalTalent('supply')).toBe(false);
    game.returnToMenu(); game.selectEra('stone');
    expect(game.getState().gold).toBe(87);
    expect(game.getState().talents.damage).toBe(3);
    expect(game.getState().globalTalents.supply).toBe(1);
    game.startNewRun(98); game.returnToMenu(); game.selectEra('bronze'); game.startNewRun(97);
    expect(game.getState().globalTalentPoints).toBe(0);
    game = new GameDirector(save); game.continueRun();
    expect(game.getState().globalTalents.supply).toBe(1);
    expect(game.getState().globalTalentPoints).toBe(0);
    game.selectDoctrine('steel'); game.beginRun(); game.chooseContract(game.getState().contracts[0].id);
    expect(game.buyGlobalTalent('health')).toBe(false);
    const normal = new BattleSimulation(0, [], 97, 'steel', undefined, undefined, 'bronze');
    expect(game.getState().income).toBeCloseTo(normal.income * 1.05);
    expect(combinedTalents({ ...emptyTalentProgress().levels, supply: 3 }, game.getState().globalTalents).supply).toBe(4);
  });

  it('charges one point for every global talent rank and preserves purchases after reload', () => {
    const save = new SaveService(new MemoryStorage());
    const levels = { damage: 0, attackSpeed: 1, health: 5, supply: 20 };
    save.writeGlobalTalents({ points: 8, levels: { ...levels }, advancedEras: [] });
    let game = new GameDirector(save);
    let points = 8;
    for (const id of Object.keys(levels) as TalentId[]) {
      for (let rank = 0; rank < 2; rank++) {
        expect(game.buyGlobalTalent(id)).toBe(true);
        expect(game.getState().globalTalentPoints).toBe(--points);
        expect(game.getState().globalTalents[id]).toBe(++levels[id]);
        game = new GameDirector(save);
        expect(game.getState().globalTalentPoints).toBe(points);
        expect(game.getState().globalTalents).toEqual(levels);
      }
    }
    expect(game.buyGlobalTalent('supply')).toBe(false);
    expect(game.getState().globalTalents).toEqual(levels);
    expect(game.getState().globalTalentPoints).toBe(0);
  });

  it('loads safely when the talent record is malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem('arena-naemnikov-talents-v1', JSON.stringify({ points: -10, levels: { damage: 99 } }));
    expect(new SaveService(storage).loadTalents()).toEqual(emptyTalentProgress());
  });

  it('converts earlier contract marks once when migrating an existing player', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    save.writeRecords({ runs: 3, wins: 1, bestBattle: 4, bestTime: 300, marks: 7 });
    expect(save.loadTalents().gold).toBe(70);
    expect(save.loadTalents().gold).toBe(70);
    const game = new GameDirector(save);
    expect(game.buyTalent('health')).toBe(true);
    expect(new GameDirector(save).getState().gold).toBe(60);
  });
});

describe('old talent migration', () => {
  it('keeps ranks and converts unspent points once into the active era only', () => {
    const storage = new MemoryStorage();
    storage.setItem('arena-naemnikov-talents-v1', JSON.stringify({ points: 7, levels: { damage: 2, attackSpeed: 1, health: 0, supply: 3 } }));
    const save = new SaveService(storage);
    expect(save.loadTalents().gold).toBe(70);
    expect(save.loadTalents().levels.damage).toBe(2);
    expect(save.loadTalents('bronze')).toEqual(emptyTalentProgress());
    const game = new GameDirector(save); game.buyTalent('health');
    expect(new GameDirector(save).getState().gold).toBe(60);
    expect(new GameDirector(save).getState().globalTalentPoints).toBe(0);
  });
});

describe('base upgrades and time income', () => {
  it('starts with one HP, buys +10 HP for gold and retains it for retries in the same era', () => {
    const save = new SaveService(new MemoryStorage());
    const game = new GameDirector(save);
    expect(game.getState().allyFortressMaxHp).toBe(1);
    expect(game.buyBaseHealth()).toBe(false);
    save.writeTalents({ gold: 25, levels: emptyTalentProgress().levels });
    const funded = new GameDirector(save);
    expect(funded.buyBaseHealth()).toBe(true);
    expect(funded.getState().gold).toBe(15);
    expect(funded.getState().allyFortressMaxHp).toBe(11);
    expect(funded.buyBaseHealth()).toBe(true);
    expect(funded.getState().gold).toBe(0);
    expect(new GameDirector(save).getState().allyFortressMaxHp).toBe(21);
    funded.startNewRun(3); funded.selectDoctrine('steel'); funded.beginRun();
    funded.chooseContract(funded.getState().contracts[0].id);
    expect(funded.getState().allyFortressHp).toBe(21);
    expect(funded.buyBaseHealth()).toBe(false);
    expect(save.loadTalents('bronze').baseLevel ?? 0).toBe(0);
  });

  it('pays each completed active second once, saves immediately and stops on pause', () => {
    const save = new SaveService(new MemoryStorage());
    const game = new GameDirector(save);
    game.startNewRun(3); game.selectDoctrine('steel'); game.beginRun();
    game.chooseContract(game.getState().contracts[0].id);
    for (let i = 0; i < 29; i++) game.tick();
    expect(game.getState().gold).toBe(0);
    game.tick();
    expect(game.getState().gold).toBe(1);
    expect(save.loadTalents().gold).toBe(1);
    game.togglePause(); for (let i = 0; i < 100; i++) game.tick();
    expect(game.getState().gold).toBe(1);
    game.togglePause(); for (let i = 0; i < 30; i++) game.tick();
    expect(game.getState().gold).toBe(2);
    expect(new GameDirector(save).getState().gold).toBe(2);
  });

  it('allows consecutive purchases without ticking when supplies suffice', () => {
    const sim = new BattleSimulation(0, [], 7);
    sim.resource = 100;
    for (let i = 0; i < 4; i++) expect(sim.hire('stoneShield')).toBe(true);
    expect(sim.elapsed).toBe(0);
    expect(sim.allyCount).toBe(4);
    expect(sim.resource).toBe(42);
  });
});
