import { locale, translate } from '../i18n';

const entries: [string, string][] = [
  ['Лаборатория спрайтов', 'Sprite Lab'],
  ['ВСЕ ЭПОХИ / ЕДИНАЯ ЛАБОРАТОРИЯ', 'ALL ERAS / ONE SPRITE LAB'],
  ['Игровые модели всех эпох. Обе стороны и полные циклы движения и действия показаны в одинаковом масштабе и на одной линии опоры. Боссы увеличены ×1,5 как в игре.', 'Game models from every era. Both sides and complete movement and action cycles appear at the same scale and baseline. Bosses are enlarged ×1.5, as in the game.'],
  ['Окопная арена, укрепления обеих сторон и восемь ролевых моделей. Осадная роль — бронемашина, босс — отдельный лёгкий танк.', 'Trench arena, fortifications for both sides, and eight role models. The siege unit is an armored car; the boss is a separate light tank.'],
  ['Восемь ролевых моделей с союзной и вражеской палитрами. Оператор запускает ударный дрон: тот летит к противнику и взрывается. Командир финала использует увеличенную модель щитовика.', 'Eight role models with ally and enemy palettes. The operator launches a strike drone that flies to the enemy and explodes. The final commander uses an enlarged shield unit model.'],
  ['Вражеский лёгкий танк в масштабе ×1,5 с отдельным атласом. Сверху осадная бронемашина, снизу босс; показаны стойка, движение и выстрел.', 'Enemy light tank at ×1.5 scale with a separate atlas. The siege armored car is above and the boss below; idle, movement, and firing are shown.'],
  ['Все кадры одного атласа, включая плавное действие командиров поддержки. Портрет и PNG можно открыть отдельно в карточке.', 'All frames of one atlas, including the full support commander action. Open the portrait or PNG separately from the card.'],
  ['Запуск → полёт к противнику → подрыв → новый дрон на ранце. Эта механика работает и в бою.', 'Launch → flight to enemy → detonation → new drone on the pack. This mechanic also works in battle.'],
  ['Оператор запускает дрон, тот летит к противнику и взрывается', 'The operator launches a drone that flies to the enemy and explodes'],
  ['Иллюстрация карты эпохи Эпоха бронемашин: окоп, бункер и лёгкий танк на рассвете', 'Age of Armored Vehicles map art: trench, bunker, and light tank at dawn'],
  ['Сравнение осадной бронемашины с уникальным боссом лёгким танком в трёх фазах анимации', 'Comparison of the siege armored car and unique light tank boss in three animation phases'],
  ['Современность: укреплённый рубеж, артиллерия, дрон и город', 'Modern Age: fortified line, artillery, drone, and city'],
  ['Союзное окопное укрепление', 'Allied trench fortification'], ['Вражеское окопное укрепление', 'Enemy trench fortification'],
  ['Союзный современный командный форт', 'Allied modern command fort'], ['Вражеский современный командный форт', 'Enemy modern command fort'],
  ['Мелкий конь колесницы; возница ×0,8.', 'Small chariot horse; driver ×0.8.'],
  ['Мелкий всадник: ×0,63 относительно пехоты.', 'Small rider: ×0.63 relative to infantry.'],
  ['Мелкий всадник: ×0,65 относительно пехоты.', 'Small rider: ×0.65 relative to infantry.'],
  ['Мелкий всадник драгуна: ×0,65 относительно пехоты.', 'Small dragoon rider: ×0.65 relative to infantry.'],
  ['Таран увеличен ×1,3; полный рост оператора ×0,95.', 'Ram enlarged ×1.3; operator full height ×0.95.'],
  ['Машина и расчёт увеличены ×1,5.', 'Machine and crew enlarged ×1.5.'],
  ['Скорпион и расчёт увеличены ×1,45.', 'Scorpion and crew enlarged ×1.45.'],
  ['Баллиста и расчёт увеличены ×1,45.', 'Ballista and crew enlarged ×1.45.'],
  ['Таран и расчёт увеличены ×1,5.', 'Ram and crew enlarged ×1.5.'],
  ['Расчёт увеличен с ×0,48 до ×0,9; механика ×1,06.', 'Crew enlarged from ×0.48 to ×0.9; mechanism ×1.06.'],
  ['Расчёт увеличен с ×0,52 до ×0,9; пушка ×1,3.', 'Crew enlarged from ×0.52 to ×0.9; cannon ×1.3.'],
  ['Роль', 'Role'], ['Сторона', 'Side'], ['Поза', 'Pose'], ['Направление', 'Direction'], ['Масштаб', 'Scale'], ['Фон', 'Background'], ['Скорость', 'Speed'], ['Поиск', 'Search'], ['Кадр', 'Frame'],
  ['Все эпохи', 'All eras'], ['Каталог', 'Catalog'], ['Уникальные модели', 'Unique models'], ['Все ID / боссы', 'All IDs / bosses'],
  ['Все роли', 'All roles'], ['Защитник', 'Defender'], ['Против брони', 'Anti-armor'], ['Дальний бой', 'Ranged combat'], ['Лечение', 'Healing'], ['Прорыв / конница', 'Breakthrough / cavalry'], ['Урон по группе', 'Area damage'], ['Поддержка', 'Support'], ['Осада', 'Siege'], ['Страж', 'Guard'], ['Особая модель босса', 'Special boss model'],
  ['Обе стороны', 'Both sides'], ['Союзники', 'Allies'], ['Противники', 'Enemies'], ['Ходьба', 'Walk'], ['Действие роли', 'Role action'], ['Стойка', 'Idle'], ['Готовность', 'Ready'],
  ['Навстречу', 'Facing each other'], ['Вправо', 'Right'], ['Влево', 'Left'], ['Тёмный', 'Dark'], ['Светлый', 'Light'], ['Прозрачность', 'Transparency'], ['Арена эпохи', 'Era arena'],
  ['Мелкие модели', 'Small models'], ['Исправленная осада', 'Corrected siege'], ['Сравнение размеров', 'Size comparison'], ['Опора и границы', 'Baseline and bounds'],
  ['Пауза', 'Pause'], ['Продолжить', 'Resume'], ['Следующий кадр', 'Next frame'], ['Мелкая модель', 'Small model'], ['Размер исправлен', 'Size corrected'],
  ['ИГРОВАЯ ЭПОХА', 'GAME ERA'], ['УНИКАЛЬНЫЙ БОСС', 'UNIQUE BOSS'], ['Ударный дрон · цикл действия', 'Strike drone · action cycle'],
  ['Манифест набора ↗', 'Set manifest ↗'], ['Манифест эпохи ↗', 'Era manifest ↗'], ['Командующий Броневого узла', 'Armored Hub Commander'],
  ['ЗАПУСК', 'LAUNCH'], ['ПОЛЁТ К ПРОТИВНИКУ', 'FLIGHT TO ENEMY'], ['ПОДРЫВ', 'DETONATION'], ['ПЕРЕЗАРЯДКА', 'RELOAD'],
  ['Загрузка ассетов…', 'Loading assets…'], ['Все ассеты загружены', 'All assets loaded'], ['По этому запросу юнитов нет.', 'No units match this search.'],
  ['Закрыть', 'Close'], ['Ассет недоступен', 'Asset unavailable'], ['ПРОТИВНИК', 'ENEMY'], ['СОЮЗНИК', 'ALLY'], ['PNG-атлас', 'PNG atlas'],
  ['опора', 'baseline'], ['босс', 'boss'], ['кадров', 'frames'], ['противник', 'enemy'], ['союзник', 'ally'], ['загрузка', 'loading'],
  ['контакт', 'contact'], ['амортизация', 'compression'], ['пронос стопы', 'passing'], ['отталкивание', 'push-off'], ['шаг', 'step'],
  ['стойка', 'idle'], ['готовность', 'ready'],
  ['подготовка запуска', 'launch preparation'], ['взлёт', 'takeoff'], ['удаление от оператора', 'moving from operator'], ['полёт к цели', 'flight to target'], ['удар у цели', 'impact at target'], ['новый дрон', 'new drone'],
  ['радиосигнал', 'radio signal'], ['работа инструментом', 'tool work'], ['сигнал рогом', 'horn signal'], ['командный жест', 'command gesture'], ['подъём и опускание знамени', 'raising and lowering banner'],
  ['прицеливание', 'aiming'], ['натяжение', 'drawing'], ['выстрел', 'shot'], ['сопровождение', 'follow-through'], ['перезарядка', 'reload'], ['полный цикл действия / перезарядки', 'full action / reload cycle'], ['атака', 'attack'],
  ['игровых эпох', 'game eras'], ['моделей в мастерской', 'models in lab'], ['игровых атласов', 'game atlases'], ['игровых ID', 'game IDs'],
  ['Имя, роль или ID', 'Name, role, or ID'], ['52% · ПК', '52% · desktop'], ['34% · телефон', '34% · phone'], ['← В игру', '← Back to game']
];
const direct = new Map(entries);
const replacements = entries.sort((a, b) => b[0].length - a[0].length)
  .map(([ru, en]) => [new RegExp(ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), en] as const);

export function translateLab(value: string): string {
  if (locale() !== 'en') return value;
  const exact = direct.get(value.trim());
  if (exact) return value.replace(value.trim(), exact);
  let result = value.replace(/Показано (\d+) из (\d+) моделей/g, 'Showing $1 of $2 models')
    .replace(/Показано (\d+) из (\d+) ID каталога/g, 'Showing $1 of $2 catalog IDs')
    .replace(/Загрузка: осталось (\d+)/g, 'Loading: $1 remaining')
    .replace(/Не загрузились (\d+) ассетов/g, 'Failed to load $1 assets');
  result = translate(result);
  for (const [pattern, english] of replacements) result = result.replace(pattern, english);
  return result;
}

export function translateLabTree(root: ParentNode): void {
  if (locale() !== 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script,style')) continue;
    node.nodeValue = translateLab(node.nodeValue ?? '');
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
  for (const element of elements) for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
    const value = element.getAttribute(attr);
    if (value) element.setAttribute(attr, translateLab(value));
  }
}
