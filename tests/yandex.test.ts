import { afterEach, expect, it, vi } from 'vitest';
import { YandexAdapter } from '../src/platform/yandex';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function setup() {
  const events = new Map<string, () => void>();
  const features = { LoadingAPI: { ready: vi.fn() }, GameplayAPI: { start: vi.fn(), stop: vi.fn() } };
  const pause = vi.fn();
  const sdk = { environment: { i18n: { lang: 'en' } }, features,
    on: (name: string, callback: () => void) => events.set(name, callback),
    adv: { showFullscreenAdv: vi.fn(({ callbacks }) => callbacks.onClose(false)) } };
  const html = { lang: '' };
  vi.stubGlobal('document', { documentElement: html });
  vi.stubGlobal('window', { YaGames: { init: vi.fn(async () => sdk) }, setTimeout, clearTimeout });
  return { adapter: new YandexAdapter(pause), events, features, pause, sdk, html };
}

it('waits for scene readiness and selects English from the SDK on startup', async () => {
  const { adapter, features, html } = setup();
  expect(await adapter.initialize()).toBe(true);
  expect(html.lang).toBe('en');
  expect(features.LoadingAPI.ready).not.toHaveBeenCalled();
  adapter.markGameReady(); adapter.markGameReady();
  expect(features.LoadingAPI.ready).toHaveBeenCalledTimes(1);
});

it('uses English for an unsupported SDK language outside the Russian fallback group', async () => {
  const { adapter, sdk, html } = setup();
  sdk.environment.i18n.lang = 'tr';
  expect(await adapter.initialize()).toBe(true);
  expect(html.lang).toBe('en');
});

it('uses Russian for languages in the portal fallback group', async () => {
  const { adapter, sdk, html } = setup();
  sdk.environment.i18n.lang = 'uk';
  expect(await adapter.initialize()).toBe(true);
  expect(html.lang).toBe('ru');
});

it('handles the scene loading before SDK initialization and deduplicates gameplay transitions', async () => {
  const { adapter, features } = setup();
  adapter.markGameReady(); adapter.setGameplay(true);
  await adapter.initialize();
  expect(features.LoadingAPI.ready).toHaveBeenCalledTimes(1);
  expect(features.GameplayAPI.start).toHaveBeenCalledTimes(1);
  adapter.setGameplay(true); adapter.setGameplay(false); adapter.setGameplay(false);
  expect(features.GameplayAPI.start).toHaveBeenCalledTimes(1);
  expect(features.GameplayAPI.stop).toHaveBeenCalledTimes(1);
});

it('handles SDK pause/resume and does not count an omitted advertisement as a shown one', async () => {
  const { adapter, events, pause } = setup();
  await adapter.initialize();
  events.get('game_api_pause')!(); events.get('game_api_resume')!();
  expect(pause.mock.calls).toEqual([[true, 'platform'], [false, 'platform']]);
  expect(await adapter.showIntermissionAd('reward')).toBe(false);
});

it('remains playable locally without an SDK', async () => {
  vi.stubGlobal('window', {});
  const adapter = new YandexAdapter(vi.fn());
  expect(await adapter.initialize()).toBe(false);
  adapter.markGameReady(); adapter.setGameplay(true);
  expect(await adapter.showIntermissionAd('victory')).toBe(false);
});

it('ignores initialization after the startup deadline without switching the open game language', async () => {
  vi.useFakeTimers();
  const { adapter, sdk, html, features, events } = setup();
  html.lang = 'ru';
  let finish!: (value: typeof sdk) => void;
  (window as unknown as { YaGames: { init: () => Promise<typeof sdk> } }).YaGames.init =
    () => new Promise(resolve => { finish = resolve; });
  adapter.markGameReady(); adapter.setGameplay(true);
  const result = adapter.initialize(100);
  await vi.advanceTimersByTimeAsync(100);
  expect(await result).toBe(false);
  finish(sdk);
  await vi.advanceTimersByTimeAsync(1);
  expect(html.lang).toBe('ru');
  expect(events.size).toBe(0);
  expect(features.LoadingAPI.ready).not.toHaveBeenCalled();
  expect(features.GameplayAPI.start).not.toHaveBeenCalled();
  expect(await adapter.showIntermissionAd('victory')).toBe(false);
});

it('rewards once only on onRewarded and keeps the ad pause until close', async () => {
  const { adapter, sdk, pause } = setup();
  let callbacks!: { onOpen(): void; onRewarded(): void; onClose(): void; onError(): void };
  Object.assign(sdk.adv, { showRewardedVideo: vi.fn((options) => { callbacks = options.callbacks; }) });
  await adapter.initialize();
  const reward = vi.fn();
  const result = adapter.showRewardedAd('battle-gold-double', reward);
  expect(await adapter.showRewardedAd('battle-speed-double', reward)).toBe(false);
  expect(await adapter.showIntermissionAd('victory')).toBe(false);
  callbacks.onOpen(); callbacks.onRewarded(); callbacks.onRewarded();
  expect(reward).toHaveBeenCalledTimes(1);
  expect(pause).not.toHaveBeenCalledWith(false, 'advertisement');
  callbacks.onClose();
  expect(await result).toBe(true);
  callbacks.onOpen(); callbacks.onRewarded(); callbacks.onError();
  expect(reward).toHaveBeenCalledTimes(1);
  expect(pause.mock.calls.filter(call => call[0] === false)).toHaveLength(1);
});

it.each(['close', 'error', 'throw'] as const)('does not reward on %s without confirmation', async mode => {
  const { adapter, sdk } = setup();
  Object.assign(sdk.adv, { showRewardedVideo: vi.fn(({ callbacks }) => {
    if (mode === 'throw') throw new Error('unavailable');
    if (mode === 'close') callbacks.onClose(); else callbacks.onError();
    callbacks.onRewarded();
  }) });
  await adapter.initialize();
  const reward = vi.fn();
  expect(await adapter.showRewardedAd('battle-gold-double', reward)).toBe(false);
  expect(reward).not.toHaveBeenCalled();
});

it('does not cancel a confirmed reward when an error follows', async () => {
  const { adapter, sdk } = setup();
  Object.assign(sdk.adv, { showRewardedVideo: vi.fn(({ callbacks }) => {
    callbacks.onRewarded(); callbacks.onError(); callbacks.onClose();
  }) });
  await adapter.initialize();
  const reward = vi.fn();
  expect(await adapter.showRewardedAd('battle-speed-double', reward)).toBe(true);
  expect(reward).toHaveBeenCalledTimes(1);
});
