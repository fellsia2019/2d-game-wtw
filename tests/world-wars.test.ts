import { expect, it } from 'vitest';
import manifest from '../public/assets/sprite-manifest.json';
import approved from '../public/assets/world-wars-manifest.json';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { ERA_HIRE_KINDS, UNITS, nextEra, unitRole } from '../src/data/content';
import { unitArt } from '../src/art/catalog';
import type { Team, UnitKind, UnitState } from '../src/core/types';
import { completeCampaignBattle } from './helpers/campaign';

class MemoryStorage implements StorageLike {
  values = new Map<string,string>();
  getItem(key:string){return this.values.get(key) ?? null;}
  setItem(key:string,value:string){this.values.set(key,value);}
  removeItem(key:string){this.values.delete(key);}
}
function profile(wins=4) {
  const save = new SaveService(new MemoryStorage());
  save.writeEraProgress({unlocked:{stone:true,bronze:true,iron:true,antique:true,medieval:true,'high-medieval':true,renaissance:true,industrial:true},
    wins:{stone:4,bronze:4,iron:4,antique:4,medieval:4,'high-medieval':4,renaissance:4,industrial:wins},challenges:{}});
  return save;
}
function figure(id:number,kind:UnitKind,team:Team,x:number):UnitState {
  return {id,kind,team,x,cooldown:0,hp:5000,maxHp:5000,action:'idle',facing:team==='ally'?1:-1};
}

it.each([23,47])('completes all World Wars stages without ads or debug gold and restores progress (seed %i)', seed => {
  const save = profile(); let game = new GameDirector(save);
  expect(game.selectEra('world-wars')).toBe(true);
  game.startNewRun(seed); game.selectDoctrine('steel');
  while (game.getState().globalTalentPoints > 0) expect(game.buyGlobalTalent('supply')).toBe(true);
  game.beginRun();
  const attempts: number[] = [];
  for (let battle = 0; battle < 4; battle++) {
    attempts.push(completeCampaignBattle(game, battle));
    expect(game.getState().eraProgress['world-wars']).toBe(battle + 1);
    expect(game.getState().unlockedUnits).toHaveLength(5 + battle);
    if (battle < 3) {
      game = new GameDirector(save); game.continueRun();
      expect(game.getState().eraId).toBe('world-wars');
      expect(game.chooseReward(game.getState().rewards[0].id)).toBe(true);
    }
  }
  expect(attempts).toHaveLength(4);
  expect(game.getState().phase).toBe('victory');
  const restored = new GameDirector(save);
  expect(restored.selectEra('world-wars')).toBe(true);
  expect(restored.getState().eraProgress['world-wars']).toBe(4);
  restored.startNewRun(seed + 1);
  expect(restored.getState().unlockedUnits).toEqual(ERA_HIRE_KINDS['world-wars']);
}, 30000);

it('unlocks after Industrial, preserves its own wallet, and registers eight roles plus the unique tank',()=>{
  const save=profile();
  save.writeTalents({gold:830,levels:{damage:2,health:3,supply:1,attackSpeed:2},baseLevel:8},'industrial');
  expect(nextEra('industrial')).toBe('world-wars');
  expect(nextEra('world-wars')).toBe('modern');
  expect(save.loadEraProgress().unlocked['world-wars']).toBe(true);
  expect(save.loadTalents('world-wars').gold).toBe(0);
  expect(save.loadTalents('industrial').gold).toBe(830);
  expect(ERA_HIRE_KINDS['world-wars']).toHaveLength(8);
  expect(new Set(ERA_HIRE_KINDS['world-wars'].map(id=>unitArt[id])).size).toBe(8);
  expect(unitArt.worldWarsJeep).toBe('world-wars-u-raider');
  expect(unitArt.worldWarsArmoredCar).toBe('world-wars-u-siege');
  expect(unitArt.worldWarsCommander).toBe('world-wars-boss');
  expect(unitRole('worldWarsCommander')).toBe('siege');
  expect(approved.status).toBe('approved');
  expect(approved.sheets).toHaveLength(17);
  expect(manifest.eras.at(-2)).toBe('world-wars');
  expect(approved.sheets.every(sheet=>manifest.sheets.includes(sheet))).toBe(true);
  expect(manifest.eraFrameCounts['world-wars'].boss).toBe(16);
  expect(new GameDirector(profile(3)).selectEra('world-wars')).toBe(false);
});

it('uses the tank in the boss phase and applies reconnaissance and suppression to either team',()=>{
  expect(enemyBalanceDefaults('world-wars')).toEqual([
    {income:41,startSupplies:35,hpBonus:25,damageBonus:25},
    {income:65,startSupplies:45,hpBonus:50,damageBonus:50},
    {income:65,startSupplies:50,hpBonus:65,damageBonus:65},
    {income:70,startSupplies:60,hpBonus:96,damageBonus:96}
  ]);
  expect(UNITS.worldWarsCommander.hp).toBe(2200);
  expect(UNITS.worldWarsCommander.damage * 1.96).toBeCloseTo(101.92);
  const finale=new BattleSimulation(3,[],23,'steel',undefined,undefined,'world-wars',undefined,10000);
  finale.enemyFortressHp=50;finale.step();
  expect(finale.bossPhase).toBe('assault');
  expect(finale.units.find(u=>u.kind==='worldWarsCommander')?.maxHp).toBe(4312);
  for(const team of ['ally','enemy'] as const){
    const targetTeam=team==='ally'?'enemy':'ally';
    const s=new BattleSimulation(0,[],23,'steel',undefined,undefined,'world-wars',undefined,10000);
    const jeep=figure(100,'worldWarsJeep',team,400), target=figure(101,'worldWarsShield',targetTeam,440);
    s.units.push(jeep,target);s.step();
    expect(s.events.some(e=>e.type==='expose'&&e.targetId===101)).toBe(true);
    expect(target.exposedUntil).toBeGreaterThan(s.elapsed);
    const hit=(exposed:boolean)=>{
      const trial=new BattleSimulation(0,[],23,'steel',undefined,undefined,'world-wars',undefined,10000);
      const sniper=figure(100,'worldWarsSniper',team,400), shield=figure(101,'worldWarsShield',targetTeam,600);
      if(exposed)shield.exposedUntil=10;
      trial.units.push(sniper,shield);trial.step();
      return trial.events.find(e=>e.type==='attack'&&e.sourceId===100)?.amount ?? 0;
    };
    expect(hit(true)).toBeGreaterThan(hit(false));
    const barrage=new BattleSimulation(0,[],23,'steel',undefined,undefined,'world-wars',undefined,10000);
    const shield=figure(101,'worldWarsShield',targetTeam,600);
    barrage.units.push(...[0,1,2].map(i=>figure(200+i,'worldWarsSniper',team,400)),shield);
    barrage.step();
    expect(barrage.events.some(e=>e.type==='suppress'&&e.targetId===101)).toBe(true);
    expect(shield.suppressedUntil).toBeGreaterThan(barrage.elapsed);
    const movement=(suppressed:boolean)=>{
      const trial=new BattleSimulation(0,[],23,'steel',undefined,undefined,'world-wars',undefined,10000);
      const start=team==='ally'?200:800, mover=figure(100,'worldWarsShield',team,start);
      if(suppressed)mover.suppressedUntil=10;
      trial.units.push(mover);trial.step();
      return Math.abs(mover.x-start);
    };
    expect(movement(true)).toBeCloseTo(movement(false)*.7);
  }
});

it('recruits the full third-stage ranged roster, including grenadier and armored car',()=>{
  const battle=new BattleSimulation(2,[],23,'steel',undefined,undefined,'world-wars',undefined,10000);
  battle.enemyResource=1000;
  for(let step=0;step<90;step++)battle.step();
  const recruits=battle.units.filter(unit=>unit.team==='enemy').map(unit=>unit.kind);
  expect(recruits).toContain('worldWarsGrenadier');
  expect(recruits).toContain('worldWarsArmoredCar');
});

it('shows the requested balance in a new game and after restoring its checkpoint',()=>{
  const save=profile();let game=new GameDirector(save);
  expect(game.selectEra('world-wars')).toBe(true);
  expect(game.getState().debugEnemyBalance).toEqual(enemyBalanceDefaults('world-wars'));
  game.startNewRun(23);game.selectDoctrine('steel');game.beginRun();
  expect(game.getState().enemyIncome).toBe(41);
  game=new GameDirector(save);game.continueRun();
  expect(game.getState().eraId).toBe('world-wars');
  expect(game.getState().debugEnemyBalance).toEqual(enemyBalanceDefaults('world-wars'));
});
