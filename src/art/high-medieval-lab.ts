import './high-medieval-lab.css';
import manifest from '../../public/assets/high-medieval-draft-manifest.json';
const names=['Рыцарь щита','Алебардист','Арбалетчик','Монах лекарь','Конный рейдер','Огнемётчик смолы','Герольд','Требушет'];
const descriptions=['Меч, большой геральдический щит и тяжёлый доспех','Двуручная алебарда: оба хвата связаны с древком','Арбалет с натяжением, выстрелом и перезарядкой','Монашеское одеяние, посох и перевязочный материал','Конь с четырьмя ногами, седло, стремена, поводья и меч','Игровая условность: резервуар смолы, шланг и ручное сопло','Геральдическая одежда и длинное знамя с плавным сигналом','Шарнирный противовес, независимая праща, вылет камня и взведение лебёдкой'];
const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/${name}?revision=2`;
const frameCount=(role:string)=>manifest.frameCounts[role as keyof typeof manifest.frameCounts];
document.querySelector<HTMLDivElement>('#workshop')!.innerHTML=`<header><a href="${import.meta.env.BASE_URL}">← В игру</a> · <a href="${import.meta.env.BASE_URL}high-medieval-playtest.html">Пробный бой без сохранений →</a><p class="eyebrow">ШЕСТАЯ ЭПОХА · ВИЗУАЛЬНАЯ МАСТЕРСКАЯ</p><h1>Высокое Средневековье</h1><p class="notice">Модели согласованы и подключены к игре. Здесь можно проверять все кадры принятого набора.</p><p>8 моделей · 16 атласов обеих сторон · 16 кадров у бойцов, 48 у арбалетчика, герольда и требушета.</p></header>
<div class="controls"><label>Действие<select id="pose"><option value="idle">Стойка</option><option value="move">Ходьба</option><option value="action">Действие / атака</option><option value="frame">Отдельный кадр</option></select></label><label>Размер<select id="scale"><option value="1">100% · исходник</option><option value="1.5">150% · детали</option><option value=".52">52% · игровой ПК</option><option value=".34">34% · игровой телефон</option></select></label><label>Сторона<select id="team"><option value="both">Обе</option><option value="ally">Союзники</option><option value="enemy">Противники</option></select></label><label>Направление<select id="facing"><option value="team">Как в бою</option><option value="right">Все вправо</option><option value="left">Все влево</option></select></label><label>Фон<select id="background"><option value="arena">Арена</option><option value="dark">Тёмный</option><option value="light">Светлый</option><option value="checker">Клетчатый</option></select></label><label>Темп<select id="speed"><option value="1">Обычный</option><option value=".5">½</option><option value=".25">¼</option></select></label><button id="pause">Пауза</button><button id="step">Кадр →</button><label>Кадр<input id="frame" type="range" min="0" max="47" value="0"/><output id="frame-label">0</output></label></div>
<p id="status" role="status">Загрузка атласов…</p><main>${manifest.roles.map((role,i)=>`<article><h2>${names[i]}</h2><p>${descriptions[i]}</p><div class="variants">${[false,true].map(enemy=>`<section data-team="${enemy?'enemy':'ally'}"><h3>${enemy?'Противники':'Союзники'}</h3><canvas width="480" height="300" data-role="${role}" data-enemy="${enemy}"></canvas><div class="links"><button data-inspect="${role}" data-enemy="${enemy}">Все ${frameCount(role)} кадров</button><a href="${asset(`${enemy?'enemy-':''}high-medieval-u-${role}.svg`)}" target="_blank" rel="noopener">Портрет</a><a href="${asset(`${enemy?'enemy-':''}high-medieval-u-${role}-sheet.png`)}" target="_blank" rel="noopener">PNG-атлас</a></div><p class="caption"></p></section>`).join('')}</div></article>`).join('')}</main><footer><a href="${asset('high-medieval-draft-manifest.json')}">Отдельный манифест</a> · <a href="${asset('high-medieval-contact.png')}">Контактный лист союзников</a> · <a href="${asset('high-medieval-enemy-contact.png')}">Контактный лист противников</a><p>Для замечания укажите бойца, сторону, действие и номер кадра. У арбалетчика и требушета полный цикл — 16–47; у герольда это сигнал знаменем. В бою противник будет зеркально развёрнут.</p></footer><dialog><div class="dialog-heading"><h2 id="inspection-title"></h2><button id="close">Закрыть</button></div><div id="frames"></div></dialog>`;
const select=(id:string)=>document.querySelector<HTMLSelectElement>(`#${id}`)!;
const pose=select('pose'),scale=select('scale'),team=select('team'),facing=select('facing'),background=select('background'),speed=select('speed');
const scrub=document.querySelector<HTMLInputElement>('#frame')!,pause=document.querySelector<HTMLButtonElement>('#pause')!;
const images=new Map<string,HTMLImageElement>();
const arena=new Image();arena.src=asset('arena-high-medieval.svg');
let failures=0,loaded=0;
for(const role of manifest.roles)for(const enemy of [false,true]) {
 const img=new Image();img.onload=()=>{loaded++;status();};img.onerror=()=>{failures++;status();};img.src=asset(`${enemy?'enemy-':''}high-medieval-u-${role}-sheet.png`);images.set(`${role}/${enemy}`,img);
}
function status(){document.querySelector('#status')!.textContent=failures?`Ошибка загрузки: ${failures} атласов. Перезагрузите страницу.`:`Загружено ${loaded}/16 атласов · отдельный черновик, ожидает согласования`;}
let paused=false,time=0,last=performance.now();
function frameFor(role:string){if(pose.value==='frame')return Math.min(Number(scrub.value),frameCount(role)-1);if(pose.value==='move')return 2+Math.floor(time*10)%8;if(pose.value==='action'){const cycle=manifest.actionCycles[role as keyof typeof manifest.actionCycles];return cycle?cycle.first+Math.floor(time*cycle.fps)%cycle.count:10+Math.floor(time*8)%6;}return 0;}
function draw(canvas:HTMLCanvasElement,role:string,enemy:boolean,frame:number,zoom:number){
 const ctx=canvas.getContext('2d')!,w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 if(background.value==='arena'&&arena.complete&&arena.naturalWidth)ctx.drawImage(arena,0,0,w,h);
 else if(background.value==='checker'){for(let y=0;y<h;y+=20)for(let x=0;x<w;x+=20){ctx.fillStyle=(x/20+y/20)%2?'#a4adb0':'#c3ccce';ctx.fillRect(x,y,20,20);}}
 else {ctx.fillStyle=background.value==='light'?'#e7e2d5':'#203239';ctx.fillRect(0,0,w,h);}
 const ground=h-18;ctx.strokeStyle='#758681';ctx.beginPath();ctx.moveTo(0,ground);ctx.lineTo(w,ground);ctx.stroke();
 const img=images.get(`${role}/${enemy}`);if(!img?.complete||!img.naturalWidth)return;
 ctx.save();ctx.translate(w/2,ground);if(facing.value==='left'||facing.value==='team'&&enemy)ctx.scale(-1,1);
 ctx.drawImage(img,frame%4*320,Math.floor(frame/4)*192,320,192,-160*zoom,-176*zoom,320*zoom,192*zoom);ctx.restore();
}
const canvases=[...document.querySelectorAll<HTMLCanvasElement>('main canvas')];
for(const canvas of canvases){const stage=document.createElement('div');stage.className='stage';canvas.before(stage);stage.append(canvas);}
function render(now:number){if(!paused)time+=(now-last)/1000*Number(speed.value);last=now;
 for(const canvas of canvases){const role=canvas.dataset.role!,enemy=canvas.dataset.enemy==='true';const frame=frameFor(role),zoom=Number(scale.value),width=Math.max(canvas.parentElement!.clientWidth,Math.ceil(320*zoom)),height=Math.max(220,Math.ceil(192*zoom+30));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;}draw(canvas,role,enemy,frame,zoom);canvas.closest('section')!.querySelector('.caption')!.textContent=`Кадр ${frame} · ${Math.round(zoom*100)}%`;}
 requestAnimationFrame(render);
}
team.onchange=()=>document.querySelectorAll<HTMLElement>('[data-team]').forEach(el=>el.hidden=team.value!=='both'&&team.value!==el.dataset.team);
pose.onchange=()=>{time=0;};
pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Продолжить':'Пауза';};
scrub.oninput=()=>{pose.value='frame';document.querySelector('#frame-label')!.textContent=scrub.value;};
document.querySelector<HTMLButtonElement>('#step')!.onclick=()=>{paused=true;pause.textContent='Продолжить';const current=pose.value==='frame'?Number(scrub.value):frameFor('banner');pose.value='frame';scrub.value=String((current+1)%48);document.querySelector('#frame-label')!.textContent=scrub.value;};
const dialog=document.querySelector<HTMLDialogElement>('dialog')!;
document.querySelector<HTMLButtonElement>('#close')!.onclick=()=>dialog.close();
document.querySelectorAll<HTMLButtonElement>('[data-inspect]').forEach(button=>button.onclick=()=>{
 const role=button.dataset.inspect!,enemy=button.dataset.enemy==='true',index=manifest.roles.indexOf(role);
 document.querySelector('#inspection-title')!.textContent=`${names[index]} · ${enemy?'противники':'союзники'}`;
 const container=document.querySelector('#frames')!;container.replaceChildren();
 for(let f=0;f<frameCount(role);f++){const figure=document.createElement('figure'),canvas=document.createElement('canvas');canvas.width=360;canvas.height=230;draw(canvas,role,enemy,f,1);const caption=document.createElement('figcaption');caption.textContent=`${f} · ${phaseLabel(role,f)}`;figure.append(canvas,caption);container.append(figure);}
 dialog.showModal();
});
requestAnimationFrame(render);
function phaseLabel(role:string,f:number){if(f===0)return 'стойка';if(f===1)return 'готовность';if(f<10)return 'ходьба';if(f<16)return 'обзор действия';const q=f-16;if(role==='siege')return q<4?'взведён / камень в праще':q<10?'падение противовеса / разгон':q<13?'раскрытие пращи / вылет':q<16?'остаточное движение':q<29?'взведение лебёдкой':'заряжание';if(role==='archer')return q<5?'подъём и прицеливание':q<7?'прицеливание':q<9?'спуск и выстрел':q<14?'опускание к стремени':q<23?'взведение тетивы':q<27?'укладка болта':'возврат в стойку';return 'сигнал';}
