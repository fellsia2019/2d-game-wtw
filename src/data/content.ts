import type { DoctrineOption, EraId, HireKind, UnitKind, UnitRole, UpgradeId } from '../core/types';

export interface UnitDefinition {
  name: string; role: string; cost: number; hp: number; damage: number; range: number;
  speed: number; period: number; armor: number; heal?: number; antiArmor?: number; archetype?: UnitRole;
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
  enemyArcher: { name: 'Вражеский стрелок', role: 'Дальний бой', cost: 30, hp: 20, damage: 6, range: 150, speed: 36, period: 1, armor: 0 },
  stoneShield: { name: 'Пещерный страж', role: 'Защитник · крепкий каменный щит', cost: 16, hp: 49, damage: 3, range: 24, speed: 34, period: 1.1, armor: .18 },
  stoneSpear: { name: 'Охотник с копьём', role: 'Против брони · длинное копьё', cost: 24, hp: 27, damage: 9, range: 43, speed: 43, period: 1.2, armor: 0, antiArmor: 2.3 },
  stoneSlinger: { name: 'Пращник', role: 'Дальний бой · короткая дистанция', cost: 27, hp: 19, damage: 8, range: 128, speed: 40, period: 1.1, armor: 0 },
  stoneShaman: { name: 'Шаман', role: 'Поддержка · лечит бойцов', cost: 39, hp: 22, damage: 2, heal: 6, range: 90, speed: 35, period: 1.5, armor: 0 },
  stoneScout: { name: 'Лазутчик', role: 'Засада · первый удар по стрелку сильнее', cost: 23, hp: 26, damage: 10, range: 26, speed: 82, period: .85, armor: 0 },
  stoneThrower: { name: 'Метатель валунов', role: 'Площадь · каменная осыпь', cost: 37, hp: 22, damage: 9, range: 105, speed: 31, period: 1.7, armor: 0 },
  stoneTotem: { name: 'Хранитель тотема', role: 'Командир · ускоряет атаки', cost: 43, hp: 27, damage: 3, range: 30, speed: 35, period: 1.3, armor: .05 },
  stoneRam: { name: 'Таранщик', role: 'Осада · крушит укрепления', cost: 52, hp: 36, damage: 8, range: 35, speed: 27, period: 1.7, armor: .1 },
  bronzeGuard: { name: 'Бронзовый страж', role: 'Защитник · броня крепче рядом с фалангой', cost: 20, hp: 57, damage: 4, range: 27, speed: 30, period: 1.1, armor: .35 },
  bronzeSpear: { name: 'Копейщик фаланги', role: 'Против брони · строй усиливает защиту', cost: 29, hp: 33, damage: 10, range: 48, speed: 35, period: 1.25, armor: .12, antiArmor: 2.4 },
  bronzeArcher: { name: 'Лучник города', role: 'Дальний бой · прицельный залп', cost: 33, hp: 22, damage: 8, range: 168, speed: 36, period: 1, armor: .05 },
  bronzeHealer: { name: 'Храмовый лекарь', role: 'Поддержка · лечит бойцов', cost: 43, hp: 26, damage: 2, heal: 8, range: 113, speed: 33, period: 1.5, armor: .08 },
  bronzeChariot: { name: 'Колесничий', role: 'Прорыв · стремительная атака', cost: 34, hp: 38, damage: 12, range: 36, speed: 93, period: 1.1, armor: .12 },
  bronzePitch: { name: 'Метатель смолы', role: 'Площадь · обжигающий залп', cost: 43, hp: 23, damage: 10, range: 125, speed: 31, period: 1.7, armor: .03 },
  bronzeHerald: { name: 'Глашатай', role: 'Командир · ускоряет атаки', cost: 49, hp: 32, damage: 4, range: 29, speed: 33, period: 1.2, armor: .2 },
  bronzeRam: { name: 'Осадный таран', role: 'Осада · усиленный удар', cost: 61, hp: 48, damage: 11, range: 45, speed: 25, period: 1.9, armor: .28 },
  stoneHunter: { name: 'Ночной охотник', role: 'Враг · стремительный прорыв', cost: 23, hp: 25, damage: 9, range: 26, speed: 74, period: .95, armor: 0, archetype: 'raider' },
  stoneBone: { name: 'Костяной щит', role: 'Враг · прикрытие', cost: 19, hp: 47, damage: 4, range: 26, speed: 31, period: 1.1, armor: .25, archetype: 'shield' },
  stoneEnemySlinger: { name: 'Пращник племени', role: 'Враг · дальний бой', cost: 27, hp: 20, damage: 7, range: 130, speed: 36, period: 1.05, armor: 0, archetype: 'archer' },
  stoneWolf: { name: 'Вожак стаи', role: 'Враг · быстрые атаки', cost: 35, hp: 36, damage: 11, range: 31, speed: 71, period: .82, armor: .04, archetype: 'raider' },
  stoneChief: { name: 'Вождь Чёрного камня', role: 'Босс · сокрушает строй', cost: 64, hp: 600, damage: 20, range: 38, speed: 35, period: 1.3, armor: .25, archetype: 'shield' },
  bronzeEnemySpear: { name: 'Бронзовый копейщик', role: 'Враг · пробивает броню', cost: 30, hp: 34, damage: 11, range: 48, speed: 34, period: 1.2, armor: .12, antiArmor: 2.2, archetype: 'spear' },
  bronzeRaider: { name: 'Колесница налётчиков', role: 'Враг · прорыв', cost: 39, hp: 39, damage: 12, range: 34, speed: 82, period: 1.05, armor: .1, archetype: 'raider' },
  bronzeEnemyArcher: { name: 'Храмовый лучник', role: 'Враг · дальний бой', cost: 32, hp: 23, damage: 8, range: 157, speed: 34, period: 1.05, armor: .08, archetype: 'archer' },
  bronzeGate: { name: 'Страж ворот', role: 'Враг · тяжёлая броня', cost: 43, hp: 80, damage: 6, range: 29, speed: 25, period: 1.3, armor: .5, archetype: 'shield' },
  bronzeKing: { name: 'Царь Медных ворот', role: 'Босс · бронзовый натиск', cost: 76, hp: 781, damage: 30 / 1.15, range: 42, speed: 31, period: 1.3, armor: .45, archetype: 'shield' }
};

export const HIRE_KINDS: HireKind[] = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export const STARTER_KINDS: HireKind[] = ['shield', 'spear', 'archer', 'medic'];
export const UNLOCKS: { kind: HireKind; marks: number }[] = [
  { kind: 'raider', marks: 1 }, { kind: 'thrower', marks: 3 },
  { kind: 'banner', marks: 5 }, { kind: 'siege', marks: 8 }
];

export const DOCTRINES: DoctrineOption[] = [
  { id: 'steel', name: 'Оплот', description: 'Первый защитник каждого боя дешевле на 6 припасов.' },
  { id: 'arrow', name: 'Стрела', description: 'Первые два бойца дальнего боя получают +20 к дальности.' },
  { id: 'bargain', name: 'Сделка', description: 'Старт с 20 припасами, но крепость теряет 15% здоровья (минимум 1 HP).' }
];

export const UPGRADES: Record<UpgradeId, { name: string; description: string; category: 'economy' | 'defense' | 'offense'; requires?: HireKind }> = {
  supply: { name: 'Полевой запас', description: '+20 припасов в начале боя', category: 'economy' },
  wagon: { name: 'Улучшенное снабжение', description: 'Восстановление припасов +1/с', category: 'economy' },
  banner: { name: 'Знамя стойкости', description: 'Здоровье защитников и бойцов против брони +15%', category: 'defense' },
  arrows: { name: 'Точные стрелы', description: 'Урон бойцов дальнего боя +15%', category: 'offense', requires: 'archer' },
  bandages: { name: 'Полевые повязки', description: 'Лечение +20%', category: 'defense', requires: 'medic' },
  contract: { name: 'Дешёвый контракт', description: 'Первый призыв каждого боя дешевле на 8', category: 'economy' },
  pikes: { name: 'Усиленные пики', description: 'Бойцы с копьями сильнее против брони', category: 'offense', requires: 'spear' },
  workshop: { name: 'Инженерная мастерская', description: 'Первое улучшение дохода дешевле на 12', category: 'economy' },
  boots: { name: 'Лёгкие сапоги', description: 'Быстрые бойцы двигаются на 20% быстрее', category: 'offense', requires: 'raider' },
  siegecraft: { name: 'Осадный расчёт', description: 'Осадные бойцы наносят крепости на 20% больше урона', category: 'offense', requires: 'siege' },
  lastReserve: { name: 'Последний резерв', description: 'Один бесплатный защитник при крепости ниже 35%', category: 'defense', requires: 'shield' },
  standard: { name: 'Строевой шаг', description: 'Командиры сильнее ускоряют союзников рядом', category: 'offense', requires: 'banner' }
};

export interface BattleDefinition { name: string; threat: string; ai: 'rush' | 'wall' | 'ranged' | 'boss'; enemyIncome: number; enemyStartingSupplies?: number; enemyHealthMultiplier?: number; enemyDamageMultiplier?: number; enemyRecruitRoster?: UnitKind[]; roster: UnitKind[]; arenaId: 'ash' | 'iron' | 'arrows' | 'citadel'; }
export const BATTLES: BattleDefinition[] = [
  { name: 'Разминка', threat: 'Налётчики: частые слабые атаки', ai: 'rush', enemyIncome: 6.3, roster: ['raider', 'shield'], arenaId: 'ash' },
  { name: 'Железная стена', threat: 'Латники: броню пробивают копейщики', ai: 'wall', enemyIncome: 6.4, roster: ['bulwark', 'enemyArcher'], arenaId: 'iron' },
  { name: 'Под градом стрел', threat: 'Стрелки под прикрытием латников', ai: 'ranged', enemyIncome: 5.9, roster: ['bulwark', 'enemyArcher'], arenaId: 'arrows' },
  { name: 'Комендант', threat: 'При 50% здоровья крепости готовит отмеченную волну', ai: 'boss', enemyIncome: 6.7, roster: ['bulwark', 'enemyArcher', 'raider'], arenaId: 'citadel' }
];

export const ERA_ORDER: EraId[] = ['stone', 'bronze'];
export const ERA_NAMES: Record<EraId, string> = { stone: 'Каменный век', bronze: 'Бронзовый век', legacy: 'Поход наёмников' };
export const ERA_HIRE_KINDS: Record<EraId, HireKind[]> = {
  stone: ['stoneShield', 'stoneSpear', 'stoneSlinger', 'stoneShaman', 'stoneScout', 'stoneThrower', 'stoneTotem', 'stoneRam'],
  bronze: ['bronzeGuard', 'bronzeSpear', 'bronzeArcher', 'bronzeHealer', 'bronzeChariot', 'bronzePitch', 'bronzeHerald', 'bronzeRam'],
  legacy: HIRE_KINDS
};
export const ERA_STARTER_KINDS: Record<EraId, HireKind[]> = {
  stone: ERA_HIRE_KINDS.stone.slice(0, 4), bronze: ERA_HIRE_KINDS.bronze.slice(0, 4), legacy: STARTER_KINDS
};
const ROLES: UnitRole[] = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export function unitRole(kind: UnitKind): UnitRole {
  const index = ERA_HIRE_KINDS.stone.indexOf(kind as HireKind);
  if (index >= 0) return ROLES[index];
  const bronzeIndex = ERA_HIRE_KINDS.bronze.indexOf(kind as HireKind);
  if (bronzeIndex >= 0) return ROLES[bronzeIndex];
  return UNITS[kind].archetype ?? (kind === 'bulwark' ? 'shield' : kind === 'enemyArcher' ? 'archer' : kind as UnitRole);
}
export const ERA_BATTLES: Record<EraId, BattleDefinition[]> = {
  legacy: BATTLES,
  stone: [
    { name: 'Ночная засада', threat: 'Ночные охотники быстро подходят к крепости', ai: 'rush', enemyIncome: 5.8, roster: ['stoneHunter', 'stoneBone'], arenaId: 'ash' },
    { name: 'Костяной заслон', threat: 'Костяные щиты прикрывают пращников', ai: 'wall', enemyIncome: 8, enemyStartingSupplies: 8, roster: ['stoneBone', 'stoneEnemySlinger'], arenaId: 'iron' },
    { name: 'Тропа стаи', threat: 'Вожак стаи ведёт быстрые атаки', ai: 'ranged', enemyIncome: 10, enemyStartingSupplies: 10, enemyHealthMultiplier: 1.3, enemyDamageMultiplier: 1.1, roster: ['stoneWolf', 'stoneEnemySlinger', 'stoneHunter'], arenaId: 'arrows' },
    { name: 'Вождь Чёрного камня', threat: 'При 50% здоровья крепости вождь выходит в бой', ai: 'boss', enemyIncome: 15, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.35, enemyDamageMultiplier: 1.15, enemyRecruitRoster: ['stoneBone', 'stoneHunter', 'stoneEnemySlinger'], roster: ['stoneChief', 'stoneBone', 'stoneHunter', 'stoneEnemySlinger'], arenaId: 'citadel' }
  ],
  bronze: [
    { name: 'Дорога колесниц', threat: 'Колесницы прорываются сквозь дальний строй', ai: 'rush', enemyIncome: 13, enemyStartingSupplies: 10, enemyHealthMultiplier: 1.1, enemyDamageMultiplier: 1.05, roster: ['bronzeRaider', 'bronzeEnemySpear', 'bronzeEnemyArcher'], arenaId: 'ash' },
    { name: 'Бронзовая фаланга', threat: 'Копейщики под прикрытием стражей ворот', ai: 'wall', enemyIncome: 15, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.15, enemyDamageMultiplier: 1.1, roster: ['bronzeGate', 'bronzeEnemySpear'], arenaId: 'iron' },
    { name: 'Храмовые стены', threat: 'Лучники стреляют из-за плотного строя', ai: 'ranged', enemyIncome: 16, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.15, roster: ['bronzeGate', 'bronzeEnemyArcher', 'bronzeRaider'], arenaId: 'arrows' },
    { name: 'Царь Медных ворот', threat: 'При 50% здоровья крепости царь ведёт ударную волну', ai: 'boss', enemyIncome: 17, enemyStartingSupplies: 25, enemyHealthMultiplier: 1.28, enemyDamageMultiplier: 1.15, enemyRecruitRoster: ['bronzeGate', 'bronzeEnemyArcher', 'bronzeEnemyArcher'], roster: ['bronzeKing', 'bronzeGate', 'bronzeEnemyArcher', 'bronzeRaider'], arenaId: 'citadel' }
  ]
};
