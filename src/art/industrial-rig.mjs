/** Standalone, unapproved eighth-era art. Nothing in this module registers game content. */
export const industrialRoles = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export const industrialNames = ['Бронежилетчик', 'Штыковик', 'Винтовочник', 'Санитар поезда', 'Велосипедный разведчик', 'Подрывник', 'Механик', 'Паровая мортира'];
export const industrialFrames = Object.fromEntries(industrialRoles.map(role => [role, 16]));
const ink = '#272b30';
const path = (d, fill, stroke = ink, width = 2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, color, width = 3) => path(d, 'none', color, width);
const circle = (x, y, r, fill, stroke = ink, width = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const ellipse = (x, y, rx, ry, fill, stroke = ink, width = 2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const group = (transform, body) => `<g transform="${transform}">${body}</g>`;
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

function legs(c, frame, scale = 1) {
 const moving = frame >= 2 && frame < 10, phase = (frame - 2) * Math.PI / 4;
 let result = '';
 for (const far of [true, false]) {
  const sign = far ? -1 : 1, stride = moving ? Math.sin(phase) * 12 * sign : 0;
  const kneeX = (far ? 84 : 108) + stride * .35 + (moving ? Math.cos(phase) * sign * 3 : 0);
  const toeX = (far ? 82 : 111) + stride, lift = moving ? Math.max(0, Math.sin(phase) * sign) * 9 : 0;
  const pant = far ? c.shade : c.coat;
  result += line(`M${far ? 84 : 108} 123L${kneeX} 146 ${toeX} ${169-lift}`, pant, 13) + circle(kneeX, 146, 5, pant);
  result += path(`M${toeX-7} ${169-lift}h12l8 5v3h-24z`, c.leather);
 }
 return group(`scale(${scale})`, result);
}

function torso(role, c, bob) {
 const medic = role === 'medic', steel = role === 'shield';
 let body = path('M76 80q19-11 39 1l8 49-23 15-30-16z', medic ? c.white : c.coat) + path('M71 127l29 11 22-11 3 19-30 6-24-11z', medic ? c.white : c.shade);
 body += path('M81 82l14 10 14-9 6 8-19 14-21-15z', medic ? c.canvas : c.shade) + line('M77 123h43', c.leather, 5) + circle(98, 123, 4, c.brass);
 if (steel) body += path('M80 83l15-6 17 7 5 34-19 14-21-13z', c.metal) + path('M85 87l11-4 12 4 4 24-15 11-14-8z', c.darkMetal) + line('M96 84v33', c.lightMetal, 2) + [91,106].map(x => circle(x, 96, 2, c.brass)).join('');
 if (medic) body += path('M76 95l18 15 22-13 8 45-29 19-26-17z', c.white) + path('M89 113h7v6h6v7h-6v6h-7v-6h-6v-7h6z', '#bc534a', 'none') + path('M62 117h22v26H62z', c.leather) + line('M67 124h12', c.brass, 2);
 if (role === 'archer' || role === 'spear') body += line('M79 82l35 38', c.leather, 6) + path('M70 109h15v27H70z', c.canvas);
 if (role === 'thrower') body += path('M65 105h25v33H65z', c.leather) + line('M68 113h18M68 120h18', c.brass, 2);
 if (role === 'banner') body += path('M62 89h14v47H62z', c.brass) + path('M64 91h10v36H64z', c.darkMetal) + line('M72 94q10-8 15 0', c.rubber, 4) + circle(69, 94, 5, c.lightMetal) + line('M82 87l32 37', c.leather, 7);
 return group(`translate(0 ${bob})`, body);
}

function person(role, c, frame) {
 const moving = frame >= 2 && frame < 10, attack = frame >= 10, k = attack ? frame - 10 : 0;
 const bob = moving ? Math.abs(Math.sin((frame-2)*Math.PI/4))*-2 : attack ? [0,-2,-3,-1,1,0][k] : 0;
 let art = legs(c, frame) + torso(role, c, bob) + head(role, c, bob);
 const hands = (leftX, leftY, rightX, rightY) => line(`M78 ${88+bob}L70 ${104+bob} ${leftX} ${leftY}`, c.shade, 9) + line(`M111 ${88+bob}L125 ${105+bob} ${rightX} ${rightY}`, c.coat, 9) + circle(leftX,leftY,5,c.skin) + circle(rightX,rightY,5,c.skin);
 if (role === 'shield') {
  const reach = attack ? [0,6,15,17,10,3][k] : 0, y = attack ? [0,-3,-12,-14,-7,0][k] : 0;
  art += hands(67,111,145+reach,103+y) + path(`M${128+reach} ${72+y}h34l6 15v57l-8 11h-33z`, c.metal) + path(`M${133+reach} ${77+y}h27v65h-27z`, c.darkMetal) + path(`M${137+reach} ${89+y}h18v18h-18z`, c.lightMetal) + line(`M${144+reach} ${113+y}v21`, c.brass, 3);
 } else if (role === 'spear' || role === 'archer') {
  const thrust = attack ? [0,4,15,21,9,1][k] : 0, lift = role === 'archer' && attack ? [0,-4,-8,-5,0,1][k] : 0;
  art += hands(105+thrust,105+lift,139+thrust,104+lift);
  let weapon = path(`M83 ${101+lift}h92l10 6-10 5H83z`, c.wood) + line(`M107 ${98+lift}h76`, c.darkMetal, 6) + line(`M110 ${97+lift}h74`, c.lightMetal, 2);
  weapon += path(`M94 ${107+lift}l-6 19 19-5 8-14z`, c.leather) + circle(119,103+lift,3,c.brass);
  if (role === 'spear') weapon += path(`M184 ${94+lift}l24 10-24 10-2-10z`, c.lightMetal) + line(`M184 ${104+lift}h17`, c.metal, 2);
  else weapon += path(`M182 ${100+lift}h7v10h-7z`, c.darkMetal) + (attack && k===2 ? path('M189 95l14 9-14 10-2-10z','#f3c379','none') : '');
  art += group(`translate(${thrust} 0)`, weapon);
 } else if (role === 'medic') {
  const extend = attack ? [0,5,13,13,7,1][k] : 0;
  art += hands(71,113,142+extend,109) + path(`M${137+extend} 104h15v12h-15z`, c.white) + line(`M${141+extend} 108h7M${144+extend} 105v7`,'#bf6154',2);
 } else if (role === 'thrower') {
  const hx = attack ? [131,139,148,156,118,130][k] : 131, hy = attack ? [91,78,61,46,96,91][k] : 91;
  art += hands(65,121,hx,hy) + (attack && k>=3&&k<=4 ? group(`translate(${hx+23+(k-3)*16} ${hy-16-(k-3)*13})`, path('M-8-13h16v26H-8z',c.leather)+line('M0-15v-9',c.brass,2)) : path(`M${hx-8} ${hy-13}h16v26h-16z`,c.leather)+line(`M${hx} ${hy-14}v-9`,c.brass,2)) + (attack&&k===4?circle(hx+31,hy-50,9,'#efa456','none'): '');
 } else if (role === 'banner') {
  const turn = attack ? [-27,-15,5,20,7,-25][k] : -25;
  art += hands(61,112,143,99) + group(`translate(143 99) rotate(${turn})`, path('M-4-45h8v57h-8z',c.metal)+path('M-14-52l8-9 6 10 6-10 8 9-6 9H-8z',c.lightMetal)) + (attack ? line(`M64 ${91-k}q-7-9 1-18`,c.smoke,2) : '');
 } else if (role === 'siege') {
  const hx = attack ? [142,141,140,136,139,142][k] : 142;
  art += hands(72,113,hx,113) + path('M49 127h25v17H49z',c.canvas) + line('M54 130h14',c.brass,2);
 } else if (role === 'raider') {
  art += hands(73,116,146,108);
 }
 return art;
}

function bicycle(c, frame) {
 const moving=frame>=2&&frame<10, spin=moving?(frame-2)*42:frame>=10?(frame-10)*14:0;
 const wheel=x=>circle(x,153,24,c.rubber)+circle(x,153,19,c.lightMetal)+group(`rotate(${spin} ${x} 153)`,line(`M${x-18} 153h36M${x} 135v36M${x-13} 140l26 26M${x-13} 166l26-26`,c.darkMetal,2))+circle(x,153,4,c.brass);
 let machine=wheel(53)+wheel(165)+line('M53 153L95 118 118 153 53 153M95 118l32-20 38 55M118 153l9-55',c.darkMetal,6)+line('M53 153L95 118 118 153M95 118l32-20 38 55',c.brass,2);
 machine+=line('M83 113h23M121 99l19-7 14 12',c.rubber,5)+circle(118,153,7,c.brass)+line('M118 153l-13 15M118 153l12-14',c.metal,4);
 const rider=group('translate(8 7) scale(.86) rotate(-8 96 121)',person('raider',c,frame));
 return machine+rider;
}

function mortar(c, frame) {
 const attack=frame>=10,k=attack?frame-10:0,recoil=attack?[0,-4,-10,-6,-2,1][k]:0;
 const wheel=x=>circle(x,153,19,c.wood)+circle(x,153,13,c.brass)+line(`M${x-12} 153h24M${x} 141v24`,c.darkMetal,3)+circle(x,153,4,c.lightMetal);
 const frameParts=path('M47 127h135l12 20-13 9H42z',c.darkMetal)+path('M59 130h117l5 15H53z',c.metal)+line('M49 131L84 91 150 134M180 135l-39-44',c.brass,5)+wheel(69)+wheel(158);
 const gun=group(`translate(${recoil} 0)`,path('M82 108l-8-13 49-55 16 6 8 14-49 58z',c.darkMetal)+path('M82 99l43-52 12 9-43 53z',c.metal)+ellipse(131,48,12,8,c.lightMetal)+ellipse(131,48,7,5,c.darkMetal)+circle(89,112,7,c.brass));
 const boiler=ellipse(141,120,23,17,c.wood)+ellipse(141,120,17,12,c.brass)+circle(141,120,7,c.darkMetal)+line('M141 103V75M141 75h9',c.metal,5)+circle(143,92,3,c.lightMetal);
 const steam=attack&&k>=2&&k<=4?ellipse(139+(k-2)*9,32-(k-2)*7,10+(k-2)*3,6+(k-2)*2,c.smoke,'none'):'';
 const flash=attack&&k===2?path('M125 37l-9-27 17 14 12-13-3 23z','#efb568','none'):'';
 return group('translate(-55 0) scale(.97)',person('siege',c,frame))+group('translate(97 0) scale(.97)',person('siege',c,frame))+frameParts+boiler+gun+steam+flash;
}

export function industrialRig(role, enemy, frame) {
 if (!industrialRoles.includes(role) || !Number.isInteger(frame) || frame < 0 || frame >= 16) throw Error(`Invalid industrial frame ${role}/${frame}`);
 const c=colors(enemy);
 return role==='raider' ? bicycle(c,frame) : role==='siege' ? mortar(c,frame) : person(role,c,frame);
}
