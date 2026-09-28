import { it, expect } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';
it.each([['stone','stoneSpear','stoneChief'],['bronze','bronzeSpear','bronzeKing'],['iron','ironSpear','ironCommandant'],['antique','antiqueHoplite','antiqueLegate']] as const)('%s keeps its boss visible under an overpowered army and eventually allows killing it', (era,spear,bossKind) => {
 const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, era, {damage:200,attackSpeed:0,health:0,supply:0});
 for(let i=0;i<40;i++){sim.resource=100;sim.hire(spear);const unit=sim.units[sim.units.length-1];unit.x=910;unit.cooldown=0;}
 sim.enemyFortressHp=51;sim.step();
 const boss=sim.units.find(u=>u.kind===bossKind)!;
 expect(boss).toBeDefined();
 expect(sim.bossPhase).toBe('assault');
 expect(boss.hp).toBeGreaterThanOrEqual(boss.maxHp*.85 - 1e-6);
 expect(sim.events.some(e=>e.type==='boss-assault')).toBe(true);
 // Even sustained overpowered attacks cannot make the boss phase disappear.
 for(let tick=0;tick<120;tick++) {
   for(const unit of sim.units) if(unit.team==='ally'){unit.x=910;unit.cooldown=0;}
   sim.step();
 }
 expect(sim.units.some(unit=>unit.kind===bossKind&&unit.hp>0)).toBe(true);
 expect(sim.bossPhase).toBe('assault');
 expect(sim.enemyFortressHp).toBe(50);
 expect(sim.events.some(e=>e.type==='boss-assault')).toBe(true);
 for(let tick=0;tick<150;tick++) {
   for(const unit of sim.units) if(unit.team==='ally'){unit.x=910;unit.cooldown=0;}
   sim.step();
 }
 expect(sim.units.some(unit=>unit.kind===bossKind&&unit.hp>0)).toBe(false);
 expect(sim.bossPhase).toBe('spent');
});