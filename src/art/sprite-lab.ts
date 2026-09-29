import { UNITS, ERA_ORDER, isBoss } from '../data/content';
import { unitArt, eraName, asset, roleOf } from './catalog';
import './sprite-lab.css';
import type { EraId } from '../core/types';
import manifest from '../../public/assets/sprite-manifest.json';
import { medievalSignalFrame, medievalTreatmentFrame } from './medieval-motion';
import { standardFrame } from '../view/SupportMotion';

type Era = EraId;
const labEraName = eraName;
// Findings from docs/SPRITE_SIZE_REVIEW.md; keyed by art so aliases share the tag.
const smallModels: Record<string, string> = {
 'bronze-u-raider': 'Мелкий конь колесницы; возница ×0,8.',
 'antique-u-raider': 'Мелкий всадник: ×0,63 относительно пехоты.',
 'high-medieval-u-raider': 'Мелкий всадник: ×0,65 относительно пехоты.',
 'renaissance-u-raider': 'Мелкий всадник драгуна: ×0,65 относительно пехоты.'
};
const correctedModels: Record<string, string> = {
 'stone-u-siege': 'Таран увеличен ×1,3; полный рост оператора ×0,95.',
 'bronze-u-siege': 'Таран увеличен ×1,3; полный рост оператора ×0,95.',
 'iron-u-siege': 'Машина и расчёт увеличены ×1,5.',
 'antique-u-thrower': 'Скорпион и расчёт увеличены ×1,45.',
 'antique-u-siege': 'Баллиста и расчёт увеличены ×1,45.',
 'medieval-u-siege': 'Таран и расчёт увеличены ×1,5.',
 'high-medieval-u-siege': 'Расчёт увеличен с ×0,48 до ×0,9; механика ×1,06.',
 'renaissance-u-siege': 'Расчёт увеличен с ×0,52 до ×0,9; пушка ×1,3.'
};
const atlasFrames = (era: Era, role: string) => {
 const counts = (manifest.eraFrameCounts ?? {}) as Partial<Record<Era, Record<string, number>>>;
 return counts[era]?.[role] ?? (role === 'banner' ? 48 : 16);
};
type Pose = 'idle' | 'ready' | 'move' | 'attack';
const entries = Object.entries(UNITS).map(([id, unit]) => ({
 id, unit, era: unitArt[id].split('-u-')[0] as Era, art: unitArt[id], artRole: roleOf(id), boss: isBoss(id as keyof typeof UNITS)
})).sort((a,b) => ERA_ORDER.indexOf(a.era)-ERA_ORDER.indexOf(b.era));
const models = new Set(entries.map(entry => entry.art));
const primaryIds = new Set<string>();
const seen = new Set<string>();
for (const entry of entries) if (!seen.has(entry.art)) { primaryIds.add(entry.id); seen.add(entry.art); }
const labRole = (id: string) => entries.find(entry => entry.id === id)?.artRole ?? roleOf(id);
const root = document.querySelector<HTMLDivElement>('#lab')!;
root.innerHTML = `
 <header><a href="${import.meta.env.BASE_URL}">← В игру</a><span class="eyebrow">ВСЕ ЭПОХИ / ЕДИНАЯ ЛАБОРАТОРИЯ</span><h1>Лаборатория спрайтов</h1><p>Все игровые модели, обе стороны и полные циклы движения и действия. Одинаковый масштаб и линия опоры позволяют сравнивать размеры. Боссы показаны с игровым увеличением ×1,5.</p><div class="summary"><b>${ERA_ORDER.length} эпох</b><span>${models.size} моделей · ${manifest.sheets.length} атласов</span><span>${entries.length} игровых ID · 16 / 48 кадров</span></div></header>
 <form class="controls" onsubmit="return false">
  <label>Эпоха<select id="era"><option value="all">Все эпохи</option>${ERA_ORDER.map(id => `<option value="${id}">${eraName(id)}</option>`).join('')}</select></label>
  <label>Каталог<select id="catalog"><option value="models">Уникальные модели</option><option value="ids">Все игровые ID / боссы</option></select></label>
  <label>Роль<select id="role"><option value="all">Все роли</option>${[['shield','Защитник'],['spear','Против брони'],['archer','Дальний бой'],['medic','Лечение'],['raider','Прорыв / конница'],['thrower','Урон по группе'],['banner','Поддержка'],['siege','Осада'],['bulwark','Страж'],['boss','Особая модель босса']].map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
  <label>Сторона<select id="team"><option value="both">Обе стороны</option><option value="ally">Союзники</option><option value="enemy">Противники</option></select></label>
  <label>Поза<select id="pose"><option value="move">Ходьба</option><option value="attack">Действие роли</option><option value="idle">Стойка</option><option value="ready">Готовность</option></select></label>
  <label>Направление<select id="facing"><option value="natural">Навстречу</option><option value="right">Вправо</option><option value="left">Влево</option></select></label>
  <label>Масштаб<select id="zoom"><option value="1">100%</option><option value="0.52">52% · ПК</option><option value="0.34">34% · телефон</option><option value="1.5">150%</option></select></label>
  <label>Фон<select id="background"><option value="dark">Тёмный</option><option value="light">Светлый</option><option value="checker">Прозрачность</option><option value="arena">Арена эпохи</option></select></label>
  <label>Скорость<select id="speed"><option value="1">100%</option><option value="0.5">50%</option><option value="0.25">25%</option></select></label>
  <label class="search">Поиск<input id="search" type="search" placeholder="Имя, роль или ID"/></label>
  <label class="check size-filter"><input id="small" type="checkbox"/>Мелкие модели · ${Object.keys(smallModels).length}</label>
  <label class="check corrected-filter"><input id="corrected" type="checkbox"/>Исправленная осада · ${Object.keys(correctedModels).length}</label>
  <label class="check"><input id="compact" type="checkbox"/>Сравнение размеров</label>
  <label class="check"><input id="guides" type="checkbox" checked/>Опора и границы</label>
  <button type="button" id="pause">Пауза</button><button type="button" id="step">Следующий кадр</button>
  <label class="scrubber">Кадр<input id="frame" type="range" min="0" max="15" value="2"/><output id="frame-value">2 / 15</output></label>
 </form>
 <div class="result-line"><span id="count"></span><span id="status" role="status">Загрузка ассетов…</span></div><main id="units"></main><p id="empty" hidden>По этому запросу юнитов нет.</p>
 <dialog id="inspector"><div class="dialog-heading"><h2 id="detail-title"></h2><button id="close" type="button">Закрыть</button></div><p>Все кадры одного атласа, включая плавное действие командиров поддержки. Портрет и PNG можно открыть отдельно в карточке.</p><div id="frames"></div></dialog>`;
const select = (id: string) => document.querySelector<HTMLSelectElement>(`#${id}`)!;
const catalog = select('catalog'), roleFilter = select('role');
const era = select('era'), team = select('team'), pose = select('pose'), facing = select('facing'), zoom = select('zoom'), background = select('background'), speed = select('speed');
const search = document.querySelector<HTMLInputElement>('#search')!, guides = document.querySelector<HTMLInputElement>('#guides')!, slider = document.querySelector<HTMLInputElement>('#frame')!;
const small = document.querySelector<HTMLInputElement>('#small')!, corrected = document.querySelector<HTMLInputElement>('#corrected')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!, status = document.querySelector<HTMLElement>('#status')!;
const canvasList: { canvas: HTMLCanvasElement; image: HTMLImageElement; enemy: boolean; arena: Era; role: string; period: number; boss: boolean; inView?: boolean; frame?: number }[] = [];
let displayRole = '';
let displayEra: Era = 'stone';
const images = new Map<string, HTMLImageElement>();
let errors = 0, pending = 0, paused = false, manual: number | null = null, time = 0, last = performance.now();
function imageFor(url: string) {
 let image = images.get(url);
 if (!image) {
  image = new Image(); pending++; images.set(url, image);
  image.onload = () => { pending--; loadStatus(); };
  image.onerror = () => { errors++; pending--; loadStatus(); };
  image.src = url;
 }
 return image;
}
function loadStatus() { status.textContent = pending ? `Загрузка: осталось ${pending}` : errors ? `Не загрузились ${errors} ассетов` : 'Все ассеты загружены'; }
const units = document.querySelector<HTMLElement>('#units')!;
for (const entry of entries) {
 const article = document.createElement('article');
 article.dataset.small = String(Boolean(smallModels[entry.art]));
 article.dataset.corrected = String(Boolean(correctedModels[entry.art]));
 article.dataset.era = entry.era; article.dataset.id = entry.id; article.dataset.role = entry.artRole;
 article.dataset.searchId = `${entry.id} ${entry.unit.name} ${entry.unit.role} ${entry.artRole} ${eraName(entry.era)}`.toLocaleLowerCase('ru');
 const aliases = entries.filter(other => other.art === entry.art);
 article.dataset.search = aliases.map(other => `${other.id} ${other.unit.name} ${other.unit.role}`).join(' ').concat(` ${eraName(entry.era)} ${entry.artRole}`).toLocaleLowerCase('ru');
 const role = entry.art;
 article.innerHTML = `<div class="unit-heading"><div><span class="eyebrow">${labEraName(entry.era)}</span><h2>${entry.unit.name}</h2>${smallModels[entry.art] ? `<div class="size-warning"><span>Мелкая модель</span><p>${smallModels[entry.art]}</p></div>` : ''}${correctedModels[entry.art] ? `<div class="size-warning size-corrected"><span>Размер исправлен</span><p>${correctedModels[entry.art]}</p></div>` : ''}<p>${entry.unit.role}</p></div><code>${entry.id}</code></div><div class="variants"></div><footer><span>320 × 192 · опора 160,176</span><span>${role}${entry.boss ? ' · босс ×1,5' : ''}</span></footer>`;
 const variants = article.querySelector('.variants')!;
 for (const enemy of [false, true]) {
  const key = `${enemy ? 'enemy-' : ''}${role}`, portrait = asset(key), sheet = portrait.replace('.svg', '-sheet.png');
  const block = document.createElement('section'); block.dataset.team = enemy ? 'enemy' : 'ally';
  block.innerHTML = `<div class="team-label ${enemy ? 'enemy' : ''}">${enemy ? 'ПРОТИВНИК' : 'СОЮЗНИК'}</div><div class="stage"><canvas width="480" height="288" aria-label="${entry.unit.name}, ${enemy ? 'противник' : 'союзник'}"></canvas></div><div class="links"><button type="button">${atlasFrames(entry.era, labRole(entry.id))} кадров ↗</button><a href="${portrait}" target="_blank" rel="noopener">SVG</a><a href="${sheet}" target="_blank" rel="noopener">PNG-атлас</a></div>`;
  const image = imageFor(sheet);
  canvasList.push({ canvas: block.querySelector('canvas')!, image, enemy, arena: entry.era, role: labRole(entry.id), period: entry.unit.period, boss: entry.boss });
  block.querySelector('button')!.onclick = () => inspect(entry.unit.name, image, enemy, entry.era, labRole(entry.id), entry.unit.period, entry.boss);
  variants.append(block);
 }
 units.append(article);
}
const arenas = new Map<Era, HTMLImageElement>();
for (const value of ERA_ORDER) arenas.set(value, imageFor(asset(`arena-${value}`)));
function filter() {
 let count = 0, hasBanner = false;
 displayRole = '';
 for (const article of units.querySelectorAll<HTMLElement>('article')) {
  article.hidden = (small.checked && article.dataset.small !== 'true') || (corrected.checked && article.dataset.corrected !== 'true') || (era.value !== 'all' && era.value !== article.dataset.era) || (catalog.value === 'models' && !primaryIds.has(article.dataset.id!)) || (roleFilter.value !== 'all' && roleFilter.value !== article.dataset.role) || !(catalog.value === 'models' ? article.dataset.search! : article.dataset.searchId!).includes(search.value.toLocaleLowerCase('ru').trim());
  if (!article.hidden) { if (atlasFrames(article.dataset.era as Era, labRole(article.querySelector('code')!.textContent!)) === 48) hasBanner = true; if (count === 0) { displayRole = labRole(article.querySelector('code')!.textContent!); displayEra = article.dataset.era as Era; } count++; }
  article.querySelector<HTMLElement>('.variants')!.style.gridTemplateColumns = team.value === 'both' ? '' : '1fr';
  for (const section of article.querySelectorAll<HTMLElement>('section')) section.hidden = team.value !== 'both' && team.value !== section.dataset.team;
 }
 slider.max = hasBanner ? '47' : '15';
 if (manual !== null) manual = Math.min(manual, Number(slider.max));
 document.querySelector('#count')!.textContent = `Показано ${count} из ${catalog.value === 'models' ? models.size : entries.length} ${catalog.value === 'models' ? 'моделей' : 'игровых ID'}`;
 document.querySelector<HTMLElement>('#empty')!.hidden = count > 0;
 const query = new URLSearchParams();
 if (small.checked) query.set('size','small');
 if (corrected.checked) query.set('size','corrected');
 if (era.value !== 'all') query.set('era',era.value);
 if (roleFilter.value !== 'all') query.set('role',roleFilter.value);
 if (catalog.value !== 'models') query.set('catalog',catalog.value);
 if (search.value.trim()) query.set('search',search.value.trim());
 history.replaceState(null,'',`${location.pathname}${query.size ? '?' + query : ''}`);
}
const params = new URLSearchParams(location.search);
if (ERA_ORDER.includes(params.get('era') as Era)) era.value = params.get('era')!;
search.value = params.get('search') ?? '';
small.checked = params.get('size') === 'small';
corrected.checked = params.get('size') === 'corrected';
if ([...roleFilter.options].some(option=>option.value === params.get('role'))) roleFilter.value = params.get('role')!;
if (params.get('catalog') === 'ids') catalog.value = 'ids';
era.onchange = filter; catalog.onchange = filter; roleFilter.onchange = filter; team.onchange = filter; search.oninput = filter; filter();
const compact = document.querySelector<HTMLInputElement>('#compact')!;
compact.onchange = () => { units.classList.toggle('compare', compact.checked); if (compact.checked && Number(zoom.value) > .52) zoom.value = '0.52'; };
function sizeFilter(active: HTMLInputElement, other: HTMLInputElement) {
 if (active.checked) {
  other.checked = false;
  era.value = 'all'; roleFilter.value = 'all'; search.value = ''; catalog.value = 'models';
  compact.checked = true; units.classList.add('compare'); if (Number(zoom.value) > .52) zoom.value = '0.52';
 }
 filter();
}
small.onchange = () => sizeFilter(small,corrected);
corrected.onchange = () => sizeFilter(corrected,small);
if (small.checked || corrected.checked) { compact.checked = true; units.classList.add('compare'); zoom.value = '0.52'; }

const dialog = document.querySelector<HTMLDialogElement>('#inspector')!;
document.querySelector<HTMLButtonElement>('#close')!.onclick = () => dialog.close();
function inspect(name: string, image: HTMLImageElement, enemy: boolean, arena: Era, role: string, period: number, boss: boolean) {
 document.querySelector('#detail-title')!.textContent = `${name} · ${enemy ? 'противник' : 'союзник'}`;
 const frames = document.querySelector('#frames')!; frames.replaceChildren();
 const items: typeof canvasList = [];
 for (let frame = 0; frame < atlasFrames(arena, role); frame++) {
  const figure = document.createElement('figure'), canvas = document.createElement('canvas'); canvas.width = boss ? 480 : 320; canvas.height = boss ? 300 : 220;
  const walkLabel = ['контакт','амортизация','пронос стопы','отталкивание'][(frame-2)%4];
  const caption = document.createElement('figcaption'); caption.textContent = `${frame} · ${frame === 0 ? 'стойка' : frame === 1 ? 'готовность' : frame < 10 ? `шаг · ${walkLabel}` : role === 'medic' ? 'лечение' : role === 'banner' ? arena === 'medieval' ? 'сигнал рогом' : arena === 'antique' ? 'командный жест' : 'подъём и опускание знамени' : role === 'archer' && arena === 'stone' ? ['прицеливание','натяжение','выстрел','сопровождение','перезарядка','готовность'][frame-10] : frame >= 16 ? 'полный цикл действия / перезарядки' : 'атака'}`;
  const stage = document.createElement('div'); stage.className = 'stage';
  canvas.style.width = `${canvas.width}px`; canvas.style.height = `${canvas.height}px`; stage.append(canvas);
  figure.append(stage, caption); frames.append(figure); items.push({ canvas, image, enemy, arena, role, frame, period, boss });
 }
 dialog.showModal();
 for (const item of items) draw(item, item.frame!, 1);
}
pause.onclick = () => { paused = !paused; manual = null; pause.textContent = paused ? 'Продолжить' : 'Пауза'; };
document.querySelector<HTMLButtonElement>('#step')!.onclick = () => { manual = ((manual ?? currentFrame()) + 1) % (Number(slider.max) + 1); paused = true; pause.textContent = 'Продолжить'; };
slider.oninput = () => { manual = Number(slider.value); paused = true; pause.textContent = 'Продолжить'; };
pose.onchange = () => { manual = null; time = 0; };
function currentFrame(role = displayRole, era = displayEra, period = entries.find(entry=>entry.era === era && entry.artRole === role)?.unit.period ?? 1.2) {
 if (manual !== null) return Math.min(manual,atlasFrames(era, role) - 1);
 const state = pose.value as Pose;
 if (state === 'attack' && role === 'banner') return era === 'medieval' ? medievalSignalFrame(time) : ['high-medieval','renaissance'].includes(era) ? 16 + Math.floor(time * 16) % 32 : standardFrame(time);
 if (state === 'attack' && atlasFrames(era,role) === 48) return 16 + (Math.floor(time / period * 32) + (era === 'renaissance' ? 7 : 0)) % 32;
 if (era === 'medieval' && state === 'attack' && role === 'medic') return medievalTreatmentFrame(time);
 if (era === 'medieval' && state === 'move' && ['medic','raider'].includes(role)) return 2 + Math.floor(time * (role === 'medic' ? 8 : 10)) % 8;
 return state === 'idle' ? 0 : state === 'ready' ? 1 : state === 'move' ? 2 + Math.floor(time * 12) % 8 : time % 1.2 < .4 ? 10 + Math.min(5, Math.floor((time % 1.2) * 15)) : 1;
}
function draw(item: typeof canvasList[number], frame: number, scale: number) {
 const { canvas, image, enemy, arena } = item;
 // Canvas pixels track CSS pixels so the game-size presets really are 52% and 34%.
 const effectiveScale = scale * (item.boss ? 1.5 : 1);
 const width = item.frame === undefined ? Math.max(Math.round(canvas.parentElement!.clientWidth), Math.ceil(320 * effectiveScale)) : canvas.width;
 if (width && canvas.width !== width) canvas.width = width;
 if (item.frame === undefined) { const height = Math.max(compact.checked ? 156 : 236, Math.ceil(192 * effectiveScale + 24)); if (canvas.height !== height) canvas.height = height; if (canvas.style.width !== `${width}px`) canvas.style.width = `${width}px`; if (canvas.style.height !== `${height}px`) canvas.style.height = `${height}px`; }
 const ctx = canvas.getContext('2d')!, w = canvas.width, h = canvas.height, base = h - 24;
 ctx.clearRect(0, 0, w, h);
 ctx.fillStyle = background.value === 'light' ? '#e8ddc4' : '#20353c'; ctx.fillRect(0, 0, w, h);
 if (background.value === 'checker') for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { ctx.fillStyle = (x / 16 + y / 16) % 2 ? '#a7afb0' : '#d2d6d0'; ctx.fillRect(x,y,16,16); }
 const arenaImage = arenas.get(arena);
 if (background.value === 'arena' && arenaImage?.complete && arenaImage.naturalWidth) ctx.drawImage(arenaImage,0,0,w,h);
 ctx.save(); ctx.translate(w / 2, base); const flip = facing.value === 'left' || (facing.value === 'natural' && enemy) ? -1 : 1;
 ctx.scale(effectiveScale * flip, effectiveScale);
 if (guides.checked) { ctx.strokeStyle = '#dbbe7277'; ctx.strokeRect(-160,-176,320,192); }
 if (image.complete && image.naturalWidth) ctx.drawImage(image,frame % 4 * 320,Math.floor(frame / 4) * 192,320,192,-160,-176,320,192);
 else { ctx.fillStyle = '#e99978'; ctx.font = '16px sans-serif'; ctx.fillText('Ассет недоступен',-70,-70); }
 ctx.restore();
 if (guides.checked) { ctx.strokeStyle = background.value === 'light' ? '#735d3d' : '#e4cb8a'; ctx.beginPath(); ctx.moveTo(0,base); ctx.lineTo(w,base); ctx.moveTo(w/2-5,base); ctx.lineTo(w/2+5,base); ctx.moveTo(w/2,base-5); ctx.lineTo(w/2,base+5); ctx.stroke(); }
}
const visible = new IntersectionObserver(changes => {
 for (const change of changes) { const item = canvasList.find(item => item.canvas === change.target); if (item) item.inView = change.isIntersecting; }
}, {rootMargin:'200px'});
for (const item of canvasList) visible.observe(item.canvas);
function loop(now: number) {
 const dt = Math.min(.05, (now-last)/1000); last = now;
 if (!paused && !document.hidden) time += dt * Number(speed.value);
 const frame = manual ?? currentFrame(); slider.value = String(frame); document.querySelector('#frame-value')!.textContent = `${frame} / ${slider.max}`;
 for (const item of canvasList) if (item.inView && !item.canvas.closest('article')!.hidden && !item.canvas.closest('section')!.hidden) draw(item, currentFrame(item.role, item.arena, item.period), Number(zoom.value));
 requestAnimationFrame(loop);
}
loadStatus(); requestAnimationFrame(loop);
