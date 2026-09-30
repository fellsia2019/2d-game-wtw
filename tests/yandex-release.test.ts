import { afterEach, expect, it, vi } from 'vitest';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { enemyBalanceDefaults } from '../src/core/enemyBalance';

afterEach(() => vi.unstubAllEnvs());
it('ignores local Debug balance and rejects Debug commands in the public mode', () => {
  vi.stubEnv('MODE', 'yandex');
  const values = new Map<string, string>();
  const storage: StorageLike = { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
  const save = new SaveService(storage);
  save.writeEnemyBalance({ stone: Array.from({ length: 4 }, () => ({ income: 200, startSupplies: 200, hpBonus: 200, damageBonus: 200 })) });
  const game = new GameDirector(save);
  expect(game.getState().debugEnemyBalance).toEqual(enemyBalanceDefaults('stone'));
  expect(game.addDebugGold(2000)).toBe(false);
  expect(game.startDebugBattle(3)).toBe(false);
  expect(game.setBattleSpeed(2)).toBe(false);
  expect(game.setEnemyBalance(0, { income: 0, startSupplies: 0, hpBonus: 0, damageBonus: 0 })).toBe(false);
  expect(game.getState().gold).toBe(0);
  expect(game.getState().phase).toBe('menu');
});
