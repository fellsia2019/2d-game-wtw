/** Ninth-era visual draft. Kept outside the game catalog until approval. */
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';

export const worldWarsRoles = ['shield', 'spear', 'archer', 'medic', 'raider', 'thrower', 'banner', 'siege'];
export const worldWarsNames = ['Окопный щитовик', 'Штурмовик', 'Снайпер', 'Фронтовой медик', 'Разведывательный джип', 'Гранатомётчик', 'Радист', 'Бронемашина'];
export const worldWarsDescriptions = ['Защитник', 'Против брони', 'Дальний бой', 'Лечение', 'Быстрый прорыв', 'Урон по группе', 'Усиление союзников', 'Осада'];
const ink = '#253039';
const path = (d, fill, stroke = ink, width = 2) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, color, width = 3) => path(d, 'none', color, width);
const circle = (x, y, r, fill, stroke = ink, width = 2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const ellipse = (x, y, rx, ry, fill, stroke = ink, width = 2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const group = (transform, body) => `<g transform="${transform}">${body}</g>`;
const limb = (d, color, width = 8) => line(d, ink, width + 3) + line(d, color, width);
const palette = enemy => ({
 coat: enemy ? '#89564d' : '#67795e', shade: enemy ? '#633c39' : '#465947', light: enemy ? '#b67e69' : '#9cae81',
 helmet: enemy ? '#684a43' : '#516047', helmetLight: enemy ? '#9b7060' : '#798b65',
 canvas: '#c5b898', leather: '#654d40', rubber: '#303b3b', metal: '#7d9090', steel: '#acb9b4', darkSteel: '#46575a',
 wood: '#866448', brass: '#c7a365', skin: '#dcac88', skinShade: '#b57962', white: '#e7e4d7', red: '#bb5b52', smoke: '#b7b8aa'
});

function head(c, role, bob = 0) {
 const face = path('M83 43q10-6 22-2 11 5 9 17l4 4-6 3-2 7q-12 9-24 0-9-8-3-29z', c.skin)
  + ellipse(84, 58, 4, 6, c.skin) + line('M101 49q5-2 9 0', c.leather, 1.6) + circle(107, 53, 1.8, ink, 'none')
  + line('M109 67q-5 3-8 1', c.skinShade, 1.7);
 let helmet = path('M70 45q1-28 27-30 25 1 28 28l-12 2q-17-10-30 1z', c.helmet)
  + path('M69 44q29-8 59-1l-5 7q-25-6-51 2z', c.helmetLight)
  + line('M76 48l-1 10 7 8', c.leather, 2);
 if (role === 'medic') helmet += circle(96, 29, 10, c.white, 'none') + path('M96 21l7 8-7 8-7-8z', c.brass, 'none');
 if (role === 'archer') helmet += line('M81 29h34', c.canvas, 3) + path('M81 36l20-11 12 1', 'none', c.leather, 2);
 if (role === 'spear') helmet += path('M78 20l29-5 11 7-30 5z', c.canvas);
 if (role === 'banner') helmet += line('M79 33h36', c.brass, 2);
 return group(`translate(0 ${bob})`, path('M89 72h17v13H89z', c.skinShade) + face + helmet);
}

function legs(c, frame, shift = 0) {
 const moving = frame >= 2 && frame < 10;
 let art = '';
 for (const far of [true, false]) {
  const p = moving ? walkLeg(frame - 2, far, false) : { hip: { x: far ? 87 : 105, y: 125 }, knee: { x: far ? 82 : 108, y: 148 }, ankle: { x: far ? 80 : 111, y: 169 }, foot: { x: far ? 80 : 111, y: 176, pitch: 0 }, pivot: 0 };
  const { hip, knee, ankle, foot, pivot } = p;
  art += limb(`M${hip.x + shift} ${hip.y}L${knee.x + shift} ${knee.y}`, far ? c.shade : c.coat, 11)
   + limb(`M${knee.x + shift} ${knee.y}L${ankle.x + shift} ${ankle.y}`, c.leather, 9)
   + circle(knee.x + shift, knee.y, 5, far ? c.shade : c.coat)
   + group(`translate(${foot.x + shift} ${foot.y}) rotate(${foot.pitch} ${pivot} 0)`, path('M-7-10h11l2 7 10 2v3H-7z', c.leather));
 }
 return art;
}

function body(c, role, bob) {
 const coat = role === 'medic' ? c.canvas : c.coat;
 let art = path('M76 81q20-11 41 1l7 54q-28 13-55 0z', coat)
  + path('M75 83l20 20 19-20', 'none', c.shade, 4)
  + line('M72 125h49', c.leather, 6) + circle(96, 126, 4, c.brass)
  + path('M78 135q18 8 38 0l5 12q-23 11-49-1z', c.shade)
  + path('M62 105h15v30H62z', c.canvas) + line('M65 112h9M65 123h9', c.leather, 2);
 if (role === 'shield') art += path('M82 87l27 1 8 31-17 10-20-11z', c.darkSteel) + path('M85 90h20l4 21-12 8-13-9z', c.steel);
 if (role === 'medic') art += path('M90 111l12 12-12 12-12-12z', c.brass, 'none') + path('M113 102l15 5-5 35-15-3z', c.white) + line('M110 119l13 10M111 126l11 9', c.brass, 2);
 if (role === 'archer') art += line('M78 82l36 38', c.leather, 6) + path('M74 121h17v19H74z', c.canvas);
 if (role === 'spear') art += path('M76 88l40 37', 'none', c.leather, 7) + [82,91,100].map(x => path(`M${x} ${x-2}h8v12h-8z`, c.canvas)).join('');
 if (role === 'thrower') art += path('M110 104h23v31h-23z', c.canvas) + line('M114 112h15M114 122h15', c.leather, 2);
 if (role === 'banner') art += path('M61 84h24v43H61z', c.leather) + path('M65 89h16v33H65z', c.darkSteel) + line('M73 88v-48', c.brass, 3) + circle(73, 39, 3, c.brass);
 return group(`translate(0 ${bob})`, art);
}

function arms(c, bob, left, right) {
 const [lx, ly] = left, [rx, ry] = right;
 return limb(`M78 ${89+bob}L68 ${105+bob} ${lx} ${ly}`, c.shade, 8)
  + limb(`M112 ${89+bob}L125 ${104+bob} ${rx} ${ry}`, c.coat, 8)
  + circle(lx, ly, 5, c.skin) + circle(rx, ry, 5, c.skin);
}

function rifle(c, x, y, variant = 'sniper') {
 const long = variant === 'sniper', length = long ? 114 : 77;
 let art = path(`M${x} ${y}l-11 11 28 1 8-10z`, c.wood)
  + path(`M${x+17} ${y-3}h${length}v9H${x+17}z`, c.darkSteel)
  + line(`M${x+20} ${y-2}h${length-4}`, c.steel, 2)
  + path(`M${x+37} ${y+6}l-5 18 12-1 7-17z`, c.leather)
  + circle(x+37, y+3, 2, c.brass);
 if (long) art += line(`M${x+48} ${y-10}h31`, c.darkSteel, 6) + circle(x+76, y-7, 3, c.steel) + line(`M${x+70} ${y-12}v-6`, c.darkSteel, 2);
 else art += path(`M${x+43} ${y+5}h17v17H${x+43}z`, c.darkSteel);
 return art;
}

function infantry(role, c, frame) {
 const moving = frame >= 2 && frame < 10, attacking = frame >= 10, k = attacking ? frame - 10 : 0;
 const bob = moving ? walkBodyOffset(frame - 2) : attacking ? [0,-2,-3,-2,0,0][k] : 0;
 let art = legs(c, frame) + body(c, role, bob) + head(c, role, bob);
 if (role === 'shield') {
  const push = attacking ? [0,3,11,16,8,0][k] : 0;
  art += arms(c,bob,[67,111],[131+push,109])
   + path(`M${127+push} 75l31-4 8 72-32 13-9-13z`, c.darkSteel)
   + path(`M${132+push} 81l23-3 5 60-24 8-7-11z`, c.steel)
   + path(`M${143+push} 83h9v12h-9z`, c.rubber)
   + line(`M${139+push} 151l-4 19M${157+push} 145l7 21`, c.leather, 4);
 } else if (role === 'spear') {
  const lean = attacking ? [0,1,4,5,2,0][k] : 0;
  const lift = attacking ? [0,-6,-15,-12,-5,0][k] : 0;
  art += arms(c,bob,[107+lean,106+lift],[136+lean,100+lift]);
  art += group(`translate(${lean} ${lift})`, path('M83 101l-9 9 25 7 12-9z', c.wood)
   + path('M100 99h74v12h-74z', c.darkSteel) + line('M105 100h65', c.steel, 2)
   + path('M114 110l-5 20 16-1 8-18z', c.leather)
   + path('M173 96h17v18h-17z', c.steel) + line('M190 105h14', c.darkSteel, 3));
  if (attacking && k === 3) art += path('M205 91l20 14-20 13-4-13z', '#edc274', 'none');
 } else if (role === 'archer') {
  const recoil = attacking ? [0,0,-10,-15,-6,0][k] : 0;
  const lift = attacking ? [0,-4,-9,-5,-2,0][k] : 0;
  art += arms(c,bob,[110+recoil,108+lift],[139+recoil,104+lift])
   + group(`translate(${recoil} ${lift})`, rifle(c,79,101));
  if (attacking && k === 2) art += path(`M${203+recoil} ${95+lift}l17-10-4 15 15 5-23 4z`, '#efc278', 'none');
 } else if (role === 'medic') {
  const reach = attacking ? [0,3,11,15,7,0][k] : 0;
  art += arms(c,bob,[66,115],[138+reach,105])
   + path(`M${133+reach} 99h15v14h-15z`, c.white)
   + line(`M${136+reach} 104h9M${136+reach} 109h9`, c.brass, 2);
  if (attacking && k >= 2 && k <= 4) art += circle(147+reach,106,8+(k-2)*4,'none',c.white,2);
 } else if (role === 'thrower') {
  const lift = attacking ? [0,-4,-15,-19,-11,0][k] : 0;
  art += arms(c,bob,[107,112+lift],[139,106+lift]);
  art += group(`translate(0 ${lift})`, path('M90 104l-9 9 26 4 12-9z', c.wood)
   + path('M110 96h68l16 9-16 10h-68z', c.darkSteel)
   + line('M113 100h66', c.steel, 3) + path('M122 113l-6 18 15-2 5-16z', c.leather)
   + path('M165 95h12v20h-12z', c.brass));
  if (attacking && k===3) art += path('M194 81l19-15-3 17 16-4-13 16 12 7-24-4z', '#ebbe74', 'none');
 } else if (role === 'banner') {
  const raise = attacking ? [0,-4,-9,-7,-3,0][k] : 0;
  art += arms(c,bob,[69,105+raise],[144,108+raise]);
  art += group(`translate(0 ${raise})`, path('M138 96h18v23h-18z', c.darkSteel)
   + path('M142 101h10v12h-10z', c.steel) + circle(147,108,2,c.brass)
   + line('M155 98q17-22 7-53', c.rubber, 2));
  if (attacking && k>=2 && k<=4) art += line(`M178 ${59+k*2}q12-5 17 2M180 ${70+k*2}q14-4 17 3`, c.brass, 2);
 }
 return art;
}

function scoutJeep(c, frame) {
 const moving = frame >= 2 && frame < 10, attacking = frame >= 10, k = attacking ? frame - 10 : 0;
 const roll = moving ? (frame - 2) * 29 : 0;
 const bounce = moving ? [0,-1,-2,-1,0,1,1,0][frame-2] : 0;
 const recoil = attacking ? [0,-2,-7,-5,-2,0][k] : 0;
 const wheel = x => circle(x,152,25,c.rubber)
  + circle(x,152,17,c.steel)
  + circle(x,152,13,c.darkSteel)
  + group(`rotate(${roll} ${x} 152)`,line(`M${x-11} 152h22M${x} 141v22M${x-8} 144l16 16M${x-8} 160l16-16`,c.metal,2))
  + circle(x,152,4,c.brass);
 // The driver, steering wheel, windshield, gun mount and wheels have separate clear anchors.
 let art = group(`translate(0 ${bounce})`,
  path('M25 137h203l-8 11H32z',c.darkSteel)
  + path('M20 119l25-8h38l16-12h58l22 13h49l11 13-5 19H20z',c.coat)
  + path('M31 120l17-6h42l7-7h57l16 11h55l7 9H30z',c.light)
  + path('M28 127h206v17H25z',c.shade)
  + path('M27 115h46v13H27z',c.canvas)
  + line('M31 122h38',c.leather,2)
  + path('M88 108h46v15H88z',c.darkSteel)
  + path('M91 111h39v11H91z',c.leather)
  + line('M149 113l13-18',c.darkSteel,4)
  + ellipse(161,94,12,7,c.rubber)
  + path('M163 111l-5-25h9l8 26z',c.darkSteel)
  + path('M162 89h8l5 18h-10z',c.steel)
  + path('M179 110h45l11 11h-55z',c.coat)
  + line('M184 116h41',c.steel,2)
  + path('M199 105h10v13h-10z',c.darkSteel)
  + circle(205,105,3,c.brass)
  + path('M98 91q12-5 25 1l17 24-38 5z',c.coat)
  + path('M101 93l25 23', 'none', c.canvas,3)
  + group('translate(39 40) scale(.68)',head(c,'raider'))
  + limb('M124 96L139 103 153 99',c.coat,7)
  + circle(153,99,4,c.skin)
  + path('M99 118h55v25H99z',c.coat)
  + path('M102 121h47v18h-47z',c.shade)
  + line('M153 118v25',c.darkSteel,2)
  + circle(141,129,3,c.brass)
  + path('M179 120h44v6h-44z',c.steel)
  + circle(228,121,5,c.canvas)
  + path('M232 136h17v7h-17z',c.metal)
  + path('M19 135h13v7H19z',c.metal)
  + line('M205 118V91',c.darkSteel,6)
  + line('M205 100v16',c.steel,2)
  + group(`translate(${recoil} 0)`,path('M187 84h33v11h-33z',c.darkSteel)
   + line('M190 86h28',c.steel,2)
   + path('M217 86h44v6h-44z',c.darkSteel)
   + path('M258 84h8v10h-8z',c.metal)));
 art += wheel(55) + wheel(205);
 art += path('M37 126q18-14 36 0M187 126q18-14 36 0','none',c.darkSteel,4);
 if (attacking && k===2) art += path('M268 76l17-15-2 16 13-5-12 17 12 6-23-3z','#efc278','none');
 if (attacking && k>=3 && k<=4) art += ellipse(278+(k-3)*8,70-(k-3)*6,8+(k-3)*3,5+(k-3)*2,c.smoke,'none');
 if (moving && frame%2===1) art += ellipse(18,169,8,4,c.smoke,'none');
 return art;
}

function armoredCar(c, frame) {
 const moving = frame >= 2 && frame < 10, attacking = frame >= 10, k = attacking ? frame - 10 : 0;
 const roll = moving ? (frame - 2) * 28 : 0;
 const recoil = attacking ? [0,-2,-9,-6,-2,0][k] : 0;
 const bounce = moving ? [0,-1,-2,-1,0,1,1,0][frame-2] : 0;
 const wheel = x => ellipse(x,151,23,25,c.rubber)
  + ellipse(x,151,16,18,c.steel)
  + ellipse(x,151,12,14,c.darkSteel)
  + group(`rotate(${roll} ${x} 151)`,line(`M${x-10} 151h20M${x} 138v26M${x-7} 141l14 20M${x-7} 161l14-20`,c.metal,2))
  + circle(x,151,4,c.brass);
 let art = group(`translate(0 ${bounce})`,
  // The angled nose and riveted crew compartment are a wheeled car, not a tracked tank.
  path('M15 129l12-36 45-13h113l35 24 10 28-15 20H32z',c.darkSteel)
  + path('M26 120l10-24 42-12h101l30 23 9 17-13 16H39z',c.coat)
  + path('M37 99l39-12h99l26 19-27 2-16-11H78l-27 15z',c.light)
  + path('M27 127h187l-9 14H35z',c.shade)
  + path('M51 107h27l-4 14H44zM174 107h27l7 14h-29z',c.darkSteel)
  + path('M53 110h20l-3 7H49zM179 110h17l4 7h-18z',c.steel)
  + path('M90 103h45v27H90z',c.shade)
  + line('M91 103v27M135 103v27',c.darkSteel,2)
  + circle(128,118,3,c.brass)
  + [42,78,151,183,210].map(x=>circle(x,132,2,c.brass,'none')).join('')
  + path('M32 140h182v8H32z',c.steel)
  + path('M35 149h176', 'none', c.darkSteel,5)
  + path('M84 86l14-23h49l20 23z',c.helmet)
  + path('M95 68q25-12 50 0l10 15H86z',c.helmetLight)
  + path('M102 83h43', 'none', c.darkSteel,4)
  // The gunner's neck disappears into the open hatch, with the face above the armor.
  + group('translate(65 20) scale(.52)',head(c,'siege'))
  + path('M101 83h42v7h-42z',c.darkSteel)
  + path('M205 117h19v12h-19z',c.darkSteel)
  + path('M218 120h13v5h-13z',c.brass)
  + path('M12 116h20v10H12z',c.darkSteel)
  + path('M12 116h7v5h-7z',c.brass)
  + group(`translate(${recoil} 0)`,path('M143 72h83v10h-83z',c.darkSteel)
   + line('M151 74h71',c.steel,2)
   + path('M219 69h13v16h-13z',c.metal)
   + ellipse(232,77,3,7,c.darkSteel)));
 art += wheel(52) + wheel(119) + wheel(191);
 if (attacking && k===2) art += path('M234 64l18-16-3 17 17-5-14 19 14 7-27-3z','#efc278','none');
 if (attacking && k>=3 && k<=4) art += ellipse(250+(k-3)*8,54-(k-3)*6,8+(k-3)*4,6+(k-3)*2,c.smoke,'none');
 if (moving && frame%2===1) art += ellipse(19,169,8,4,c.smoke,'none');
 return art;
}

function tank(c, frame) {
 const moving = frame >= 2 && frame < 10, attacking = frame >= 10, k = attacking ? frame-10 : 0;
 const roll = moving ? frame-2 : 0, recoil = attacking ? [0,-3,-11,-7,-2,0][k] : 0;
 let art = path('M12 145q-1-19 19-21h157q22 0 23 20v11q-2 19-23 20H33q-22 0-22-20z', c.rubber);
 art += path('M23 145q2-12 13-13h148q14 0 16 13v9q-3 12-15 12H36q-12 0-13-12z', c.darkSteel);
 for (let i=0;i<6;i++) {
  const x=43+i*28;
  art += circle(x,150,9,c.metal)
   + group(`rotate(${roll*32} ${x} 150)`,line(`M${x-6} 150h12M${x} 144v12`,c.darkSteel,2))
   + circle(x,150,3,c.brass);
 }
 art += `<path d="M33 128h153M33 170h153" fill="none" stroke="${c.steel}" stroke-width="3" stroke-dasharray="12 7" stroke-dashoffset="${-roll*4}"/>`;
 art += path('M20 126l13-25 33-19h91l41 21 15 24z',c.coat)
  + path('M33 101l34-17h88l33 17z',c.light)
  ;
 // The commander rises through the hatch; the turret covers the lower neck.
 art += group('translate(48 5) scale(.72)',head(c,'siege'));
 art += path('M70 87l13-23h55l22 23z',c.helmet)
  + path('M81 65q30-15 60 0', 'none', c.helmetLight, 4)
  + path('M78 90h85', 'none', c.darkSteel, 4)
  + path('M34 114h32v15H31z',c.darkSteel)
  + path('M172 112h25v15h-27z',c.darkSteel)
  + path('M93 75h11v8H93z',c.darkSteel)
  + circle(118,75,4,c.brass);
 art += group(`translate(${recoil} 0)`, path('M135 70h91v14h-91z',c.darkSteel)
  + line('M143 72h76',c.steel,3) + path('M218 67h13v20h-13z',c.metal)
  + ellipse(230,77,5,9,c.darkSteel));
 art += line('M73 81V28',c.darkSteel,3)+path('M74 29l25 7-25 7z',c.red)+circle(73,29,3,c.brass);
 if (attacking && k===2) art += path('M233 60l17-17-2 19 14-9-10 22 12 7-25 1z','#f0bd73','none');
 if (attacking && k>=3 && k<=4) art += ellipse(247+(k-3)*9,52-(k-3)*9,9+(k-3)*4,6+(k-3)*3,c.smoke,'none');
 return art;
}

export function worldWarsRig(role, enemy, frame) {
 if (!worldWarsRoles.includes(role) || !Number.isInteger(frame) || frame < 0 || frame > 15) throw Error(`Invalid World Wars frame: ${role}/${frame}`);
 const c = palette(enemy);
 return role === 'siege' ? armoredCar(c,frame) : role === 'raider' ? scoutJeep(c,frame) : infantry(role,c,frame);
}

export function worldWarsBossRig(frame) {
 if (!Number.isInteger(frame) || frame < 0 || frame > 15) throw Error(`Invalid World Wars boss frame: ${frame}`);
 return tank(palette(true),frame);
}
