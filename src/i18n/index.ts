import { DOCTRINES, ERA_BATTLES, ERA_NAMES, UNITS, UPGRADES } from '../data/content';
import { TALENTS } from '../core/talents';
import type { EraId, UnitKind } from '../core/types';
import { englishBattles, englishEras, englishUnits } from './english';

export type Locale = 'ru' | 'en';
let currentLocale: Locale = 'ru';
const translationCache = new Map<string, string>();
const russianFallbackLanguages = new Set(['ru', 'be', 'kk', 'uk', 'uz']);

export const locale = (): Locale => currentLocale;
export const portalLocale = (language: string): Locale => russianFallbackLanguages.has(language.trim().toLowerCase().split(/[-_]/)[0]) ? 'ru' : 'en';
export const browserLocale = (language = navigator.language): Locale => portalLocale(language);

export function setLocale(next: Locale): void {
  currentLocale = next;
  translationCache.clear();
  document.documentElement.lang = next;
  document.title = next === 'en' ? 'Banners of Ages' : 'Знамёна эпох';
  document.querySelector?.<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', next === 'en'
    ? 'Banners of Ages — build an army, fight four battles in each of ten eras, and defeat their bosses.'
    : 'Знамёна эпох — собери отряд, пройди четыре сражения в каждой из десяти эпох и одолей их боссов.');
}

const pairs: [string, string][] = [
  ['Знамёна эпох', 'Banners of Ages'], ['ЗНАМЁНА ЭПОХ', 'BANNERS OF AGES'],
  ['Неизвестная эпоха', 'Unknown era'], ['Особый боец своей эпохи.', 'A special unit of this era.'],
  ['Оплот', 'Bulwark'], ['Первый защитник каждого боя дешевле на 6 припасов.', 'The first defender in each battle costs 6 fewer supplies.'],
  ['Стрела', 'Arrow'], ['Первые два бойца дальнего боя получают +20 к дальности.', 'The first two ranged units gain +20 range.'],
  ['Сделка', 'Trade-off'], ['Старт с 20 припасами, но крепость теряет 15% здоровья (минимум 1 HP).', 'Start with 20 supplies, but your fortress loses 15% health (minimum 1 HP).'],
  ['Полевой запас', 'Field Supplies'], ['+20 припасов в начале боя', '+20 supplies at the start of each battle'],
  ['Улучшенное снабжение', 'Improved Supply'], ['Восстановление припасов +1/с', 'Supply income +1/s'],
  ['Знамя стойкости', 'Banner of Resilience'], ['Здоровье защитников и бойцов против брони +15%', 'Defender and anti-armor unit health +15%'],
  ['Точные стрелы', 'Accurate Arrows'], ['Урон бойцов дальнего боя +15%', 'Ranged unit damage +15%'],
  ['Полевые повязки', 'Field Bandages'], ['Лечение +20%', 'Healing +20%'],
  ['Подготовленный резерв', 'Prepared Reserve'], ['Первый призыв каждого боя дешевле на 8', 'The first recruit in each battle costs 8 less'],
  ['Усиленные пики', 'Reinforced Pikes'], ['Бойцы с копьями сильнее против брони', 'Spearmen deal more damage to armor'],
  ['Инженерная мастерская', 'Engineering Workshop'], ['Первое улучшение дохода дешевле на 12', 'The first income upgrade costs 12 less'],
  ['Лёгкие сапоги', 'Light Boots'], ['Быстрые бойцы двигаются на 20% быстрее', 'Fast units move 20% faster'],
  ['Осадный расчёт', 'Siege Crew'], ['Осадные бойцы наносят крепости на 20% больше урона', 'Siege units deal 20% more damage to the fortress'],
  ['Последний резерв', 'Last Reserve'], ['Один бесплатный защитник при крепости ниже 35%', 'One free defender when fortress health falls below 35%'],
  ['Командная система', 'Command System'], ['Усиливает поддержку: ускоряет союзников, в Современности повышает урон дрона', 'Improves support: speeds up allies and boosts drone damage in the Modern Age'],
  ['Урон', 'Damage'], ['Урон всех бойцов', 'Damage of all units'],
  ['Скорость атаки', 'Attack Speed'], ['Скорость атаки и лечения', 'Attack and healing speed'],
  ['Здоровье бойцов', 'Unit Health'], ['Здоровье всех бойцов', 'Health of all units'],
  ['Доход припасов', 'Supply Income'],
  ['Держит фронт и поглощает часть урона.', 'Holds the line and absorbs some damage.'],
  ['Пробивает броню тяжёлых бойцов.', 'Pierces heavy armor.'],
  ['Стреляет из-за спины передней линии.', 'Fires from behind the front line.'],
  ['Лечит раненых союзников рядом.', 'Heals nearby wounded allies.'],
  ['Быстро сближается и давит на фронт.', 'Closes in quickly and pressures the front line.'],
  ['Взрыв задевает группу противников.', 'The blast hits a group of enemies.'],
  ['Ускоряет атаки ближайших союзников.', 'Speeds up attacks of nearby allies.'],
  ['Медленный расчёт для разрушения ворот.', 'Slow siege crew that breaks gates.'],
  ['Держит фронт', 'Holds the line'], ['Против брони', 'Anti-armor'], ['Дальний урон', 'Ranged damage'],
  ['Лечение', 'Healing'], ['Быстрый прорыв', 'Fast breakthrough'], ['Урон по группе', 'Area damage'],
  ['Ускоряет союзников', 'Speeds up allies'], ['Бьёт крепость', 'Attacks fortress'], ['Удар дроном', 'Drone strike'],
  ['Щит', 'Shield'], ['Копьё', 'Spear'], ['Знамя', 'Banner'],
  ['Прогресс в этом браузере', 'Progress in this browser'], ['Прогресс сохранён в облаке', 'Progress saved to cloud'],
  ['Прогресс сохранён · отправляем в облако…', 'Progress saved · syncing to cloud…'],
  ['Прогресс в браузере · облако недоступно', 'Progress in browser · cloud unavailable'],
  ['В облаке другой прогресс · обнови страницу для выбора', 'Different cloud progress · reload to choose'],
  ['Карта эпох', 'Era Map'], ['Предыдущие эпохи', 'Previous eras'], ['Следующие эпохи', 'Next eras'],
  ['Эпохи · перетаскивай влево и вправо', 'Eras · drag left and right'],
  ['Навигация по эпохам', 'Era navigation'], ['✓ Пройдена', '✓ Completed'], ['Не пройдена', 'Incomplete'], ['Закрыта', 'Locked'],
  ['Доступна · выбрать →', 'Available · select →'], ['Пройди', 'Complete'], ['Выбрана', 'Selected'], ['этапов', 'stages'],
  ['каменный век', 'Stone Age'], ['бронзовый век', 'Bronze Age'], ['железный век', 'Iron Age'],
  ['античность', 'Antiquity'], ['раннее Средневековье', 'Early Middle Ages'],
  ['высокое Средневековье', 'High Middle Ages'], ['индустриальную эпоху', 'Industrial Age'],
  ['эпоху бронемашин', 'Age of Armored Vehicles'],
  ['Разделы игры', 'Game sections'], ['Дерево талантов', 'Talent Tree'],
  ['таланта', 'talent'],
  ['Золото — эта эпоха, очки — все эпохи', 'Gold for this era, points for all eras'],
  ['Книга войск', 'Unit Codex'], ['Бойцы, роли и условия открытия', 'Units, roles, and unlock conditions'],
  ['Открыто карт:', 'Cards unlocked:'], ['Рекорды', 'Records'], ['История твоих походов и побед', 'History of your campaigns and victories'],
  ['Продолжи', 'Continue'], ['свой поход', 'your campaign'], ['Начни поход', 'Start a campaign'],
  ['Пройди четыре сражения и одолей вождя эпохи.', 'Win four battles and defeat the chief of this era.'],
  ['Открой бронзовый век с новым войском и тактикой.', 'Unlock the Bronze Age with a new army and tactics.'],
  ['Останови царя Медных ворот в четырёх боях.', 'Stop the King of the Copper Gates in four battles.'],
  ['Открой Железный век и войско тяжёлых доспехов.', 'Unlock the Iron Age and its heavily armored troops.'],
  ['Прикрой мушкетёров кирасирами и пикинёрами.', 'Protect musketeers with cuirassiers and pikemen.'],
  ['Подведи артиллерию к бастиону и одолей генерала Дымного фронта.', 'Bring artillery to the bastion and defeat the Smoky Front General.'],
  ['Проведи штурм через железную дорогу и заводской рубеж.', 'Fight your way through the railway and factory line.'],
  ['Прикрой гаубицу, сдержи перегрев и одолей барона Стального завода.', 'Protect the howitzer, manage overheating, and defeat the Steelworks Baron.'],
  ['Пройди траншеи под огнём снайперов и бронемашин.', 'Cross the trenches under fire from snipers and armored cars.'],
  ['Разведджип открывает слабые места, плотный огонь замедляет врага; одолей лёгкий танк командующего.', "The recon jeep exposes weak points and suppressive fire slows enemies; defeat the commander's light tank."],
  ['Штурмуй укреплённый сектор щитовиками, марксманами и артиллерией.', 'Storm the fortified sector with shield troops, marksmen, and artillery.'],
  ['Ударные дроны летят к цели и взрываются; одолей командира Автономной базы.', 'Strike drones fly to their targets and explode; defeat the Autonomous Base Commander.'],
  ['Веди рыцарей, алебардистов и арбалетчиков к каменному замку.', 'Lead knights, halberdiers, and crossbowmen to the stone castle.'],
  ['Прикрой требушеты и одолей кастеляна с его гарнизоном.', 'Protect the trebuchets and defeat the castellan and his garrison.'],
  ['Пройди засаду, щитовой рубеж и осаду посада.', 'Survive the ambush, shield line, and town siege.'],
  ['Веди дружину, берсерков и стенобитчика против ярла Северного форта.', 'Lead your warband, berserkers, and battering ram against the Northern Fort Jarl.'],
  ['Пройди лагерь, переправу и стены провинции.', 'Fight through the camp, crossing, and province walls.'],
  ['Используй строй, конницу и осаду против Девятого легиона.', 'Use formations, cavalry, and siege weapons against the Ninth Legion.'],
  ['Прорви заслон и осадную дорогу к Железной цитадели.', 'Break through the shield wall and siege road to the Iron Citadel.'],
  ['Пробивай броню и одолей коменданта в четвёртом бою.', 'Pierce armor and defeat the commandant in the fourth battle.'],
  ['Продолжить игру →', 'Continue game →'], ['Играть →', 'Play →'], ['Итог последнего боя →', 'Last battle result →'],
  ['Начать эпоху заново →', 'Restart era →'], ['Начать эпоху заново', 'Restart era'],
  ['Развитие и история', 'Progress and History'], ['Доступен в подготовке', 'Available during preparation'],
  ['Одолей босса эпохи', 'Defeat the era boss'], ['Победи босса эпохи', 'Defeat the era boss'],
  ['Победы эпохи:', 'Era victories:'], ['Прогресс эпохи', 'Era progress'],
  ['за победу', 'for victory'], ['Начать бой', 'Start battle'], ['Улучшить отряд', 'Upgrade Army'],
  ['Свободное место', 'Empty slot'], ['Убрать', 'Remove'], ['убрать из отряда', 'remove from army'],
  ['сначала убери бойца из отряда', 'remove a unit from the army first'], ['добавить в отряд', 'add to army'],
  ['В отряде · убрать', 'In army · remove'], ['Отряд заполнен', 'Army full'], ['Добавить в отряд', 'Add to army'],
  ['Выбери 4 бойцов', 'Choose 4 units'], ['Твой отряд', 'Your Army'],
  ['Чтобы заменить бойца, убери одного', 'Remove a unit to choose another'], ['Добавь ещё', 'Add'],
  ['Нажми карточку, чтобы добавить или убрать бойца', 'Tap a card to add or remove a unit'],
  ['Выбрано', 'Selected'], ['из 4', 'of 4'], ['Дальше →', 'Next →'],
  ['Поражение', 'Defeat'], ['Эпоха пройдена!', 'Era Completed!'], ['Победа!', 'Victory!'],
  ['Итоги боя', 'Battle results'], ['Золото', 'Gold'], ['Игровое время', 'Battle time'], ['Призвано', 'Recruited'],
  ['Усиль отряд и попробуй снова.', 'Upgrade your army and try again.'], ['Повторить бой →', 'Retry battle →'],
  ['Выбери усиление', 'Choose an upgrade'], ['Продолжить', 'Continue'], ['Перейти в', 'Advance to'],
  ['ДАЛЬШЕ', 'NEXT'], ['Новая эпоха — новые бойцы', 'New era, new units'],
  ['+1 очко за первый переход', '+1 point for the first transition'],
  ['Все доступные эпохи пройдены', 'All available eras completed'],
  ['Собери другой отряд и повтори поход.', 'Build another army and play again.'], ['В меню', 'Menu'],
  ['Получить подтверждённый бонус', 'Claim confirmed bonus'], ['Реклама: темп этого боя ×2', 'Ad: double battle speed'],
  ['Реклама: золото за бой ×2 · ещё +', 'Ad: double battle gold · extra +'],
  ['Темп ×2 доступен', 'Speed ×2 unlocked'], ['Бонус золота получен', 'Gold bonus claimed'],
  ['Ожидание рекламы…', 'Waiting for ad…'],
  ['Обе армии, припасы и таймеры движутся вдвое быстрее.', 'Both armies, supplies, and timers run twice as fast.'],
  ['Реклама сейчас недоступна. Можно продолжить без неё.', 'Ads are unavailable. You can continue without one.'],
  ['ДЕРЕВО ТАЛАНТОВ', 'TALENT TREE'], ['Глобальные таланты', 'Global Talents'], ['Таланты эпохи', 'Era Talents'],
  ['За золото · текущая эпоха', 'For gold · current era'], ['За очки · все эпохи', 'For points · all eras'],
  ['Выбор дерева талантов', 'Choose talent tree'], ['Очки перехода', 'Transition points'], ['Золото эпохи', 'Era gold'],
  ['Здоровье базы', 'Base Health'], ['Текущее здоровье', 'Current health'], ['следующее', 'next'],
  ['здоровье базы', 'base health'], ['Таланты', 'Talents'], ['припасов', 'supplies'],
  ['для прокачки', 'for upgrades'], ['Добавить', 'Add'], ['из отряда', 'from army'],
  ['Текущий бонус', 'Current bonus'], ['следующий', 'next'], ['Купить', 'Buy'], ['Уровень', 'Level'], ['уровень', 'level'], ['цена', 'cost'],
  ['Призвать:', 'Recruit:'], ['Знамёна эпох', 'Banners of Ages'], ['КАМЕННЫЙ ВЕК', 'STONE AGE'],
  ['Маршрут из четырёх боёв', 'Four-battle route'], ['Золото эпохи · заработано в этом бою', 'Era gold · earned in this battle'],
  ['Пауза · Escape', 'Pause · Escape'], ['Ⅱ Пауза', 'Ⅱ Pause'], ['▶ Продолжить', '▶ Resume'],
  ['Бой', 'Battle'], ['БОЙ', 'BATTLE'], ['Наши', 'Allies'], ['Припасы', 'Supplies'], ['Враг', 'Enemy'],
  ['линия фронта', 'front line'], ['Призыв бойцов', 'Recruit units'], ['Нажми карту, чтобы призвать', 'Tap a card to recruit'],
  ['· клавиши 1–4', '· keys 1–4'], ['Доход', 'Income'], ['Локальная игра · сохранение в браузере', 'Local game · saved in browser'],
  ['Четыре боя — одна эпоха', 'Four battles per era'], ['Лаборатория спрайтов ↗', 'Sprite Lab ↗'],
  ['Скорость боя', 'Battle speed'], ['Запустить бой заново', 'Restart battle'], ['Выбор боя', 'Choose battle'],
  ['Золото для прокачки', 'Gold for upgrades'], ['Добавить золото для прокачки', 'Add gold for upgrades'],
  ['Золото текущей эпохи · доступно на любом экране', 'Current era gold · available on every screen'],
  ['Сохраняется в браузере · действует со следующего боя', 'Saved in browser · takes effect next battle'],
  ['Сбросить баланс эпохи', 'Reset era balance'], ['В коде:', 'Default:'], ['Урон +%', 'Damage +%'],
  ['Доход/с', 'Income/s'], ['Старт', 'Starting'], ['Темп', 'Speed'], ['Переключить на', 'Switch to'],
  ['Глиф', 'Glyph'], ['Крепость защищена, пока босс жив', 'The fortress is protected while the boss lives'],
  ['Подкрепление через', 'Reinforcements in'], ['Подкрепление на поле', 'Reinforcements arrived'],
  ['клавиша', 'key'], ['Клавиша', 'Key'], ['Цена:', 'Cost:'], ['Недостаточно припасов.', 'Not enough supplies.'],
  ['Найм', 'Recruit'], ['Улучшить доход:', 'Upgrade income:'], ['доход +1 в секунду', 'income +1 per second'],
  ['ВОЕННЫЙ АРХИВ', 'UNIT ARCHIVE'], ['Справочник бойцов, их ролей, характеристик и условий открытия.', 'A guide to units, roles, stats, and unlock conditions.'],
  ['здоровья', 'health'], ['урона', 'damage'], ['Усиления похода', 'Campaign upgrades'],
  ['ЛЕТОПИСЬ ПОХОДОВ', 'CAMPAIGN RECORDS'], ['Твои походы', 'Your Campaigns'],
  ['начато походов', 'campaigns started'], ['побед', 'victories'], ['лучший этап', 'best stage'], ['лучшее время', 'best time'],
  ['Знаков победы:', 'Victory marks:'],
  ['Рекорды хранятся в этом браузере. Убийства дают золото эпохи, первый переход в новую эпоху — очко глобальной прокачки.', 'Records are stored in this browser. Kills earn era gold; the first transition to a new era earns a global talent point.'],
  ['Доступно очков глобальной прокачки:', 'Global talent points available:'],
  ['ПОДГОТОВКА · ШАГ 1 ИЗ 2', 'PREPARATION · STEP 1 OF 2'], ['Выбери тактику', 'Choose a Tactic'],
  ['Тактика действует весь поход. Нажми одну из трёх карточек, чтобы перейти к отряду.', 'Your tactic lasts for the whole campaign. Choose one of three cards to assemble your army.'],
  ['Выбрать тактику', 'Choose tactic'], ['Выбрать →', 'Choose →'],
  ['ПРИКАЗ: ПРИВАЛ', 'ORDER: REST'], ['Бой на паузе', 'Battle Paused'],
  ['Фронт, припасы и время остановлены.', 'The front line, supplies, and timer are paused.'],
  ['Твой отряд ждёт возвращения.', 'Your army awaits your return.'],
  ['Вернуться в бой →', 'Return to battle →'], ['В главное меню', 'Main Menu'],
  ['Поход и заработанное золото сохранятся.', 'Your campaign and earned gold will be saved.'],
  ['При продолжении текущий бой начнётся заново.', 'The current battle will restart when you continue.'],
  ['Назад', 'Back'], ['Назад к тактике', 'Back to tactic'], ['Назад в бой', 'Back to battle'], ['Назад в главное меню', 'Back to main menu'],
  ['Очки эпох:', 'Era points:'], ['Начало карты эпох', 'Start of era map'], ['Конец карты эпох', 'End of era map'],
  ['Показать группу эпох', 'Show era group'], ['Эпоха', 'Era'], ['из', 'of'],
  ['Включить звук', 'Enable sound'], ['Включить музыку', 'Enable music'], ['Включить', 'Enable'], ['Выключить', 'Disable'],
  ['музыку', 'music'], ['звуки игры', 'game sounds'], ['Музыка и звуки', 'Music and sound'], ['аудио недоступно', 'audio unavailable'],
  ['Загрузка игры…', 'Loading game…'], ['Загрузка игры и сохранения…', 'Loading game and save…'],
  ['Не удалось загрузить ресурсы игры. Обновите страницу.', 'Could not load game assets. Please reload the page.'],
  ['Выбери сохранение', 'Choose a Save'],
  ['Прогресс в этом браузере отличается от облачного. Будет использован один профиль целиком.', 'The save in this browser differs from the cloud save. One complete profile will be used.'],
  ['Из облака', 'From cloud'], ['Из этого браузера', 'From this browser'],
  ['Поверните устройство', 'Rotate Your Device'], ['Игра работает в горизонтальной ориентации', 'Play in landscape orientation'],
  ['Поле боя: союзники слева, враги справа. Бой идёт автоматически.', 'Battlefield: allies on the left, enemies on the right. Combat is automatic.'],
  ['Обычный бой', 'Standard battle'], ['1 знак победы', '1 victory mark'],
  ['Твоя крепость пала: на защиту вышло слишком мало бойцов.', 'Your fortress fell: too few units defended it.'],
  ['Быстрые враги прорвались к крепости. Ранний защитник сдерживает натиск.', 'Fast enemies reached the fortress. Recruit a defender early to stop them.'],
  ['Защитники врага продавили строй. Бойцы с копьями пробивают их броню.', 'Enemy defenders pushed through your line. Spearmen can pierce their armor.'],
  ['Вражеские стрелки атаковали из-за строя. Нужен прорыв или дальний ответ.', 'Enemy ranged units attacked from behind the line. Break through or return fire.'],
  ['Босс прорвал оборону. Улучши отряд и здоровье базы.', 'The boss broke through your defenses. Upgrade your army and base health.'],
  ['Время истекло: у крепости врага осталось меньше здоровья.', 'Time ran out: the enemy fortress had less health remaining.'],
  ['Крепость врага разрушена.', 'Enemy fortress destroyed.'],
  ['Время истекло: крепость врага сохранила больше здоровья.', 'Time ran out: the enemy fortress had more health remaining.'],
  ['Просмотр не засчитан. Можно продолжить без рекламы.', 'The ad was not credited. You can continue without it.'],
  ['Не удалось сохранить бонус. Проверь доступность сохранения.', 'Could not save the bonus. Check that saving is available.'],
  ['Темп ×2 доступен для этого боя.', 'Speed ×2 is available for this battle.']
];

const translations = new Map(pairs);
for (const [id, original] of Object.entries(UNITS)) {
  const translated = englishUnits[id as UnitKind];
  translations.set(original.name, translated[0]);
  translations.set(original.role, translated[1]);
}
for (const [id, original] of Object.entries(ERA_NAMES)) translations.set(original, englishEras[id as EraId]);
for (const [era, battles] of Object.entries(ERA_BATTLES)) battles.forEach((battle, index) => {
  const translated = englishBattles[era as EraId][index];
  translations.set(battle.name, translated[0]);
  translations.set(battle.threat, translated[1]);
});
for (const collection of [DOCTRINES, Object.values(UPGRADES), Object.values(TALENTS)]) {
  for (const item of collection) {
    if (!translations.has(item.name)) throw new Error(`Missing English translation: ${item.name}`);
    if ('description' in item && !translations.has(item.description)) throw new Error(`Missing English translation: ${item.description}`);
    if ('effect' in item && !translations.has(item.effect)) throw new Error(`Missing English translation: ${item.effect}`);
  }
}

const literalPairs = [...translations].sort((a, b) => b[0].length - a[0].length)
  .map(([ru, en]) => [new RegExp(`(?<![А-Яа-яЁё])${ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![А-Яа-яЁё])`, 'g'), en] as const);
export function translate(text: string): string {
  if (currentLocale === 'ru' || !/[А-Яа-яЁё]/.test(text)) return text;
  const cached = translationCache.get(text);
  if (cached !== undefined) return cached;
  const trimmed = text.trim();
  const direct = translations.get(trimmed);
  if (direct) {
    const result = text.replace(trimmed, direct);
    translationCache.set(text, result);
    return result;
  }
  // Interpolated counts and rewards are built in the simulation and UI.
  let translated = text.replace(/Бонус получен: \+(\d+) золота\./g, 'Bonus received: +$1 gold.')
    .replace(/\+(\d+) золота за победу/g, '+$1 gold for victory')
    .replace(/\+(\d+) за победу/g, '+$1 gold for victory')
    .replace(/(\d+) (?:победа|победы|побед)(?![А-Яа-яЁё])/g, (_match, count: string) => `${count} ${count === '1' ? 'victory' : 'victories'}`)
    .replace(/(\d+) (?:походов|похода|поход)(?![А-Яа-яЁё])/g, (_match, count: string) => `${count} ${count === '1' ? 'campaign' : 'campaigns'}`)
    .replace(/(\d+) золота/g, '$1 gold')
    .replace(/(\d+) очк\. эпох/g, '$1 era points')
    .replace(/(\d+) с(?=$|\s)/g, '$1 s')
    .replace(/\/ сек/g, '/ sec')
    .replace(/Ур\.\s*(\d+)/g, 'Lv. $1');
  for (const [pattern, en] of literalPairs) translated = translated.replace(pattern, en);
  if (translationCache.size > 2000) translationCache.clear();
  translationCache.set(text, translated);
  return translated;
}

export function translateTree(root: ParentNode): void {
  if (currentLocale !== 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script,style')) continue;
    const value = translate(node.nodeValue ?? '');
    if (value !== node.nodeValue) node.nodeValue = value;
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
  for (const element of elements) for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
    const value = element.getAttribute(attr);
    if (value) element.setAttribute(attr, translate(value));
  }
}
