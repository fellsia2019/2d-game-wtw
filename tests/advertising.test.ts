import { expect, it, vi } from 'vitest';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import type { RewardedProvider } from '../src/core/advertising';
import type { BattleSimulation } from '../src/core/BattleSimulation';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function setup() {
  const storage = new MemoryStorage(), save = new SaveService(storage), game = new GameDirector(save);
  game.startNewRun(42); game.selectDoctrine('steel'); game.beginRun();
  game.setPlatformStatus({ sdk: 'available', online: true });
  const provider: RewardedProvider = { showRewardedAd: vi.fn(async (_type, grant) => { grant(); grant(); return true; }) };
  game.setRewardedProvider(provider);
  return { game, save, storage, provider };
}
function finish(game: GameDirector, won = false, gold = 105) {
  // Inject a completed simulation report to exercise real director settlement,
  // avoiding dependence on the numerical balance of a particular era.
  const simulation = (game as unknown as { simulation: BattleSimulation }).simulation;
  simulation.goldEarned = gold;
  simulation.report = { won, goldEarned: gold, reason: 'fixture', duration: 60, allyFortressHp: won ? 1 : 0,
    enemyFortressHp: won ? 0 : 100, hires: 0, damageDealt: 0, damageTaken: 0, blocked: 0, healed: 0, survivors: 0 };
  game.tick();
}

it.each([false, true])('adds the fixed report gold once after a talent purchase (won=%s)', async won => {
  const { game, provider, save, storage } = setup();
  game.chooseContract(game.getState().contracts[0].id); finish(game, won);
  expect(game.buyTalent('damage')).toBe(true);
  const before = game.getState().gold;
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(true);
  expect(game.getState().gold).toBe(before + 105);
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(false);
  expect(provider.showRewardedAd).toHaveBeenCalledTimes(1);
  expect(game.buyTalent('damage')).toBe(true);
  const restored = new GameDirector(new SaveService(storage));
  expect(restored.restoreBattleResult()).toBe(true);
  restored.setPlatformStatus({ sdk: 'available', online: true }); restored.setRewardedProvider(provider);
  expect(restored.getState().advertising.goldClaimed).toBe(true);
  expect(restored.getState().gold).toBe(save.loadTalents().gold);
  expect(await restored.requestRewardedAd('battle-gold-double')).toBe(false);
});

it('keeps final-result rewards in the completed era even after the next era unlocks', async () => {
  const { game, storage, save } = setup();
  game.startDebugBattle(3); finish(game, true);
  expect(save.load()).toBeNull();
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(true);
  expect(save.loadTalents('stone').gold).toBe(210);
  expect(save.loadTalents('bronze').gold).toBe(0);
  const restored = new GameDirector(new SaveService(storage));
  expect(restored.getState().eraId).toBe('bronze');
  restored.selectEra('stone'); expect(restored.restoreBattleResult()).toBe(true);
  expect(restored.getState().phase).toBe('victory');
  expect(restored.getState().advertising.goldClaimed).toBe(true);
});

it('does not offer a zero-gold bonus and leaves normal transitions available without SDK', async () => {
  const { game, provider } = setup();
  game.chooseContract(game.getState().contracts[0].id); finish(game, false, 0);
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(false);
  expect(provider.showRewardedAd).not.toHaveBeenCalled();
  game.setPlatformStatus({ sdk: 'unavailable' });
  expect(game.retryBattle(true)).toBe(true);
  expect(await game.requestRewardedAd('battle-speed-double')).toBe(false);
  expect(game.chooseContract(game.getState().contracts[0].id)).toBe(true);
});

it('persists attempt speed, never auto-starts, and resets on retry', async () => {
  const { game, storage } = setup();
  expect(game.setRewardedSpeed(2)).toBe(false);
  expect(await game.requestRewardedAd('battle-speed-double')).toBe(true);
  expect(game.getState().phase).toBe('contract');
  expect(game.getState().battleSpeed).toBe(2);
  game.chooseContract(game.getState().contracts[0].id);
  game.togglePause(); game.setExternalPause(true, 'platform'); game.setExternalPause(false, 'platform');
  expect(game.getState().paused).toBe(true);
  expect(game.setRewardedSpeed(1)).toBe(true);
  const restored = new GameDirector(new SaveService(storage)); restored.continueRun();
  expect(restored.getState().advertising.speedUnlocked).toBe(true);
  expect(restored.getState().battleSpeed).toBe(1);
  expect(restored.setRewardedSpeed(2)).toBe(true);
  finish(restored);
  expect(restored.retryBattle(true)).toBe(true);
  expect(restored.getState().phase).toBe('contract');
  expect(restored.getState().battleSpeed).toBe(1);
  expect(restored.getState().advertising.speedUnlocked).toBe(false);
});

it('resets the speed entitlement on the next stage and on a new campaign', async () => {
  const { game } = setup();
  await game.requestRewardedAd('battle-speed-double');
  game.chooseContract(game.getState().contracts[0].id); finish(game, true);
  game.chooseReward(game.getState().rewards[0].id);
  expect(game.getState().advertising.speedUnlocked).toBe(false);
  await game.requestRewardedAd('battle-speed-double');
  game.startNewRun(); expect(game.getState().advertising.speedUnlocked).toBe(false);
});

it('locks transitions and concurrent rewards until ad closure; ignores late rewards', async () => {
  const { game } = setup();
  let grant!: () => void, close!: (value: boolean) => void;
  game.setRewardedProvider({ showRewardedAd: (_type, callback) => { grant = callback; return new Promise(resolve => { close = resolve; }); } });
  const pending = game.requestRewardedAd('battle-speed-double');
  expect(game.chooseContract(game.getState().contracts[0].id)).toBe(false);
  expect(game.returnToMenu()).toBe(false); expect(game.selectEra('stone')).toBe(false);
  game.startNewRun(); expect(game.getState().phase).toBe('contract');
  expect(await game.requestRewardedAd('battle-speed-double')).toBe(false);
  close(false); expect(await pending).toBe(false);
  grant(); expect(game.getState().advertising.speedUnlocked).toBe(false);
  expect(game.chooseContract(game.getState().contracts[0].id)).toBe(true);
});

it('a failed wallet commit never stores a reward receipt or changes the wallet', async () => {
  const { game, storage, save, provider } = setup();
  game.chooseContract(game.getState().contracts[0].id); finish(game);
  const before = game.getState().gold;
  const original = storage.setItem.bind(storage);
  storage.setItem = () => { throw new Error('quota'); };
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(false);
  expect(game.getState().gold).toBe(before);
  expect(game.getState().advertising.goldClaimed).toBe(false);
  storage.setItem = original;
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(true);
  expect(save.loadTalents().gold).toBe(before + 105);
  expect(provider.showRewardedAd).toHaveBeenCalledTimes(1);
});

it('recovers a persisted confirmation after a wallet failure and reload', async () => {
  const { game, storage } = setup();
  game.chooseContract(game.getState().contracts[0].id); finish(game);
  const original = storage.setItem.bind(storage);
  storage.setItem = (key, value) => { if (key === 'arena-naemnikov-talents-v2') throw new Error('quota'); original(key, value); };
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(false);
  storage.setItem = original;
  const restored = new GameDirector(new SaveService(storage));
  restored.restoreBattleResult();
  expect(restored.getState().gold).toBe(210);
  expect(restored.getState().advertising.goldClaimed).toBe(true);
  const again = new GameDirector(new SaveService(storage)); again.restoreBattleResult();
  expect(again.getState().gold).toBe(210);
});

it('another completed attempt with the same seed can earn its own reward', async () => {
  const { game } = setup();
  game.chooseContract(game.getState().contracts[0].id); finish(game);
  await game.requestRewardedAd('battle-gold-double');
  game.retryBattle(); finish(game);
  expect(game.getState().advertising.goldClaimed).toBe(false);
  expect(await game.requestRewardedAd('battle-gold-double')).toBe(true);
  expect(game.getState().gold).toBe(420);
});
