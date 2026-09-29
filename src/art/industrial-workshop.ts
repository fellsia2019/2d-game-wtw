import './industrial-workshop.css';

type Draft = { status: string; modelCount: number; roles: string[]; names: string[]; frameWidth: number; frameHeight: number; framesPerModel: number };
const root = document.querySelector<HTMLDivElement>('#workshop')!;
const manifest = await fetch('/drafts/industrial/manifest.json').then(response => {
  if (!response.ok) throw new Error('Манифест черновика не найден');
  return response.json() as Promise<Draft>;
});
if (manifest.modelCount !== 8 || manifest.roles.length !== 8 || manifest.framesPerModel !== 16) throw new Error('Неполный набор Индустриальной эпохи');

root.innerHTML = `<header><div><p class="eyebrow">Отдельная мастерская · до апрува</p><h1>Индустриальная эпоха</h1><p>Восемь ролей, общие модели для двух сторон. Игровой баланс и каталог этой эпохи ещё не подключены.</p></div><a href="/sprite-lab.html">Лаборатория принятых эпох ↗</a></header>
<section class="controls"><label>Поиск <input id="search" type="search" placeholder="Название или роль"></label><label>Кадр <input id="frame" type="range" min="0" max="15" value="0"><output id="frame-value">0 · стойка</output></label><label>Масштаб <select id="scale"><option value="1">100% · исходный</option><option value="0.52">52% · крупный в игре</option><option value="0.34">34% · малый в игре</option></select></label><button id="play" type="button">▶ Анимация</button></section>
<main id="cards" class="cards"></main><footer>Кадры 0–1: стойка · 2–9: ходьба · 10–15: действие. Сравнивайте обе стороны и масштаб 34% перед апрувом.</footer>`;
const cards = root.querySelector<HTMLElement>('#cards')!;
const search = root.querySelector<HTMLInputElement>('#search')!;
const slider = root.querySelector<HTMLInputElement>('#frame')!;
const frameValue = root.querySelector<HTMLOutputElement>('#frame-value')!;
const scaleSelect = root.querySelector<HTMLSelectElement>('#scale')!;
const play = root.querySelector<HTMLButtonElement>('#play')!;
const images = new Map<string, HTMLImageElement>();
for (const [index, role] of manifest.roles.entries()) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.search = `${role} ${manifest.names[index]}`.toLocaleLowerCase('ru');
  card.innerHTML = `<div class="card-head"><span class="index">${String(index + 1).padStart(2, '0')}</span><div><h2>${manifest.names[index]}</h2><small>${role}</small></div></div><div class="pair"><div class="side"><span>Союзник</span><canvas width="320" height="192" data-role="${role}" data-side="ally"></canvas></div><div class="side"><span>Враг</span><canvas width="320" height="192" data-role="${role}" data-side="enemy"></canvas></div></div>`;
  cards.append(card);
  for (const side of ['ally', 'enemy']) {
    const image = new Image();
    image.src = `/drafts/industrial/${side === 'enemy' ? 'enemy-' : ''}industrial-u-${role}-sheet.png`;
    image.onload = draw;
    images.set(`${side}-${role}`, image);
  }
}
function frameName(frame: number) { return frame < 2 ? 'стойка' : frame < 10 ? 'ходьба' : 'действие'; }
function draw() {
  const frame = Number(slider.value), scale = Number(scaleSelect.value);
  frameValue.textContent = `${frame} · ${frameName(frame)}`;
  root.querySelectorAll<HTMLCanvasElement>('canvas').forEach(canvas => {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 320, 192);
    ctx.fillStyle = '#263d41'; ctx.fillRect(0, 0, 320, 192);
    ctx.strokeStyle = '#628681'; ctx.beginPath(); ctx.moveTo(0, 176); ctx.lineTo(320, 176); ctx.stroke();
    const image = images.get(`${canvas.dataset.side}-${canvas.dataset.role}`);
    if (!image?.complete || !image.naturalWidth) return;
    const w = 320 * scale, h = 192 * scale;
    ctx.drawImage(image, frame % 4 * 320, Math.floor(frame / 4) * 192, 320, 192, 160 - w / 2, 176 - 176 * scale, w, h);
  });
}
slider.addEventListener('input', draw);
scaleSelect.addEventListener('change', draw);
search.addEventListener('input', () => root.querySelectorAll<HTMLElement>('.card').forEach(card => { card.hidden = !card.dataset.search!.includes(search.value.trim().toLocaleLowerCase('ru')); }));
let timer: number | undefined;
play.addEventListener('click', () => {
  if (timer !== undefined) { window.clearInterval(timer); timer = undefined; play.textContent = '▶ Анимация'; return; }
  play.textContent = '⏸ Пауза';
  timer = window.setInterval(() => { slider.value = String((Number(slider.value) + 1) % 16); draw(); }, 190);
});
draw();
