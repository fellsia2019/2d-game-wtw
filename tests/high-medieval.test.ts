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
function profile(wins=4){const save=new SaveService(new MemoryStorage());save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true},wins:{stone:4,bronze:4,iron:4,antique:4,medieval:wins},challenges:{}});return save;}
function figure(id:number,kind:UnitKind,team:Team,x:number,cooldown=0):UnitState{return {id,kind,team,x,cooldown,hp:500,maxHp:500,action:'idle',facing:team==='ally'?1:-1};}
it('unlocks after four medieval wins and preserves the previous wallet',()=>{
 const save=profile();save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true},wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4},challenges:{}});
 save.writeTalents({gold:730,levels:{damage:2,health:3,supply:1,attackSpeed:2},baseLevel:8},'medieval');
 expect(nextEra('medieval')).toBe('high-medieval');expect(nextEra('high-medieval')).toBe('renaissance');
 expect(save.loadEraProgress().unlocked['high-medieval']).toBe(true);
 expect(save.loadTalents('high-medieval').gold).toBe(0);expect(save.loadTalents('medieval').gold).toBe(730);
 save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true},wins:{stone:4,bronze:4,iron:4,antique:4,medieval:3},challenges:{}});
 expect(new GameDirector(save).selectEra('high-medieval')).toBe(false);
});
it.each([23,47])('finishes high medieval campaign with earned upgrades and restores each checkpoint (seed %i)',seed=>{
 const save=profile();let game=new GameDirector(save);game.selectEra('high-medieval');game.startNewRun(seed);game.selectDoctrine('steel');
 // Five global points earned by reaching this sixth era, spent through the public API.
 while(game.getState().globalTalentPoints>0)expect(game.buyGlobalTalent('supply')).toBe(true);
 game.beginRun();
 const attempts:number[]=[];
 for(let battle=0;battle<4;battle++){
  attempts.push(completeCampaignBattle(game,battle));expect(game.getState().eraProgress['high-medieval']).toBe(battle+1);
  expect(game.getState().unlockedUnits).toHaveLength(5+battle);
  if(battle<3){game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('high-medieval');game.chooseReward(game.getState().rewards[0].id);}
 }
 console.log('High Medieval campaign',seed,'attempts',attempts,'earned gold',game.getState().gold);
 // User-requested harder preset: bounded earned progression within 64 attempts.
 expect(game.getState().phase).toBe('victory');expect(attempts.reduce((a,b)=>a+b,0),JSON.stringify(attempts)).toBeLessThanOrEqual(64);
 const restored=new GameDirector(save);restored.selectEra('high-medieval');restored.startNewRun(seed+1);expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS['high-medieval']);
},15000);
it('registers exactly eight models and sixteen atlases, reusing the knight for the castellan',()=>{
 expect(ERA_HIRE_KINDS['high-medieval']).toHaveLength(8);
 expect(new Set(Object.entries(unitArt).filter(([id])=>id.startsWith('high')).map(([,art])=>art)).size).toBe(8);
 expect(unitArt.highCastellan).toBe(unitArt.highKnight);expect(unitRole('highCastellan')).toBe('shield');
 expect(manifest.sheets.filter(name=>/^(enemy-)?high-medieval-u-/.test(name))).toHaveLength(16);
 for(const id of ERA_HIRE_KINDS['high-medieval'])for(const prefix of ['','enemy-'])expect(manifest.sheets).toContain(`${prefix}${unitArt[id]}-sheet.png`);
});
it('deploys pitch and trebuchet on stage three; castellan comes at half fortress health with final stats',()=>{
 const road=new BattleSimulation(2,[],23,'steel',undefined,undefined,'high-medieval',undefined,10000);road.enemyResource=400;for(let i=0;i<76;i++)road.step();
 expect(road.units.some(u=>u.kind==='highPitch')).toBe(true);expect(road.units.some(u=>u.kind==='highTrebuchet')).toBe(true);
 const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'high-medieval',undefined,10000);finale.enemyResource=400;for(let i=0;i<76;i++)finale.step();expect(finale.units.some(u=>u.kind==='highCastellan')).toBe(false);
 finale.enemyFortressHp=50;finale.step();expect(finale.bossPhase).toBe('assault');expect(finale.units.find(u=>u.kind==='highCastellan')?.maxHp).toBe(Math.round(1500 / 1.4 * 1.7));
 expect(UNITS.highCastellan.damage*1.7).toBeCloseTo(44 / 1.44 * 1.7);expect(UNITS.highCastellan.armor).toBe(.48);expect(UNITS.highCastellan.period).toBe(1.6);
});

it('supports healing, passive herald aura, cavalry pressure and bounded pitch splash',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'high-medieval');
 s.units.push({...figure(100,'highKnight','ally',400),hp:300},figure(101,'highMonk','ally',360),figure(102,'highHerald','ally',370),figure(103,'highCrossbow','enemy',430,100));s.step();
 expect(s.events.find(e=>e.type==='heal'&&e.sourceId===101)?.amount).toBe(20);
 expect(s.events.some(e=>e.type==='attack'&&e.sourceId===102)).toBe(false);
 expect(s.units[0].cooldown).toBeLessThan(UNITS.highKnight.period);
 const cavalry=new BattleSimulation(0,[],23,'steel',undefined,undefined,'high-medieval');
 cavalry.units.push(figure(100,'highRider','ally',400),figure(101,'highKnight','enemy',410,100),figure(102,'highCrossbow','enemy',440,100));cavalry.step();
 expect(cavalry.events.find(e=>e.type==='attack'&&e.sourceId===100)?.targetId).toBe(102);
 const splash=new BattleSimulation(0,[],23,'steel',undefined,undefined,'high-medieval');
 splash.units.push(figure(100,'highPitch','ally',400));for(let i=0;i<5;i++)splash.units.push(figure(101+i,'highKnight','enemy',500+i*3,100));splash.step();
 expect(splash.events.filter(e=>e.type==='attack'&&e.sourceId===100)).toHaveLength(4);
});
it('pays era-specific gold once and gives the trebuchet a long-range fortress role',()=>{
 const bounty=new BattleSimulation(0,[],23,'steel',undefined,undefined,'high-medieval');
 bounty.units.push({...figure(100,'highKnight','enemy',500),hp:0});bounty.step();expect(bounty.goldEarned).toBe(6);bounty.step();expect(bounty.goldEarned).toBe(6);
 expect(bounty.income).toBe(16);expect(victoryGold('high-medieval')).toBe(150);
 const hit=(kind:'highPitch'|'highTrebuchet')=>{const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'high-medieval');s.units.push(figure(100,kind,'ally',900));s.step();return 100-s.enemyFortressHp;};
 expect(hit('highTrebuchet')).toBeGreaterThan(hit('highPitch')*2);
 expect(UNITS.highTrebuchet.range).toBeGreaterThan(UNITS.highCrossbow.range);
});
