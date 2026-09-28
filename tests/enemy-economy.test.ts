import { expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { UNITS } from '../src/data/content';

it('spends the stone finale income on recruits instead of filling the wallet', () => {
  const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'stone');
  expect(sim.enemyIncome).toBe(15);
  expect(sim.enemyResource).toBe(20);
  let spent = 0;
  let largestPurchase = 0;
  for (let i = 0; i < 60 * 30; i++) {
    sim.step();
    const enemies = sim.units.filter(unit => unit.team === 'enemy');
    largestPurchase = Math.max(largestPurchase, enemies.length);
    spent += enemies.reduce((sum, unit) => sum + UNITS[unit.kind].cost, 0);
    // Isolate recruitment from combat losses and fortress damage.
    sim.units.length = 0;
  }
  expect(largestPurchase).toBeGreaterThan(1);
  expect(spent).toBeGreaterThan(850);
  expect(spent + sim.enemyResource).toBeCloseTo(920, 6);
});


it('keeps supplies above 100 for both sides without losing income', () => {
  const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'stone');
  sim.resource = 150;
  sim.enemyResource = 150;
  for (let i = 0; i < 60; i++) sim.step();
  expect(sim.resource).toBeCloseTo(162, 6);
  expect(sim.enemyResource).toBeCloseTo(180, 6);
});

it('gives field supplies as an opening reserve instead of increasing a cap', () => {
  const sim = new BattleSimulation(0, ['supply'], 23, 'bargain', undefined, undefined, 'stone');
  expect(sim.resource).toBe(40);
});
