import { describe, expect, it } from 'vitest';
import { UnitMotion } from '../src/view/UnitMotion';
import type { UnitState } from '../src/core/types';

const unit = (overrides: Partial<UnitState> = {}): UnitState => ({
  id: 7, kind: 'shield', team: 'ally', x: 100, hp: 50, maxHp: 50,
  cooldown: .3, action: 'move', facing: 1, ...overrides
});

describe('unit presentation clock', () => {
  it.each([60, 144])('keeps walking through 30Hz snapshots at %iHz render rate', hz => {
    const motion = new UnitMotion(unit(), 0);
    const frames = new Set<number>();
    let previousX = 100;
    let lastTick = 0;
    let stationaryFrames = 0;
    const speed = 36;
    for (let frame = 1; frame <= hz * 2; frame++) {
      const elapsed = frame / hz;
      const tick = Math.floor(elapsed * 30 + 1e-9);
      if (tick > lastTick) {
        motion.sample(unit({ x: 100 + tick * speed / 30 }), tick / 30);
        lastTick = tick;
      }
      const pose = motion.advance(1 / hz);
      expect(pose.frame).toBeGreaterThanOrEqual(2);
      expect(pose.frame).toBeLessThanOrEqual(9);
      expect(pose.x).toBeGreaterThanOrEqual(previousX - 1e-6);
      if (frame > hz / 2) {
        const delta = pose.x - previousX;
        if (delta < 1e-6) stationaryFrames++;
        expect(delta).toBeLessThan(speed / hz * 1.8);
      }
      previousX = pose.x;
      frames.add(pose.frame);
    }
    expect(frames.size).toBeGreaterThanOrEqual(6);
    expect(stationaryFrames).toBeLessThan(hz * .1);
  });

  it('holds a steady ready pose, then transitions walk to attack to idle', () => {
    const motion = new UnitMotion(unit(), 0);
    for (let tick = 1; tick <= 30; tick++) {
      motion.sample(unit({ x: 100 + tick, action: 'move' }), tick / 30);
      motion.advance(1 / 60); motion.advance(1 / 60);
    }
    motion.sample(unit({ x: 130, action: 'attack' }), 31 / 30);
    for (let i = 0; i < 120; i++) {
      const pose = motion.advance(1 / 60);
      expect(pose).toEqual({ x: 130, frame: 1, facing: 1 });
    }
    motion.sample(unit({ x: 130, action: 'idle' }), 32 / 30);
    for (let i = 0; i < 120; i++) expect(motion.advance(1 / 60)).toEqual({ x: 130, frame: 0, facing: 1 });
  });

  it('freezes walk, interpolation and strike during pause', () => {
    const motion = new UnitMotion(unit(), 0);
    motion.sample(unit({ x: 104 }), 1 / 30);
    motion.triggerStrike();
    const before = motion.advance(1 / 60);
    for (let i = 0; i < 180; i++) expect(motion.advance(1 / 60, true)).toEqual(before);
    const after = motion.advance(1 / 60);
    expect(after.frame).toBeGreaterThanOrEqual(before.frame);
    expect(after.x).toBeGreaterThanOrEqual(before.x);
  });

  it('plays heal and fortress strikes once, then holds a ready pose', () => {
    for (const kind of ['medic', 'siege'] as const) {
      const motion = new UnitMotion(unit({ kind, action: 'attack' }), 0);
      motion.sample(unit({ kind, action: 'attack' }), 1 / 30);
      expect(motion.advance(1 / 60).frame).toBe(1);
      motion.triggerStrike(); // event type heal or fortress, routed by BattleScene
      const first = motion.advance(1 / 60).frame;
      expect(first).toBeGreaterThanOrEqual(10);
      motion.advance(.1);
      const progressed = motion.advance(.1).frame;
      motion.triggerStrike(); // duplicate event from same simulation hit must not restart
      expect(motion.advance(1 / 60).frame).toBeGreaterThanOrEqual(progressed);
      for (let i = 0; i < 30; i++) motion.advance(1 / 60);
      expect(motion.advance(1 / 60).frame).toBe(1);
    }
  });

  it('clears clocks when a unit id is reused in a new battle', () => {
    const motion = new UnitMotion(unit(), 0);
    motion.triggerStrike(); motion.advance(.12);
    const next = unit({ x: 895, team: 'enemy', action: 'idle', facing: -1 });
    motion.reset(next, 0);
    expect(motion.advance(1 / 60)).toEqual({ x: 895, frame: 0, facing: -1 });
    motion.sample(unit({ ...next, action: 'move', x: 893 }), 1 / 30);
    const pose = motion.advance(1 / 60);
    expect(pose.frame).toBeGreaterThanOrEqual(2);
    expect(pose.facing).toBe(-1);
  });
});
