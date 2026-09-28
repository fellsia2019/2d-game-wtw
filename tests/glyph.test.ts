import { describe, expect, it } from 'vitest';
import { BattleSimulation } from '../src/core/BattleSimulation';

describe('enemy fortress glyph', () => {
  it('stops an overwhelming hit at half HP, blocks damage for five seconds and expires once', () => {
    const sim = new BattleSimulation(0, [], 23, 'steel', undefined, undefined, 'stone', { damage: 10000, health: 0, attackSpeed: 0, supply: 0 });
    sim.resource = 100; sim.hire('stoneShield');
    const ally = sim.units[0]; ally.x = 930; ally.cooldown = 0;
    sim.enemyFortressHp = 51; sim.step();
    expect(sim.enemyFortressHp).toBe(50);
    expect(sim.enemyGlyphRemaining).toBe(5);
    for (let i = 0; i < 149; i++) {
      sim.enemyResource = 0; ally.cooldown = 0; sim.step();
      expect(sim.enemyFortressHp).toBe(50);
      expect(sim.report).toBeNull();
    }
    expect(sim.enemyGlyphRemaining).toBeGreaterThan(0);
    sim.enemyResource = 0; ally.cooldown = 100; sim.step();
    expect(sim.enemyGlyphRemaining).toBe(0);
    sim.enemyFortressHp = 49; sim.step();
    expect(sim.enemyGlyphRemaining).toBe(0);
    ally.cooldown = 0; sim.step();
    expect(sim.report?.won).toBe(true);
  });
  it('starts simultaneously with the boss and leaves boss protection after expiry', () => {
    const sim = new BattleSimulation(3, [], 23, 'steel', undefined, undefined, 'stone');
    sim.enemyFortressHp = 50; sim.step();
    expect(sim.bossPhase).toBe('assault');
    expect(sim.enemyGlyphRemaining).toBe(5);
    for (let i = 0; i < 150; i++) { sim.enemyResource = 0; sim.step(); }
    expect(sim.enemyGlyphRemaining).toBe(0);
    expect(sim.bossPhase).toBe('assault');
    expect(sim.enemyFortressHp).toBe(50);
  });
});
