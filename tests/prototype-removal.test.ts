import { expect, it } from 'vitest';
import { ERA_ORDER, ERA_HIRE_KINDS, UNITS } from '../src/data/content';
import { unitArt } from '../src/art/catalog';
import { GameDirector } from '../src/core/GameDirector';
import { SaveService, type StorageLike } from '../src/core/save';
import type { EraId } from '../src/core/types';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

it('contains only units and artwork belonging to the seven current eras', () => {
  expect(ERA_ORDER).toEqual(['stone', 'bronze', 'iron', 'antique', 'medieval', 'high-medieval', 'renaissance']);
  expect(Object.keys(UNITS)).toHaveLength(72);
  expect(Object.keys(unitArt).sort()).toEqual(Object.keys(UNITS).sort());
  for (const era of ERA_ORDER) expect(ERA_HIRE_KINDS[era]).toHaveLength(8);
  expect(Object.values(unitArt).every(asset => /^(stone|bronze|iron|antique|medieval|high-medieval|renaissance)-u-/.test(asset))).toBe(true);
});

it('ignores a prototype checkpoint and selection while preserving current era progress and wallets', () => {
  const storage = new MemoryStorage();
  storage.setItem('arena-naemnikov-selected-era-v1', 'legacy');
  storage.setItem('arena-naemnikov-run-v3', JSON.stringify({version:3,eraId:'legacy',seed:7,battleIndex:2,
    phase:'contract',doctrine:'steel',roster:['shield','spear','archer','medic'],upgrades:[],rewards:[],
    contracts:[],selectedContract:null,report:null,runTime:20}));
  storage.setItem('arena-naemnikov-eras-v1', JSON.stringify({unlocked:{stone:true,bronze:true,legacy:true},
    wins:{stone:4,bronze:2,legacy:4},challenges:{stone:false,bronze:true,legacy:true}}));
  const levels = {damage:2,attackSpeed:1,health:0,supply:3};
  storage.setItem('arena-naemnikov-talents-v2', JSON.stringify({version:2,eras:{
    stone:{gold:120,levels,baseLevel:9},bronze:{gold:75,levels,baseLevel:4},legacy:{gold:999,levels}}}));
  const save = new SaveService(storage), game = new GameDirector(save);
  expect(save.load()).toBeNull();
  expect(game.getState().eraId).toBe('bronze');
  expect(game.getState().canContinue).toBe(false);
  expect(game.getState().eraProgress).toEqual({stone:4,bronze:2,iron:0,antique:0,medieval:0,'high-medieval':0,renaissance:0});
  expect(save.loadTalents('stone')).toEqual({gold:120,levels,baseLevel:9});
  expect(save.loadTalents('bronze')).toEqual({gold:75,levels,baseLevel:4});
  expect(game.selectEra('legacy' as EraId)).toBe(false);
});

it('continues a current checkpoint from backup even when the primary checkpoint is from the prototype', () => {
  const storage = new MemoryStorage(), save = new SaveService(storage);
  const game = new GameDirector(save);
  game.startNewRun(72, 'stone');
  const current = storage.getItem('arena-naemnikov-run-v3')!;
  storage.setItem('arena-naemnikov-run-v3-backup', current);
  storage.setItem('arena-naemnikov-run-v3', current.replace('"stone"', '"legacy"'));
  const restored = new GameDirector(save);
  restored.continueRun();
  expect(restored.getState().eraId).toBe('stone');
  expect(restored.getState().seed).toBe(72);
  expect(restored.getState().roster).toEqual(ERA_HIRE_KINDS.stone.slice(0,4));
});

it('rejects a current-era checkpoint carrying prototype enemies', () => {
  const storage = new MemoryStorage(), save = new SaveService(storage);
  const game = new GameDirector(save);
  game.startNewRun(1);
  game.selectDoctrine('steel'); game.beginRun();
  const checkpoint = JSON.parse(storage.getItem('arena-naemnikov-run-v3')!);
  checkpoint.contracts[0].roster = ['bulwark'];
  storage.removeItem('arena-naemnikov-run-v3-backup');
  storage.setItem('arena-naemnikov-run-v3', JSON.stringify(checkpoint));
  expect(save.load()).toBeNull();
});
