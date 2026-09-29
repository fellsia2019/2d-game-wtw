/** Standalone, unapproved eighth-era art. Nothing in this module registers game content. */
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';
export const industrialRoles = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export const industrialNames = ['Бронежилетчик', 'Штыковик', 'Винтовочник', 'Санитар поезда', 'Велосипедный разведчик', 'Подрывник', 'Механик', 'Паровая мортира'];
export const industrialFrames = Object.fromEntries(industrialRoles.map(role => [role, 16]));
const ink = '#272b30';
const path = (d, fill, stroke = ink, width = 2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, color, width = 3) => path(d, 'none', color, width);
const circle = (x, y, r, fill, stroke = ink, width = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const ellipse = (x, y, rx, ry, fill, stroke = ink, width = 2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const group = (transform, body) => `<g transform="${transform}">${body}</g>`;
const limb = (d, fill, width = 8) => line(d, ink, width + 3) + line(d, fill, width);
const colors = enemy => ({
 coat: enemy ? '#82494a' : '#3d7777', shade: enemy ? '#5c373b' : '#285255', trim: enemy ? '#c98975' : '#a2c5ad',
 metal: '#87949b', lightMetal: '#c4d0cd', darkMetal: '#46565c', brass: '#d6ad62', wood: '#77543d', paleWood: '#af8860',
 skin: '#deb18d', skinShade: '#b77c63', canvas: '#cfbb8e', white: '#ebe7d9', leather: '#574b3e', rubber: '#343b3d', smoke: '#b8b7aa'
});

function head(role, c, bob = 0) {
 let hair = path('M77 47q1-26 22-26 22 2 21 28l-13-11-25 14z', c.leather);
 if (role === 'shield') hair = path('M74 49q-3-27 23-30 24 1 25 29l-17-7-20 7-5 12z', c.metal) + line('M77 41q19-15 41-3', c.lightMetal, 3) + circle(98, 23, 3, c.brass);
 if (role === 'spear') hair = path('M73 40q9-24 28-22 18 2 19 21z', c.shade) + path('M67 40q28-7 62 0l2 7q-38 8-64 0z', c.coat) + line('M77 35h39', c.brass, 2);
 if (role === 'archer') hair = path('M71 41q5-22 27-22 23 0 28 23z', c.coat) + path('M67 43h67l-8 7H71z', c.shade) + circle(91, 29, 3, c.brass);
 if (role === 'medic') hair = path('M74 42q6-22 23-22 19 0 24 23z', c.white) + path('M69 43h58l-6 8H75z', c.white) + path('M94 23h7v6h6v7h-6v6h-7v-6h-6v-7h6z', '#b95d52', 'none');
 if (role === 'raider') hair = path('M76 38q2-20 21-21 18 1 22 22l-16-6-21 7z', c.leather) + line('M79 39l40 4', c.brass, 3);
 if (role === 'thrower') hair = path('M76 42q-4-23 21-27 25 2 24 28l-17-7-19 11z', c.darkMetal) + path('M75 42h47l-4 6H77z', c.brass);
 if (role === 'banner') hair = path('M74 40q2-23 22-23 21 1 25 25z', c.leather) + path('M68 40h62l-5 8H72z', c.coat) + ellipse(96, 38, 13, 5, c.lightMetal) + ellipse(96, 38, 8, 3, c.darkMetal);
 if (role === 'siege') hair = path('M74 41q5-21 24-22 20 1 24 23z', c.coat) + path('M69 42h61l-8 7H74z', c.shade);
 const face = path('M82 44q11-8 24-1l8 11 8 5-8 5-2 12q-18 9-31-7z', c.skin) + ellipse(82, 58, 4, 6, c.skin) + line('M104 50l10 1', c.leather, 2) + ellipse(110, 56, 2, 2, ink, 'none') + line('M108 68h7', c.skinShade, 2);
 return group(`translate(0 ${bob})`, path('M89 72h18v16H89z', c.skinShade) + face + hair);
}

function legs(c, frame) {
 const moving = frame >= 2 && frame < 10;
 let result = '';
 for (const far of [true, false]) {
  const pose = moving ? walkLeg(frame - 2, far, false) : { hip: { x: far ? 87 : 104, y: 124 }, knee: { x: far ? 82 : 109, y: 147 }, ankle: { x: far ? 80 : 112, y: 169 }, foot: { x: far ? 80 : 112, y: 176, pitch: 0 }, pivot: 0 };
  const { hip, knee, ankle, foot, pivot } = pose;
  result += limb(`M${hip.x} ${hip.y}L${knee.x} ${knee.y}`, far ? c.shade : c.coat, 12);
  result += limb(`M${knee.x} ${knee.y}L${ankle.x} ${ankle.y}`, c.leather, 9);
  result += circle(knee.x, knee.y, 5, far ? c.shade : c.coat);
  result += group(`translate(${foot.x} ${foot.y}) rotate(${foot.pitch} ${pivot} 0)`, path('M-7-10h10l3 7 9 2v3H-7z', c.leather));
 }
 return result;
}

function torso(role, c, bob) {
 const medic = role === 'medic', steel = role === 'shield';
 let body = path('M76 82q19-12 39 0l8 54q-22 11-54 0z', medic ? c.white : c.coat) + path('M70 131q26 10 52 0l2 16q-27 10-55-1z', medic ? c.white : c.shade);
 body += path('M81 82l14 10 14-9 6 8-19 14-21-15z', medic ? c.canvas : c.shade);
 if (!medic && !steel) body += line('M97 102v28', c.trim, 2) + [106,117,128].map(y=>circle(101,y,2,c.brass)).join('');
 body += line('M73 127h48', c.leather, 5) + circle(98, 127, 4, c.brass);
 if (steel) body += path('M80 83l15-6 17 7 5 34-19 14-21-13z', c.metal) + path('M85 87l11-4 12 4 4 24-15 11-14-8z', c.darkMetal) + line('M96 84v33', c.lightMetal, 2) + [91,106].map(x => circle(x, 96, 2, c.brass)).join('');
 if (medic) body += path('M76 95l18 15 22-13 8 45-29 19-26-17z', c.white) + path('M89 113h7v6h6v7h-6v6h-7v-6h-6v-7h6z', '#bc534a', 'none') + path('M62 117h22v26H62z', c.leather) + line('M67 124h12', c.brass, 2);
 if (role === 'archer' || role === 'spear') body += line('M79 82l35 38', c.leather, 6) + path('M70 109h15v27H70z', c.canvas);
 if (role === 'thrower') body += path('M65 105h25v33H65z', c.leather) + line('M68 113h18M68 120h18', c.brass, 2);
 if (role === 'banner') body += path('M62 89h14v47H62z', c.brass) + path('M64 91h10v36H64z', c.darkMetal) + line('M72 94q10-8 15 0', c.rubber, 4) + circle(69, 94, 5, c.lightMetal) + line('M82 87l32 37', c.leather, 7);
 return group(`translate(0 ${bob})`, body);
}

function person(role, c, frame) {
 const moving = frame >= 2 && frame < 10, attack = frame >= 10, k = attack ? frame - 10 : 0;
 const bob = moving ? walkBodyOffset(frame - 2) : attack ? [0,-2,-3,-1,1,0][k] : 0;
 let art = legs(c, frame) + torso(role, c, bob) + head(role, c, bob);
 const hands = (leftX, leftY, rightX, rightY) => limb(`M78 ${88+bob}L70 ${104+bob} ${leftX} ${leftY}`, c.shade, 8) + limb(`M111 ${88+bob}L125 ${105+bob} ${rightX} ${rightY}`, c.coat, 8) + circle(leftX,leftY,5,c.skin) + circle(rightX,rightY,5,c.skin);
 if (role === 'shield') {
  const reach = attack ? [0,6,15,17,10,3][k] : 0, y = attack ? [0,-3,-12,-14,-7,0][k] : 0;
  art += hands(67,111,145+reach,103+y) + path(`M${128+reach} ${72+y}h34l6 15v57l-8 11h-33z`, c.metal) + path(`M${133+reach} ${77+y}h27v65h-27z`, c.darkMetal) + path(`M${137+reach} ${89+y}h18v18h-18z`, c.lightMetal) + line(`M${144+reach} ${113+y}v21`, c.brass, 3);
 } else if (role === 'spear' || role === 'archer') {
  const thrust = attack ? [0,4,15,21,9,1][k] : 0, lift = role === 'spear' ? -11 : attack ? [0,-4,-8,-5,0,1][k] : 0;
  art += limb(`M78 ${88+bob}L91 ${106+bob} ${105+thrust} ${105+lift}`, c.shade, 8) + limb(`M111 ${88+bob}L126 ${105+bob} ${139+thrust} ${104+lift}`, c.coat, 8);
  let weapon = path(`M83 ${101+lift}h92l10 6-10 5H83z`, c.wood) + line(`M107 ${98+lift}h76`, c.darkMetal, 6) + line(`M110 ${97+lift}h74`, c.lightMetal, 2);
  weapon += path(`M94 ${107+lift}l-6 19 19-5 8-14z`, c.leather) + circle(119,103+lift,3,c.brass);
  if (role === 'spear') weapon += path(`M184 ${94+lift}l24 10-24 10-2-10z`, c.lightMetal) + line(`M184 ${104+lift}h17`, c.metal, 2);
  else weapon += path(`M182 ${100+lift}h7v10h-7z`, c.darkMetal) + (attack && k===2 ? path('M189 95l14 9-14 10-2-10z','#f3c379','none') : '');
  art += group(`translate(${thrust} 0)`, weapon);
  art += circle(105+thrust,105+lift,5,c.skin) + circle(139+thrust,104+lift,5,c.skin);
 } else if (role === 'medic') {
  const extend = attack ? [0,5,13,13,7,1][k] : 0;
  art += hands(71,113,142+extend,109) + path(`M${137+extend} 103h16v13h-16z`, c.white) + line(`M${141+extend} 109h8M${145+extend} 105v9`,'#bf6154',2);
  if (attack && k>=2 && k<=4) art += circle(149+extend,109,9+(k-2)*4,'none',c.trim,2)+line(`M${164+extend} 83v10M${159+extend} 88h10`,c.white,2);
 } else if (role === 'thrower') {
  const hx = attack ? [131,139,148,156,118,130][k] : 131, hy = attack ? [91,78,61,46,96,91][k] : 91;
  const charge = (x,y) => path(`M${x-8} ${y-13}h16v26h-16z`,c.leather)+line(`M${x} ${y-14}v-9`,c.brass,2);
  art += hands(65,121,hx,hy) + (attack && k===4 ? charge(190,43)+circle(194,22,5,'#efa456','none') : charge(hx,hy));
 } else if (role === 'banner') {
  const turn = attack ? [-18,-7,8,20,5,-18][k] : -18;
  art += limb(`M78 ${88+bob}L69 ${104+bob} 61 112`,c.shade,8)+limb(`M111 ${88+bob}L129 ${108+bob} 151 113`,c.coat,8);
  art += group(`translate(151 113) rotate(${turn})`, path('M-4-45h8v57h-8z',c.metal)+path('M-14-52l8-9 6 10 6-10 8 9-6 9H-8z',c.lightMetal));
  art += circle(61,112,5,c.skin)+circle(151,113,5,c.skin);
  if (attack && k>=2 && k<=4) art += line(`M171 ${65-k}l7-6M170 ${69-k}l10 1M166 ${60-k}l-1-8`,c.brass,2);
 } else if (role === 'raider') {
  art += hands(73,116,146,108);
 }
 return art;
}

function bicycle(c, frame) {
 const moving=frame>=2&&frame<10, spin=moving?(frame-2)*42:frame>=10?(frame-10)*64:0, radians=spin*Math.PI/180;
 const wheel=x=>circle(x,153,24,c.rubber)+circle(x,153,19,c.lightMetal)+group(`rotate(${spin} ${x} 153)`,line(`M${x-18} 153h36M${x} 135v36M${x-13} 140l26 26M${x-13} 166l26-26`,c.darkMetal,2))+circle(x,153,4,c.brass);
 const frameParts=limb('M53 153L95 118 118 153 53 153M95 118l32-20 38 55M118 153l9-55',c.metal,4)+line('M53 153L95 118 118 153M95 118l32-20 38 55',c.brass,2);
 const saddle=line('M83 113h23M125 99l17-7 12 10',c.rubber,5);
 const pedal=(offset)=>({x:118+15*Math.cos(radians+offset),y:153+15*Math.sin(radians+offset)});
 const rear=pedal(Math.PI),front=pedal(0);
 const leg=(startX,p,far)=>limb(`M${startX} 112L${far?83:126} ${far?133:130} ${p.x} ${p.y}`,far?c.shade:c.coat,8)+path(`M${p.x-6} ${p.y-4}h13l7 5h-20z`,c.leather);
 const jacket=path('M80 77q16-8 30 3l10 35-23 11-28-13z',c.coat)+path('M73 111l27 11 20-8 2 12-24 8-29-15z',c.shade)+line('M75 105l40 14',c.leather,5)+circle(96,121,3,c.brass);
 const backArm=limb('M79 84L91 99 130 101',c.shade,7),frontArm=limb('M108 83L126 91 145 99',c.coat,7);
 return wheel(53)+wheel(165)+frameParts+leg(88,rear,true)+saddle+jacket+head('raider',c,-1)+backArm+frontArm+leg(106,front,false)+circle(130,101,4,c.skin)+circle(145,99,4,c.skin)+circle(118,153,6,c.brass)+line(`M118 153L${rear.x} ${rear.y}M118 153L${front.x} ${front.y}`,c.darkMetal,4);
}

function mortar(c, frame) {
 const attack=frame>=10,k=attack?frame-10:0,recoil=attack?[0,-4,-10,-6,-2,1][k]:0;
 const wheel=x=>circle(x,153,19,c.wood)+circle(x,153,13,c.brass)+line(`M${x-12} 153h24M${x} 141v24`,c.darkMetal,3)+circle(x,153,4,c.lightMetal);
 const frameParts=path('M47 127h135l12 20-13 9H42z',c.darkMetal)+path('M59 130h117l5 15H53z',c.metal)+line('M49 131L84 91 150 134M180 135l-39-44',c.brass,5)+wheel(69)+wheel(158);
 const gun=group(`translate(${recoil} 0)`,path('M82 108l-8-13 49-55 16 6 8 14-49 58z',c.darkMetal)+path('M82 99l43-52 12 9-43 53z',c.metal)+ellipse(131,48,12,8,c.lightMetal)+ellipse(131,48,7,5,c.darkMetal)+circle(89,112,7,c.brass));
 const boiler=ellipse(141,120,23,17,c.wood)+ellipse(141,120,17,12,c.brass)+circle(141,120,7,c.darkMetal)+line('M141 103V75M141 75h9',c.metal,5)+circle(143,92,3,c.lightMetal);
 const steam=attack&&k>=2&&k<=4?ellipse(139+(k-2)*9,32-(k-2)*7,10+(k-2)*3,6+(k-2)*2,c.smoke,'none'):'';
 const flash=attack&&k===2?path('M125 37l-9-27 17 14 12-13-3 23z','#efb568','none'):'';
 const crew = () => legs(c,frame)+torso('siege',c,0)+head('siege',c)+limb('M78 88L92 107 109 124',c.shade,8)+limb('M111 88L127 108 143 124',c.coat,8)+circle(109,124,5,c.skin)+circle(143,124,5,c.skin);
 return group('translate(-55 0) scale(.97)',crew())+group('translate(286 0) scale(-.97 .97)',crew())+frameParts+boiler+gun+steam+flash;
}

export function industrialRig(role, enemy, frame) {
 if (!industrialRoles.includes(role) || !Number.isInteger(frame) || frame < 0 || frame >= 16) throw Error(`Invalid industrial frame ${role}/${frame}`);
 const c=colors(enemy);
 return role==='raider' ? bicycle(c,frame) : role==='siege' ? mortar(c,frame) : person(role,c,frame);
}
