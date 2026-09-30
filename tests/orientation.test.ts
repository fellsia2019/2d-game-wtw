import { afterEach, expect, it, vi } from 'vitest';
import { mountOrientationGuard } from '../src/ui/orientation';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService } from '../src/core/save';

afterEach(() => vi.unstubAllGlobals());

function setup(portrait: boolean) {
  let change = () => {};
  const media = { matches: portrait, addEventListener: vi.fn((_event, callback) => { change = callback; }), removeEventListener: vi.fn() };
  const shell = { inert: false };
  const guard = { hidden: false, className: '', tabIndex: 0, innerHTML: '', setAttribute: vi.fn(), focus: vi.fn(), remove: vi.fn() };
  const previousFocus = { isConnected: true, focus: vi.fn() };
  const root = { querySelector: vi.fn(() => shell), append: vi.fn() };
  vi.stubGlobal('window', { matchMedia: vi.fn(() => media) });
  vi.stubGlobal('document', { createElement: () => guard, activeElement: previousFocus });
  const app = new GameDirector(new SaveService(null));
  app.startDebugBattle(0);
  const mounted = mountOrientationGuard(root as unknown as HTMLElement, app);
  return { app, shell, guard, previousFocus, media, mounted, rotate: (value: boolean) => { media.matches = value; change(); } };
}

it('blocks portrait input and combat, then restores focus and combat after rotation', () => {
  const { app, shell, guard, previousFocus, mounted, rotate } = setup(true);
  expect(mounted.blocked()).toBe(true);
  expect(shell.inert).toBe(true);
  expect(guard.hidden).toBe(false);
  const elapsed = app.getState().elapsed;
  app.tick();
  expect(app.getState().elapsed).toBe(elapsed);
  rotate(false);
  expect(shell.inert).toBe(false);
  expect(guard.hidden).toBe(true);
  expect(previousFocus.focus).toHaveBeenCalled();
  app.tick();
  expect(app.getState().elapsed).toBeGreaterThan(elapsed);
});

it('preserves manual and platform pauses independently of the orientation pause', () => {
  const { app, rotate } = setup(false);
  app.togglePause();
  rotate(true); rotate(false);
  expect(app.getState().paused).toBe(true);
  app.togglePause();
  app.setExternalPause(true, 'sdk');
  rotate(true); rotate(false);
  expect(app.getState().paused).toBe(true);
  app.setExternalPause(false, 'sdk');
  expect(app.getState().paused).toBe(false);
});

it('starts unobstructed in landscape and cleans up its listener and pause on unmount', () => {
  const { app, shell, guard, media, mounted, rotate } = setup(false);
  expect(mounted.blocked()).toBe(false);
  expect(guard.hidden).toBe(true);
  expect(app.getState().paused).toBe(false);
  rotate(true);
  mounted.destroy();
  expect(shell.inert).toBe(false);
  expect(guard.remove).toHaveBeenCalledOnce();
  expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  expect(app.getState().paused).toBe(false);
});
