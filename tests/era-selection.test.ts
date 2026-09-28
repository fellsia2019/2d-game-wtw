import { expect, it } from 'vitest';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import type { BattleSimulation } from '../src/core/BattleSimulation';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function unlockedSave() {
  const save = new SaveService(new MemoryStorage());
  save.writeEraProgress({ unlocked: { stone: true, bronze: true, legacy: true },
    wins: { stone: 4, bronze: 0, legacy: 0 }, challenges: { stone: false, bronze: false, legacy: false } });
  return save;
}

it('selects the latest unlocked era for existing saves without a preference', () => {
  const save = unlockedSave();
  save.writeTalents({ gold: 42, levels: { damage: 1, health: 0, attackSpeed: 0, supply: 0 } }, 'bronze');
  const state = new GameDirector(save).getState();
  expect(state.eraId).toBe('bronze');
  expect(state.gold).toBe(42);
  expect(state.roster[0]).toBe('bronzeGuard');
});

it('preserves manual era selection on reload and keeps another era checkpoint', () => {
  const save = unlockedSave();
  const game = new GameDirector(save);
  game.startNewRun(23);
  game.returnToMenu();
  expect(game.selectEra('stone')).toBe(true);
  const restored = new GameDirector(save);
  expect(restored.getState().eraId).toBe('stone');
  expect(restored.getState().canContinue).toBe(false);
  expect(save.load()?.eraId).toBe('bronze');
  restored.selectEra('bronze');
  expect(restored.getState().canContinue).toBe(true);
});

it('selects bronze after its first unlock for menu and reload, then honours a manual override', () => {
  const save = new SaveService(new MemoryStorage());
  const game = new GameDirector(save);
  game.startNewRun(23);
  const checkpoint = save.load()!;
  save.write({ ...checkpoint, battleIndex: 3, phase: 'contract', doctrine: 'steel' });
  game.continueRun();
  expect(game.chooseContract(game.getState().contracts[0].id)).toBe(true);
  const sim = (game as unknown as { simulation: BattleSimulation }).simulation;
  sim.enemyFortressHp = 0;
  game.tick();
  expect(game.getState().phase).toBe('victory');
  expect(new GameDirector(save).getState().eraId).toBe('bronze');
  expect(game.returnToMenu()).toBe(true);
  expect(game.getState().eraId).toBe('bronze');
  game.selectEra('stone');
  expect(new GameDirector(save).getState().eraId).toBe('stone');
});

it('ignores locked and corrupt saved era selections', () => {
  const storage = new MemoryStorage();
  const save = new SaveService(storage);
  save.writeSelectedEra('bronze');
  expect(new GameDirector(save).getState().eraId).toBe('stone');
  storage.setItem('arena-naemnikov-selected-era-v1', 'bad');
  expect(new GameDirector(save).getState().eraId).toBe('stone');
});
