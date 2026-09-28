import { describe, expect, it } from 'vitest';
import { GameUI } from '../src/ui/GameUI';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService } from '../src/core/save';

function fixture() {
  const game = new GameDirector(new SaveService(null));
  const state = game.getState();
  state.unlockedUnits.push('stoneScout');
  const ui = Object.create(GameUI.prototype) as GameUI;
  Object.assign(ui, { state, draft: [...state.roster], renderOverlay: () => {} });
  return ui;
}

describe('four-card squad selection', () => {
  it('removes a chosen fighter and adds another with direct card clicks', () => {
    const ui = fixture(), original = ui.getDraftRoster();
    ui.toggleRoster(original[2]);
    expect(ui.getDraftRoster()).toEqual([original[0], original[1], original[3]]);
    ui.toggleRoster('stoneScout');
    expect(ui.getDraftRoster()).toEqual([original[0], original[1], original[3], 'stoneScout']);
  });
  it('keeps locked units out and rejects a fifth fighter without changing the squad', () => {
    const ui = fixture(), original = ui.getDraftRoster();
    ui.toggleRoster('stoneRam'); ui.toggleRoster('stoneScout');
    expect(ui.getDraftRoster()).toEqual(original);
    expect(new Set(ui.getDraftRoster()).size).toBe(4);
  });
  it('toggles a fighter off and back on without duplication', () => {
    const ui = fixture(), original = ui.getDraftRoster();
    ui.toggleRoster(original[3]);
    expect(ui.getDraftRoster()).toHaveLength(3);
    ui.toggleRoster(original[3]);
    expect(ui.getDraftRoster()).toEqual(original);
  });
});
