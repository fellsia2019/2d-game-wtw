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
function profile(wins=4){const save=new SaveService(new MemoryStorage());save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true},wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':wins},challenges:{}});return save;}
function figure(id:number,kind:UnitKind,team:Team,x:number,cooldown=0):UnitState{return {id,kind,team,x,cooldown,hp:500,maxHp:500,action:'idle',facing:team==='ally'?1:-1};}
it('unlocks after four High Medieval wins and preserves the previous wallet',()=>{
 const save=profile();save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true},wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':4},challenges:{}});
 save.writeTalents({gold:730,levels:{damage:2,health:3,supply:1,attackSpeed:2},baseLevel:8},'high-medieval');
 expect(nextEra('high-medieval')).toBe('renaissance');expect(nextEra('renaissance')).toBeUndefined();
 expect(save.loadEraProgress().unlocked['renaissance']).toBe(true);
 expect(save.loadTalents('renaissance').gold).toBe(0);expect(save.loadTalents('high-medieval').gold).toBe(730);
 save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true},wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':3},challenges:{}});
 expect(new GameDirector(save).selectEra('renaissance')).toBe(false);
});
it.each([23,47])('finishes Renaissance campaign with earned upgrades and restores each checkpoint (seed %i)',seed=>{
 const save=profile();let game=new GameDirector(save);game.selectEra('renaissance');game.startNewRun(seed);game.selectDoctrine('steel');
 // Six global points earned by reaching this seventh era, spent through the public API.
 while(game.getState().globalTalentPoints>0)expect(game.buyGlobalTalent('supply')).toBe(true);
 game.beginRun();
 const attempts:number[]=[];
 for(let battle=0;battle<4;battle++){
  attempts.push(completeCampaignBattle(game,battle));expect(game.getState().eraProgress['renaissance']).toBe(battle+1);
  expect(game.getState().unlockedUnits).toHaveLength(5+battle);
  if(battle<3){game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('renaissance');game.chooseReward(game.getState().rewards[0].id);}
 }
 console.log('Renaissance campaign',seed,'attempts',attempts,'earned gold',game.getState().gold);
 // Bounded earned progression for the seventh era.
 expect(game.getState().phase).toBe('victory');expect(attempts.reduce((a,b)=>a+b,0),JSON.stringify(attempts)).toBeLessThanOrEqual(24);
 const restored=new GameDirector(save);restored.selectEra('renaissance');restored.startNewRun(seed+1);expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS['renaissance']);
});
it('registers exactly eight models and sixteen atlases, reusing the cuirassier for the general',()=>{
 expect(ERA_HIRE_KINDS['renaissance']).toHaveLength(8);
 expect(new Set(Object.entries(unitArt).filter(([id])=>id.startsWith('renaissance')).map(([,art])=>art)).size).toBe(8);
 expect(unitArt.renaissanceGeneral).toBe(unitArt.renaissanceCuirassier);expect(unitRole('renaissanceGeneral')).toBe('shield');
 expect(manifest.sheets.filter(name=>/^(enemy-)?renaissance-u-/.test(name))).toHaveLength(16);
 for(const id of ERA_HIRE_KINDS['renaissance'])for(const prefix of ['','enemy-'])expect(manifest.sheets).toContain(`${prefix}${unitArt[id]}-sheet.png`);
});
it('deploys grenadiers and cannon on stage three; general comes at half fortress health with final stats',()=>{
 const road=new BattleSimulation(2,[],23,'steel',undefined,undefined,'renaissance',undefined,10000);road.enemyResource=400;for(let i=0;i<76;i++)road.step();
 expect(road.units.some(u=>u.kind==='renaissanceGrenadier')).toBe(true);expect(road.units.some(u=>u.kind==='renaissanceCannon')).toBe(true);
 const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'renaissance',undefined,10000);finale.enemyResource=400;for(let i=0;i<76;i++)finale.step();expect(finale.units.some(u=>u.kind==='renaissanceGeneral')).toBe(false);
 finale.enemyFortressHp=50;finale.step();expect(finale.bossPhase).toBe('assault');expect(finale.units.find(u=>u.kind==='renaissanceGeneral')?.maxHp).toBe(Math.round(1200 * 1.5));
 expect(UNITS.renaissanceGeneral.damage*1.5).toBeCloseTo(36 * 1.5);expect(UNITS.renaissanceGeneral.armor).toBe(.5);expect(UNITS.renaissanceGeneral.period).toBe(1.7);
});

it('supports healing, passive captain aura, cavalry pressure and bounded grenade splash',()=>{
 const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'renaissance');
 s.units.push({...figure(100,'renaissanceCuirassier','ally',400),hp:300},figure(101,'renaissanceSurgeon','ally',360),figure(102,'renaissanceCaptain','ally',370),figure(103,'renaissanceMusket','enemy',430,100));s.step();
 expect(s.events.find(e=>e.type==='heal'&&e.sourceId===101)?.amount).toBe(23);
 expect(s.events.some(e=>e.type==='attack'&&e.sourceId===102)).toBe(false);
 expect(s.units[0].cooldown).toBeLessThan(UNITS.renaissanceCuirassier.period);
 const cavalry=new BattleSimulation(0,[],23,'steel',undefined,undefined,'renaissance');
 cavalry.units.push(figure(100,'renaissanceDragoon','ally',400),figure(101,'renaissanceCuirassier','enemy',410,100),figure(102,'renaissanceMusket','enemy',440,100));cavalry.step();
 expect(cavalry.events.find(e=>e.type==='attack'&&e.sourceId===100)?.targetId).toBe(102);
 const splash=new BattleSimulation(0,[],23,'steel',undefined,undefined,'renaissance');
 splash.units.push(figure(100,'renaissanceGrenadier','ally',400));for(let i=0;i<5;i++)splash.units.push(figure(101+i,'renaissanceCuirassier','enemy',500+i*3,100));splash.step();
 expect(splash.events.filter(e=>e.type==='attack'&&e.sourceId===100)).toHaveLength(4);
});
it('pays era-specific gold once and gives the cannon a long-range fortress role',()=>{
 const bounty=new BattleSimulation(0,[],23,'steel',undefined,undefined,'renaissance');
 bounty.units.push({...figure(100,'renaissanceCuirassier','enemy',500),hp:0});bounty.step();expect(bounty.goldEarned).toBe(7);bounty.step();expect(bounty.goldEarned).toBe(7);
 expect(bounty.income).toBe(18);expect(victoryGold('renaissance')).toBe(175);
 const hit=(kind:'renaissanceGrenadier'|'renaissanceCannon')=>{const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'renaissance');s.units.push(figure(100,kind,'ally',900));s.step();return 100-s.enemyFortressHp;};
 expect(hit('renaissanceCannon')).toBeGreaterThan(hit('renaissanceGrenadier')*2);
 expect(UNITS.renaissanceCannon.range).toBeGreaterThan(UNITS.renaissanceMusket.range);
});
