import { expect, it } from 'vitest';
import { GameDirector } from '../src/core/GameDirector';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { SaveService, type StorageLike } from '../src/core/save';
import { emptyGlobalTalents } from '../src/core/talents';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

it('buys local, global and base upgrades on manual pause without restarting or advancing battle', () => {
  const save = new SaveService(new MemoryStorage());
  save.writeGlobalTalents({ ...emptyGlobalTalents(), points: 2 });
  const app = new GameDirector(save);
  app.startDebugBattle(0);
  app.addDebugGold(200);
  app.tick();
  const elapsed = app.getState().elapsed;
  const income = app.getState().income;
  expect(app.buyTalent('supply')).toBe(false);
  expect(app.buyBaseHealth()).toBe(false);
  expect(app.buyGlobalTalent('damage')).toBe(false);
  app.setExternalPause(true, 'sdk');
  expect(app.buyTalent('supply')).toBe(false);
  app.setExternalPause(false, 'sdk');
  app.togglePause();
  expect(app.buyTalent('supply')).toBe(true);
  expect(app.buyGlobalTalent('damage')).toBe(true);
  expect(app.buyBaseHealth()).toBe(true);
  expect(app.getState().income).toBeCloseTo(income * 1.05);
  expect(app.getState().allyFortressMaxHp).toBe(11);
  expect(app.getState().gold).toBe(180);
  expect(app.getState().globalTalentPoints).toBe(1);
  app.tick();
  expect(app.getState().elapsed).toBe(elapsed);
  expect(app.getState().paused).toBe(true);
  expect(save.loadTalents().levels.supply).toBe(1);
  expect(save.loadTalents().baseLevel).toBe(1);
  expect(new GameDirector(save).getState().globalTalents.damage).toBe(1);
  app.togglePause();
  app.tick();
  expect(app.getState().elapsed).toBeGreaterThan(elapsed);
});

it('updates existing allies and future hires while preserving wounds, cooldown progress and enemy stats', () => {
  const sim = new BattleSimulation(0, [], 7, 'steel', ['stoneShield'], undefined, 'stone', undefined, 11);
  sim.resource = 100;
  sim.hire('stoneShield');
  const ally = sim.units[0];
  ally.hp = ally.maxHp * .4;
  ally.cooldown = 1.2;
  const enemy = { ...ally, id: 900, team: 'enemy' as const, x: 800 };
  sim.units.push(enemy);
  const enemyBefore = { ...enemy };
  const oldMax = ally.maxHp;
  sim.allyFortressHp = 5;
  const levels = { damage: 1, health: 1, attackSpeed: 1, supply: 1 };
  sim.updateTalents(levels, 21);
  expect(ally.maxHp).toBeGreaterThan(oldMax);
  expect(ally.hp / ally.maxHp).toBeCloseTo(.4);
  expect(ally.cooldown).toBeCloseTo(1.2 / 1.05);
  expect(sim.allyFortressHp / sim.allyFortressMaxHp).toBeCloseTo(5 / 11);
  expect(enemy).toEqual(enemyBefore);
  sim.hire('stoneShield');
  expect(sim.units.at(-1)?.maxHp).toBe(ally.maxHp);
  const upgradedHp = ally.hp;
  sim.updateTalents(levels, 21);
  expect(ally.hp).toBeCloseTo(upgradedHp);
});
