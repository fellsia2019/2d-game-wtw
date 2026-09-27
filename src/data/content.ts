import type { DoctrineOption, HireKind, UnitKind, UpgradeId } from '../core/types';

export interface UnitDefinition {
  name: string; role: string; cost: number; hp: number; damage: number; range: number;
  speed: number; period: number; armor: number; heal?: number; antiArmor?: number;
}

export const UNITS: Record<UnitKind, UnitDefinition> = {
  shield: { name: 'Щитоносец', role: 'Передняя линия · поглощает удары', cost: 18, hp: 50, damage: 3, range: 25, speed: 33, period: 1, armor: .25 },
  spear: { name: 'Копейщик', role: 'Пробивает броню', cost: 26, hp: 28, damage: 9, range: 40, speed: 41, period: 1.2, armor: 0, antiArmor: 2.5 },
  archer: { name: 'Стрелок', role: 'Дальний урон из-за строя', cost: 30, hp: 20, damage: 7, range: 155, speed: 38, period: .95, armor: 0 },
  medic: { name: 'Лекарь', role: 'Лечит ближайшего раненого', cost: 42, hp: 23, damage: 2, heal: 6, range: 105, speed: 36, period: 1.4, armor: 0 },
  raider: { name: 'Налётчик', role: 'Прорывается к стрелкам', cost: 24, hp: 29, damage: 9, range: 26, speed: 76, period: .85, armor: 0 },
  thrower: { name: 'Метатель', role: 'Поражает плотные группы', cost: 38, hp: 21, damage: 8, range: 120, speed: 34, period: 1.6, armor: 0 },
  banner: { name: 'Знаменосец', role: 'Ускоряет атаки рядом', cost: 45, hp: 29, damage: 3, range: 28, speed: 36, period: 1.2, armor: .1 },
  siege: { name: 'Осадник', role: 'Разрушает крепости', cost: 55, hp: 31, damage: 8, range: 125, speed: 26, period: 1.8, armor: 0 },
  bulwark: { name: 'Латник', role: 'Тяжёлая броня', cost: 34, hp: 70, damage: 5, range: 27, speed: 27, period: 1.3, armor: .6 },
  enemyArcher: { name: 'Вражеский стрелок', role: 'Дальний бой', cost: 30, hp: 20, damage: 6, range: 150, speed: 36, period: 1, armor: 0 }
};

export const HIRE_KINDS: HireKind[] = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export const STARTER_KINDS: HireKind[] = ['shield', 'spear', 'archer', 'medic'];
export const UNLOCKS: { kind: HireKind; marks: number }[] = [
  { kind: 'raider', marks: 1 }, { kind: 'thrower', marks: 3 },
  { kind: 'banner', marks: 5 }, { kind: 'siege', marks: 8 }
];

export const DOCTRINES: DoctrineOption[] = [
  { id: 'steel', name: 'Сталь', description: 'Первый щитоносец каждого боя дешевле на 6 припасов.' },
  { id: 'arrow', name: 'Стрела', description: 'Первые два стрелка каждого боя получают +20 к дальности.' },
  { id: 'bargain', name: 'Сделка', description: 'Старт с 20 припасами, но крепость имеет 85 здоровья.' }
];

export const UPGRADES: Record<UpgradeId, { name: string; description: string; category: 'economy' | 'defense' | 'offense'; requires?: HireKind }> = {
  supply: { name: 'Полевой запас', description: 'Максимум припасов +20', category: 'economy' },
  wagon: { name: 'Слаженный обоз', description: 'Восстановление припасов +1/с', category: 'economy' },
  banner: { name: 'Знамя стойкости', description: 'Здоровье щитоносцев и копейщиков +15%', category: 'defense' },
  arrows: { name: 'Точные стрелы', description: 'Урон стрелков +15%', category: 'offense', requires: 'archer' },
  bandages: { name: 'Полевые повязки', description: 'Лечение +20%', category: 'defense', requires: 'medic' },
  contract: { name: 'Дешёвый контракт', description: 'Первый призыв каждого боя дешевле на 8', category: 'economy' },
  pikes: { name: 'Усиленные пики', description: 'Копейщики сильнее против брони', category: 'offense', requires: 'spear' },
  workshop: { name: 'Инженерная мастерская', description: 'Первый обоз каждого боя дешевле на 12', category: 'economy' },
  boots: { name: 'Лёгкие сапоги', description: 'Налётчики двигаются на 20% быстрее', category: 'offense', requires: 'raider' },
  siegecraft: { name: 'Осадный расчёт', description: 'Осадники наносят крепости на 20% больше урона', category: 'offense', requires: 'siege' },
  lastReserve: { name: 'Последний резерв', description: 'Один бесплатный щитоносец при крепости ниже 35%', category: 'defense', requires: 'shield' },
  standard: { name: 'Строевой шаг', description: 'Знаменосцы сильнее ускоряют союзников рядом', category: 'offense', requires: 'banner' }
};

export interface BattleDefinition { name: string; threat: string; ai: 'rush' | 'wall' | 'ranged' | 'boss'; enemyIncome: number; roster: UnitKind[]; arenaId: 'ash' | 'iron' | 'arrows' | 'citadel'; }
export const BATTLES: BattleDefinition[] = [
  { name: 'Разминка', threat: 'Налётчики: частые слабые атаки', ai: 'rush', enemyIncome: 6.3, roster: ['raider', 'shield'], arenaId: 'ash' },
  { name: 'Железная стена', threat: 'Латники: броню пробивают копейщики', ai: 'wall', enemyIncome: 6.4, roster: ['bulwark', 'enemyArcher'], arenaId: 'iron' },
  { name: 'Под градом стрел', threat: 'Стрелки под прикрытием латников', ai: 'ranged', enemyIncome: 5.9, roster: ['bulwark', 'enemyArcher'], arenaId: 'arrows' },
  { name: 'Комендант', threat: 'При 50% здоровья крепости готовит отмеченную волну', ai: 'boss', enemyIncome: 6.7, roster: ['bulwark', 'enemyArcher', 'raider'], arenaId: 'citadel' }
];
