import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import type { HireKind } from '../src/core/types';

const strategies: Record<string, HireKind[]> = {
  balanced: ['shield', 'archer', 'archer', 'spear', 'medic'],
  spearLine: ['shield', 'spear', 'spear', 'archer', 'medic'],
  archerRush: ['archer', 'archer', 'archer', 'shield'],
  raiderFlank: ['shield', 'spear', 'raider', 'archer', 'raider'],
  splashLine: ['shield', 'spear', 'thrower', 'medic'],
  shieldsOnly: ['shield']
};

function run(battle: number, seed: number, plan: HireKind[]) {
  const roster = [...new Set(plan)].slice(0, 4);
  for (const kind of ['shield', 'spear', 'archer', 'medic'] as HireKind[]) if (roster.length < 4 && !roster.includes(kind)) roster.push(kind);
  const sim = new BattleSimulation(battle, [], seed, 'steel', roster);
  let purchase = 0;
  for (let i = 0; i < 420 * 30 && !sim.report; i++) {
    sim.step();
    if (sim.hire(plan[purchase % plan.length])) purchase++;
  }
  return sim.report!;
}

describe('headless balance scenarios', () => {
  it('finishes for distinct compositions and exposes outcome reasons', () => {
    const results = Object.fromEntries(Object.entries(strategies).map(([name, plan]) => [name,
      [0, 1, 2, 3].map(index => run(index, 41, plan))]));
    for (const battles of Object.values(results)) for (const battle of battles) {
      expect(battle.duration).toBeLessThan(420);
      expect(battle.reason.length).toBeGreaterThan(15);
    }
    expect(results.spearLine[1].won).toBe(true); // pikes answer armored wall
    expect(results.spearLine[2].won).toBe(true);
    expect(results.archerRush[1].won).toBe(false); // archers alone fail into armor
    expect(results.archerRush[2].won).toBe(true);
    expect(results.archerRush[3].won).toBe(true);
    expect(results.archerRush[3].duration).toBeLessThan(300);
    expect(results.raiderFlank[2].won).toBe(true); // fast pressure is another ranged answer
    expect(results.shieldsOnly[1].won).toBe(false);
    expect(results.shieldsOnly[1].reason).toMatch(/Латники/);
  });
});
