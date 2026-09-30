import { expect, it } from 'vitest';
import manifest from '../public/assets/sprite-manifest.json';
import approved from '../public/assets/modern-manifest.json';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { ERA_BATTLES, ERA_HIRE_KINDS, UNITS, nextEra } from '../src/data/content';
import { unitArt } from '../src/art/catalog';
import type { Team, UnitKind, UnitState } from '../src/core/types';
import { completeCampaignBattle } from './helpers/campaign';

class MemoryStorage implements StorageLike {
  values = new Map<string,string>();
  getItem(key:string){return this.values.get(key) ?? null;}
  setItem(key:string,value:string){this.values.set(key,value);}
  removeItem(key:string){this.values.delete(key);}
}
function profile(worldWins=4) {
  const save = new SaveService(new MemoryStorage());
  save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true,'high-medieval':true,renaissance:true,industrial:true,'world-wars':true},
    wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':4,renaissance:4,industrial:4,'world-wars':worldWins},challenges:{}});
  return save;
}
function figure(id:number,kind:UnitKind,team:Team,x:number):UnitState {
  return {id,kind,team,x,cooldown:0,hp:1000,maxHp:1000,action:'idle',facing:team==='ally'?1:-1};
}

it('unlocks Modernity after World Wars and registers exactly eight shared role models',()=>{
  const save=profile();
  expect(nextEra('world-wars')).toBe('modern');
  expect(save.loadEraProgress().unlocked.modern).toBe(true);
  expect(ERA_HIRE_KINDS.modern).toHaveLength(8);
  expect(new Set(ERA_HIRE_KINDS.modern.map(id=>unitArt[id])).size).toBe(8);
  expect(unitArt.modernCommander).toBe(unitArt.modernShield);
  expect(approved.status).toBe('approved');
  expect(approved.models).toHaveLength(8);
  expect(approved.sheets).toHaveLength(16);
  expect(approved.scenery).toContain('modern-tower-ally.svg');
  expect(approved.scenery).toContain('modern-tower-enemy.svg');
  expect(approved.scenery.some(path=>path.startsWith('modern-tower-')&&path.endsWith('.png'))).toBe(false);
  expect(manifest.eras.at(-1)).toBe('modern');
  expect(approved.sheets.every(sheet=>manifest.sheets.includes(sheet))).toBe(true);
  expect(new GameDirector(profile(3)).selectEra('modern')).toBe(false);
  expect(save.loadTalents('modern').gold).toBe(0);
  save.writeTalents({gold:300,levels:{damage:1,health:1,supply:1,attackSpeed:1},baseLevel:1},'world-wars');
  expect(save.loadTalents('modern').gold).toBe(0);
});

it('uses the four enemy balance rows from the approved screenshot',()=>{
  expect(enemyBalanceDefaults('modern')).toEqual([
    {income:60,startSupplies:35,hpBonus:25,damageBonus:25},
    {income:70,startSupplies:45,hpBonus:47,damageBonus:46},
    {income:80,startSupplies:45,hpBonus:80,damageBonus:80},
    {income:90,startSupplies:50,hpBonus:95,damageBonus:95},
  ]);
});

it.each(['ally','enemy'] as const)('launches a real %s drone, then damages the target after flight with no passive aura',team=>{
  const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'modern',undefined,10000);
  const opponent=team==='ally'?'enemy':'ally';
  const drone=figure(100,'modernDroneOperator',team,400);
  const target=figure(101,'modernShield',opponent,510);
  s.units.push(drone,target);
  s.step();
  expect(s.droneStrikes).toHaveLength(1);
  expect(s.events.some(e=>e.type==='drone-launch'&&e.sourceId===100)).toBe(true);
  expect(s.events.some(e=>e.type==='attack'&&e.sourceId===100)).toBe(false);
  const before=target.hp;
  for(let i=0;i<20;i++)s.step();
  expect(target.hp).toBe(before);
  for(let i=0;i<10;i++)s.step();
  expect(s.droneStrikes).toHaveLength(0);
  expect(s.events.some(e=>e.type==='drone-explode'&&e.sourceId===100)).toBe(true);
  expect(target.hp).toBeLessThan(before);
  const noAura=new BattleSimulation(0,[],23,'steel',undefined,undefined,'modern',undefined,10000);
  noAura.units.push(figure(100,'modernShield',team,400),figure(101,'modernDroneOperator',team,410),figure(102,'modernShield',opponent,440));
  noAura.step();
  expect(noAura.units[0].cooldown).toBeCloseTo(UNITS.modernShield.period);
});

it('spawns the final commander using shield art and preserves a Modern checkpoint',()=>{
  const s=new BattleSimulation(3,[],23,'steel',undefined,undefined,'modern',undefined,10000);
  s.enemyFortressHp=50;s.step();
  expect(s.bossPhase).toBe('assault');
  expect(s.units.find(u=>u.kind==='modernCommander')?.maxHp).toBe(Math.round(UNITS.modernCommander.hp*1.95));
  const save=profile();let game=new GameDirector(save);
  expect(game.selectEra('modern')).toBe(true);
  game.startNewRun(23);game.selectDoctrine('steel');game.beginRun();
  game=new GameDirector(save);game.continueRun();
  expect(game.getState().eraId).toBe('modern');
  expect(game.getState().phase).toBe('contract');
});

it('recruits the intended enemy formation in each fight, including artillery and fort defenders',()=>{
  const formations: UnitKind[][] = [
    ['modernShield','modernMarksman','modernRecon'],
    ['modernShield','modernAntiTank','modernMarksman','modernDroneOperator'],
    ['modernShield','modernMarksman','modernShield','modernGrenadier','modernArtillery'],
    ['modernShield','modernAntiTank','modernMarksman','modernGrenadier'],
  ];
  for(let battle=0;battle<4;battle++){
    const s=new BattleSimulation(battle,[],23,'steel',undefined,undefined,'modern',undefined,10000);
    const expected=formations[battle];
    s.enemyResource=expected.reduce((sum,kind)=>sum+UNITS[kind].cost,0);
    for(let i=0;i<76;i++)s.step();
    expect(s.units.filter(u=>u.team==='enemy').slice(0,expected.length).map(u=>u.kind)).toEqual(expected);
    expect(s.units.some(u=>u.kind==='modernCommander')).toBe(false);
  }
  const defense=new BattleSimulation(2,[],23,'steel',undefined,undefined,'modern',undefined,10000);
  defense.units.push({...figure(10000,'modernShield','ally',710),hp:10000,maxHp:10000,cooldown:1000});
  defense.enemyResource=400;
  for(let i=0;i<76;i++)defense.step();
  expect(defense.units.filter(u=>u.team==='enemy').slice(0,4).map(u=>u.kind))
    .toEqual(['modernShield','modernMarksman','modernShield','modernAntiTank']);
  expect(ERA_BATTLES.modern[2].enemyDefenseRoster).toContain('modernAntiTank');
  const natural=new BattleSimulation(2,[],23,'steel',undefined,undefined,'modern',undefined,10000);
  for(let i=0;i<30*45;i++)natural.step();
  expect(natural.units.some(u=>u.team==='enemy'&&u.kind==='modernGrenadier')).toBe(true);
  expect(natural.units.some(u=>u.team==='enemy'&&u.kind==='modernArtillery')).toBe(true);
});

it.each([23,47])('reaches the strengthened Modern finale with earned progression and restored checkpoints (seed %i)',seed=>{
  const save=profile();let game=new GameDirector(save);
  expect(game.selectEra('modern')).toBe(true);
  game.startNewRun(seed);game.selectDoctrine('steel');
  while(game.getState().globalTalentPoints>0)expect(game.buyGlobalTalent('supply')).toBe(true);
  game.beginRun();
  for(let battle=0;battle<3;battle++){
    completeCampaignBattle(game,battle);
    const state=game.getState();
    expect(state.eraProgress.modern).toBe(battle+1);
    game=new GameDirector(save);game.continueRun();expect(game.getState().eraId).toBe('modern');game.chooseReward(game.getState().rewards[0].id);
  }
  expect(game.getState().eraProgress.modern).toBe(3);
  expect(game.getState().phase).toBe('contract');
  expect(game.getState().debugEnemyBalance[3].income).toBe(90);
});
