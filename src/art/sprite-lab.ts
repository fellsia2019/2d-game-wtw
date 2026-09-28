import { UNITS } from '../data/content';
import { unitArt, eraName, asset, roleOf } from './catalog';
import './sprite-lab.css';
import { standardFrame } from '../view/SupportMotion';

type Era = 'stone' | 'bronze';
type Pose = 'idle' | 'ready' | 'move' | 'attack';
const entries = Object.entries(UNITS).map(([id, unit]) => ({ id, unit, era: (id.startsWith('stone') ? 'stone' : 'bronze') as Era }));
const root = document.querySelector<HTMLDivElement>('#lab')!;
root.innerHTML = `
 <header><a href="${import.meta.env.BASE_URL}">← В игру</a><span class="eyebrow">МАСТЕРСКАЯ / РАЗРАБОТКА</span><h1>Лаборатория спрайтов</h1><p>Все бойцы, враги и боссы. Те же портреты и атласы, которые загружает игра.</p><div class="summary"><b>${entries.length} юнитов</b><span>2 эпохи</span><span>16 кадров · у знаменосцев 48</span></div></header>
 <form class="controls" onsubmit="return false">
  <label>Эпоха<select id="era"><option value="all">Все эпохи</option><option value="stone">Каменный век</option><option value="bronze">Бронзовый век</option></select></label>
  <label>Сторона<select id="team"><option value="both">Обе стороны</option><option value="ally">Союзники</option><option value="enemy">Противники</option></select></label>
  <label>Поза<select id="pose"><option value="move">Ходьба</option><option value="attack">Действие роли</option><option value="idle">Стойка</option><option value="ready">Готовность</option></select></label>
  <label>Направление<select id="facing"><option value="natural">Навстречу</option><option value="right">Вправо</option><option value="left">Влево</option></select></label>
  <label>Масштаб<select id="zoom"><option value="1">100%</option><option value="0.52">52% · ПК</option><option value="0.34">34% · телефон</option><option value="1.5">150%</option></select></label>
  <label>Фон<select id="background"><option value="dark">Тёмный</option><option value="light">Светлый</option><option value="checker">Прозрачность</option><option value="arena">Арена эпохи</option></select></label>
  <label>Скорость<select id="speed"><option value="1">100%</option><option value="0.5">50%</option><option value="0.25">25%</option></select></label>
  <label class="search">Поиск<input id="search" type="search" placeholder="Имя, роль или ID"/></label>
  <label class="check"><input id="guides" type="checkbox" checked/>Опора и границы</label>
  <button type="button" id="pause">Пауза</button><button type="button" id="step">Следующий кадр</button>
  <label class="scrubber">Кадр<input id="frame" type="range" min="0" max="15" value="2"/><output id="frame-value">2 / 15</output></label>
 </form>
 <div class="result-line"><span id="count"></span><span id="status" role="status">Загрузка ассетов…</span></div><main id="units"></main><p id="empty" hidden>По этому запросу юнитов нет.</p>
 <dialog id="inspector"><div class="dialog-heading"><h2 id="detail-title"></h2><button id="close" type="button">Закрыть</button></div><p>Все кадры одного атласа, включая плавное действие знаменосцев. Портрет и PNG можно открыть отдельно в карточке.</p><div id="frames"></div></dialog>`;
const select = (id: string) => document.querySelector<HTMLSelectElement>(`#${id}`)!;
const era = select('era'), team = select('team'), pose = select('pose'), facing = select('facing'), zoom = select('zoom'), background = select('background'), speed = select('speed');
const search = document.querySelector<HTMLInputElement>('#search')!, guides = document.querySelector<HTMLInputElement>('#guides')!, slider = document.querySelector<HTMLInputElement>('#frame')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!, status = document.querySelector<HTMLElement>('#status')!;
const canvasList: { canvas: HTMLCanvasElement; image: HTMLImageElement; enemy: boolean; arena: Era; role: string; frame?: number }[] = [];
let displayRole = '';
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
 article.dataset.era = entry.era; article.dataset.search = `${entry.id} ${entry.unit.name} ${entry.unit.role}`.toLocaleLowerCase('ru');
 const role = unitArt[entry.id];
 article.innerHTML = `<div class="unit-heading"><div><span class="eyebrow">${eraName(entry.era)}</span><h2>${entry.unit.name}</h2><p>${entry.unit.role}</p></div><code>${entry.id}</code></div><div class="variants"></div><footer><span>320 × 192 · опора 160,176</span><span>${role}</span></footer>`;
 const variants = article.querySelector('.variants')!;
 for (const enemy of [false, true]) {
  const key = `${enemy ? 'enemy-' : ''}${role}`, portrait = asset(key), sheet = portrait.replace('.svg', '-sheet.png');
  const block = document.createElement('section'); block.dataset.team = enemy ? 'enemy' : 'ally';
  block.innerHTML = `<div class="team-label ${enemy ? 'enemy' : ''}">${enemy ? 'ПРОТИВНИК' : 'СОЮЗНИК'}</div><div class="stage"><canvas width="480" height="288" aria-label="${entry.unit.name}, ${enemy ? 'противник' : 'союзник'}"></canvas></div><div class="links"><button type="button">${roleOf(entry.id) === 'banner' ? 48 : 16} кадров ↗</button><a href="${portrait}" target="_blank" rel="noopener">SVG</a><a href="${sheet}" target="_blank" rel="noopener">PNG-атлас</a></div>`;
  const image = imageFor(sheet);
  canvasList.push({ canvas: block.querySelector('canvas')!, image, enemy, arena: entry.era, role: roleOf(entry.id) });
  block.querySelector('button')!.onclick = () => inspect(entry.unit.name, image, enemy, entry.era, roleOf(entry.id));
  variants.append(block);
 }
 units.append(article);
}
const arenas = new Map<Era, HTMLImageElement>();
for (const value of ['stone', 'bronze'] as Era[]) arenas.set(value, imageFor(asset(`arena-${value}`)));
function filter() {
 let count = 0;
 displayRole = '';
 for (const article of units.querySelectorAll<HTMLElement>('article')) {
  article.hidden = (era.value !== 'all' && era.value !== article.dataset.era) || !article.dataset.search!.includes(search.value.toLocaleLowerCase('ru').trim());
  if (!article.hidden) { if (count === 0) displayRole = roleOf(article.querySelector('code')!.textContent!); count++; }
  article.querySelector<HTMLElement>('.variants')!.style.gridTemplateColumns = team.value === 'both' ? '' : '1fr';
  for (const section of article.querySelectorAll<HTMLElement>('section')) section.hidden = team.value !== 'both' && team.value !== section.dataset.team;
 }
 slider.max = displayRole === 'banner' ? '47' : '15';
 document.querySelector('#count')!.textContent = `Показано ${count} из ${entries.length} юнитов`;
 document.querySelector<HTMLElement>('#empty')!.hidden = count > 0;
}
era.onchange = filter; team.onchange = filter; search.oninput = filter; filter();
const dialog = document.querySelector<HTMLDialogElement>('#inspector')!;
document.querySelector<HTMLButtonElement>('#close')!.onclick = () => dialog.close();
function inspect(name: string, image: HTMLImageElement, enemy: boolean, arena: Era, role: string) {
 document.querySelector('#detail-title')!.textContent = `${name} · ${enemy ? 'противник' : 'союзник'}`;
 const frames = document.querySelector('#frames')!; frames.replaceChildren();
 const items: typeof canvasList = [];
 for (let frame = 0; frame < (role === 'banner' ? 48 : 16); frame++) {
  const figure = document.createElement('figure'), canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 192;
  const walkLabel = ['контакт','амортизация','пронос стопы','отталкивание'][(frame-2)%4];
  const caption = document.createElement('figcaption'); caption.textContent = `${frame} · ${frame === 0 ? 'стойка' : frame === 1 ? 'готовность' : frame < 10 ? `шаг · ${walkLabel}` : role === 'medic' ? 'лечение' : role === 'banner' ? 'подъём и опускание знамени' : role === 'archer' && arena === 'stone' ? ['прицеливание','натяжение','выстрел','сопровождение','перезарядка','готовность'][frame-10] : 'атака'}`;
  figure.append(canvas, caption); frames.append(figure); items.push({ canvas, image, enemy, arena, role, frame });
 }
 dialog.showModal();
 for (const item of items) draw(item, item.frame!, 1);
}
pause.onclick = () => { paused = !paused; manual = null; pause.textContent = paused ? 'Продолжить' : 'Пауза'; };
document.querySelector<HTMLButtonElement>('#step')!.onclick = () => { manual = ((manual ?? currentFrame()) + 1) % (Number(slider.max) + 1); paused = true; pause.textContent = 'Продолжить'; };
slider.oninput = () => { manual = Number(slider.value); paused = true; pause.textContent = 'Продолжить'; };
pose.onchange = () => { manual = null; time = 0; };
function currentFrame(role = displayRole) {
 if (manual !== null) return Math.min(manual,role === 'banner' ? 47 : 15);
 const state = pose.value as Pose;
 if (state === 'attack' && role === 'banner') return standardFrame(time);
 return state === 'idle' ? 0 : state === 'ready' ? 1 : state === 'move' ? 2 + Math.floor(time * 12) % 8 : time % 1.2 < .4 ? 10 + Math.min(5, Math.floor((time % 1.2) * 15)) : 1;
}
function draw(item: typeof canvasList[number], frame: number, scale: number) {
 const { canvas, image, enemy, arena } = item;
 // Canvas pixels track CSS pixels so the game-size presets really are 52% and 34%.
 const width = Math.round(canvas.clientWidth);
 if (width && canvas.width !== width) canvas.width = width;
 if (item.frame === undefined && canvas.height !== 304) canvas.height = 304;
 const ctx = canvas.getContext('2d')!, w = canvas.width, h = canvas.height, base = h - 24;
 ctx.clearRect(0, 0, w, h);
 ctx.fillStyle = background.value === 'light' ? '#e8ddc4' : '#20353c'; ctx.fillRect(0, 0, w, h);
 if (background.value === 'checker') for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { ctx.fillStyle = (x / 16 + y / 16) % 2 ? '#a7afb0' : '#d2d6d0'; ctx.fillRect(x,y,16,16); }
 const arenaImage = arenas.get(arena);
 if (background.value === 'arena' && arenaImage?.complete && arenaImage.naturalWidth) ctx.drawImage(arenaImage,0,0,w,h);
 ctx.save(); ctx.translate(w / 2, base); const flip = facing.value === 'left' || (facing.value === 'natural' && enemy) ? -1 : 1;
 ctx.scale(scale * flip, scale);
 if (guides.checked) { ctx.strokeStyle = '#dbbe7277'; ctx.strokeRect(-160,-176,320,192); }
 if (image.complete && image.naturalWidth) ctx.drawImage(image,frame % 4 * 320,Math.floor(frame / 4) * 192,320,192,-160,-176,320,192);
 else { ctx.fillStyle = '#e99978'; ctx.font = '16px sans-serif'; ctx.fillText('Ассет недоступен',-70,-70); }
 ctx.restore();
 if (guides.checked) { ctx.strokeStyle = background.value === 'light' ? '#735d3d' : '#e4cb8a'; ctx.beginPath(); ctx.moveTo(0,base); ctx.lineTo(w,base); ctx.moveTo(w/2-5,base); ctx.lineTo(w/2+5,base); ctx.moveTo(w/2,base-5); ctx.lineTo(w/2,base+5); ctx.stroke(); }
}
function loop(now: number) {
 const dt = Math.min(.05, (now-last)/1000); last = now;
 if (!paused && !document.hidden) time += dt * Number(speed.value);
 const frame = currentFrame(); slider.value = String(frame); document.querySelector('#frame-value')!.textContent = `${frame} / ${slider.max}`;
 for (const item of canvasList) if (!item.canvas.closest('article')!.hidden && !item.canvas.closest('section')!.hidden) draw(item, currentFrame(item.role), Number(zoom.value));
 requestAnimationFrame(loop);
}
loadStatus(); requestAnimationFrame(loop);
