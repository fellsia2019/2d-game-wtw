import { expect, it } from 'vitest';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { ERA_BATTLES, ERA_STARTER_KINDS } from '../src/data/content';
import { CAMPAIGN_PLANS } from './helpers/campaign';

it.each(CAMPAIGN_PLANS.bronze.map((plan, battle) => [battle, plan.tier]))('bronze battle %i can be completed with progression tier %i', (battle, level) => {
  const sim = new BattleSimulation(battle, [], 23, 'steel', undefined, undefined, 'bronze',
    { damage: level, health: level, attackSpeed: level, supply: level }, 1 + level * 10);
  const order = CAMPAIGN_PLANS.bronze[battle].order;
  let purchase = 0;
  while (!sim.report) {
    sim.step();
    if (sim.hire(ERA_STARTER_KINDS.bronze[Number(order[purchase % order.length])])) purchase++;
  }
  expect(sim.report.won, sim.report.reason).toBe(true);
  expect(sim.elapsed).toBeLessThan(180);
});

it('keeps approved stone economy and strength unchanged', () => {
  expect(ERA_BATTLES.stone.map(battle => [battle.enemyIncome, battle.enemyStartingSupplies ?? 0,
    battle.enemyHealthMultiplier ?? 1, battle.enemyDamageMultiplier ?? 1])).toEqual([
    [5.8, 0, 1, 1], [8, 8, 1, 1], [10, 10, 1.3, 1.1], [15, 20, 1.35, 1.15]
  ]);
  expect(new BattleSimulation(0, [], 23, 'steel', undefined, undefined, 'stone').income).toBe(6);
  expect(new BattleSimulation(0, [], 23, 'steel', undefined, undefined, 'bronze').income).toBe(8);
});

it('recruits two archers per guard in the bronze finale and strengthens its boss', () => {
  const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'bronze');
  sim.enemyResource = 150;
  for (let i = 0; i < 76; i++) sim.step();
  expect(sim.units.slice(0, 3).map(unit => unit.kind)).toEqual(['bronzeGate', 'bronzeEnemyArcher', 'bronzeEnemyArcher']);
  sim.enemyFortressHp = 50;
  sim.step();
  expect(sim.units.find(unit => unit.kind === 'bronzeKing')?.maxHp).toBe(1000);
});


it('recruits archers alongside chariots and spears in the first bronze battle', () => {
  const sim = new BattleSimulation(0, [], 23, 'steel', undefined, undefined, 'bronze');
  sim.enemyResource = 150;
  for (let i = 0; i < 76; i++) sim.step();
  expect(sim.units.slice(0, 3).map(unit => unit.kind)).toEqual([
    'bronzeRaider', 'bronzeEnemySpear', 'bronzeEnemyArcher'
  ]);
  expect(sim.units.find(unit => unit.kind === 'bronzeEnemyArcher')?.maxHp).toBe(25);
});


it('uses the approved bronze debug configuration as the default balance', () => {
  expect(enemyBalanceDefaults('bronze')).toEqual([
    { income: 13, startSupplies: 10, hpBonus: 10, damageBonus: 5 },
    { income: 15, startSupplies: 20, hpBonus: 15, damageBonus: 10 },
    { income: 20, startSupplies: 23, hpBonus: 20, damageBonus: 15 },
    { income: 17, startSupplies: 25, hpBonus: 28, damageBonus: 15 }
  ]);
});


it('lets the bronze boss hit nearby soldiers with its heavy strike', () => {
  const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'bronze');
  sim.enemyFortressHp = 50;
  sim.step();
  const boss = sim.units.find(unit => unit.kind === 'bronzeKing')!;
  expect(boss.maxHp).toBe(1000);
  sim.units.splice(0, sim.units.length, boss);
  for (let i = 0; i < 3; i++) {
    sim.resource = 100;
    sim.hire('bronzeGuard');
    const guard = sim.units[sim.units.length - 1];
    guard.x = 501 + i * 3;
    guard.cooldown = 100;
  }
  boss.x = 500; boss.cooldown = 0;
  sim.step();
  const allies = sim.units.filter(unit => unit.team === 'ally');
  expect(allies).toHaveLength(3);
  expect(allies.every(unit => unit.hp < unit.maxHp)).toBe(true);
  expect(sim.damageTaken).toBeCloseTo(30 * (1 - .47) * 2, 6);
});
