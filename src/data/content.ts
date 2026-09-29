import type { DoctrineOption, EraId, HireKind, UnitKind, UnitRole, UpgradeId } from '../core/types';

export interface UnitDefinition {
  name: string; role: string; cost: number; hp: number; damage: number; range: number;
  speed: number; period: number; armor: number; heal?: number; antiArmor?: number; archetype?: UnitRole;
}

export const UNITS: Record<UnitKind, UnitDefinition> = {
  stoneShield: { name: 'Пещерный страж', role: 'Защитник · крепкий каменный щит', cost: 16, hp: 49, damage: 3, range: 24, speed: 34, period: 1.1, armor: .18 },
  stoneSpear: { name: 'Охотник с копьём', role: 'Против брони · длинное копьё', cost: 24, hp: 27, damage: 9, range: 43, speed: 43, period: 1.2, armor: 0, antiArmor: 2.3 },
  stoneSlinger: { name: 'Пращник', role: 'Дальний бой · короткая дистанция', cost: 27, hp: 19, damage: 8, range: 128, speed: 40, period: 1.1, armor: 0 },
  stoneShaman: { name: 'Племенной лекарь', role: 'Поддержка · лечит бойцов', cost: 39, hp: 22, damage: 2, heal: 6, range: 90, speed: 35, period: 1.5, armor: 0 },
  stoneScout: { name: 'Лазутчик', role: 'Засада · первый удар по стрелку сильнее', cost: 23, hp: 26, damage: 10, range: 26, speed: 82, period: .85, armor: 0 },
  stoneThrower: { name: 'Метатель валунов', role: 'Площадь · каменная осыпь', cost: 37, hp: 22, damage: 9, range: 105, speed: 31, period: 1.7, armor: 0 },
  stoneTotem: { name: 'Знаменосец племени', role: 'Командир · ускоряет атаки', cost: 43, hp: 27, damage: 0, range: 30, speed: 35, period: 1.3, armor: .05 },
  stoneRam: { name: 'Таранщик', role: 'Осада · крушит укрепления', cost: 52, hp: 36, damage: 8, range: 35, speed: 27, period: 1.7, armor: .1 },
  bronzeGuard: { name: 'Бронзовый страж', role: 'Защитник · броня крепче рядом с фалангой', cost: 20, hp: 57, damage: 4, range: 27, speed: 30, period: 1.1, armor: .35 },
  bronzeSpear: { name: 'Копейщик фаланги', role: 'Против брони · строй усиливает защиту', cost: 29, hp: 33, damage: 10, range: 48, speed: 35, period: 1.25, armor: .12, antiArmor: 2.4 },
  bronzeArcher: { name: 'Лучник города', role: 'Дальний бой · прицельный залп', cost: 33, hp: 22, damage: 8, range: 168, speed: 36, period: 1, armor: .05 },
  bronzeHealer: { name: 'Городской лекарь', role: 'Поддержка · лечит бойцов', cost: 43, hp: 26, damage: 2, heal: 8, range: 113, speed: 33, period: 1.5, armor: .08 },
  bronzeChariot: { name: 'Колесничий', role: 'Прорыв · стремительная атака', cost: 34, hp: 38, damage: 12, range: 36, speed: 93, period: 1.1, armor: .12 },
  bronzePitch: { name: 'Метатель смолы', role: 'Площадь · обжигающий залп', cost: 43, hp: 23, damage: 10, range: 125, speed: 31, period: 1.7, armor: .03 },
  bronzeHerald: { name: 'Глашатай', role: 'Командир · ускоряет атаки', cost: 49, hp: 32, damage: 0, range: 29, speed: 33, period: 1.2, armor: .2 },
  bronzeRam: { name: 'Осадный таран', role: 'Осада · усиленный удар', cost: 61, hp: 48, damage: 11, range: 45, speed: 25, period: 1.9, armor: .28 },
  ironShield: { name: 'Железный щитоносец', role: 'Защитник · большой щит и крепкая броня', cost: 26, hp: 74, damage: 5, range: 27, speed: 29, period: 1.15, armor: .48 },
  ironSpear: { name: 'Копейщик дружины', role: 'Против брони · пробивает тяжёлый доспех', cost: 36, hp: 42, damage: 12, range: 51, speed: 34, period: 1.2, armor: .18, antiArmor: 2.5 },
  ironArcher: { name: 'Стрелок заставы', role: 'Дальний бой · прикрывает передний ряд', cost: 40, hp: 28, damage: 10, range: 180, speed: 35, period: 1.05, armor: .08 },
  ironMedic: { name: 'Полевой лекарь', role: 'Поддержка · лечит бойцов', cost: 52, hp: 32, damage: 2, heal: 10, range: 118, speed: 32, period: 1.5, armor: .1 },
  ironRaider: { name: 'Налётчик', role: 'Прорыв · секирой давит на стрелков', cost: 42, hp: 46, damage: 15, range: 32, speed: 88, period: .95, armor: .15 },
  ironThrower: { name: 'Метатель', role: 'Площадь · залп дротиков по группе', cost: 54, hp: 30, damage: 14, range: 140, speed: 31, period: 1.65, armor: .08 },
  ironBanner: { name: 'Знаменосец', role: 'Поддержка · ускоряет союзников без атак', cost: 60, hp: 40, damage: 0, range: 30, speed: 32, period: 1.2, armor: .1 },
  ironSiege: { name: 'Осадник', role: 'Осада · расчёт тарана разрушает ворота', cost: 74, hp: 65, damage: 14, range: 45, speed: 24, period: 1.9, armor: .35 },
  antiqueLegionary: { name: 'Легионер', role: 'Защитник · скутум и защита в строю', cost: 32, hp: 90, damage: 6, range: 28, speed: 30, period: 1.15, armor: .45 },
  antiqueHoplite: { name: 'Гоплит', role: 'Против брони · копьё и защита в строю', cost: 43, hp: 50, damage: 14, range: 56, speed: 33, period: 1.25, armor: .22, antiArmor: 2.5 },
  antiquePeltast: { name: 'Пельтаст', role: 'Дальний бой · метает дротики из-за строя', cost: 48, hp: 34, damage: 12, range: 185, speed: 40, period: 1.1, armor: .1 },
  antiqueSurgeon: { name: 'Хирург лагеря', role: 'Поддержка · перевязывает раненых', cost: 62, hp: 39, damage: 2, heal: 12, range: 125, speed: 33, period: 1.5, armor: .1 },
  antiqueRider: { name: 'Нумидийский всадник', role: 'Прорыв · быстрый всадник с дротиком', cost: 50, hp: 54, damage: 17, range: 130, speed: 98, period: 1.15, armor: .1 },
  antiqueScorpion: { name: 'Скорпион', role: 'Площадь · болт пробивает тесную группу', cost: 65, hp: 38, damage: 18, range: 200, speed: 26, period: 1.85, armor: .12 },
  antiqueCenturion: { name: 'Центурион', role: 'Поддержка · командным жестом ускоряет строй', cost: 72, hp: 48, damage: 0, range: 35, speed: 31, period: 1.2, armor: .25 },
  antiqueBallista: { name: 'Баллиста', role: 'Осада · дальние удары по укреплениям', cost: 90, hp: 78, damage: 19, range: 210, speed: 22, period: 2.1, armor: .3 },
  highKnight: { name: 'Рыцарь щита', role: 'Защитник · меч и щит', cost: 42, hp: 122, damage: 8, range: 29, speed: 31, period: 1.2, armor: .5 },
  highHalberd: { name: 'Алебардист', role: 'Против брони · двуручная алебарда', cost: 55, hp: 65, damage: 18, range: 68, speed: 34, period: 1.3, armor: .27, antiArmor: 2.6 },
  highCrossbow: { name: 'Арбалетчик', role: 'Дальний бой · выстрел и перезарядка', cost: 62, hp: 44, damage: 48, range: 215, speed: 35, period: 4, armor: .16 },
  highMonk: { name: 'Монах лекарь', role: 'Лечение · помощь раненым', cost: 78, hp: 51, damage: 2, heal: 20, range: 130, speed: 30, period: 2.2, armor: .12 },
  highRider: { name: 'Конный рейдер', role: 'Прорыв · конница против дальнего ряда', cost: 65, hp: 82, damage: 22, range: 38, speed: 98, period: 1.1, armor: .18 },
  highPitch: { name: 'Огнемётчик смолы', role: 'Площадь · горящая смола по группе', cost: 84, hp: 50, damage: 21, range: 155, speed: 34, period: 1.7, armor: .16 },
  highHerald: { name: 'Герольд', role: 'Поддержка · знамя ускоряет союзников', cost: 92, hp: 63, damage: 0, range: 35, speed: 32, period: 1.2, armor: .24 },
  highTrebuchet: { name: 'Требушет', role: 'Осада · противовес, праща и камень', cost: 145, hp: 80, damage: 56, range: 270, speed: 22, period: 4, armor: .28 },
  highCastellan: { name: 'Кастелян каменного замка', role: 'Босс · рыцарь с охраной', cost: 150, hp: 1500 / 1.4, damage: 44 / 1.44, range: 48, speed: 28, period: 1.6, armor: .48, archetype: 'shield' },
  medievalGuard: { name: 'Дружинник', role: 'Защитник · большой каплевидный щит', cost: 38, hp: 108, damage: 7, range: 29, speed: 31, period: 1.15, armor: .48 },
  medievalPikeman: { name: 'Пикинёр', role: 'Против брони · двуручная пика', cost: 50, hp: 59, damage: 16, range: 64, speed: 34, period: 1.25, armor: .25, antiArmor: 2.6 },
  medievalLongbow: { name: 'Длиннолучник', role: 'Дальний бой · высокий деревянный лук', cost: 56, hp: 40, damage: 14, range: 215, speed: 36, period: 1.15, armor: .12 },
  medievalHealer: { name: 'Знахарь', role: 'Лечение · травы и повязки', cost: 72, hp: 46, damage: 2, heal: 18, range: 130, speed: 30, period: 2.2, armor: .12 },
  medievalBerserker: { name: 'Берсерк', role: 'Прорыв · после ближнего удара следующая атака за 2 секунды сильнее на 20%', cost: 58, hp: 70, damage: 20, range: 35, speed: 94, period: 1.05, armor: .12 },
  medievalThrower: { name: 'Топорник', role: 'Площадь · метательные топоры по группе', cost: 76, hp: 45, damage: 19, range: 155, speed: 34, period: 1.65, armor: .14 },
  medievalHorn: { name: 'Роговой трубач', role: 'Поддержка · сигнал ускоряет союзников', cost: 84, hp: 57, damage: 0, range: 35, speed: 32, period: 1.2, armor: .22 },
  medievalRam: { name: 'Стенобитчик', role: 'Осада · колёсный таран с двумя бойцами', cost: 105, hp: 96, damage: 23, range: 48, speed: 25, period: 1.95, armor: .38 },
  medievalJarl: { name: 'Ярл Северного форта', role: 'Босс · дружинник с ударом по строю', cost: 130, hp: 1350 / 1.36, damage: 40 / 1.4, range: 48, speed: 28, period: 1.6, armor: .45, archetype: 'shield' },
  antiqueLegate: { name: 'Легат Девятого легиона', role: 'Босс · опытный легионер с усиленным скутумом', cost: 110, hp: 1450 / 1.3, damage: 36 / 1.2, range: 48, speed: 28, period: 1.5, armor: .5, archetype: 'shield' },
  ironGate: { name: 'Воротный страж', role: 'Враг · тяжёлый доспех и двуручный молот', cost: 54, hp: 104, damage: 8, range: 36, speed: 23, period: 1.6, armor: .55, archetype: 'shield' },
  ironCommandant: { name: 'Комендант железной цитадели', role: 'Босс · сабельный удар по строю', cost: 95, hp: 1000, damage: 34 / 1.2, range: 46, speed: 28, period: 1.4, armor: .5, archetype: 'shield' },
  stoneHunter: { name: 'Ночной охотник', role: 'Враг · стремительный прорыв', cost: 23, hp: 25, damage: 9, range: 26, speed: 74, period: .95, armor: 0, archetype: 'raider' },
  stoneBone: { name: 'Костяной щит', role: 'Враг · прикрытие', cost: 19, hp: 47, damage: 4, range: 26, speed: 31, period: 1.1, armor: .25, archetype: 'shield' },
  stoneEnemySlinger: { name: 'Пращник племени', role: 'Враг · дальний бой', cost: 27, hp: 20, damage: 7, range: 130, speed: 36, period: 1.05, armor: 0, archetype: 'archer' },
  stoneWolf: { name: 'Вожак стаи', role: 'Враг · быстрые атаки', cost: 35, hp: 36, damage: 11, range: 31, speed: 71, period: .82, armor: .04, archetype: 'raider' },
  stoneChief: { name: 'Вождь Чёрного камня', role: 'Босс · сокрушает строй', cost: 64, hp: 700 / 1.35, damage: 20 / 1.15, range: 38, speed: 35, period: 1.6, armor: .2, archetype: 'shield' },
  bronzeEnemySpear: { name: 'Бронзовый копейщик', role: 'Враг · пробивает броню', cost: 30, hp: 34, damage: 11, range: 48, speed: 34, period: 1.2, armor: .12, antiArmor: 2.2, archetype: 'spear' },
  bronzeRaider: { name: 'Колесница налётчиков', role: 'Враг · прорыв', cost: 39, hp: 39, damage: 12, range: 34, speed: 82, period: 1.05, armor: .1, archetype: 'raider' },
  bronzeEnemyArcher: { name: 'Лучник стражи', role: 'Враг · дальний бой', cost: 32, hp: 23, damage: 8, range: 157, speed: 34, period: 1.05, armor: .08, archetype: 'archer' },
  bronzeGate: { name: 'Страж ворот', role: 'Враг · тяжёлая броня', cost: 43, hp: 80, damage: 6, range: 29, speed: 25, period: 1.3, armor: .5, archetype: 'shield' },
  bronzeKing: { name: 'Царь Медных ворот', role: 'Босс · бронзовый натиск', cost: 76, hp: 781, damage: 30 / 1.15, range: 42, speed: 31, period: 1.3, armor: .45, archetype: 'shield' }
};

export const DOCTRINES: DoctrineOption[] = [
  { id: 'steel', name: 'Оплот', description: 'Первый защитник каждого боя дешевле на 6 припасов.' },
  { id: 'arrow', name: 'Стрела', description: 'Первые два бойца дальнего боя получают +20 к дальности.' },
  { id: 'bargain', name: 'Сделка', description: 'Старт с 20 припасами, но крепость теряет 15% здоровья (минимум 1 HP).' }
];

export const UPGRADES: Record<UpgradeId, { name: string; description: string; category: 'economy' | 'defense' | 'offense'; requires?: UnitRole }> = {
  supply: { name: 'Полевой запас', description: '+20 припасов в начале боя', category: 'economy' },
  wagon: { name: 'Улучшенное снабжение', description: 'Восстановление припасов +1/с', category: 'economy' },
  banner: { name: 'Знамя стойкости', description: 'Здоровье защитников и бойцов против брони +15%', category: 'defense' },
  arrows: { name: 'Точные стрелы', description: 'Урон бойцов дальнего боя +15%', category: 'offense', requires: 'archer' },
  bandages: { name: 'Полевые повязки', description: 'Лечение +20%', category: 'defense', requires: 'medic' },
  contract: { name: 'Подготовленный резерв', description: 'Первый призыв каждого боя дешевле на 8', category: 'economy' },
  pikes: { name: 'Усиленные пики', description: 'Бойцы с копьями сильнее против брони', category: 'offense', requires: 'spear' },
  workshop: { name: 'Инженерная мастерская', description: 'Первое улучшение дохода дешевле на 12', category: 'economy' },
  boots: { name: 'Лёгкие сапоги', description: 'Быстрые бойцы двигаются на 20% быстрее', category: 'offense', requires: 'raider' },
  siegecraft: { name: 'Осадный расчёт', description: 'Осадные бойцы наносят крепости на 20% больше урона', category: 'offense', requires: 'siege' },
  lastReserve: { name: 'Последний резерв', description: 'Один бесплатный защитник при крепости ниже 35%', category: 'defense', requires: 'shield' },
  standard: { name: 'Строевой шаг', description: 'Командиры сильнее ускоряют союзников рядом', category: 'offense', requires: 'banner' }
};

export interface BattleDefinition { name: string; threat: string; ai: 'rush' | 'wall' | 'ranged' | 'boss'; enemyIncome: number; enemyStartingSupplies?: number; enemyHealthMultiplier?: number; enemyDamageMultiplier?: number; enemyRecruitRoster?: UnitKind[]; enemyDefenseRoster?: UnitKind[]; roster: UnitKind[]; arenaId: 'ash' | 'iron' | 'arrows' | 'citadel'; }
export const ERA_ORDER: EraId[] = ['stone', 'bronze', 'iron', 'antique', 'medieval', 'high-medieval'];
export const ERA_INCOME: Record<EraId, number> = { stone: 6, bronze: 8, iron: 10, antique: 12, medieval: 14, 'high-medieval': 16 };
export const ERA_KILL_GOLD: Record<EraId, number> = { stone: 1, bronze: 2, iron: 3, antique: 4, medieval: 5, 'high-medieval': 6 };
export const victoryGold = (era: EraId): number => 25 * ERA_KILL_GOLD[era];
export const ERA_BOSSES: Record<EraId, UnitKind> = { stone: 'stoneChief', bronze: 'bronzeKing', iron: 'ironCommandant', antique: 'antiqueLegate', medieval: 'medievalJarl', 'high-medieval': 'highCastellan' };
export const isBoss = (kind: UnitKind): boolean => Object.values(ERA_BOSSES).includes(kind);
export const nextEra = (era: EraId): EraId | undefined => ERA_ORDER[ERA_ORDER.indexOf(era) + 1];
export const ERA_NAMES: Record<EraId, string> = { stone: 'Каменный век', bronze: 'Бронзовый век', iron: 'Железный век', antique: 'Античность', medieval: 'Раннее Средневековье', 'high-medieval': 'Высокое Средневековье' };
export const ERA_HIRE_KINDS: Record<EraId, HireKind[]> = {
  stone: ['stoneShield', 'stoneSpear', 'stoneSlinger', 'stoneShaman', 'stoneScout', 'stoneThrower', 'stoneTotem', 'stoneRam'],
  bronze: ['bronzeGuard', 'bronzeSpear', 'bronzeArcher', 'bronzeHealer', 'bronzeChariot', 'bronzePitch', 'bronzeHerald', 'bronzeRam'],
  iron: ['ironShield', 'ironSpear', 'ironArcher', 'ironMedic', 'ironRaider', 'ironThrower', 'ironBanner', 'ironSiege'],
  'high-medieval': ['highKnight', 'highHalberd', 'highCrossbow', 'highMonk', 'highRider', 'highPitch', 'highHerald', 'highTrebuchet'],
  medieval: ['medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalHealer', 'medievalBerserker', 'medievalThrower', 'medievalHorn', 'medievalRam'],
  antique: ['antiqueLegionary', 'antiqueHoplite', 'antiquePeltast', 'antiqueSurgeon', 'antiqueRider', 'antiqueScorpion', 'antiqueCenturion', 'antiqueBallista']
};
export const ERA_STARTER_KINDS: Record<EraId, HireKind[]> = {
  stone: ERA_HIRE_KINDS.stone.slice(0, 4), bronze: ERA_HIRE_KINDS.bronze.slice(0, 4), iron: ERA_HIRE_KINDS.iron.slice(0, 4), antique: ERA_HIRE_KINDS.antique.slice(0, 4), medieval: ERA_HIRE_KINDS.medieval.slice(0, 4), 'high-medieval': ERA_HIRE_KINDS['high-medieval'].slice(0, 4)
};
const ROLES: UnitRole[] = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export function unitRole(kind: UnitKind): UnitRole {
  for (const era of ERA_ORDER) {
    const index = ERA_HIRE_KINDS[era].indexOf(kind as HireKind);
    if (index >= 0) return ROLES[index];
  }
  return UNITS[kind].archetype!;
}
export const ERA_BATTLES: Record<EraId, BattleDefinition[]> = {
  stone: [
    { name: 'Ночная засада', threat: 'Ночные охотники быстро подходят к крепости', ai: 'rush', enemyIncome: 5.8, roster: ['stoneHunter', 'stoneBone'], arenaId: 'ash' },
    { name: 'Костяной заслон', threat: 'Костяные щиты прикрывают пращников', ai: 'wall', enemyIncome: 8, enemyStartingSupplies: 8, roster: ['stoneBone', 'stoneEnemySlinger'], arenaId: 'iron' },
    { name: 'Тропа стаи', threat: 'Вожак стаи ведёт быстрые атаки', ai: 'ranged', enemyIncome: 10, enemyStartingSupplies: 10, enemyHealthMultiplier: 1.3, enemyDamageMultiplier: 1.1, roster: ['stoneWolf', 'stoneEnemySlinger', 'stoneHunter'], arenaId: 'arrows' },
    { name: 'Вождь Чёрного камня', threat: 'При 50% здоровья крепости вождь выходит в бой', ai: 'boss', enemyIncome: 15, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.35, enemyDamageMultiplier: 1.15, enemyRecruitRoster: ['stoneBone', 'stoneHunter', 'stoneEnemySlinger'], roster: ['stoneChief', 'stoneBone', 'stoneHunter', 'stoneEnemySlinger'], arenaId: 'citadel' }
  ],
  bronze: [
    { name: 'Дорога колесниц', threat: 'Колесницы прорываются сквозь дальний строй', ai: 'rush', enemyIncome: 13, enemyStartingSupplies: 10, enemyHealthMultiplier: 1.1, enemyDamageMultiplier: 1.05, roster: ['bronzeRaider', 'bronzeEnemySpear', 'bronzeEnemyArcher'], arenaId: 'ash' },
    { name: 'Бронзовая фаланга', threat: 'Копейщики под прикрытием стражей ворот', ai: 'wall', enemyIncome: 15, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.15, enemyDamageMultiplier: 1.1, roster: ['bronzeGate', 'bronzeEnemySpear'], arenaId: 'iron' },
    { name: 'Городские стены', threat: 'Лучники стреляют из-за плотного строя', ai: 'ranged', enemyIncome: 20, enemyStartingSupplies: 23, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.15, roster: ['bronzeGate', 'bronzeEnemyArcher', 'bronzeRaider'], arenaId: 'arrows' },
    { name: 'Царь Медных ворот', threat: 'При 50% здоровья крепости царь ведёт ударную волну', ai: 'boss', enemyIncome: 17, enemyStartingSupplies: 25, enemyHealthMultiplier: 1.28, enemyDamageMultiplier: 1.15, enemyRecruitRoster: ['bronzeGate', 'bronzeEnemyArcher', 'bronzeEnemyArcher'], roster: ['bronzeKing', 'bronzeGate', 'bronzeEnemyArcher', 'bronzeRaider'], arenaId: 'citadel' }
  ],
  iron: [
    { name: 'Железная застава', threat: 'Налётчики идут под прикрытием щитоносцев; встречай их ранним фронтом', ai: 'rush', enemyIncome: 16, enemyStartingSupplies: 10, enemyHealthMultiplier: 1.1, enemyDamageMultiplier: 1.05, roster: ['ironRaider', 'ironShield', 'ironArcher'], arenaId: 'ash' },
    { name: 'Дружинный заслон', threat: 'Молот воротного стража ломает фронт; копейщики пробивают его доспех', ai: 'wall', enemyIncome: 18, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.15, enemyDamageMultiplier: 1.1, roster: ['ironGate', 'ironSpear'], arenaId: 'iron' },
    { name: 'Осадная дорога', threat: 'Щиты и стрелки прикрывают таран; прорывайся к дальнему ряду', ai: 'ranged', enemyIncome: 19, enemyStartingSupplies: 25, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.15, enemyRecruitRoster: ['ironShield', 'ironArcher', 'ironArcher', 'ironSiege'], roster: ['ironShield', 'ironArcher', 'ironSiege'], arenaId: 'arrows' },
    { name: 'Железная цитадель', threat: 'При 50% крепости комендант выходит со стражем, стрелком и метателем', ai: 'boss', enemyIncome: 20, enemyStartingSupplies: 30, enemyHealthMultiplier: 1.3, enemyDamageMultiplier: 1.2, enemyRecruitRoster: ['ironGate', 'ironArcher', 'ironThrower'], roster: ['ironCommandant', 'ironGate', 'ironArcher', 'ironThrower'], arenaId: 'citadel' }
  ],
  medieval: [
    { name: 'Лесная засада', threat: 'Берсерки прорываются к стрелкам и отвечают на ближние удары', ai: 'rush', enemyIncome: 25, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.2, roster: ['medievalGuard', 'medievalLongbow', 'medievalBerserker'], arenaId: 'ash' },
    { name: 'Щитовой рубеж', threat: 'Пики и большие щиты под сигналом рога; длиннолучники разряжают строй', ai: 'wall', enemyIncome: 30, enemyStartingSupplies: 40, enemyHealthMultiplier: 1.33, enemyDamageMultiplier: 1.33, enemyRecruitRoster: ['medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalHorn'], roster: ['medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalHorn'], arenaId: 'iron' },
    { name: 'Осада северного посада', threat: 'Две линии щитов прикрывают длиннолучника, топорника и стенобитчик; у крепости выходят пики', ai: 'ranged', enemyIncome: 36, enemyStartingSupplies: 50, enemyHealthMultiplier: 1.48, enemyDamageMultiplier: 1.48, enemyRecruitRoster: ['medievalGuard', 'medievalLongbow', 'medievalGuard', 'medievalThrower', 'medievalRam'], enemyDefenseRoster: ['medievalGuard', 'medievalLongbow', 'medievalGuard', 'medievalPikeman'], roster: ['medievalGuard', 'medievalLongbow', 'medievalGuard', 'medievalThrower', 'medievalRam'], arenaId: 'arrows' },
    { name: 'Северный форт', threat: 'Щиты, пики и дальний ряд держат форт; при 50% крепости ярл выходит с охраной и знахарем', ai: 'boss', enemyIncome: 36, enemyStartingSupplies: 50, enemyHealthMultiplier: 1.36, enemyDamageMultiplier: 1.4, enemyRecruitRoster: ['medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalThrower'], roster: ['medievalJarl', 'medievalGuard', 'medievalPikeman', 'medievalLongbow', 'medievalBerserker', 'medievalHealer'], arenaId: 'citadel' }
  ],
  'high-medieval': [
    { name: 'Конная засада', threat: 'Конница прорывается к арбалетчикам; щиты держат фронт', ai: 'rush', enemyIncome: 30, enemyStartingSupplies: 20, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.2, roster: ['highKnight', 'highCrossbow', 'highRider'], arenaId: 'ash' },
    { name: 'Алебардный рубеж', threat: 'Алебарды и щиты под знаменем; арбалеты бьют из дальнего ряда', ai: 'wall', enemyIncome: 37, enemyStartingSupplies: 40, enemyHealthMultiplier: 1.55, enemyDamageMultiplier: 1.53, enemyRecruitRoster: ['highKnight', 'highHalberd', 'highCrossbow', 'highHerald'], roster: ['highKnight', 'highHalberd', 'highCrossbow', 'highHerald'], arenaId: 'iron' },
    { name: 'Осада каменного замка', threat: 'Щиты прикрывают арбалеты, смолу и требушет; у ворот выходят алебардисты', ai: 'ranged', enemyIncome: 43, enemyStartingSupplies: 50, enemyHealthMultiplier: 1.65, enemyDamageMultiplier: 1.65, enemyRecruitRoster: ['highKnight', 'highCrossbow', 'highKnight', 'highPitch', 'highTrebuchet'], enemyDefenseRoster: ['highKnight', 'highCrossbow', 'highKnight', 'highHalberd'], roster: ['highKnight', 'highCrossbow', 'highKnight', 'highPitch', 'highTrebuchet'], arenaId: 'arrows' },
    { name: 'Цитадель кастеляна', threat: 'При 50% крепости кастелян выходит с рыцарями, конницей и монахом', ai: 'boss', enemyIncome: 50, enemyStartingSupplies: 55, enemyHealthMultiplier: 1.7, enemyDamageMultiplier: 1.7, enemyRecruitRoster: ['highKnight', 'highHalberd', 'highCrossbow', 'highPitch'], roster: ['highCastellan', 'highKnight', 'highHalberd', 'highCrossbow', 'highRider', 'highMonk'], arenaId: 'citadel' }
  ],
  antique: [
    { name: 'Пограничный лагерь', threat: 'Всадники метают дротики под прикрытием легионеров', ai: 'rush', enemyIncome: 18, enemyStartingSupplies: 10, enemyHealthMultiplier: 1.1, enemyDamageMultiplier: 1.05, roster: ['antiqueLegionary', 'antiquePeltast', 'antiqueRider'], arenaId: 'ash' },
    { name: 'Фаланга у переправы', threat: 'Легионеры и гоплиты прикрывают пельтастов; центурион ускоряет строй', ai: 'wall', enemyIncome: 28, enemyStartingSupplies: 30, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.15, roster: ['antiqueLegionary', 'antiqueHoplite', 'antiquePeltast', 'antiqueCenturion'], arenaId: 'iron' },
    { name: 'Стены провинции', threat: 'Скорпионы и баллиста ведут огонь из-за скутумов', ai: 'ranged', enemyIncome: 28, enemyStartingSupplies: 30, enemyHealthMultiplier: 1.2, enemyDamageMultiplier: 1.15, enemyRecruitRoster: ['antiqueLegionary', 'antiquePeltast', 'antiqueScorpion', 'antiqueBallista'], roster: ['antiqueLegionary', 'antiquePeltast', 'antiqueScorpion', 'antiqueBallista'], arenaId: 'arrows' },
    { name: 'Девятый легион', threat: 'При 50% крепости легат выводит легионера, пельтаста и центуриона', ai: 'boss', enemyIncome: 28, enemyStartingSupplies: 30, enemyHealthMultiplier: 1.3, enemyDamageMultiplier: 1.2, enemyRecruitRoster: ['antiqueLegionary', 'antiquePeltast', 'antiqueScorpion'], roster: ['antiqueLegate', 'antiqueLegionary', 'antiquePeltast', 'antiqueCenturion'], arenaId: 'citadel' }
  ]
};
