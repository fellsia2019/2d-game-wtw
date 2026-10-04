/** Standalone, unapproved eighth-era art. Nothing in this module registers game content. */
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';
export const industrialRoles = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export const industrialNames = ['Бронежилетчик', 'Штыковик', 'Винтовочник', 'Санитар поезда', 'Штурмовой карабинер', 'Подрывник', 'Механик', 'Полевая гаубица'];
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
 if (role === 'medic') hair = path('M74 42q6-22 23-22 19 0 24 23z', c.white) + path('M69 43h58l-6 8H75z', c.white) + path('M98 24l7 9-7 9-7-9z', '#398b87', 'none');
 if (role === 'raider') hair = path('M76 38q2-20 21-21 18 1 22 22l-16-6-21 7z', c.leather) + line('M79 39l40 4', c.brass, 3);
 if (role === 'thrower') hair = path('M76 42q-4-23 21-27 25 2 24 28l-17-7-19 11z', c.darkMetal) + path('M75 42h47l-4 6H77z', c.brass);
 if (role === 'banner') hair = path('M74 40q2-23 22-23 21 1 25 25z', c.leather) + path('M68 40h62l-5 8H72z', c.coat) + ellipse(96, 38, 13, 5, c.lightMetal) + ellipse(96, 38, 8, 3, c.darkMetal);
 if (role === 'siege') hair = path('M74 41q5-21 24-22 20 1 24 23z', c.coat) + path('M69 42h61l-8 7H74z', c.shade);
 const face = path('M82 47q10-8 22-4 9 3 10 13l5 4-6 4-2 8q-12 9-25 1-8-7-4-26z', c.skin)
  + ellipse(83, 59, 4, 6, c.skin) + line('M83 57q4 1 3 5', c.skinShade, 1.5)
  + line('M101 51q5-2 9 0', c.leather, 1.6) + circle(107, 55, 1.6, ink, 'none')
  + line('M111 68q-3 2-7 1', c.skinShade, 1.8);
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
 if (medic) body += path('M76 95l18 15 22-13 8 45-29 19-26-17z', c.white) + path('M93 113l8 10-8 10-8-10z', '#398b87', 'none') + path('M62 117h22v26H62z', c.leather) + line('M67 124h12', c.brass, 2);
 if (role === 'archer' || role === 'spear') body += line('M79 82l35 38', c.leather, 6) + path('M70 109h15v27H70z', c.canvas);
 if (role === 'thrower') body += path('M65 105h25v33H65z', c.leather) + line('M68 113h18M68 120h18', c.brass, 2);
 if (role === 'raider') body += line('M77 86l39 39', c.leather, 7) + line('M79 86l37 39', c.brass, 2) + path('M75 118h17v18H75zM104 121h16v16h-16z', c.leather) + line('M78 123h11M107 126h10', c.brass, 2);
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
  const thrust = attack ? role === 'spear' ? [0,4,15,21,9,1][k] : [0,0,-10,-7,-3,0][k] : 0;
  const lift = role === 'spear' ? -11 : attack ? [0,-4,-8,-5,0,1][k] : 0;
  art += limb(`M78 ${88+bob}L91 ${106+bob} ${105+thrust} ${105+lift}`, c.shade, 8) + limb(`M111 ${88+bob}L126 ${105+bob} ${139+thrust} ${104+lift}`, c.coat, 8);
  let weapon = path(`M83 ${101+lift}h92l10 6-10 5H83z`, c.wood) + line(`M107 ${98+lift}h76`, c.darkMetal, 6) + line(`M110 ${97+lift}h74`, c.lightMetal, 2);
  weapon += path(`M94 ${107+lift}l-6 19 19-5 8-14z`, c.leather) + circle(119,103+lift,3,c.brass);
  if (role === 'spear') weapon += path(`M184 ${94+lift}l24 10-24 10-2-10z`, c.lightMetal) + line(`M184 ${104+lift}h17`, c.metal, 2);
  else weapon += path(`M182 ${100+lift}h7v10h-7z`, c.darkMetal) + (attack && k===2 ? path('M189 95l14 9-14 10-2-10z','#f3c379','none') : '');
  art += group(`translate(${thrust} 0)`, weapon);
  art += circle(105+thrust,105+lift,5,c.skin) + circle(139+thrust,104+lift,5,c.skin);
 } else if (role === 'medic') {
  const extend = attack ? [0,5,13,13,7,1][k] : 0;
  art += hands(71,113,142+extend,109) + path(`M${137+extend} 103h16v13h-16z`, c.white) + path(`M${145+extend} 105l4 4-4 4-4-4z`, '#398b87', 'none');
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
  const reach = attack ? [0,0,-3,-10,-5,0][k] : 0;
  const lift = attack ? [0,-4,-7,-5,-2,0][k] : moving ? -2 : 0;
  art += limb(`M78 ${88+bob}L75 ${106+bob} ${112+reach} ${113+lift}`,c.shade,8)
   + limb(`M111 ${88+bob}L125 ${104+bob} ${139+reach} ${106+lift}`,c.coat,8);
  art += group(`translate(${reach} ${lift})`,
   path('M83 105l-7 12 24 1 11-12z',c.wood)
   + path('M103 102h58v8h-58z',c.darkMetal)
   + line('M107 102h54',c.lightMetal,2)
   + path('M117 110l-5 17 12-2 7-15z',c.leather)
   + path('M155 99h9v13h-9z',c.metal)
   + circle(118,108,2,c.brass));
  art += circle(112+reach,113+lift,5,c.skin)+circle(139+reach,106+lift,5,c.skin);
  if (attack && k===3) art += path(`M${164+reach} ${100+lift}l18-9-8 14 11 7-21-3z`,'#f0bb70','none');
 }
 return art;
}

function howitzer(c, frame) {
 const moving=frame>=2&&frame<10, attack=frame>=10, k=attack?frame-10:0;
 const roll=moving?(frame-2)*23:0, recoil=attack?[0,-3,-12,-8,-3,0][k]:0;
 const wheel=ellipse(117,146,30,30,c.rubber)+ellipse(117,146,25,25,c.wood)
  + group(`rotate(${roll} 117 146)`,line('M92 146h50M117 121v50M99 128l36 36M99 164l36-36',c.brass,3))
  + ellipse(117,146,9,9,c.metal)+circle(117,146,4,c.brass);
 const trail=path('M117 139L25 166l-4-9 84-37 27 11z',c.darkMetal)
  + line('M28 160l77-31',c.lightMetal,4)+path('M23 159l-9 3v9h24v-6z',c.wood);
 const carriage=path('M91 111l28-8 27 29-17 12-35-15z',c.metal)
  + line('M103 119l31 15',c.darkMetal,5)+circle(111,113,7,c.brass);
 const barrel=group(`translate(${recoil} ${-recoil*.35})`,
  path('M73 107l16-18 83-36 12 15-82 50-25 1z',c.darkMetal)
  + path('M82 101l10-8 79-34 7 9-78 43-17 2z',c.metal)
  + line('M104 101l70-36',c.lightMetal,3)
  + ellipse(181,60,10,8,c.lightMetal)+ellipse(182,60,5,4,c.darkMetal)
  + path('M71 103h11l7 12-10 6-12-6z',c.brass));
 const shield=path('M101 79l16-4 13 56-32 9-10-10z',c.darkMetal)
  + path('M105 85l9-3 10 44-20 6-9-6z',c.metal)
  + line('M99 117l25-6',c.lightMetal,2)+circle(111,105,3,c.brass);
 const crew=(front)=>{
  const shell=attack&&k<3&&front;
  let body=legs(c,frame)+torso('siege',c,moving?walkBodyOffset(frame-2):0)+head('siege',c);
  body+=limb('M78 88L76 108 104 119',c.shade,8)+limb('M111 88L126 103 140 115',c.coat,8)
   +circle(104,119,5,c.skin)+circle(140,115,5,c.skin);
  if(shell)body+=group(`translate(${122+(k*4)} ${101-k*5}) rotate(24)`,path('M-5-13h10v26H-5z',c.brass)+path('M-5-13l5-9 5 9z',c.lightMetal));
  return group(`translate(${front?-40:-99} 0) scale(.92)`,body);
 };
 const flash=attack&&k===2?path('M179 51l16-22-3 18 20-8-11 20 12 7-23 1z','#f0bd73','none'):'';
 const smoke=attack&&k>=3&&k<=4?ellipse(197+(k-3)*9,35-(k-3)*7,10+(k-3)*4,6+(k-3)*2,c.smoke,'none'):'';
 return trail+carriage+barrel+wheel+shield+crew(false)+crew(true)+flash+smoke;
}

export function industrialRig(role, enemy, frame) {
 if (!industrialRoles.includes(role) || !Number.isInteger(frame) || frame < 0 || frame >= 16) throw Error(`Invalid industrial frame ${role}/${frame}`);
 const c=colors(enemy);
 return role==='siege' ? howitzer(c,frame) : person(role,c,frame);
}
