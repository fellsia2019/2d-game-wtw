import { afterEach, expect, it, vi } from 'vitest';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import { ERA_ORDER } from '../src/data/content';
import { completeCampaignBattle } from './helpers/campaign';

afterEach(() => vi.unstubAllEnvs());

it('finishes 39 battles from a fresh public profile without ads or Debug and restores the Modern finale', () => {
  vi.stubEnv('MODE', 'yandex');
  const values = new Map<string, string>();
  const storage: StorageLike = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); }
  };
  const save = new SaveService(storage);
  let game = new GameDirector(save);
  for (const era of ERA_ORDER) {
    expect(game.selectEra(era)).toBe(true);
    game.startNewRun(23);
    expect(game.selectDoctrine('steel')).toBe(true);
    while (game.getState().globalTalentPoints > 0) expect(game.buyGlobalTalent('supply')).toBe(true);
    expect(game.beginRun()).toBe(true);
    const attempts: number[] = [];
    // The strengthened finale was completed by the owner with shield + ranged
    // units. The reference bot covers the path to it without changing balance.
    const stages = era === 'modern' ? 3 : 4;
    for (let stage = 0; stage < stages; stage++) {
      attempts.push(completeCampaignBattle(game, stage));
      expect(game.getState().eraProgress[era]).toBe(stage + 1);
      if (stage < 3) {
        game = new GameDirector(save);
        game.continueRun();
        expect(game.getState().eraId).toBe(era);
        expect(game.chooseReward(game.getState().rewards[0].id)).toBe(true);
      }
    }
    expect(game.getState().phase).toBe(era === 'modern' ? 'contract' : 'victory');
    console.log('Release campaign', era, 'attempts', attempts);
    game = new GameDirector(save);
    expect(game.getState().eraProgress[era]).toBe(stages);
  }
  game.continueRun();
  expect(game.getState().eraId).toBe('modern');
  expect(game.getState().battleIndex).toBe(3);
  expect(game.getState().phase).toBe('contract');
  expect(game.chooseContract(game.getState().contracts[0].id)).toBe(true);
  expect(game.getState().enemyIncome).toBe(90);
}, 120000);
