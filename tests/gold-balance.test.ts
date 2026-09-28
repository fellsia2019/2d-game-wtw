import { expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { ERA_STARTER_KINDS } from '../src/data/content';
import { talentCost } from '../src/core/talents';

it('a losing second battle still funds an early talent after repeated attempts', () => {
  const earnings: number[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const sim = new BattleSimulation(1, [], 23, 'steel', undefined, undefined, 'stone');
    const plan = ERA_STARTER_KINDS.stone.slice(0, 3); let purchase = 0;
    while (!sim.report) { sim.step(); if (sim.hire(plan[purchase % plan.length])) purchase++; }
    expect(sim.report.won).toBe(false);
    expect(sim.goldEarned).toBeGreaterThan(0);
    earnings.push(sim.goldEarned);
  }
  expect(earnings.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(talentCost(0));
});
