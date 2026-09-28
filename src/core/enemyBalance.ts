import { ERA_BATTLES } from '../data/content';
import type { EraId } from './types';

export interface EnemyBalance { income: number; startSupplies: number; hpBonus: number; damageBonus: number; }
export type EnemyBalanceOverrides = Partial<Record<EraId, EnemyBalance[]>>;
export const enemyBalanceDefaults = (era: EraId): EnemyBalance[] => ERA_BATTLES[era].map(battle => ({
  income: battle.enemyIncome, startSupplies: battle.enemyStartingSupplies ?? 0,
  hpBonus: Math.round(((battle.enemyHealthMultiplier ?? 1) - 1) * 100),
  damageBonus: Math.round(((battle.enemyDamageMultiplier ?? 1) - 1) * 100)
}));
export function validEnemyBalance(value: unknown): value is EnemyBalance {
  if (!value || typeof value !== 'object') return false;
  const row = value as EnemyBalance;
  return Object.entries({ income: 1000, startSupplies: 10000, hpBonus: 1000, damageBonus: 1000 })
    .every(([key, max]) => { const n = row[key as keyof EnemyBalance]; return Number.isFinite(n) && n >= 0 && n <= max; });
}
