import {expect,it} from 'vitest';
import manifest from '../public/assets/sprite-manifest.json';
import {BattleSimulation} from '../src/core/BattleSimulation';
import {GameDirector} from '../src/core/GameDirector';
import {SaveService,type StorageLike} from '../src/core/save';
import {ERA_HIRE_KINDS,UNITS,nextEra,unitRole,victoryGold} from '../src/data/content';
import {unitArt} from '../src/art/catalog';
import type {UnitKind,Team,UnitState} from '../src/core/types';
import {completeCampaignBattle} from './helpers/campaign';
class MemoryStorage implements StorageLike {
 values=new Map<string,string>();getItem(k:string){return this.values.get(k)??null;}setItem(k:string,v:string){this.values.set(k,v);}removeItem(k:string){this.values.delete(k);}
}
function profile(wins=4){const save=new SaveService(new MemoryStorage());save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true},wins:{stone:4,bronze:4,iron:wins},challenges:{}});return save;}
function figure(id:number,kind:UnitKind,team:Team,x:number,cooldown=0):UnitState{return {id,kind,team,x,cooldown,hp:500,maxHp:500,action:'idle',facing:team==='ally'?1:-1};}
it('unlocks Antiquity for completed Iron saves without moving money or awarding a duplicate point',()=>{
 const save=profile(),levels={damage:2,health:3,supply:1,attackSpeed:2};save.writeTalents({gold:730,levels,baseLevel:8},'iron');
 const game=new GameDirector(save);expect(nextEra('iron')).toBe('antique');expect(game.getState().unlockedEras.antique).toBe(true);
 expect(save.loadTalents('iron')).toEqual({gold:730,levels,baseLevel:8});expect(save.loadTalents('antique').gold).toBe(0);
 game.selectEra('antique');const points=game.getState().globalTalentPoints;game.startNewRun(23);expect(game.getState().globalTalentPoints).toBe(points+1);
 game.startNewRun(24);expect(game.getState().globalTalentPoints).toBe(points+1);
 expect(new GameDirector(profile(3)).selectEra('antique')).toBe(false);
});
it.each([23,47])('finishes four Antiquity battles using earned gold and saves each stage (seed %i)',seed=>{
 const save=profile();let game=new GameDirector(save);game.selectEra('antique');game.startNewRun(seed);game.selectDoctrine('steel');game.beginRun();
 const attempts:number[]=[];
 for(let battle=0;battle<4;battle++){
  attempts.push(completeCampaignBattle(game,battle));expect(game.getState().eraProgress.antique).toBe(battle+1);
  expect(game.getState().unlockedUnits).toHaveLength(5+battle);
  if(battle<3){game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('antique');game.chooseReward(game.getState().rewards[0].id);}
 }
 expect(game.getState().phase).toBe('victory');expect(game.getState().unlockedEras.medieval).toBe(true);expect(attempts.reduce((a,b)=>a+b,0),JSON.stringify(attempts)).toBeLessThanOrEqual(32);
 const restored=new GameDirector(save);restored.selectEra('antique');restored.startNewRun(seed+1);expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS.antique);
});
it('uses exactly eight approved models on both sides, including the legate variant',()=>{
 expect(ERA_HIRE_KINDS.antique).toHaveLength(8);
 expect(new Set(Object.entries(unitArt).filter(([id])=>id.startsWith('antique')).map(([,art])=>art)).size).toBe(8);
 expect(unitArt.antiqueLegate).toBe(unitArt.antiqueLegionary);
 expect(manifest.sheets.filter(name=>name.includes('antique-u-'))).toHaveLength(16);
 for(const id of ERA_HIRE_KINDS.antique)for(const prefix of ['','enemy-'])expect(manifest.sheets).toContain(`${prefix}${unitArt[id]}-sheet.png`);
});
it('fields both engines on the third stage and triggers the legate only at half fortress health',()=>{
 const road=new BattleSimulation(2,[],23,'steel',undefined,undefined,'antique',undefined,10000);road.enemyResource=400;for(let i=0;i<76;i++)road.step();
 expect(road.units.some(u=>u.kind==='antiqueScorpion')).toBe(true);expect(road.units.some(u=>u.kind==='antiqueBallista')).toBe(true);
 const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'antique',undefined,10000);finale.enemyResource=400;for(let i=0;i<76;i++)finale.step();expect(finale.units.some(u=>u.kind==='antiqueLegate')).toBe(false);
 finale.enemyFortressHp=50;finale.step();expect(finale.bossPhase).toBe('assault');expect(finale.units.find(u=>u.kind==='antiqueLegate')?.maxHp).toBe(1450);
});
it('adds formation armor symmetrically and removes it when the partner dies',()=>{
 const hit=(formed:boolean,dead=false)=>{const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'antique');s.units.push(figure(100,'antiquePeltast','ally',400),figure(101,'antiqueLegionary','enemy',500,100));if(formed)s.units.push({...figure(102,'antiqueHoplite','enemy',560,100),hp:dead?0:500});s.step();return s.events.find(e=>e.type==='attack'&&e.sourceId===100)?.amount!;};
 expect(hit(true)).toBeLessThan(hit(false));expect(hit(true,true)).toBe(hit(false));
});
it('supports healing and command aura without centurion attacks; cavalry pressures ranged enemies',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'antique');
 s.units.push({...figure(100,'antiqueLegionary','ally',400),hp:300},figure(101,'antiqueSurgeon','ally',360),figure(102,'antiqueCenturion','ally',370),figure(103,'antiquePeltast','enemy',430,100));s.step();
 expect(s.events.some(e=>e.type==='heal'&&e.sourceId===101)).toBe(true);expect(s.events.some(e=>e.type==='attack'&&e.sourceId===102)).toBe(false);expect(s.units[0].cooldown).toBeLessThan(UNITS.antiqueLegionary.period);
 const c=new BattleSimulation(0,[],23,'steel',undefined,undefined,'antique');c.units.push(figure(100,'antiqueRider','ally',400),figure(101,'antiqueLegionary','enemy',430,100),figure(102,'antiquePeltast','enemy',500,100));c.step();expect(c.events.find(e=>e.type==='attack'&&e.sourceId===100)?.targetId).toBe(102);
});
it('gives the scorpion bounded group damage and the ballista a stronger fortress hit',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'antique');s.units.push(figure(100,'antiqueScorpion','ally',400));for(let i=0;i<5;i++)s.units.push(figure(101+i,'antiqueLegionary','enemy',500+i*3,100));s.step();expect(s.events.filter(e=>e.type==='attack'&&e.sourceId===100)).toHaveLength(4);
 const hit=(kind:'antiqueScorpion'|'antiqueBallista')=>{const b=new BattleSimulation(0,[],23,'steel',undefined,undefined,'antique');b.units.push(figure(100,kind,'ally',900));b.step();return 100-b.enemyFortressHp;};expect(hit('antiqueBallista')).toBeGreaterThan(hit('antiqueScorpion')*2);
 const bounty=new BattleSimulation(0,[],23,'steel',undefined,undefined,'antique');bounty.units.push({...figure(100,'antiqueLegionary','enemy',500),hp:0});bounty.step();expect(bounty.goldEarned).toBe(4);bounty.step();expect(bounty.goldEarned).toBe(4);expect(victoryGold('antique')).toBe(100);expect(unitRole('antiqueLegate')).toBe('shield');
});
it('persists Antiquity battle gold separately from Iron and retains its battle checkpoint',()=>{
 const save=profile(),levels={damage:0,health:0,supply:0,attackSpeed:0};save.writeTalents({gold:120,levels},'iron');
 const game=new GameDirector(save);game.selectEra('antique');game.startDebugBattle(2);
 const supplies=game.getState().resource;expect(game.addDebugGold(50)).toBe(true);expect(game.getState().resource).toBe(supplies);
 expect(save.load()?.eraId).toBe('antique');expect(save.load()?.battleIndex).toBe(2);expect(save.loadTalents('antique').gold).toBe(50);expect(save.loadTalents('iron').gold).toBe(120);
 const restored=new GameDirector(save);expect(restored.getState().eraId).toBe('antique');expect(restored.getState().gold).toBe(50);expect(restored.getState().canContinue).toBe(true);
 game.tick();expect(game.getState().gold).toBe(50);
});
