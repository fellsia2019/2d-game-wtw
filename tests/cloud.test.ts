import { afterEach, expect, it, vi } from 'vitest';
import { CloudProfileStorage, type CloudPlayer, type CloudSnapshot } from '../src/platform/cloud';
import type { StorageLike } from '../src/core/save';
import { SaveService } from '../src/core/save';
import { GameDirector } from '../src/core/GameDirector';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const stores: CloudProfileStorage[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.dispose()); vi.useRealTimers(); });
const RECORDS = 'arena-naemnikov-records-v1';
const snapshot = (id: string, runs: number, account = 'account-a'): CloudSnapshot => ({
  version: 1, account, stamp: id, data: { [RECORDS]: JSON.stringify({ runs }) }
});
function setup(remote: CloudSnapshot | null = null, account = 'account-a') {
  const storage = new MemoryStorage();
  const state = { remote };
  const player: CloudPlayer = { getUniqueID: () => account,
    getData: vi.fn(async () => state.remote ? { znamyonaProfile: state.remote } : {}),
    setData: vi.fn(async data => { state.remote = data.znamyonaProfile as CloudSnapshot; }) };
  const choose = vi.fn(async () => 'cloud' as const);
  const open = async (target: CloudPlayer | null = player) => {
    const store = await CloudProfileStorage.open(storage, target, choose); stores.push(store); return store;
  };
  return { storage, state, player, choose, open };
}

it('migrates legacy local data once, saves a complete profile, and excludes Debug', async () => {
  const { storage, player, open, state } = setup();
  storage.setItem(RECORDS, JSON.stringify({ runs: 3 }));
  storage.setItem('arena-naemnikov-debug-balance-v1', 'debug');
  const store = await open();
  expect(store.getItem(RECORDS)).toBe(JSON.stringify({ runs: 3 }));
  expect(store.getItem('arena-naemnikov-debug-balance-v1')).toBe('debug');
  await store.flush();
  expect(player.setData).toHaveBeenCalledTimes(1);
  expect(player.setData).toHaveBeenLastCalledWith({ znamyonaProfile: state.remote }, true);
  expect(state.remote!.data[RECORDS]).toBe(JSON.stringify({ runs: 3 }));
  expect(state.remote!.data['arena-naemnikov-debug-balance-v1']).toBeUndefined();
});

it('restores cloud on a clean browser and keeps the last account cache without SDK', async () => {
  const { open, choose, player } = setup(snapshot('remote', 8));
  const store = await open();
  expect(store.getItem(RECORDS)).toBe(JSON.stringify({ runs: 8 }));
  expect(choose).not.toHaveBeenCalled();
  const offline = await open(null);
  expect(offline.getItem(RECORDS)).toBe(store.getItem(RECORDS));
  expect(player.setData).not.toHaveBeenCalled();
});

it.each(['local', 'cloud'] as const)('resolves a conflict with the %s profile without adding currencies', async choice => {
  const { storage, choose, open, state } = setup(snapshot('remote', 8));
  storage.setItem('znamyona-profile-v1:account-a', JSON.stringify({ ...snapshot('local', 3), syncedStamp: 'older' }));
  choose.mockResolvedValue(choice as 'cloud');
  const store = await open();
  expect(choose).toHaveBeenCalledTimes(1);
  expect(store.getItem(RECORDS)).toBe(JSON.stringify({ runs: choice === 'local' ? 3 : 8 }));
  expect(storage.getItem('znamyona-profile-v1:account-a:conflict-backup')).toBeTruthy();
  await store.flush();
  expect(state.remote!.data[RECORDS]).toBe(store.getItem(RECORDS));
});

it('never imports the previous account profile into a different account', async () => {
  const { storage, open } = setup(snapshot('remote', 8));
  await open();
  storage.setItem(RECORDS, JSON.stringify({ runs: 5 }));
  const other: CloudPlayer = { getUniqueID: () => 'account-b', getData: async () => ({}), setData: async () => {} };
  const store = await open(other);
  expect(store.getItem(RECORDS)).toBeNull();
});

it('retains local changes during outages and stops upload when another device changed cloud', async () => {
  const { open, player, state } = setup(snapshot('remote', 8));
  const store = await open(); const status = vi.fn(); store.onStatus(status);
  store.setItem(RECORDS, JSON.stringify({ runs: 9 }));
  state.remote = snapshot('another-device', 10);
  await store.flush();
  expect(status).toHaveBeenLastCalledWith('conflict');
  expect(player.setData).not.toHaveBeenCalled();
  expect(store.getItem(RECORDS)).toBe(JSON.stringify({ runs: 9 }));
});

it('does not upload blindly if the initial cloud read failed', async () => {
  const { open, storage, player } = setup(snapshot('remote', 8));
  storage.setItem(RECORDS, JSON.stringify({ runs: 3 }));
  vi.mocked(player.getData).mockRejectedValueOnce(new Error('offline'));
  const store = await open();
  const status = vi.fn(); store.onStatus(status);
  expect(status).toHaveBeenLastCalledWith('offline');
  await store.flush();
  expect(status).toHaveBeenLastCalledWith('conflict');
  expect(player.setData).not.toHaveBeenCalled();
});

it('throttles server writes and includes changes made during an upload in the next snapshot', async () => {
  vi.useFakeTimers(); vi.setSystemTime(100_000);
  const { open, player, state } = setup(snapshot('remote', 8));
  const store = await open();
  store.setItem(RECORDS, JSON.stringify({ runs: 9 }));
  let complete!: () => void;
  vi.mocked(player.setData).mockImplementationOnce(data => new Promise(resolve => {
    state.remote = data.znamyonaProfile as CloudSnapshot;
    complete = () => resolve();
  }));
  const first = store.flush();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  store.setItem(RECORDS, JSON.stringify({ runs: 10 }));
  complete(); await first;
  expect(player.setData).toHaveBeenCalledTimes(1);
  await store.flush(); expect(player.setData).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(5000);
  expect(player.setData).toHaveBeenCalledTimes(2);
  expect(state.remote!.data[RECORDS]).toBe(JSON.stringify({ runs: 10 }));
});

it('moves campaign, talents, and the atomic reward receipt together to another browser', async () => {
  const { open, player } = setup();
  const store = await open(), save = new SaveService(store), game = new GameDirector(save);
  game.startNewRun(42); game.selectDoctrine('steel'); game.beginRun();
  const rewarded = save.claimBattleGold('attempt:battle-gold-double', 'stone', save.loadTalents(), 105);
  expect(rewarded?.gold).toBe(105);
  await store.flush();
  const second = await CloudProfileStorage.open(new MemoryStorage(), player, async () => 'cloud'); stores.push(second);
  const recovered = new SaveService(second);
  expect(recovered.load()?.phase).toBe('contract');
  expect(recovered.load()?.seed).toBe(42);
  expect(recovered.loadTalents().gold).toBe(105);
  expect(recovered.claimBattleGold('attempt:battle-gold-double', 'stone', recovered.loadTalents(), 105)).toBeNull();
});

it('retries a failed flush even if getData exposes the SDK cached attempted write', async () => {
  vi.useFakeTimers(); vi.setSystemTime(100_000);
  const { open, player, state } = setup(snapshot('remote', 8));
  const store = await open(); const status = vi.fn(); store.onStatus(status);
  store.setItem(RECORDS, JSON.stringify({ runs: 9 }));
  vi.mocked(player.setData).mockImplementationOnce(async data => {
    state.remote = data.znamyonaProfile as CloudSnapshot;
    throw new Error('network');
  });
  await store.flush(); expect(status).toHaveBeenLastCalledWith('offline');
  await vi.advanceTimersByTimeAsync(5000);
  expect(player.setData).toHaveBeenCalledTimes(2);
  expect(status).toHaveBeenLastCalledWith('synced');
});
