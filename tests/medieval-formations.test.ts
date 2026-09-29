import { expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';
import { ERA_BATTLES, UNITS } from '../src/data/content';
import type { UnitKind } from '../src/core/types';

const formations: UnitKind[][] = [
  ['medievalGuard', 'medievalLongbow', 'medievalBerserker'],
  ['medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalHorn'],
  ['medievalGuard', 'medievalLongbow', 'medievalGuard', 'medievalThrower', 'medievalRam'],
  ['medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalThrower'],
];

it('uses the requested medieval enemy balance for all four battles', () => {
  expect(enemyBalanceDefaults('medieval')).toEqual([
    { income: 25, startSupplies: 20, hpBonus: 20, damageBonus: 20 },
    { income: 30, startSupplies: 40, hpBonus: 33, damageBonus: 33 },
    { income: 36, startSupplies: 50, hpBonus: 48, damageBonus: 48 },
    { income: 36, startSupplies: 50, hpBonus: 36, damageBonus: 40 },
  ]);
});

it.each([0, 1, 2, 3])('recruits the combined medieval formation in battle %i', battle => {
  const simulation = new BattleSimulation(battle, [], 23, 'steel', undefined, undefined, 'medieval');
  const expected = formations[battle];
  simulation.enemyResource = expected.reduce((sum, kind) => sum + UNITS[kind].cost, 0);
  for (let i = 0; i < 76; i++) simulation.step();
  expect(simulation.units.filter(unit => unit.team === 'enemy').slice(0, expected.length).map(unit => unit.kind)).toEqual(expected);
  expect(simulation.units.some(unit => unit.kind === 'medievalJarl')).toBe(false);
});

it('keeps bows and anti-armor troops in the siege defense instead of recruiting only shields', () => {
  const simulation = new BattleSimulation(2, [], 23, 'steel', undefined, undefined, 'medieval');
  simulation.units.push({ id: 10000, kind: 'medievalGuard', team: 'ally', x: 710,
    hp: 10000, maxHp: 10000, cooldown: 1000, action: 'idle', facing: 1 });
  simulation.enemyResource = 400;
  for (let i = 0; i < 76; i++) simulation.step();
  expect(simulation.units.filter(unit => unit.team === 'enemy').slice(0, 4).map(unit => unit.kind))
    .toEqual(['medievalGuard', 'medievalLongbow', 'medievalGuard', 'medievalPikeman']);
  expect(simulation.units.some(unit => unit.kind === 'medievalRam')).toBe(false);
});

it('updates shield-line recruitment even when continuing a contract saved with the old roster', () => {
  const battle = ERA_BATTLES.medieval[1];
  const simulation = new BattleSimulation(1, [], 23, 'steel', undefined, {
    id: 'old', name: battle.name, threat: battle.threat,
    roster: ['medievalGuard', 'medievalPikeman', 'medievalHorn'],
    condition: '', reward: '', marks: 1, risk: 'standard', enemyIncome: battle.enemyIncome,
  }, 'medieval');
  simulation.enemyResource = 400;
  for (let i = 0; i < 76; i++) simulation.step();
  expect(simulation.units.some(unit => unit.kind === 'medievalLongbow')).toBe(true);
});

it('deploys a protected and healed jarl squad only at half fortress health', () => {
  const simulation = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'medieval');
  simulation.step();
  expect(simulation.units).toHaveLength(0);
  simulation.enemyFortressHp = 50;
  simulation.step();
  expect(simulation.units.map(unit => unit.kind)).toEqual([
    'medievalJarl', 'medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalBerserker', 'medievalHealer',
  ]);
  expect(simulation.bossPhase).toBe('assault');
});
