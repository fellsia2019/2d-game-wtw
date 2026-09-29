import { expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';
import { ERA_BATTLES, UNITS } from '../src/data/content';
import type { UnitKind } from '../src/core/types';

const formations: UnitKind[][] = [
  ['renaissanceCuirassier', 'renaissanceMusket', 'renaissanceDragoon'],
  ['renaissanceCuirassier', 'renaissancePikeman', 'renaissanceMusket', 'renaissanceCaptain'],
  ['renaissanceCuirassier', 'renaissanceMusket', 'renaissanceCuirassier', 'renaissanceGrenadier', 'renaissanceCannon'],
  ['renaissanceCuirassier', 'renaissancePikeman', 'renaissanceMusket', 'renaissanceGrenadier'],
];

it('uses the requested Renaissance enemy balance for all four battles', () => {
  expect(enemyBalanceDefaults('renaissance')).toEqual([
    { income: 32, startSupplies: 25, hpBonus: 22, damageBonus: 22 },
    { income: 40, startSupplies: 40, hpBonus: 40, damageBonus: 40 },
    { income: 43, startSupplies: 50, hpBonus: 50, damageBonus: 50 },
    { income: 45, startSupplies: 55, hpBonus: 50, damageBonus: 50 },
  ]);
});

it.each([0, 1, 2, 3])('recruits the combined Renaissance formation in battle %i', battle => {
  const simulation = new BattleSimulation(battle, [], 23, 'steel', undefined, undefined, 'renaissance');
  const expected = formations[battle];
  simulation.enemyResource = expected.reduce((sum, kind) => sum + UNITS[kind].cost, 0);
  for (let i = 0; i < 76; i++) simulation.step();
  expect(simulation.units.filter(unit => unit.team === 'enemy').slice(0, expected.length).map(unit => unit.kind)).toEqual(expected);
  expect(simulation.units.some(unit => unit.kind === 'renaissanceGeneral')).toBe(false);
});

it('keeps muskets and anti-armor troops in the siege defense instead of recruiting only shields', () => {
  const simulation = new BattleSimulation(2, [], 23, 'steel', undefined, undefined, 'renaissance');
  simulation.units.push({ id: 10000, kind: 'renaissanceCuirassier', team: 'ally', x: 710,
    hp: 10000, maxHp: 10000, cooldown: 1000, action: 'idle', facing: 1 });
  simulation.enemyResource = 400;
  for (let i = 0; i < 76; i++) simulation.step();
  expect(simulation.units.filter(unit => unit.team === 'enemy').slice(0, 4).map(unit => unit.kind))
    .toEqual(['renaissanceCuirassier', 'renaissanceMusket', 'renaissanceCuirassier', 'renaissancePikeman']);
  expect(simulation.units.some(unit => unit.kind === 'renaissanceCannon')).toBe(false);
});

it('updates shield-line recruitment even when continuing a contract saved with the old roster', () => {
  const battle = ERA_BATTLES['renaissance'][1];
  const simulation = new BattleSimulation(1, [], 23, 'steel', undefined, {
    id: 'old', name: battle.name, threat: battle.threat,
    roster: ['renaissanceCuirassier', 'renaissancePikeman', 'renaissanceCaptain'],
    condition: '', reward: '', marks: 1, risk: 'standard', enemyIncome: battle.enemyIncome,
  }, 'renaissance');
  simulation.enemyResource = 400;
  for (let i = 0; i < 76; i++) simulation.step();
  expect(simulation.units.some(unit => unit.kind === 'renaissanceMusket')).toBe(true);
});

it('deploys a protected and healed general squad only at half fortress health', () => {
  const simulation = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'renaissance');
  simulation.step();
  expect(simulation.units).toHaveLength(0);
  simulation.enemyFortressHp = 50;
  simulation.step();
  expect(simulation.units.map(unit => unit.kind)).toEqual([
    'renaissanceGeneral', 'renaissanceCuirassier', 'renaissancePikeman', 'renaissanceMusket', 'renaissanceDragoon', 'renaissanceSurgeon',
  ]);
  expect(simulation.bossPhase).toBe('assault');
});
