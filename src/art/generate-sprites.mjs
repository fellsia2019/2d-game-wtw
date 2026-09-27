/** Original articulated SVG rigs. Rebuild: node src/art/generate-sprites.mjs */
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const out = resolve('public/assets');
mkdirSync(out, { recursive: true });
const SIZE = 320, HEIGHT = 192, FEET = 176;
const names = { shield: 'Щитоносец', spear: 'Копейщик', archer: 'Стрелок', medic: 'Лекарь', raider: 'Налётчик', thrower: 'Метатель', banner: 'Знаменосец', siege: 'Осадник', bulwark: 'Латник' };
const roles = Object.keys(names);
const teams = ['ally', 'enemy'];
const ink = '#16292e';
const palettes = {
  ally: { cloth: '#4c9b88', light: '#94ceb1', dark: '#2e5b59', steel: '#b4c9bd', metalShade: '#6a8883', gold: '#e7ca83', skin: '#e3c5a0', pants: '#354951', boot: '#695344', cape: '#37786e' },
  enemy: { cloth: '#b96e60', light: '#e6aa8d', dark: '#744953', steel: '#c4aaa0', metalShade: '#886f70', gold: '#efbd83', skin: '#dfb899', pants: '#49404b', boot: '#614849', cape: '#854b50' }
};
const tag = (shape, attrs, inside = '') => `<${shape} ${attrs}>${inside}</${shape}>`;
const path = (d, fill, stroke = ink, width = 3) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const circle = (x, y, r, fill, stroke = ink, width = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const line = (points, color, width = 4) => `<polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const group = (transform, children) => tag('g', `transform="${transform}"`, children);
const limb = (points, color, width) => line(points, ink, width + 5) + line(points, color, width);
const f = n => Math.round(n * 100) / 100;

// The stance and the eight-step walk use explicit feet and knee joints.
// The support foot always touches FEET; the swinging foot follows an arch.
function legs(c, phase, moving, siege = false) {
  if (siege) return '';
  const one = (side, back) => {
    const wave = moving ? Math.sin(phase + (back ? Math.PI : 0)) : 0;
    const lift = moving ? Math.max(0, Math.cos(phase + (back ? Math.PI : 0))) * 7 : 0;
    const hip = [back ? 84 : 99, 123];
    const foot = [f((back ? 78 : 107) + wave * 11), f(FEET - lift)];
    const knee = [f((hip[0] + foot[0]) / 2 + Math.max(0, -wave) * 7), f(149 - lift * .45)];
    return limb([hip, knee, [foot[0], foot[1] - 8]], back ? '#2e4248' : c.pants, 11)
      + path(`M${foot[0] - 6} ${foot[1] - 10}h12l7 5v5h-22z`, back ? '#51463e' : c.boot, ink, 3)
      + line([[foot[0] - 4, foot[1] - 2], [foot[0] + 11, foot[1] - 2]], '#9d8763', 2);
  };
  return one(-1, true) + one(1, false);
}

function head(kind, c, dy) {
  const hood = kind === 'archer' || kind === 'medic' || kind === 'raider';
  let art = '';
  if (hood) art += path('M67 62Q62 28 85 23Q109 22 118 52L108 74 78 80z', c.dark);
  art += path('M81 42Q99 34 110 45l5 14 7 5-8 5-2 11-18 6-15-11z', c.skin);
  art += line([[104, 58], [111, 58]], ink, 3) + path('M109 73l-8 1', 'none', '#88684f', 2);
  if (hood) {
    art += path('M68 60Q65 30 86 25q24-3 29 24l-14-8-21 8-4 27z', c.cloth);
    art += path('M81 39q16-11 27 3', 'none', c.light, 3);
    if (kind === 'raider') art += path('M82 71l29-1-3 15-20 4-10-9z', c.light);
  } else {
    art += path('M68 51Q69 25 91 25q24 0 28 26l-14 7-30-1z', c.steel);
    art += path('M73 47q16-10 38-3l8 8-13 7-32-3z', c.metalShade);
    art += path('M72 53l9 4-2 22-11-10z', c.steel);
    art += line([[90, 29], [92, 43]], '#e4e5c6', 3);
    if (kind === 'shield') {
      art += path('M88 28l5-17 9 2 1 20z', c.gold);
      art += path('M96 59h21l-3 8h-18z', c.dark);
    }
    if (kind === 'banner') art += path('M69 45l7-20 10 8 8-15 9 14 10-5 5 19z', c.gold);
    if (kind === 'spear') art += path('M87 26l6-13 7 3-3 13z', c.gold);
  }
  return group(`translate(0 ${dy})`, art);
}

function weapon(kind, c, hand, frame, pose, rear = false) {
  const [x,y] = hand;
  const attack = pose === 'attack';
  const hit = attack && (frame === 2 || frame === 3);
  const wind = attack && frame < 2;
  const sword = (length = 34) => path(`M-3 3l1-${length} 6-8 5 8L5 3z`, c.steel) + line([[-8,3],[11,3]],c.gold,4) + line([[1,4],[1,15]],c.boot,5);
  if (kind === 'shield') {
    if (rear) return group(`translate(${x} ${y}) rotate(${attack ? [-8,-32,65,88,42,8][frame] : 8})`, sword(29));
    return group(`translate(${x} ${y}) rotate(${attack ? [0,-5,8,13,5,0][frame] : 0})`, path('M-17-26Q0-34 18-26l-1 48Q0 39-18 22z',c.steel,ink,4)+path('M-12-21Q0-25 13-21l-1 39Q0 28-12 18z',c.dark,c.gold,3)+line([[0,-23],[0,23]],c.gold,3)+line([[-12,0],[12,0]],c.gold,3)+circle(0,0,6,c.gold,ink,2));
  }
  if (kind === 'spear') {
    const angle = attack ? [20,-10,70,78,56,36][frame] : pose === 'ready' ? 36 : 15;
    return group(`translate(${x} ${y}) rotate(${angle})`, line([[0,39],[0,-78]],ink,7)+line([[0,39],[0,-78]],'#9e7950',4)+path('M0-103l-8 21 8 7 8-7z',c.steel,ink,2)+path('M3-75l20 7-20 9z',c.cloth,c.gold,2));
  }
  if (kind === 'archer') {
    const pull = attack ? [10,27,0,1,4,9][frame] : pose==='ready' ? 9 : 4;
    const bow = path('M1-36Q29 0 1 36','none',ink,7)+path('M1-36Q29 0 1 36','none',c.gold,4)+line([[1,-36],[-pull,0],[1,36]],'#e7dec0',1.5);
    const arrow = !hit ? line([[-pull-5,0],[33,0]],'#e5dba9',2)+path('M30-4l9 4-9 4z',c.steel,ink,1) : '';
    return group(`translate(${x} ${y})`, bow+arrow);
  }
  if (kind === 'medic') {
    const glow = attack ? circle(0,-54,[8,10,21,25,15,0][frame],'#efd2f0','none',0) : '';
    return group(`translate(${x} ${y}) rotate(${attack ? [-5,-16,7,12,5,0][frame] : 0})`, `<g opacity="${attack ? [.1,.15,.3,.22,.12,0][frame] : 0}">${glow}</g>`+line([[0,46],[0,-43]],ink,7)+line([[0,46],[0,-43]],'#8b6a7d',4)+path('M-10-62l10-6 10 6-2 22H-8z','#d7b3dd','#564767',3)+line([[-5,-52],[5,-52]],'#f9e4d9',3)+line([[0,-58],[0,-46]],'#f9e4d9',3));
  }
  if (kind === 'raider') return group(`translate(${x} ${y}) rotate(${attack ? (rear ? [-12,-60,-78,-40,-28,-35] : [5,-65,68,91,55,28])[frame] : rear ? -35 : 28})`, sword(28));
  if (kind === 'thrower') return attack && frame >= 2 && frame <= 3 ? '' : circle(x,y-4,12,'#2e444a',c.gold,3)+path(`M${x+2} ${y-17}q6-8 10-3`,'none','#e9bf78',2);
  if (kind === 'banner') {
    const flagWave = pose === 'move' ? Math.sin(frame * Math.PI / 4) * 4 : attack ? [1,3,9,12,6,0][frame] : 0;
    return group(`translate(${x} ${y}) rotate(${attack ? [-3,-10,11,16,7,0][frame] : 0})`, line([[0,48],[0,-93]],ink,7)+line([[0,48],[0,-93]],'#a58758',4)+path(`M2-88q28 ${-9+flagWave} 45 0l-8 19 8 19q-22-9-45-2z`,c.cloth,c.gold,3)+path('M17-80v23l15-12z',c.gold,'none',0)+path('M0-105l7 9-7 9-7-9z',c.gold));
  }
  return '';
}

// A separate heavy-infantry rig, not the shield mercenary with recoloured cloth.
function bulwarkRig(team, pose, frame) {
  const c=palettes[team], moving=pose==='move', attacking=pose==='attack';
  const phase=frame*Math.PI/4, dy=moving?-Math.abs(Math.sin(phase))*.7:0;
  const plate=team==='enemy'?'#71616b':'#59727b', shade=team==='enemy'?'#493e4b':'#364f5d';
  const edge='#b7b8b0', copper='#c69765', paint=team==='enemy'?'#a8534b':'#377d7d';
  let art='';
  for(const back of [true,false]) {
    const wave=moving?Math.sin(phase+(back?Math.PI:0)):0;
    const lift=moving?Math.max(0,Math.cos(phase+(back?Math.PI:0)))*5:0;
    const foot=[f((back?72:111)+wave*8),f(FEET-lift)];
    const knee=[f((back?77:109)+wave*3),f(148-lift*.4)];
    art+=limb([[back?78:108,126],knee,[foot[0],foot[1]-10]],shade,16);
    art+=path(`M${knee[0]-8} ${knee[1]-4}l15-1 ${foot[0]-knee[0]+2} ${foot[1]-knee[1]-7}h-17z`,plate,ink,3);
    art+=path(`M${foot[0]-8} ${foot[1]-11}h16l7 7v4h-26z`,plate,ink,3);
    art+=line([[foot[0]-5,foot[1]-4],[foot[0]+12,foot[1]-4]],copper,2);
  }
  const hand=attacking?[[57,100],[66,70],[137,78],[148,98],[97,103],[59,106]][frame]:[pose==='ready'?59:54,pose==='ready'?106:117];
  const elbow=attacking?[[56,86],[53,76],[102,67],[118,80],[75,85],[56,89]][frame]:[55,92];
  art+=limb([[65,78],elbow,hand],plate,14);
  // Broad breastplate, overlapping tassets and slab shoulders replace the tunic/cape.
  art+=group(`translate(0 ${dy})`,path('M59 70l21-11 34 5 16 20-9 46-55 4-14-38z',plate,ink,4)
    +path('M69 77l22 7 24-8-4 31-22 10-21-12z',shade,edge,2)
    +path('M66 119h53l7 22-25 6-13-9-26 3z',plate,ink,3)
    +line([[88,120],[89,136]],edge,2)+line([[103,122],[104,139]],edge,2)
    +path('M51 69l21-9 15 13-7 22-30-5z',plate,ink,4)
    +path('M106 66l22 3 13 19-8 12-27-13z',plate,ink,4)
    +line([[56,72],[73,68]],edge,3)+line([[115,73],[128,78]],edge,3)
    +line([[66,116],[119,116]],copper,5));
  // Flat-topped closed great helm: no exposed face, no mercenary crest.
  art+=group(`translate(0 ${dy})`,path('M72 24l28-4 18 13 4 34-21 14-31-9-5-30z',plate,ink,4)
    +path('M74 32l27-3 13 10-2 11-37 1z',shade,ink,2)
    +path('M80 45l32-2v6l-31 3z','#101e28','none',0)
    +line([[84,47],[106,46]],c.gold,2)
    +path('M99 53l17-4-2 16-15 8z',shade,ink,2)
    +line([[104,57],[104,65]],edge,2)+line([[110,55],[110,62]],edge,2)
    +line([[72,32],[74,68]],edge,3));
  // Angular tower shield braces forward; the mace has an overhead swing of its own.
  const shieldX=attacking?[130,126,133,138,133,131][frame]:pose==='ready'?131:126;
  const shieldY=attacking?[116,119,113,115,117,116][frame]:116;
  art+=limb([[119,87],[130,104],[shieldX,shieldY]],plate,14);
  art+=group(`translate(${shieldX} ${shieldY}) rotate(${attacking?[-2,-7,2,7,1,-3][frame]:pose==='ready'?-3:0})`,
    path('M-23-43l34-5 14 13-2 69-18 13-31-10z',shade,ink,4)
    +path('M-16-36l24-4 10 9-2 60-12 9-21-7z',paint,copper,3)
    +path('M-13-17l28-10v8l-28 10zM-14 3L14-7v8l-28 10z',edge,'none',0)
    +line([[0,-35],[0,30]],shade,4)+circle(0,5,6,copper,ink,2));
  const angle=attacking?[-10,-48,62,107,44,0][frame]:pose==='ready'?0:-14;
  art+=group(`translate(${hand[0]} ${hand[1]}) rotate(${angle})`,line([[0,14],[0,-36]],ink,8)+line([[0,14],[0,-36]],'#8f7256',4)
    +path('M-10-50l8-7 13 3 6 15-7 11-17-3-7-11z',plate,ink,3)
    +path('M-3-53l3 22M9-50l-2 20','none',copper,3)+circle(0,3,6,plate,ink,2));
  return art;
}

function rig(kind, team, pose, frame = 0) {
  if(kind==='bulwark') return bulwarkRig(team,pose,frame);
  const c = palettes[team], moving = pose === 'move', attack = pose === 'attack';
  const phase = frame * Math.PI / 4;
  const dy = moving ? -Math.abs(Math.sin(phase)) * 1.2 : 0;
  const hit = attack && (frame === 2 || frame === 3), wind = attack && frame < 2;
  let art = '';
  if (kind === 'siege') {
    const wheelAngle = moving ? frame * 22.5 : 0, recoil = attack ? [-1,-3,-10,-6,-2,0][frame] : 0;
    art += path('M42 139l17-38h69l23 38-12 21H51z','#7a644a',ink,4);
    art += path('M52 132h91v22H48z',c.dark,ink,4)+line([[64,119],[131,119]],c.gold,4);
    art += group(`translate(0 ${-8+dy})`, head('shield',c,13)+path('M78 91h33l10 40H66z',c.cloth)+limb([[105,98],[124,112],[attack ? [131,127,124,128,130,132][frame] : 132,attack ? [103,100,105,109,108,107][frame] : 107]],c.steel,9));
    art += group(`translate(${recoil} 0)`, path('M76 94l63-9 25 7v22l-28 5-60-6z',c.metalShade,ink,4)+path('M91 98l48-6 21 3v11l-23 7-46-4z',c.steel,ink,2)+path('M153 90h13v25h-13z',c.dark,c.gold,3));
    for (const x of [58,135]) art += circle(x,156,20,'#665642',ink,4)+group(`rotate(${wheelAngle} ${x} 156)`,line([[x-14,156],[x+14,156]],c.gold,3)+line([[x,142],[x,170]],c.gold,3)+circle(x,156,5,c.metalShade,ink,2)+circle(x+13,151,2,'#efe1b1','none',0));
    if(hit) art += `<g opacity="${frame===2?.8:.35}">`+path('M170 88l13 4-6 9 13 7-19 10-7-14z','#f5dba0','#d6a76b',2)+'</g>';
    return art;
  }
  // Cape and rear equipment sit behind the articulated limbs.
  if (['shield','banner'].includes(kind)) art += group(`translate(0 ${dy})`,path(`M74 75q-15 31 ${moving?-18:-13} 70l27-12 13-45z`,c.cape));
  if (kind === 'archer') art += group(`translate(0 ${dy})`,path('M65 62l14 5-10 54-16-4z','#826344')+line([[64,66],[68,41]],c.gold,3)+line([[69,68],[74,43]],c.gold,3)+line([[59,67],[60,44]],c.gold,3));
  if (kind === 'raider') art += group(`translate(0 ${dy})`,path(`M74 79L${moving?39:48} ${moving?76:87}l8 10 23-8z`,c.light));
  art += legs(c,phase,moving);
  // Rear arm; elbow and hand coordinates are per-pose, never a body rotation.
  const backHand = kind === 'archer' ? [attack ? [123,105,136,136,132,126][frame] : pose==='ready' ? 126 : 131,94+dy] : [66+(moving?Math.sin(phase)*8:0)+(attack ? [-1,-5,7,10,4,0][frame] : 0),116+dy];
  art += limb([[77,83+dy],[66,101+dy],backHand],c.dark,10);
  if (kind === 'shield' || kind === 'raider') art += weapon(kind,c,backHand,frame,pose,true);
  // Stable torso; broad plate, tunic, or long healer coat establishes role.
  const broad = kind === 'shield' || kind === 'thrower';
  art += group(`translate(0 ${dy})`,path(`M${broad?67:73} 77q24-10 ${broad?47:37} 0l${broad?8:5} 49-47 7-11-19z`,kind==='medic'?'#b599ba':c.cloth,ink,4));
  if(kind==='medic') art += path('M71 113l-7 42 49 1-6-44z','#a88ab1',ink,3)+path('M69 145h42','none','#e6d9be',3);
  if(['shield','spear'].includes(kind)) art += group(`translate(0 ${dy})`,path('M75 77l19 7 17-7 2 23-20 9-19-9z',c.steel,ink,3)+path('M79 82l14 5 15-5v13l-15 7-14-7z',c.metalShade,'none',0));
  art += group(`translate(0 ${dy})`,line([[73,119],[112,119]],c.gold,5)+path('M88 114h10v10H88z',c.gold,ink,2));
  if(kind==='thrower') art += circle(71,124,9,'#6f5942',c.gold,2)+circle(111,128,8,'#6f5942',c.gold,2);
  if(kind==='medic') art += circle(91,119,14,'#ddd1d9','#665477',3)+line([[84,119],[98,119]],'#925c98',4)+line([[91,112],[91,126]],'#925c98',4);
  art += head(kind,c,dy);
  let hand = [121,110+dy], elbow = [117,94+dy];
  if(kind==='shield') { hand=[attack ? [122,113,137,143,132,128][frame] : pose==='ready'?128:124,110+dy]; elbow=[112,98+dy]; }
  if(kind==='spear') {hand=[attack ? [121,112,140,143,134,127][frame] : 127,(attack ? [106,112,108,109,107,108][frame] : 108)+dy];elbow=[attack ? [111,108,126,130,119,113][frame] : 113,99+dy];}
  if(kind==='archer') {hand=[attack ? [133,132,136,137,136,135][frame] : 135,94+dy];elbow=[121,(attack ? [93,96,94,92,93,94][frame] : 92)+dy];}
  if(kind==='medic') {hand=[attack ? [125,119,131,134,129,125][frame] : 125,(attack ? [112,105,101,102,109,115][frame] : 115)+dy];elbow=[112,101+dy];}
  if(kind==='raider') {hand=attack ? [[118,112],[102,87],[138,101],[146,108],[134,112],[122,118]][frame].map((v,i)=>v+(i?dy:0)) : [122,118+dy];elbow=[hit?126:113,96+dy];}
  if(kind==='thrower') {hand=attack ? [[116,86],[86,39],[143,68],[151,84],[136,99],[124,106]][frame].map((v,i)=>v+(i?dy:0)) : [124,106+dy];elbow=wind?[115,61+dy]:hit?[128,76+dy]:[114,91+dy];}
  if(kind==='banner') {hand=[attack ? [124,120,130,132,128,125][frame] : 125,(attack ? [114,109,107,110,113,114][frame] : 114)+dy];elbow=[113,100+dy];}
  if(moving && !['spear','archer','banner','medic'].includes(kind)) hand[0]+=Math.sin(phase+Math.PI)*5;
  art += limb([[107,84+dy],elbow,hand],kind==='medic'?'#c3a4c9':c.steel,10)+circle(hand[0],hand[1],5,c.skin,ink,2);
  art += weapon(kind,c,hand,frame,pose);
  // Drawing hand visibly pulls the bow string on the wind-up, releases on strike.
  if(kind==='archer') art += limb([[82,84+dy],[91,99+dy],backHand],c.cloth,8)+circle(backHand[0],backHand[1],4,c.skin,ink,2);
  return art;
}

function frameRig(kind, team, index) {
  return index === 0 ? rig(kind,team,'idle') : index === 1 ? rig(kind,team,'ready') : index < 10 ? rig(kind,team,'move',index-2) : rig(kind,team,'attack',index-10);
}
const svg = (w,h,content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`;
function png(file, source, checkCells = false) {
  const rendered = new Resvg(source).render();
  if (checkCells) {
    const pixels = rendered.pixels;
    for (let y=0;y<rendered.height;y++) for(let x=0;x<rendered.width;x++) {
      const cellX=x%SIZE,cellY=y%HEIGHT;
      if ((cellX<2||cellX>=SIZE-2||cellY<2||cellY>=HEIGHT-2) && pixels[(y*rendered.width+x)*4+3]>0)
        throw new Error(`Clipped sprite: ${file} frame ${Math.floor(y/HEIGHT)*4+Math.floor(x/SIZE)} at ${cellX},${cellY}`);
    }
    const hashes=[];
    for(let frame=0;frame<16;frame++) {
      const hash=createHash('sha256'),left=frame%4*SIZE,top=Math.floor(frame/4)*HEIGHT;
      for(let y=top;y<top+HEIGHT;y++) hash.update(pixels.subarray((y*rendered.width+left)*4,(y*rendered.width+left+SIZE)*4));
      hashes.push(hash.digest('hex'));
    }
    if(new Set(hashes.slice(2,10)).size!==8) throw new Error(`Walk must have eight distinct poses: ${file}`);
    if(new Set(hashes.slice(10,16)).size!==6) throw new Error(`Attack must have six distinct poses: ${file}`);
  }
  writeFileSync(resolve(out,file),rendered.asPng());
}
for(const team of teams) for(const kind of roles) {
  const prefix = team==='enemy'?'enemy-':'';
  const standing=svg(192,192,frameRig(kind,team,0));
  writeFileSync(resolve(out,`${prefix}u-${kind}.svg`),standing);
  const frames=Array.from({length:16},(_,i)=>`<svg x="${i%4*SIZE}" y="${Math.floor(i/4)*HEIGHT}" width="${SIZE}" height="${HEIGHT}" viewBox="0 0 320 192"><g transform="translate(64 0)">${frameRig(kind,team,i)}</g></svg>`).join('');
  png(`${prefix}u-${kind}-sheet.png`,svg(SIZE*4,HEIGHT*4,frames),true);
}
const selected=[0,1,2,4,6,10,12,14];
const labels=['СТОЙКА','ГОТОВ','ШАГ 1','ШАГ 3','ШАГ 5','ЗАМАХ','УДАР','ВОЗВРАТ'];
for(const team of teams) {
  let content='<rect width="2720" height="1850" fill="#243c43"/>';
  labels.forEach((name,col)=>content+=`<text x="${160+col*SIZE+160}" y="35" fill="#e6d19a" font-size="16" text-anchor="middle" font-family="Segoe UI">${name}</text>`);
  roles.forEach((kind,row)=>{
    const y=55+row*198;
    content+=`<text x="12" y="${y+85}" fill="#e5dfca" font-size="16" font-family="Segoe UI">${names[kind]}</text>`;
    selected.forEach((frame,col)=>{ const x=160+col*SIZE; content+=`<rect x="${x}" y="${y}" width="319" height="192" fill="${row%2?'#2a454a':'#294046'}"/><path d="M${x} ${y+176}h320" stroke="#acc5ab" stroke-opacity=".3"/>`+`<svg x="${x}" y="${y}" width="320" height="192" viewBox="0 0 320 192"><g transform="translate(64 0)">${frameRig(kind,team,frame)}</g></svg>`; });
  });
  png(`sprite-contact-${team}.png`,svg(2720,1850,content));
}
let walk='<rect width="2720" height="1690" fill="#233b42"/>';
roles.slice(0,8).forEach((kind,row)=>{const y=30+row*204;walk+=`<text x="10" y="${y+85}" fill="#e8d9b7" font-size="16" font-family="Segoe UI">${names[kind]}</text>`;for(let i=0;i<8;i++){const x=160+i*320;walk+=`<path d="M${x} ${y+176}h320" stroke="#94b4a2" stroke-opacity=".4"/>`+`<svg x="${x}" y="${y}" width="320" height="192" viewBox="0 0 320 192"><g transform="translate(64 0)">${rig(kind,'ally','move',i)}</g></svg>`;}});
png('sprite-contact-walk.png',svg(2720,1690,walk));
let attacks='<rect width="2080" height="1850" fill="#233b42"/>';
roles.forEach((kind,row)=>{const y=55+row*198;attacks+=`<text x="10" y="${y+85}" fill="#e8d9b7" font-size="16" font-family="Segoe UI">${names[kind]}</text>`;for(let i=0;i<6;i++){const x=160+i*320;if(row===0)attacks+=`<text x="${x+160}" y="30" fill="#e8d9b7" font-size="16" text-anchor="middle" font-family="Segoe UI">${['ПОДГОТОВКА','ЗАМАХ','УДАР','ДОВЕДЕНИЕ','ВОЗВРАТ','ГОТОВНОСТЬ'][i]}</text>`;attacks+=`<path d="M${x} ${y+176}h320" stroke="#94b4a2" stroke-opacity=".4"/><svg x="${x}" y="${y}" width="320" height="192" viewBox="0 0 320 192"><g transform="translate(64 0)">${rig(kind,'ally','attack',i)}</g></svg>`;}});
png('sprite-contact-attack.png',svg(2080,1850,attacks));
let comparison='<rect width="920" height="565" fill="#243e46"/>';
for(const [column,[kind,team]] of [['shield','ally'],['bulwark','ally'],['shield','enemy'],['bulwark','enemy']].entries()) {
  const center=140+column*210;
  comparison+=`<text x="${center}" y="26" fill="#eed5a0" font-size="16" text-anchor="middle" font-family="Segoe UI">${names[kind]} · ${team==='ally'?'союз':'враг'}</text>`;
  for(const [scale,y] of [[1,55],[.52,305],[.34,455]]) comparison+=group(`translate(${center-96*scale} ${y}) scale(${scale})`,rig(kind,team,'idle'));
}
comparison+='<text x="15" y="278" fill="#bdd1ba" font-size="16" font-family="Segoe UI">52% · размер на ПК</text><text x="15" y="432" fill="#bdd1ba" font-size="16" font-family="Segoe UI">34% · размер на телефоне</text>';
png('sprite-comparison-bulwark.png',svg(920,565,comparison));
writeFileSync(resolve(out,'sprite-manifest.json'),JSON.stringify({ frameWidth:SIZE,frameHeight:HEIGHT,columns:4,rows:4,originX:.5,originY:FEET/HEIGHT,frames:{idle:0,ready:1,move:[2,3,4,5,6,7,8,9],attack:[10,11,12,13,14,15]},moveFps:12,attackFps:15,roles },null,2));
const preview=`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Арена наёмников · проверка анимаций</title><style>
*{box-sizing:border-box}body{margin:0;background:#14282f;color:#e4e8d6;font:16px/1.5 "Segoe UI",sans-serif}header{padding:22px 26px;background:#1d363c;border-bottom:1px solid #64715d}h1{margin:0 0 8px;font:700 28px Georgia}p{margin:5px 0;color:#aec2b2}.controls{position:sticky;top:0;z-index:3;display:flex;flex-wrap:wrap;gap:12px;align-items:center;background:#172f36ed;padding:14px 26px;border-bottom:1px solid #516b5b}label{display:flex;gap:7px;align-items:center;font-size:16px}button,select{font:inherit;padding:8px;background:#345047;color:#f0e5c7;border:1px solid #809276;border-radius:4px;min-height:44px}button{cursor:pointer}button:focus-visible,select:focus-visible{outline:2px solid #f1d394}main{max-width:1380px;margin:0 auto;padding:20px}section{margin-bottom:23px;background:#213e45;border:1px solid #4a655b;border-radius:7px;overflow:hidden}section h2{font:700 20px Georgia;margin:0;padding:12px 18px;background:#29473f}.poses{display:grid;grid-template-columns:repeat(3,minmax(320px,1fr));gap:1px}.pose{display:flex;flex-direction:column;align-items:center;padding:10px 0 0;background:#2d484f}.caption{font-size:16px;color:#d5c58f}.viewport{width:320px;height:192px;position:relative;flex-shrink:0;background:linear-gradient(transparent 175px,#b8d9ac77 176px,transparent 177px)}.viewport:after{content:"";position:absolute;left:159px;top:171px;width:2px;height:10px;background:#f1d793;pointer-events:none}.sprite{width:320px;height:192px;background-size:1280px 768px;background-repeat:no-repeat;transform-origin:160px 176px}.meta{font-size:16px;color:#9fb6a7;padding:9px 18px}.contacts{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px}a{color:#e5c989}.hidden{display:none!important}@media(max-width:1060px){.poses{grid-template-columns:1fr}}@media(max-width:370px){main{padding:8px}header,.controls{padding:14px 12px}} </style>
<header><h1>Проверка поз и анимаций</h1><p>Отдельная галерея спрайтов. Линия — уровень опоры, золотая отметка — неизменная точка привязки стоп.</p><p>Стойка неподвижна. Шаг: 8 кадров, 12 кадр/с. Удар: 6 разных поз, 15 кадр/с; затем боец возвращается в готовность.</p><div class="contacts"><a href="assets/sprite-contact-ally.png">Все роли</a><a href="assets/sprite-contact-enemy.png">Враги</a><a href="assets/sprite-contact-walk.png">Восемь фаз шага</a><a href="assets/sprite-contact-attack.png">Шесть фаз удара</a></div></header>
<div class="controls"><label>Сторона <select id="team"><option value="ally">Союзники</option><option value="enemy">Противники</option></select></label><label>Роль <select id="role"><option value="all">Все роли</option>${roles.map(r=>`<option value="${r}">${names[r]}</option>`).join('')}</select></label><label>Состояние <select id="state"><option value="all">Все три</option><option value="idle">Стоит</option><option value="move">Идёт</option><option value="attack">Сражается</option></select></label><label>Направление <select id="facing"><option value="1">Вправо</option><option value="-1">Влево</option></select></label><label>Скорость <select id="speed"><option value="1">100%</option><option value="0.5">50%</option><option value="0.25">25%</option></select></label><button id="pause">Пауза</button><button id="step">Следующий кадр</button><span id="status" aria-live="polite"></span></div>
<main>${roles.map(r=>`<section data-role="${r}"><h2>${names[r]}</h2><div class="poses">${['idle','move','attack'].map((s,i)=>`<div class="pose" data-state="${s}"><span class="caption">${['СТОИТ','ДВИЖЕНИЕ','БОЙ'][i]}</span><div class="viewport"><div class="sprite" data-kind="${r}" data-pose="${s}"></div></div></div>`).join('')}</div><div class="meta">Кадр 320 × 192 · опора 160,176 · атлас 1280 × 768</div></section>`).join('')}</main>
<script>const sprites=[...document.querySelectorAll('.sprite')],team=document.querySelector('#team'),role=document.querySelector('#role'),state=document.querySelector('#state'),facing=document.querySelector('#facing'),speed=document.querySelector('#speed'),pause=document.querySelector('#pause'),status=document.querySelector('#status');let time=0,last=performance.now(),paused=false,manual=null;
function sources(){sprites.forEach(s=>s.style.backgroundImage='url("assets/'+(team.value==='enemy'?'enemy-':'')+'u-'+s.dataset.kind+'-sheet.png")')}sources();team.onchange=sources;
role.onchange=()=>document.querySelectorAll('section').forEach(s=>s.classList.toggle('hidden',role.value!=='all'&&s.dataset.role!==role.value));state.onchange=()=>document.querySelectorAll('.pose').forEach(s=>s.classList.toggle('hidden',state.value!=='all'&&s.dataset.state!==state.value));facing.onchange=()=>sprites.forEach(s=>s.style.transform='scaleX('+facing.value+')');
pause.onclick=()=>{paused=!paused;manual=null;pause.textContent=paused?'Продолжить':'Пауза';status.textContent=paused?'Кадры остановлены':''};document.querySelector('#step').onclick=()=>{paused=true;manual=manual===null?0:(manual+1)%16;pause.textContent='Продолжить';status.textContent='Кадр '+manual+' / 15'};
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused)time+=dt*Number(speed.value);sprites.forEach(s=>{const t=time%1.2;const frame=manual!==null?manual:s.dataset.pose==='idle'?0:s.dataset.pose==='move'?2+Math.floor(time*12)%8:t<.4?10+Math.min(5,Math.floor(t*15)):1;s.style.backgroundPosition=-(frame%4)*320+'px '+-Math.floor(frame/4)*192+'px'});requestAnimationFrame(loop)}requestAnimationFrame(loop);</script></html>`;
writeFileSync(resolve('public/sprite-preview.html'),preview);
console.log(`Generated ${roles.length*2} PNG sprite sheets, static SVGs, four contact sheets and sprite-preview.html. All 288 frames pass bounds and pose-uniqueness checks.`);
