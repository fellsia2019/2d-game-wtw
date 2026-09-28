import { afterEach, describe, expect, it, vi } from 'vitest';
import { BattleSound } from '../src/view/Sound';
import { MusicLoop } from '../src/view/MusicLoop';
import type { GameState } from '../src/core/types';

const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
const gainNode = () => ({ gain: param(), connect: vi.fn(), disconnect: vi.fn() });
const oscillator = () => ({ type: 'sine', frequency: param(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null });
class AudioMock {
  state: string = 'suspended';
  currentTime = 1;
  destination = {};
  oscillators: ReturnType<typeof oscillator>[] = [];
  gains: ReturnType<typeof gainNode>[] = [];
  resume = vi.fn(async () => { this.state = 'running'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  createGain() {
    const gain = gainNode(); this.gains.push(gain); return gain;
  }
  createOscillator() {
    const voice = oscillator(); this.oscillators.push(voice); return voice;
  }
}
const state = (patch: Partial<GameState> = {}) => ({ muted: false, paused: false, phase: 'battle' as const, ...patch });
const sounds: BattleSound[] = [];
function setup(hidden = () => false) {
  const ctx = new AudioMock(), create = vi.fn(() => ctx as unknown as AudioContext), onStatus = vi.fn();
  const sound = new BattleSound({ createContext: create, isHidden: hidden, onStatus, loadMusic: async () => { throw new Error('No fixture audio'); } }); sounds.push(sound); sound.sync(state());
  return { ctx, sound, create, onStatus };
}
afterEach(() => { sounds.splice(0).forEach(s => s.destroy()); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Web Audio lifecycle and audible feedback', () => {
  it('does not autoplay, resumes inside gesture and schedules audible confirmation after unmute', async () => {
    const { sound, ctx, create } = setup();
    sound.sync(state({ muted: true })); await sound.unlock(true); expect(create).not.toHaveBeenCalled();
    sound.sync(state()); expect(create).not.toHaveBeenCalled();
    const unlock = sound.unlock(true); expect(ctx.resume).toHaveBeenCalledOnce(); expect(ctx.oscillators).toHaveLength(0);
    expect(await unlock).toBe(true); expect(sound.status).toBe('ready');
    expect(ctx.oscillators.length).toBeGreaterThanOrEqual(2); expect(ctx.oscillators.every(o => o.start.mock.calls.length === 1)).toBe(true);
    expect(ctx.gains.some(g => g.gain.exponentialRampToValueAtTime.mock.calls.some(([gain]) => gain >= .16))).toBe(true);
  });
  it.each(['muted', 'paused'] as const)('%s stops active voices and music immediately', async flag => {
    vi.useFakeTimers(); const { sound, ctx } = setup(); await sound.unlock(true);
    const count = ctx.oscillators.length; sound.sync(state({ [flag]: true }));
    expect(ctx.suspend).toHaveBeenCalled(); expect(ctx.oscillators.every(o => o.stop.mock.calls.some(args => args.length === 0))).toBe(true);
    vi.advanceTimersByTime(3000); sound.play({ id: 1, type: 'attack', x: 500, team: 'ally' }); expect(ctx.oscillators).toHaveLength(count);
  });
  it('never starts audio during external/ad pause, including a pending resume race', async () => {
    const { sound, ctx, create } = setup(); sound.sync(state({ paused: true, phase: 'menu' }));
    expect(await sound.unlock(true)).toBe(false); expect(create).not.toHaveBeenCalled();
    sound.sync(state()); let release!: () => void;
    ctx.resume.mockImplementation(() => new Promise<void>(resolve => { release = () => { ctx.state = 'running'; resolve(); }; }));
    const pending = sound.unlock(true); sound.sync(state({ paused: true })); release();
    expect(await pending).toBe(false); expect(ctx.oscillators).toHaveLength(0); expect(ctx.suspend).toHaveBeenCalled();
  });
  it('reports rejected resume and retries on another gesture', async () => {
    const { sound, ctx } = setup(); ctx.resume.mockRejectedValueOnce(new Error('autoplay blocked'));
    expect(await sound.unlock(true)).toBe(false); expect(sound.status).toBe('locked'); expect(ctx.oscillators).toHaveLength(0);
    expect(await sound.unlock(true)).toBe(true); expect(ctx.oscillators.length).toBeGreaterThan(0);
  });
  it('stops on focus loss and resumes interrupted Safari contexts when focus returns', async () => {
    const { sound, ctx } = setup(); await sound.unlock(); sound.setFocused(false); expect(ctx.suspend).toHaveBeenCalled();
    ctx.state = 'interrupted'; sound.setFocused(true); await Promise.resolve(); await Promise.resolve();
    expect(ctx.resume.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
  it('silences hidden pages and distinguishes heal, block and fortress impacts', async () => {
    let hidden = false; const { sound, ctx } = setup(() => hidden); await sound.unlock();
    for (const type of ['heal', 'block', 'fortress'] as const) { ctx.currentTime += 1; sound.play({ id: 1, type, x: 500, team: 'ally' }); }
    const pitches = ctx.oscillators.flatMap(o => o.frequency.setValueAtTime.mock.calls.map(([f]) => f));
    expect(pitches).toContain(659); expect(pitches).toContain(840); expect(pitches).toContain(95);
    hidden = true; sound.sync(state()); expect(ctx.suspend).toHaveBeenCalled();
  });
});


it('mutes music and effects independently without suspending the remaining channel', async () => {
  const playMusic = vi.spyOn(MusicLoop.prototype, 'play').mockImplementation(() => {});
  const pauseMusic = vi.spyOn(MusicLoop.prototype, 'pause');
  const { sound, ctx } = setup();
  sound.sync(state({ muted: true, musicMuted: false }));
  await sound.unlock();
  expect(playMusic).toHaveBeenCalled();
  sound.play({ id: 1, type: 'attack', x: 500, team: 'ally' });
  expect(ctx.oscillators).toHaveLength(0);
  expect(ctx.suspend).not.toHaveBeenCalled();
  playMusic.mockClear();
  sound.sync(state({ muted: false, musicMuted: true }));
  await Promise.resolve(); await Promise.resolve();
  expect(pauseMusic).toHaveBeenCalled();
  expect(playMusic).not.toHaveBeenCalled();
  sound.play({ id: 2, type: 'attack', x: 500, team: 'ally' });
  expect(ctx.oscillators.length).toBeGreaterThan(0);
  expect(ctx.suspend).not.toHaveBeenCalled();
  sound.sync(state({ muted: true, musicMuted: false }));
  await Promise.resolve(); await Promise.resolve();
  expect(ctx.oscillators.every(o => o.stop.mock.calls.some(args => args.length === 0))).toBe(true);
  expect(playMusic).toHaveBeenCalled();
  expect(ctx.suspend).not.toHaveBeenCalled();
  sound.sync(state({ muted: true, musicMuted: true }));
  expect(ctx.suspend).toHaveBeenCalled();
});
