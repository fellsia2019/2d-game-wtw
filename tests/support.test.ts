import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { UNITS } from '../src/data/content';
import type { EraId, Team, UnitKind, UnitState } from '../src/core/types';

const cases: [EraId, UnitKind][] = [['stone', 'stoneTotem'], ['bronze', 'bronzeHerald'], ['iron', 'ironBanner']];
function figure(id: number, kind: UnitKind, team: Team, x: number, cooldown = 0): UnitState {
 return { id, kind, team, x, hp: 100, maxHp: 100, cooldown, action: 'idle', facing: team === 'ally' ? 1 : -1 };
}
describe.each(cases)('%s standard support', (era, kind) => {
 it.each(['ally','enemy'] as const)('%s standard never damages a soldier or fortress', team => {
  expect(UNITS[kind].damage).toBe(0);
  for (const target of ['soldier','fortress']) {
   const sim = new BattleSimulation(0, [], 1, 'steel', undefined, undefined, era);
   const support = figure(100,kind,team,team === 'ally' ? 910 : 90);
   sim.units.push(support);
   if (target === 'soldier') sim.units.push(figure(101,'stoneShield',team === 'ally' ? 'enemy' : 'ally',team === 'ally' ? 925 : 75,10));
   const hp = [sim.allyFortressHp,sim.enemyFortressHp];
   sim.step();
   expect(support.action).toBe('idle');
   expect(sim.events.some(event => event.sourceId === support.id && ['attack','fortress'].includes(event.type))).toBe(false);
   expect(sim.units.every(unit => unit.hp === 100)).toBe(true);
   expect([sim.allyFortressHp,sim.enemyFortressHp]).toEqual(hp);
  }
 });
 it('still accelerates the attacks of nearby allies', () => {
  function strike(withBanner: boolean) {
   const sim = new BattleSimulation(0,[],1,'steel',undefined,undefined,era);
   const attacker = figure(100,'stoneShield','ally',200);
   sim.units.push(attacker,figure(101,'stoneShield','enemy',225,10));
   if(withBanner) sim.units.push(figure(102,kind,'ally',190));
   sim.step();
   return attacker.cooldown;
  }
  expect(strike(true)).toBeCloseTo(strike(false)/1.16);
 });
});
