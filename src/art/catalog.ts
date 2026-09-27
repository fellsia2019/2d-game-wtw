import type { UnitKind } from '../core/types';

export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.svg`;
export const unitArt: Record<UnitKind, string> = { shield: 'u-shield', spear: 'u-spear', archer: 'u-archer', medic: 'u-medic', raider: 'u-raider', thrower: 'u-thrower', banner: 'u-banner', siege: 'u-siege', bulwark: 'u-bulwark', enemyArcher: 'u-archer' };
export const descriptions = { shield: 'Держит фронт и поглощает часть урона.', spear: 'Пробивает броню тяжёлых бойцов.', archer: 'Стреляет из-за спины передней линии.', medic: 'Лечит раненых союзников рядом.', raider: 'Быстро сближается и давит на фронт.', thrower: 'Взрыв задевает группу противников.', banner: 'Ускоряет атаки ближайших союзников.', siege: 'Медленный расчёт для разрушения ворот.' };
export const rewardIcons: Record<string, string> = { supply: '◈', wagon: '✦', banner: '⚑', arrows: '➶', bandages: '✚', contract: '◇', pikes: '↟', workshop: '⚒' };
