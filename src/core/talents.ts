export const TALENTS = {
  damage: { name: 'Сила оружия', effect: 'Урон всех бойцов', icon: '⚔' },
  attackSpeed: { name: 'Боевой ритм', effect: 'Скорость атаки и лечения', icon: '✦' },
  health: { name: 'Выучка', effect: 'Здоровье всех бойцов', icon: '◆' },
  supply: { name: 'Снабжение', effect: 'Доход припасов', icon: '◈' }
} as const;

export type TalentId = keyof typeof TALENTS;
export type TalentLevels = Record<TalentId, number>;
export interface TalentProgress { points: number; levels: TalentLevels; }
export const MAX_TALENT_LEVEL = 5;
export const emptyTalentProgress = (): TalentProgress => ({
  points: 0, levels: { damage: 0, attackSpeed: 0, health: 0, supply: 0 }
});
export const talentCost = (level: number): number => level + 1;
export const talentMultiplier = (level: number): number => 1 + level * .05;
