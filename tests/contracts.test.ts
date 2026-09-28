import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { UNITS } from '../src/data/content';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function start(save: SaveService) {
  const game = new GameDirector(save);
  game.startNewRun(23); game.selectDoctrine('steel'); game.beginRun();
  return game;
}

describe('epoch contracts', () => {
  it('offers one balance and migrates an old risky checkpoint without losing progress', () => {
    const save = new SaveService(new MemoryStorage());
    const game = start(save);
    expect(game.getState().contracts).toHaveLength(1);
    game.chooseContract(game.getState().contracts[0].id);
    const checkpoint = save.load()!;
    save.write({ ...checkpoint, contractRisk: 'daring', selectedContract: { ...checkpoint.selectedContract!, risk: 'daring', enemyIncome: 50, marks: 2 } });
    const restored = new GameDirector(save); restored.continueRun();
    expect(restored.getState().phase).toBe('battle');
    expect(restored.getState().contracts).toHaveLength(1);
    expect(restored.getState().contractRisk).toBe('standard');
    expect(restored.getState().enemyIncome).toBe(game.getState().enemyIncome);
    expect(restored.getState().roster).toEqual(game.getState().roster);
  });
  it('gives a common victory bonus once with current era stats and no risky bounty', () => {
    for (const era of ['stone', 'bronze'] as const) {
      const sim = new BattleSimulation(0, [], 23, 'steel', undefined, undefined, era);
      expect(sim.enemyResource).toBe(era === 'bronze' ? 10 : 0);
      sim.enemyResource = 100;
      for (let i = 0; i < 76; i++) sim.step();
      const enemy = sim.units.find(unit => unit.team === 'enemy')!;
      expect(enemy.maxHp).toBe(Math.round(UNITS[enemy.kind].hp * (era === 'bronze' ? 1.1 : 1)));
      const before = sim.goldEarned; enemy.hp = 0; sim.step();
      expect(sim.goldEarned - before).toBe(era === 'bronze' ? 2 : 1);
      const beforeWin = sim.goldEarned; sim.enemyFortressHp = 0; sim.step();
      expect(sim.goldEarned - beforeWin).toBe(era === 'bronze' ? 50 : 25);
      sim.step(); expect(sim.goldEarned).toBe(beforeWin + (era === 'bronze' ? 50 : 25));
    }
  });
  it('spawns the boss in the attack that crosses half health, even with a huge hit', () => {
    const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'stone', { damage: 10000, attackSpeed: 0, health: 0, supply: 0 });
    sim.resource = 100; sim.hire('stoneShield');
    sim.units[0].x = 930; sim.units[0].cooldown = 0;
    sim.enemyFortressHp = 51; sim.step();
    expect(sim.events.some(e => e.type === 'boss-assault')).toBe(true);
    expect(sim.units.some(u => u.kind === 'stoneChief')).toBe(true);
    expect(sim.enemyFortressHp).toBe(50);
    expect(sim.report).toBeNull();
    // Protection lasts until the boss dies, not until he crosses an x-coordinate.
    const boss = sim.units.find(u => u.kind === 'stoneChief')!;
    boss.x = 600;
    sim.units[0].cooldown = 100;
    sim.step();
    expect(sim.bossPhase).toBe('assault');
    expect(sim.enemyFortressHp).toBe(50);
    boss.hp = 0;
    sim.step();
    expect(sim.bossPhase).toBe('spent');
    for (const unit of sim.units) if (unit.team === 'enemy') unit.hp = 0;
    sim.step();
    for (let i = 0; i < 151; i++) { sim.enemyResource = 0; sim.step(); }
    sim.units[0].x = 930; sim.units[0].cooldown = 0;
    sim.step();
    expect(sim.report?.won).toBe(true);
  });
});
