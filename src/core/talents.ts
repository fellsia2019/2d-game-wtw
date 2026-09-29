export const TALENTS = {
  damage: { name: 'Урон', effect: 'Урон всех бойцов', icon: '⚔' },
  attackSpeed: { name: 'Скорость атаки', effect: 'Скорость атаки и лечения', icon: '✦' },
  health: { name: 'Здоровье бойцов', effect: 'Здоровье всех бойцов', icon: '◆' },
  supply: { name: 'Доход припасов', effect: 'Доход припасов', icon: '◈' }
} as const;

export type TalentId = keyof typeof TALENTS;
export type TalentLevels = Record<TalentId, number>;
export interface TalentProgress { gold: number; levels: TalentLevels; baseLevel?: number; }
export const baseHealth = (level: number): number => 1 + level * 10;
export const baseHealthCost = (level: number): number => 10 + level * 5;
export interface GlobalTalentProgress { points: number; levels: TalentLevels; advancedEras: string[]; }
export const emptyGlobalTalents = (): GlobalTalentProgress => ({ points: 0, levels: emptyTalentProgress().levels, advancedEras: [] });
export const globalTalentCost = (): number => 1;
export const combinedTalents = (local: TalentLevels, global: TalentLevels): TalentLevels => ({
  damage: local.damage + global.damage, attackSpeed: local.attackSpeed + global.attackSpeed,
  health: local.health + global.health, supply: local.supply + global.supply
});
export const emptyTalentProgress = (): TalentProgress => ({
  gold: 0, levels: { damage: 0, attackSpeed: 0, health: 0, supply: 0 }
});
export const LEGACY_POINT_GOLD = 10;
// 10, 20, 35, 55, 80, 110...; no rank cap, each next purchase costs more.
export const talentCost = (level: number): number => 10 + 5 * level * (level + 3) / 2;
export const talentMultiplier = (level: number): number => 1 + level * .05;
