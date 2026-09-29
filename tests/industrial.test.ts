import { expect, it } from 'vitest';
import manifest from '../public/assets/sprite-manifest.json';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { ERA_HIRE_KINDS, UNITS, nextEra, unitRole, victoryGold } from '../src/data/content';
import { unitArt } from '../src/art/catalog';
import type { Team, UnitKind, UnitState } from '../src/core/types';
import { completeCampaignBattle } from './helpers/campaign';

class MemoryStorage implements StorageLike {
  values = new Map<string,string>();
  getItem(key:string){return this.values.get(key) ?? null;}
  setItem(key:string,value:string){this.values.set(key,value);}
  removeItem(key:string){this.values.delete(key);}
}
function profile(wins=4){
  const save = new SaveService(new MemoryStorage());
  save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true,'high-medieval':true,renaissance:true},
    wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':4,renaissance:wins},challenges:{}});
  return save;
}
function figure(id:number,kind:UnitKind,team:Team,x:number):UnitState {
  return {id,kind,team,x,cooldown:0,hp:500,maxHp:500,action:'idle',facing:team==='ally'?1:-1};
}

it('unlocks after Renaissance and keeps its own wallet and eight approved models',()=>{
  const save=profile();
  save.writeTalents({gold:830,levels:{damage:2,health:3,supply:1,attackSpeed:2},baseLevel:8},'renaissance');
  expect(nextEra('renaissance')).toBe('industrial');
  expect(nextEra('industrial')).toBeUndefined();
  expect(save.loadEraProgress().unlocked.industrial).toBe(true);
  expect(save.loadTalents('industrial').gold).toBe(0);
  expect(save.loadTalents('renaissance').gold).toBe(830);
  expect(ERA_HIRE_KINDS.industrial).toHaveLength(8);
  expect(new Set(ERA_HIRE_KINDS.industrial.map(id=>unitArt[id])).size).toBe(8);
  expect(unitArt.industrialBaron).toBe(unitArt.industrialShield);
  expect(unitRole('industrialBaron')).toBe('shield');
  expect(manifest.sheets.filter(name=>/^(enemy-)?industrial-u-/.test(name))).toHaveLength(16);
  save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true,'high-medieval':true,renaissance:true},
    wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':4,renaissance:3},challenges:{}});
  expect(new GameDirector(save).selectEra('industrial')).toBe(false);
});

it('deploys howitzers and the baron with approved shield art and final scaling',()=>{
  const siege=new BattleSimulation(2,[],23,'steel',undefined,undefined,'industrial',undefined,10000);
  siege.enemyResource=500;for(let i=0;i<85;i++)siege.step();
  expect(siege.units.some(u=>u.kind==='industrialDemolition')).toBe(true);
  expect(siege.units.some(u=>u.kind==='industrialHowitzer')).toBe(true);
  const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'industrial',undefined,10000);
  finale.enemyResource=500;for(let i=0;i<85;i++)finale.step();
  expect(finale.units.some(u=>u.kind==='industrialBaron')).toBe(false);
  finale.enemyFortressHp=50;finale.step();
  expect(finale.bossPhase).toBe('assault');
  expect(finale.units.find(u=>u.kind==='industrialBaron')?.maxHp).toBe(Math.round(1400*1.55));
  expect(UNITS.industrialBaron.damage*1.55).toBeCloseTo(43*1.55);
  expect(UNITS.industrialBaron.armor).toBe(.52);
});

it('gives firearms symmetric heat and lets a nearby mechanic shorten the pause',()=>{
  const cooldown=(team:Team,kind:'industrialRifle'|'industrialCarbine'|'industrialHowitzer',withMechanic:boolean)=>{
    const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'industrial',undefined,10000);
    const x=team==='ally'?850:150;
    const gun=figure(100,kind,team,x);s.units.push(gun);
    if(withMechanic)s.units.push(figure(101,'industrialMechanic',team,x-10));
    for(let shot=0;shot<3;shot++){gun.cooldown=0;s.step();}
    return gun.cooldown;
  };
  for(const kind of ['industrialRifle','industrialCarbine','industrialHowitzer'] as const){
    expect(cooldown('ally',kind,false)).toBeGreaterThan(cooldown('ally',kind,true));
    expect(cooldown('enemy',kind,false)).toBeGreaterThan(cooldown('enemy',kind,true));
  }
  expect(victoryGold('industrial')).toBe(200);
});

it('uses medic, raider, demolition, support and siege roles in combat',()=>{
  const support=new BattleSimulation(0,[],23,'steel',undefined,undefined,'industrial');
  support.units.push({...figure(100,'industrialShield','ally',400),hp:300},figure(101,'industrialMedic','ally',360),figure(102,'industrialMechanic','ally',370),figure(103,'industrialRifle','enemy',430));
  support.step();
  expect(support.events.find(e=>e.type==='heal'&&e.sourceId===101)?.amount).toBe(27);
  expect(support.events.some(e=>e.type==='attack'&&e.sourceId===102)).toBe(false);
  const raid=new BattleSimulation(0,[],23,'steel',undefined,undefined,'industrial');
  raid.units.push(figure(100,'industrialCarbine','ally',400),figure(101,'industrialShield','enemy',410),figure(102,'industrialRifle','enemy',440));
  raid.step();
  expect(raid.events.find(e=>e.type==='attack'&&e.sourceId===100)?.targetId).toBe(102);
  const splash=new BattleSimulation(0,[],23,'steel',undefined,undefined,'industrial');
  splash.units.push(figure(100,'industrialDemolition','ally',400));
  for(let i=0;i<5;i++)splash.units.push(figure(101+i,'industrialShield','enemy',500+i*3));
  splash.step();
  expect(splash.events.filter(e=>e.type==='attack'&&e.sourceId===100)).toHaveLength(4);
  const hit=(kind:'industrialDemolition'|'industrialHowitzer')=>{
    const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'industrial');
    s.units.push(figure(100,kind,'ally',900));s.step();return 100-s.enemyFortressHp;
  };
  expect(hit('industrialHowitzer')).toBeGreaterThan(hit('industrialDemolition')*2);
});

it.each([23,47])('completes the Industrial campaign with earned progression and saved checkpoints (seed %i)',seed=>{
  const save=profile();let game=new GameDirector(save);
  expect(game.selectEra('industrial')).toBe(true);
  game.startNewRun(seed);game.selectDoctrine('steel');
  while(game.getState().globalTalentPoints>0)expect(game.buyGlobalTalent('supply')).toBe(true);
  game.beginRun();
  const attempts:number[]=[];
  for(let battle=0;battle<4;battle++){
    attempts.push(completeCampaignBattle(game,battle));
    const state=game.getState();
    console.log('Industrial stage',seed,battle+1,{attempts:attempts[battle],talents:state.talents,base:state.baseLevel,global:state.globalTalents,gold:state.gold});
    expect(state.eraProgress.industrial).toBe(battle+1);
    expect(state.unlockedUnits).toHaveLength(5+battle);
    if(battle<3){game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('industrial');game.chooseReward(game.getState().rewards[0].id);}
  }
  expect(game.getState().phase).toBe('victory');
  expect(attempts.reduce((a,b)=>a+b,0),JSON.stringify(attempts)).toBeLessThanOrEqual(40);
  const restored=new GameDirector(save);restored.selectEra('industrial');restored.startNewRun(seed+1);
  expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS.industrial);
});
