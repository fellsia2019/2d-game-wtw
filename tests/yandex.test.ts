import { afterEach, expect, it, vi } from 'vitest';
import { YandexAdapter } from '../src/platform/yandex';

afterEach(() => vi.unstubAllGlobals());

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

it('waits for scene readiness and reports it once, with RU fallback determined on startup', async () => {
  const { adapter, features, html } = setup();
  expect(await adapter.initialize()).toBe(true);
  expect(html.lang).toBe('ru');
  expect(features.LoadingAPI.ready).not.toHaveBeenCalled();
  adapter.markGameReady(); adapter.markGameReady();
  expect(features.LoadingAPI.ready).toHaveBeenCalledTimes(1);
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
