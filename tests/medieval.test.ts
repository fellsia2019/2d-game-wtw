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
function profile(wins=4){const save=new SaveService(new MemoryStorage());save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true},wins:{stone:4,bronze:4,iron:4,antique:wins},challenges:{}});return save;}
function figure(id:number,kind:UnitKind,team:Team,x:number,cooldown=0):UnitState{return {id,kind,team,x,cooldown,hp:500,maxHp:500,action:'idle',facing:team==='ally'?1:-1};}
it('migrates completed four-era profiles with an empty medieval wallet and one point on first entry',()=>{
 const save=profile(),levels={damage:2,health:3,supply:1,attackSpeed:2};save.writeTalents({gold:730,levels,baseLevel:8},'antique');
 const game=new GameDirector(save);expect(nextEra('antique')).toBe('medieval');expect(nextEra('medieval')).toBeUndefined();
 expect(game.getState().unlockedEras.medieval).toBe(true);expect(save.loadTalents('antique')).toEqual({gold:730,levels,baseLevel:8});
 expect(save.loadTalents('medieval')).toMatchObject({gold:0,levels:{damage:0,health:0,supply:0,attackSpeed:0}});
 game.selectEra('medieval');const points=game.getState().globalTalentPoints;game.startNewRun(23);expect(game.getState().globalTalentPoints).toBe(points+1);
 game.startNewRun(24);expect(game.getState().globalTalentPoints).toBe(points+1);
 expect(new GameDirector(profile(3)).selectEra('medieval')).toBe(false);
});
it.each([23,47])('finishes medieval campaign with earned upgrades and restores each checkpoint (seed %i)',seed=>{
 const save=profile();let game=new GameDirector(save);game.selectEra('medieval');game.startNewRun(seed);game.selectDoctrine('steel');game.beginRun();
 const attempts:number[]=[];
 for(let battle=0;battle<4;battle++){
  attempts.push(completeCampaignBattle(game,battle));expect(game.getState().eraProgress.medieval).toBe(battle+1);
  expect(game.getState().unlockedUnits).toHaveLength(5+battle);
  if(battle<3){game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('medieval');game.chooseReward(game.getState().rewards[0].id);}
 }
 expect(game.getState().phase).toBe('victory');expect(attempts.reduce((a,b)=>a+b,0),JSON.stringify(attempts)).toBeLessThanOrEqual(32);
 const restored=new GameDirector(save);restored.selectEra('medieval');restored.startNewRun(seed+1);expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS.medieval);
});
it('registers exactly eight models and sixteen atlases, reusing the guard for the jarl',()=>{
 expect(ERA_HIRE_KINDS.medieval).toHaveLength(8);
 expect(new Set(Object.entries(unitArt).filter(([id])=>id.startsWith('medieval')).map(([,art])=>art)).size).toBe(8);
 expect(unitArt.medievalJarl).toBe(unitArt.medievalGuard);expect(unitRole('medievalJarl')).toBe('shield');
 expect(manifest.sheets.filter(name=>name.includes('medieval-u-'))).toHaveLength(16);
 for(const id of ERA_HIRE_KINDS.medieval)for(const prefix of ['','enemy-'])expect(manifest.sheets).toContain(`${prefix}${unitArt[id]}-sheet.png`);
});
it('deploys throwers and ram on stage three; jarl comes at half fortress health with final stats',()=>{
 const road=new BattleSimulation(2,[],23,'steel',undefined,undefined,'medieval',undefined,10000);road.enemyResource=400;for(let i=0;i<76;i++)road.step();
 expect(road.units.some(u=>u.kind==='medievalThrower')).toBe(true);expect(road.units.some(u=>u.kind==='medievalRam')).toBe(true);
 const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'medieval',undefined,10000);finale.enemyResource=400;for(let i=0;i<76;i++)finale.step();expect(finale.units.some(u=>u.kind==='medievalJarl')).toBe(false);
 finale.enemyFortressHp=50;finale.step();expect(finale.bossPhase).toBe('assault');expect(finale.units.find(u=>u.kind==='medievalJarl')?.maxHp).toBe(1650);
 expect(UNITS.medievalJarl.damage*1.2).toBe(40);expect(UNITS.medievalJarl.armor).toBe(.52);expect(UNITS.medievalJarl.period).toBe(1.6);
});
it.each(['ally','enemy'] as const)('grants a single berserker counter after melee damage on the %s side',team=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval',undefined,10000);
 const other=team==='ally'?'enemy':'ally';
 const guard=figure(100,'medievalGuard',other,420),berserker=figure(101,'medievalBerserker',team,400);
 s.units.push(guard,berserker);s.step();
 const hit=()=>s.events.filter(e=>e.type==='attack'&&e.sourceId===101).at(-1)!.amount!;
 const base=UNITS.medievalBerserker.damage*(team==='enemy'?1.05:1)*(1-UNITS.medievalGuard.armor);
 expect(hit()).toBeCloseTo(base*1.2);
 guard.cooldown=100;berserker.cooldown=0;s.step();expect(hit()).toBeCloseTo(base);
});
it('expires the counter after two seconds, does not stack, and excludes ranged damage',()=>{
 const strike=(kind:UnitKind,delay=0,repeat=false)=>{
  const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval',undefined,10000);
  const enemy=figure(100,kind,'enemy',420),berserker=figure(101,'medievalBerserker','ally',400,100);s.units.push(enemy,berserker);s.step();enemy.cooldown=100;
  if(repeat){enemy.cooldown=0;s.step();enemy.cooldown=100;}
  for(let i=0;i<delay;i++)s.step();
  berserker.cooldown=0;s.step();return s.events.find(e=>e.type==='attack'&&e.sourceId===101)!.amount!;
 };
 const base=20*(1-.48);
 expect(strike('medievalGuard')).toBeCloseTo(base*1.2);expect(strike('medievalGuard',0,true)).toBeCloseTo(base*1.2);
 expect(strike('medievalGuard',61)).toBeCloseTo(base);
 expect(strike('medievalLongbow')).toBeCloseTo(20*(1-.12));
});
it('heals, supplies the horn aura without attacking, and pressures ranged targets',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval');
 s.units.push({...figure(100,'medievalGuard','ally',400),hp:300},figure(101,'medievalHealer','ally',360),figure(102,'medievalHorn','ally',370),figure(103,'medievalLongbow','enemy',430,100));s.step();
 expect(s.events.find(e=>e.type==='heal'&&e.sourceId===101)?.amount).toBe(18);expect(s.events.some(e=>e.type==='attack'&&e.sourceId===102)).toBe(false);
 expect(s.units[0].cooldown).toBeLessThan(UNITS.medievalGuard.period);
 const c=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval');c.units.push(figure(100,'medievalBerserker','ally',400),figure(101,'medievalGuard','enemy',410,100),figure(102,'medievalLongbow','enemy',440,100));c.step();expect(c.events.find(e=>e.type==='attack'&&e.sourceId===100)?.targetId).toBe(102);
});
it('bounds axe splash to three extra enemies and gives ram a stronger fortress hit',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval');s.units.push(figure(100,'medievalThrower','ally',400));for(let i=0;i<5;i++)s.units.push(figure(101+i,'medievalGuard','enemy',500+i*3,100));s.step();expect(s.events.filter(e=>e.type==='attack'&&e.sourceId===100)).toHaveLength(4);
 const hit=(kind:'medievalThrower'|'medievalRam')=>{const b=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval');b.units.push(figure(100,kind,'ally',900));b.step();return 100-b.enemyFortressHp;};expect(hit('medievalRam')).toBeGreaterThan(hit('medievalThrower')*2);
 const bounty=new BattleSimulation(0,[],23,'steel',undefined,undefined,'medieval');bounty.units.push({...figure(100,'medievalGuard','enemy',500),hp:0});bounty.step();expect(bounty.goldEarned).toBe(5);bounty.step();expect(bounty.goldEarned).toBe(5);expect(victoryGold('medieval')).toBe(125);expect(bounty.income).toBe(14);
});
it('saves debug upgrade gold in the medieval wallet and keeps battle continuation',()=>{
 const save=profile(),levels={damage:0,health:0,supply:0,attackSpeed:0};save.writeTalents({gold:120,levels},'antique');
 const game=new GameDirector(save);game.selectEra('medieval');game.startDebugBattle(2);
 const supplies=game.getState().resource;for(const n of [50,100,200])expect(game.addDebugGold(n)).toBe(true);expect(game.getState().resource).toBe(supplies);
 expect(save.load()?.eraId).toBe('medieval');expect(save.load()?.battleIndex).toBe(2);expect(save.loadTalents('medieval').gold).toBe(350);expect(save.loadTalents('antique').gold).toBe(120);
 const restored=new GameDirector(save);expect(restored.getState().eraId).toBe('medieval');expect(restored.getState().gold).toBe(350);expect(restored.getState().canContinue).toBe(true);
 game.tick();expect(game.getState().gold).toBe(350);
});
