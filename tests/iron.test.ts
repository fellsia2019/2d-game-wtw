import { expect, it } from 'vitest';
import manifest from '../public/assets/sprite-manifest.json';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { ERA_STARTER_KINDS, ERA_HIRE_KINDS, UNITS } from '../src/data/content';
import { unitArt } from '../src/art/catalog';
import type { UnitKind, Team, UnitState } from '../src/core/types';
import { completeCampaignBattle } from './helpers/campaign';
class MemoryStorage implements StorageLike {
 values = new Map<string,string>();
 getItem(key:string){ return this.values.get(key) ?? null; }
 setItem(key:string,value:string){ this.values.set(key,value); }
 removeItem(key:string){ this.values.delete(key); }
}
function figure(id:number, kind:UnitKind, team:Team, x:number, cooldown=0):UnitState {
 return {id,kind,team,x,cooldown,hp:500,maxHp:500,action:'idle',facing:team==='ally'?1:-1};
}
it('migrates a completed Bronze profile without moving its gold or granting an extra transition point',()=>{
 const storage=new MemoryStorage(),save=new SaveService(storage);
 save.writeEraProgress({unlocked:{stone:true,bronze:true},wins:{stone:4,bronze:4},challenges:{stone:true,bronze:false}});
 const levels={damage:3,health:2,attackSpeed:1,supply:4};
 save.writeTalents({gold:700,levels,baseLevel:6},'bronze');
 const game=new GameDirector(save);
 expect(game.getState().unlockedEras.iron).toBe(true);
 expect(save.loadTalents('bronze')).toEqual({gold:700,levels,baseLevel:6});
 expect(save.loadTalents('iron').gold).toBe(0);
 expect(game.selectEra('iron')).toBe(true);
 const points=game.getState().globalTalentPoints;
 game.startNewRun(23);
 expect(game.getState().globalTalentPoints).toBe(points+1);
 game.startNewRun(24);
 expect(game.getState().globalTalentPoints).toBe(points+1);
 expect(game.getState().roster).toEqual(ERA_STARTER_KINDS.iron);
});
it.each([23,47])('finishes all four Iron battles with earned gold and preserves unlocks across reloads (seed %i)',seed=>{
 const save=new SaveService(new MemoryStorage());
 save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true},wins:{stone:4,bronze:4,iron:0},challenges:{}});
 let game=new GameDirector(save);game.selectEra('iron');game.startNewRun(seed);game.selectDoctrine('steel');game.beginRun();
 const attempts:number[]=[];
 for(let battle=0;battle<4;battle++){
  attempts.push(completeCampaignBattle(game,battle));
  expect(game.getState().eraProgress.iron).toBe(battle+1);
  expect(game.getState().unlockedUnits).toHaveLength(5+battle);
  if(battle<3){game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('iron');game.chooseReward(game.getState().rewards[0].id);}
 }
 expect(game.getState().phase).toBe('victory');
 expect(game.getState().unlockedEras.antique).toBe(true);
 expect(new GameDirector(save).getState().unlockedEras.antique).toBe(true);
 expect(attempts.every(count=>count<=24) && attempts.reduce((sum,count)=>sum+count,0)<=32,JSON.stringify(attempts)).toBe(true);
 const restored=new GameDirector(save);restored.selectEra('iron');restored.startNewRun(seed+1);
 expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS.iron);
 expect(restored.getState().globalTalentPoints).toBe(game.getState().globalTalentPoints);
});
it('uses one archer definition on both sides and loads every approved portrait and atlas',()=>{
 expect(manifest.eras).toContain('iron');
 for(const id of [...ERA_HIRE_KINDS.iron,'ironGate','ironCommandant']){
  for(const prefix of ['','enemy-']){
   expect(manifest.sheets).toContain(`${prefix}${unitArt[id]}-sheet.png`);
  }
 }
 expect(Object.keys(UNITS).filter(id=>id.startsWith('iron')&&id.toLowerCase().includes('archer'))).toEqual(['ironArcher']);
});
it('fields the siege crew on the third road and saves the commandant for the half-health assault',()=>{
 const road=new BattleSimulation(2,[],23,'steel',undefined,undefined,'iron',undefined,10000);
 road.enemyResource=300;for(let i=0;i<76;i++)road.step();
 expect(road.units.some(u=>u.kind==='ironSiege'&&u.team==='enemy')).toBe(true);
 const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'iron',undefined,10000);
 finale.enemyResource=300;for(let i=0;i<76;i++)finale.step();
 expect(finale.units.some(u=>u.kind==='ironCommandant')).toBe(false);
 finale.enemyFortressHp=50;finale.step();
 expect(finale.units.find(u=>u.kind==='ironCommandant')?.maxHp).toBe(1300);
 expect(finale.bossPhase).toBe('assault');
 expect(finale.enemyGlyphRemaining).toBe(5);
});
it('lets Iron spears counter gate armor and javelins hit a bounded group',()=>{
 const hit=(kind:'ironShield'|'ironSpear')=>{
  const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'iron');
  s.units.push(figure(100,kind,'ally',400),figure(101,'ironGate','enemy',425,100));s.step();
  return s.events.find(e=>e.type==='attack'&&e.sourceId===100)?.amount!;
 };
 expect(hit('ironSpear')).toBeGreaterThan(hit('ironShield')*5);
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'iron');
 s.units.push(figure(100,'ironThrower','ally',400));
 for(let i=0;i<5;i++)s.units.push(figure(101+i,'ironShield','enemy',500+i*3,100));
 s.step();
 expect(s.events.filter(e=>e.type==='attack'&&e.sourceId===100)).toHaveLength(4);
 expect(s.units.filter(u=>u.team==='enemy'&&u.hp<500)).toHaveLength(4);
});
it('pays the Iron bounty once for each fallen enemy',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'iron');
 s.units.push({...figure(100,'ironShield','enemy',500,100),hp:0});s.step();
 expect(s.goldEarned).toBe(3);s.step();expect(s.goldEarned).toBe(3);
});
