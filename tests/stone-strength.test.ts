import { expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { UNITS } from '../src/data/content';

it.each([[0, 1, 1], [1, 1, 1], [2, 1.3, 1.1], [3, 1.35, 1.15]])('applies stone battle %i health and damage scaling', (index, health, damage) => {
  const sim = new BattleSimulation(index, [], 23, 'steel', undefined, undefined, 'stone');
  sim.enemyResource = 100;
  for (let i = 0; i < 76; i++) sim.step();
  const enemy = sim.units.find(unit => unit.team === 'enemy')!;
  expect(enemy.maxHp).toBe(Math.round(UNITS[enemy.kind].hp * health));
  sim.units.splice(0, sim.units.length, enemy);
  sim.resource = 100;
  expect(sim.hire('stoneShield')).toBe(true);
  const ally = sim.units.find(unit => unit.team === 'ally')!;
  expect(ally.maxHp).toBe(UNITS.stoneShield.hp);
  enemy.x = 500; ally.x = 499;
  enemy.cooldown = 0; ally.cooldown = 100;
  const before = ally.hp;
  sim.step();
  expect(before - ally.hp).toBeCloseTo(UNITS[enemy.kind].damage * damage * (1 - UNITS.stoneShield.armor), 6);
});

it('increases stone finale boss health by thirty-five percent as well as regular troops', () => {
  const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'stone');
  sim.enemyFortressHp = 50;
  sim.step();
  expect(sim.units.find(unit => unit.kind === 'stoneChief')?.maxHp).toBe(810);
});


it('recruits a balanced shield, hunter and slinger cycle in the stone finale', () => {
  const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'stone');
  sim.enemyResource = 150;
  for (let i = 0; i < 76; i++) sim.step();
  expect(sim.units.map(unit => unit.kind)).toEqual([
    'stoneBone', 'stoneHunter', 'stoneEnemySlinger',
    'stoneBone', 'stoneHunter', 'stoneEnemySlinger',
    'stoneBone', 'stoneHunter'
  ]);
  expect(sim.units.some(unit => unit.kind === 'stoneChief')).toBe(false);
  sim.enemyFortressHp = 50;
  sim.step();
  expect(sim.units.slice(-4).map(unit => unit.kind)).toEqual([
    'stoneChief', 'stoneBone', 'stoneHunter', 'stoneEnemySlinger'
  ]);
});
