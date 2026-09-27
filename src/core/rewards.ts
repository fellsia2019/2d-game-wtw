import { UPGRADES } from '../data/content';
import { Random } from './random';
import type { HireKind, UpgradeId } from './types';

export function offerRewards(seed: number, battleIndex: number, roster: HireKind[], selected: UpgradeId[]): UpgradeId[] {
  const random = new Random((seed ^ Math.imul(battleIndex + 1, 0x85ebca6b)) >>> 0);
  const remaining = (Object.keys(UPGRADES) as UpgradeId[]).filter(id => {
    if (selected.includes(id)) return false;
    const requirement = UPGRADES[id].requires;
    if (requirement && !roster.includes(requirement)) return false;
    if (id === 'banner' && !roster.includes('shield') && !roster.includes('spear')) return false;
    return true;
  });
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = random.int(i + 1);
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  const result: UpgradeId[] = [];
  for (const category of ['economy', 'defense', 'offense'] as const) {
    const item = remaining.find(id => UPGRADES[id].category === category && !result.includes(id));
    if (item) result.push(item);
  }
  for (const id of remaining) if (result.length < 3 && !result.includes(id)) result.push(id);
  return result;
}
