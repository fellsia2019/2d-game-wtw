import { expect, it } from 'vitest';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { BattleSimulation } from '../src/core/BattleSimulation';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';
class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const custom = { income: 20, startSupplies: 45, hpBonus: 50, damageBonus: 25 };
function setup() {
  const save = new SaveService(new MemoryStorage());
  save.writeEraProgress({ unlocked: { stone: true, bronze: true },
    wins: { stone: 4, bronze: 0 }, challenges: { stone: false, bronze: false } });
  return { save, game: new GameDirector(save) };
}
it('persists editable rows independently of other eras and resets to configured defaults', () => {
  const { save, game } = setup();
  expect(game.setEnemyBalance(0, custom)).toBe(true);
  const restored = new GameDirector(save);
  expect(restored.getState().debugEnemyBalance[0]).toEqual(custom);
  restored.selectEra('stone');
  expect(restored.getState().debugEnemyBalance).toEqual(enemyBalanceDefaults('stone'));
  restored.selectEra('bronze'); restored.resetEnemyBalance();
  expect(new GameDirector(save).getState().debugEnemyBalance).toEqual(enemyBalanceDefaults('bronze'));
});
it('keeps active combat unchanged and applies edits on retry', () => {
  const { game } = setup();
  game.startNewRun(23); game.selectDoctrine('steel'); game.beginRun();
  game.chooseContract(game.getState().contracts[0].id);
  const sim = (game as unknown as { simulation: BattleSimulation }).simulation;
  game.setEnemyBalance(0, custom);
  expect(game.getState().enemyIncome).toBe(13);
  sim.allyFortressHp = 0; game.tick();
  expect(game.retryBattle()).toBe(true);
  const retry = (game as unknown as { simulation: BattleSimulation }).simulation;
  expect(retry.enemyResource).toBe(45);
  expect(retry.enemyIncome).toBe(20);
  expect(retry.enemyBalance).toEqual(custom);
  for (let i = 0; i < 76; i++) game.tick();
  expect(game.getState().units.find(unit => unit.kind === 'bronzeRaider')?.maxHp).toBe(59);
});
it('rejects empty, non-finite, negative and out-of-range values without overwriting valid rows', () => {
  const { game } = setup();
  const initial = game.getState().debugEnemyBalance;
  for (const income of [NaN, Infinity, -1, 1001]) expect(game.setEnemyBalance(0, { ...custom, income })).toBe(false);
  expect(game.setEnemyBalance(4, custom)).toBe(false);
  expect(game.getState().debugEnemyBalance).toEqual(initial);
});


it('starts any debug battle with current army, talents, speed and edited balance', () => {
  const { save } = setup();
  save.writeTalents({ gold: 123, levels: { damage: 2, health: 1, attackSpeed: 0, supply: 1 } }, 'bronze');
  const app = new GameDirector(save);
  app.setEnemyBalance(3, custom);
  app.setBattleSpeed(5);
  const roster = app.getState().roster;
  for (const index of [2, 0, 3, 1, 1]) {
    expect(app.startDebugBattle(index)).toBe(true);
    const state = app.getState();
    expect(state.phase).toBe('battle');
    expect(state.battleIndex).toBe(index);
    expect(state.eraId).toBe('bronze');
    expect(state.elapsed).toBe(0);
    expect(state.units).toHaveLength(0);
    expect(state.roster).toEqual(roster);
    expect(state.gold).toBe(123);
    expect(state.talents.damage).toBe(2);
    expect(state.battleSpeed).toBe(5);
    expect(save.load()?.battleIndex).toBe(index);
    if (index === 3) expect(state.enemyIncome).toBe(20);
    app.tick();
    app.togglePause();
  }
  expect(app.getState().paused).toBe(true);
  app.startDebugBattle(3);
  expect(app.getState().paused).toBe(false);
  const restored = new GameDirector(save); restored.continueRun();
  expect(restored.getState().battleIndex).toBe(3);
  expect(restored.getState().enemyIncome).toBe(20);
});

it('rejects invalid debug battle indices without disturbing active combat', () => {
  const { game } = setup();
  game.startDebugBattle(1);
  game.tick();
  const before = game.getState();
  for (const index of [-1, 4, 1.5, NaN, Infinity]) expect(game.startDebugBattle(index)).toBe(false);
  expect(game.getState().elapsed).toBe(before.elapsed);
  expect(game.getState().battleIndex).toBe(1);
});

it.each([50,100,200,500,2000])('adds %i upgrade gold during battle without adding supplies or crediting it twice', amount => {
  const {save,game}=setup();
  game.startDebugBattle(0);
  const before=game.getState();
  expect(game.addDebugGold(amount)).toBe(true);
  const after=game.getState();
  expect(after.gold).toBe(before.gold+amount);
  expect(after.battleGold).toBe(before.battleGold+amount);
  expect(after.resource).toBe(before.resource);
  expect(save.loadTalents(after.eraId).gold).toBe(after.gold);
  game.tick();
  expect(game.getState().gold).toBe(after.gold);
  game.returnToMenu();
  expect(game.buyTalent('damage')).toBe(true);
  const restored=new GameDirector(save);
  expect(restored.getState().gold).toBe(amount-10);
  expect(restored.getState().talents.damage).toBe(1);
  expect(save.loadTalents('stone').gold).toBe(0);
});
it.each([50,100,200,500,2000])('adds %i upgrade gold outside battle, saves it and permits immediate upgrades', amount => {
  const {save,game}=setup();
  expect(game.getState().phase).toBe('menu');
  expect(game.addDebugGold(amount)).toBe(true);
  expect(game.getState().battleGold).toBe(0);
  expect(game.buyTalent('damage')).toBe(true);
  game.startNewRun();
  expect(game.getState().phase).toBe('preparation');
  const before=game.getState();
  expect(game.addDebugGold(amount)).toBe(true);
  expect(game.getState().gold).toBe(before.gold+amount);
  expect(game.getState().resource).toBe(before.resource);
  expect(game.getState().battleGold).toBe(0);
  const restored=new GameDirector(save);
  expect(restored.getState().gold).toBe(amount*2-10);
  expect(restored.getState().talents.damage).toBe(1);
  restored.selectEra('stone');
  expect(restored.getState().gold).toBe(0);
});
it('adds debug gold after defeat without changing the completed battle report', () => {
  const {save,game}=setup();
  game.startDebugBattle(0);
  for(let i=0;i<10000&&game.getState().phase==='battle';i++)game.tick();
  expect(game.getState().phase).toBe('defeat');
  const before=game.getState();
  expect(game.addDebugGold(2000)).toBe(true);
  const after=game.getState();
  expect(after.gold).toBe(before.gold+2000);
  expect(after.battleGold).toBe(before.battleGold);
  expect(after.report).toEqual(before.report);
  expect(after.resource).toBe(before.resource);
  expect(save.loadTalents(after.eraId).gold).toBe(after.gold);
});
it('allows debug gold on a paused battle and rejects all other amounts', () => {
  const {game}=setup();game.startDebugBattle(0);game.togglePause();
  expect(game.addDebugGold(50)).toBe(true);
  const state=game.getState();
  for(const amount of [-50,0,1,75,NaN,Infinity]) expect(game.addDebugGold(amount)).toBe(false);
  expect(game.getState().gold).toBe(state.gold);
  expect(game.getState().resource).toBe(state.resource);
});
