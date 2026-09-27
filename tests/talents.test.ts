import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { emptyTalentProgress, type TalentLevels } from '../src/core/talents';

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

  it('earns points on victory, pays increasing prices and keeps talents after a loss', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    let game = new GameDirector(save);
    expect(game.getState().talentPoints).toBe(0);
    expect(game.buyTalent('damage')).toBe(false);
    game.startNewRun(23);
    game.selectDoctrine('steel'); game.beginRun();
    game.chooseContract(game.getState().contracts[0].id);
    expect(game.buyTalent('damage')).toBe(false);
    const plan = ['stoneShield', 'stoneSpear', 'stoneSlinger'] as const;
    let purchase = 0;
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) {
      game.tick();
      if (game.hire(plan[purchase % plan.length])) purchase++;
    }
    expect(game.getState().report?.won).toBe(true);
    expect(game.getState().talentPoints).toBe(1);
    expect(game.buyTalent('damage')).toBe(true);
    expect(game.getState().talents.damage).toBe(1);
    expect(game.getState().talentPoints).toBe(0);
    expect(game.buyTalent('damage')).toBe(false);
    game = new GameDirector(save);
    expect(game.getState().talents.damage).toBe(1);
    game.startNewRun(3);
    game.selectDoctrine('steel'); game.beginRun();
    game.chooseContract(game.getState().contracts[0].id);
    for (let i = 0; i < 420 * 30 && game.getState().phase === 'battle'; i++) game.tick();
    expect(game.getState().phase).toBe('defeat');
    game = new GameDirector(save);
    expect(game.getState().talents.damage).toBe(1);
    expect(game.getState().talentPoints).toBe(0);
  });

  it('loads safely when the talent record is malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem('arena-naemnikov-talents-v1', JSON.stringify({ points: -10, levels: { damage: 99 } }));
    expect(new SaveService(storage).loadTalents()).toEqual(emptyTalentProgress());
  });

  it('credits earlier contract marks once when migrating an existing player', () => {
    const storage = new MemoryStorage();
    const save = new SaveService(storage);
    save.writeRecords({ runs: 3, wins: 1, bestBattle: 4, bestTime: 300, marks: 7 });
    expect(save.loadTalents().points).toBe(7);
    expect(save.loadTalents().points).toBe(7);
    const game = new GameDirector(save);
    expect(game.buyTalent('health')).toBe(true);
    expect(new GameDirector(save).getState().talentPoints).toBe(6);
  });
});
