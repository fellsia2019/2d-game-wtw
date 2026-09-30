/** Modern-era draft: a separate silhouette and weapon system for each of eight roles. */
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';

export const modernRoles = ['shield','spear','archer','medic','raider','thrower','banner','siege'];
export const modernNames = ['Щитовик спецгруппы','Противотанкист','Марксман','Боевой медик','Оператор разведки','Реактивный гранатомётчик','Оператор дронов','Артиллерийский расчёт'];
export const modernDescriptions = ['Защитник','Против брони','Дальний бой','Лечение','Быстрый прорыв','Урон по группе','Удар дроном по цели','Осада'];

const ink='#17232d';
const p=(d,fill,stroke=ink,w=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const l=(d,color=ink,w=3)=>p(d,'none',color,w);
const c=(x,y,r,fill,stroke=ink,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const e=(x,y,rx,ry,fill,stroke=ink,w=2)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const g=(transform,body)=>`<g transform="${transform}">${body}</g>`;
const joint=(d,color,w=9)=>l(d,ink,w+3)+l(d,color,w);
const palette=enemy=>({
 armor:enemy?'#653f4c':'#28596a',armorDark:enemy?'#412f3b':'#1e3a49',armorLight:enemy?'#a56b68':'#5da5b1',
 fabric:enemy?'#7b5961':'#3c7482',accent:enemy?'#e7956e':'#91d8dc',visor:'#9ed4dc',
 ceramic:'#c8d3d0',steel:'#82949b',gun:'#34464f',rubber:'#28323a',
 skin:'#e6b38e',skinShade:'#ad7460',white:'#f1efe1',medical:'#e87970',smoke:'#b8c3c1'
});

function head(q,role,bob=0){
 const cap=role==='raider';
 let art=p('M88 65q9 4 19-1l-1 15H90z',q.skinShade)
  +p('M80 42q5-13 20-14 14 1 18 15l-1 10 6 5-6 4-3 8q-10 8-23 2-13-8-11-30z',q.skin)
  +e(80,56,5,7,q.skin)+l('M102 48q5-3 10-1',q.armorDark,1.8)
  +c(109,53,1.8,ink,'none')+l('M114 64q-6 4-11 2',q.skinShade,1.8)
  +p('M82 41q2-8 10-10-3 13-2 28l-6 4z',q.armorDark);
 art+=cap
  ? p('M72 39q6-18 25-19 21 0 27 19l-8 6H76z',q.armorDark)+p('M74 39q25-7 49 1l-8 7H77z',q.armorLight)
  : p('M69 43q2-24 28-26 26 0 31 26l-9 7q-13-7-28-4l-14 6z',q.armorDark)
   +p('M74 40q4-18 24-18 21 1 25 19l-9 5q-18-6-37 3z',q.armor)
   +l('M78 43q22-8 42 1',q.armorLight,4)
   +l('M76 48l2 16 8 9',q.gun,2.5);
 if(role==='medic') art+=c(99,31,9,q.white,'none')+p('M97 25h4v4h4v4h-4v4h-4v-4h-4v-4h4z',q.medical,'none');
 if(role==='raider')art+=p('M83 27q12-4 24 0l-2 8H84z',q.gun)+c(96,31,3,q.accent);
 if(role==='banner')art+=c(98,30,5,q.ceramic)+c(98,30,2,q.accent,'none');
 return g(`translate(0 ${bob})`,art);
}

function legs(q,frame){
 let art='';
 for(const far of [true,false]){
  const v=frame>=2&&frame<10?walkLeg(frame-2,far,false):{hip:{x:far?86:107,y:125},knee:{x:far?81:111,y:148},ankle:{x:far?79:113,y:169},foot:{x:far?79:113,y:176,pitch:0},pivot:0};
  const {hip,knee,ankle,foot,pivot}=v;
  art+=joint(`M${hip.x} ${hip.y}Q${knee.x+2} ${knee.y-10} ${knee.x} ${knee.y}`,far?q.armorDark:q.fabric,11)
   +joint(`M${knee.x} ${knee.y}Q${ankle.x-2} ${ankle.y-11} ${ankle.x} ${ankle.y}`,q.armorDark,9)
   +e(knee.x,knee.y,5,4,far?q.armorDark:q.armor)
   +g(`translate(${foot.x} ${foot.y}) rotate(${foot.pitch} ${pivot} 0)`,p('M-7-9q5-3 10 0l3 6 9 1q4 2 2 5H-7z',q.rubber)+l('M-4-7q4-2 7 0',q.armorLight,1.5));
 }
 return art;
}

function torso(q,role,bob){
 const light=role==='raider';
 let art=p('M72 83q9-10 23-9l14 1q13 3 17 14l-2 41q-14 12-27 13-16 0-27-12z',q.fabric)
  +p('M76 85q8-7 22-7 17 1 24 10l-3 35q-21 10-42 1z',light?q.fabric:q.armorDark)
  +p('M85 88q13 3 27-2l5 29q-16 8-31 2z',light?q.fabric:q.armor)
  +l('M83 93q17 6 32 0M86 113q14 6 28 0',q.armorLight,2)
  +l('M74 126q23 8 49-1',q.armorDark,6)
  +p('M73 130q22 9 51 0l-4 14q-23 4-43-2z',q.fabric)
  +p('M68 88q-11 7-12 20l9 9 12-23z',q.armorDark)
  +p('M60 104q5-4 11 0l1 23-12 3z',q.gun)+l('M62 111l8-2',q.accent,2);
 if(role==='medic')art+=p('M65 81q-20-4-24 10l-1 43q11 10 27 6z',q.white)+l('M47 92q10-3 17 2M45 121q12 3 20 0',q.medical,4)+p('M92 105h8v5h5v7h-5v5h-8v-5h-5v-7h5z',q.medical,'none');
 if(role==='shield')art+=p('M82 90q17-6 32 0l4 27q-20 8-36-1z',q.armor)+l('M87 100q13 4 24 0',q.armorLight,3);
 if(role==='spear')art+=l('M78 89q21 19 43 31',q.armorDark,5)+p('M78 112q8-4 15 0l-1 18-14 1z',q.gun);
 if(role==='archer')art+=l('M78 87q17 17 40 28',q.gun,4)+p('M72 117q8-4 15 1l-2 15-13-2z',q.armorDark);
 if(role==='thrower')art+=p('M112 103q10-3 18 3l-2 23-16 1z',q.gun)+l('M115 111h11M115 119h11',q.steel,2);
 if(role==='banner')art+=p('M50 85q13-5 24 2l-2 42-23-1z',q.gun)+p('M55 91q8-3 15 0l-1 28-15 1z',q.armorLight)+l('M62 87V61',q.steel,3);
 return g(`translate(0 ${bob})`,art);
}

function arms(q,bob,left,right){
 const [lx,ly]=left,[rx,ry]=right;
 return joint(`M77 ${91+bob}L63 ${105+bob} ${lx} ${ly}`,q.armorDark,9)
  +joint(`M115 ${91+bob}L131 ${106+bob} ${rx} ${ry}`,q.fabric,9)
  +e(lx,ly,5,4,q.gun)+e(rx,ry,5,4,q.gun);
}

function infantry(role,q,frame){
 const walking=frame>=2&&frame<10,acting=frame>=10,k=acting?frame-10:0;
 const bob=walking?walkBodyOffset(frame-2):acting?[0,-1,-3,-2,-1,0][k]:0;
 let art=legs(q,frame)+torso(q,role,bob)+head(q,role,bob);
 if(role==='shield'){
  const shove=acting?[0,3,9,15,8,0][k]:0;
  art+=arms(q,bob,[70,116],[136+shove,107])
   +l(`M${136+shove} 107l10 3`,q.armorLight,5)
   +p(`M${143+shove} 55l41-6 10 12-1 89-14 15-37-11-6-16z`,q.armorDark)
   +p(`M${150+shove} 62l28-4 8 9-1 68-8 16-27-8-5-11z`,q.ceramic)
   +p(`M${153+shove} 71l24-3 3 20-24 2z`,q.visor)
   +p(`M${153+shove} 94l28-3 2 8-29 3z`,q.armorLight)
   +l(`M${151+shove} 149l-5 19M${181+shove} 151l7 17`,q.rubber,4);
 } else if(role==='spear'){
  const recoil=acting?[0,-2,-9,-6,-2,0][k]:0;
  art+=arms(q,bob,[114+recoil,105],[161+recoil,101])
   +g(`translate(${recoil} 0)`,
    // A rigid launch canister: parallel edges, a visible rear exhaust and a muzzle cap.
    p('M67 77L238 72l7 6v20L67 102z',q.armorDark)
    +p('M73 80l165-5v10L73 91z',q.ceramic)
    +p('M74 93l164-6v8L74 99z',q.armorLight)
    +l('M77 83l158-5M78 96l157-5',q.steel,2)
    +p('M67 76l12 1v25l-12 1zM205 73l12-1v26l-12 1z',q.gun)
    +p('M59 80l9-3v26l-9-3z',q.steel)
    +e(59,90,5,13,q.rubber)+e(59,90,2,7,q.gun,'none')
    +p('M238 72l11 2 5 5v17l-5 5-11-3z',q.gun)
    +e(254,87,5,13,q.rubber)+e(255,87,2,7,q.steel,'none')
    +p('M126 64l40-1 5 9-49 2z',q.rubber)
    +p('M137 57h22l6 8-31 1z',q.gun)
    +p('M142 59h14l3 4-19 1z',q.visor)
    +p('M110 99l34-1 6 10-5 10-32-2z',q.gun)
    +p('M116 101h21v10h-21z',q.armorLight)
    +c(133,106,4,q.visor)
    +p('M154 99l16-1-2 29-12 1z',q.rubber)
    +l('M159 109l8-1',q.steel,2)
    +e(113,102,5,4,q.gun)+e(161,99,5,4,q.gun));
  if(acting&&k===2)art+=p('M255 79l4-6-1 10 2 3-4 3z','#f4c576','none');
  if(acting&&k>=3&&k<=4)art+=e(52-(k-3)*8,90,7+(k-3)*4,5+(k-3)*2,q.smoke,'none');
 } else if(role==='archer'){
  const recoil=acting?[0,-1,-6,-9,-3,0][k]:0;
  art+=arms(q,bob,[115+recoil,109],[142+recoil,101])
   +g(`translate(${recoil} 0)`,p('M75 102l15-18 18 3 11 12-13 14-25 1z',q.armorDark)
    +p('M105 91h101v13H105z',q.gun)
    +p('M115 94h86v3h-86z',q.steel,'none')
    +p('M206 94h39v7h-39z',q.armorDark)
    +p('M242 90h21v15h-21z',q.rubber)
    +p('M127 105l10 28 17-3 4-25z',q.armorDark)
    +p('M144 82h44v8h-44z',q.rubber)
    +p('M152 77h21v6h-21z',q.ceramic)
    +c(174,86,4,q.visor)
    +l('M214 106l-5 24m5-24 7 24',q.steel,3));
  if(acting&&k===2)art+=p('M259 91l3-5-1 7 2 3-4 4z','#f3d38a','none');
 } else if(role==='medic'){
  const reach=acting?[0,4,13,17,8,0][k]:0;
  art+=arms(q,bob,[68,119],[139+reach,106])
   +p(`M${133+reach} 95h18v23h-18z`,q.white)
   +p(`M${140+reach} 99h5v5h5v5h-5v5h-5v-5h-5v-5h5z`,q.medical,'none')
   +l(`M${152+reach} 103h13`,q.steel,3);
  if(acting&&k>=2&&k<=4)art+=c(168+reach,105,10+(k-2)*4,'none',q.accent,2);
 } else if(role==='raider'){
  const raise=acting?[0,-5,-11,-11,-5,0][k]:0;
  art+=arms(q,bob,[69,111],[137,95+raise])
   +g(`translate(0 ${raise})`,p('M134 84h26v20h-26z',q.gun)+p('M139 88h16v11h-16z',q.visor)
    +c(160,94,6,q.rubber)+c(160,94,3,q.accent))
   +p('M46 114l10-13 9 8 2 26-18 7z',q.armorDark)
   +p('M50 120h15v14H50z',q.accent);
  if(acting&&k>=2&&k<=4)art+=l('M164 80q22-14 39-5m-34 14q18-8 28-2',q.accent,2);
 } else if(role==='thrower'){
  const recoil=acting?[0,-1,-7,-5,-2,0][k]:0;
  art+=arms(q,bob,[110+recoil,125],[145+recoil,114])
   +g(`translate(${recoil} 14)`,p('M80 101l16-11 20 2 7 12-12 10-28 2z',q.armorDark)
    +p('M108 92h81v17h-81z',q.gun)
    +p('M118 95h61v4h-61z',q.steel,'none')
    +p('M185 91h27v19h-27z',q.armorDark)
    +p('M209 94h10v13h-10z',q.ceramic)
    +c(139,114,18,q.armorDark)+c(139,114,13,q.steel)
    +[0,60,120,180,240,300].map(a=>g(`rotate(${a} 139 114)`,c(139,105,2,q.gun,'none'))).join('')
    +p('M161 107l-6 25 15 1 9-24z',q.armorDark));
  if(acting&&k===2)art+=g('translate(0 14)',p('M220 83l20-12-2 14 16-2-16 17 14 10-29-7z','#f5c77d','none'));
  if(acting&&k>=3&&k<=4)art+=e(235+(k-3)*9,97,9+(k-3)*4,5+(k-3)*3,q.smoke,'none');
 } else if(role==='banner'){
  const raise=acting?[0,-4,-8,-8,-4,0][k]:0;
  art+=arms(q,bob,[67,109],[139,106+raise])
   +g(`translate(0 ${raise})`,p('M126 96q15-7 36 0l2 19q-19 8-38 0z',q.gun)+p('M132 101q12-4 25 0v10q-13 4-25 0z',q.visor)
    +l('M130 116l-5 8M159 116l5 8',q.steel,3));
  // The small strike drone is folded on the backpack except during launch.
  const launched=acting&&k>=1&&k<=3;
  if(!acting||k===0||k===5)art+=p('M51 83q-13-5-18 3l1 24q11 5 18-2z',q.armorDark)
   +p('M38 85q6-3 11 0l1 20q-6 4-12 0z',q.gun)
   +l('M40 88l-8-5M42 103l-8 6M49 88l6-5M49 103l6 6',q.steel,2.5)
   +c(44,96,3,q.accent)+l('M51 91l6 2M51 103l6-2',q.rubber,2);
  if(launched){
   const dx=[0,170,195,217][k],dy=[0,45,38,34][k];
   art+=g(`translate(${dx} ${dy})`,p('M-16-3q14-8 30 0l3 8q-15 8-33 0z',q.armorDark)
    +p('M-9-2q10-3 19 0l2 5q-11 3-22 0z',q.armorLight)
    +c(15,2,3,q.medical)+l('M-12-2l-17-8M13-2l17-8M-12 5l-17 8M13 5l17 8',q.steel,3)
    +e(-29,-10,8,2,q.rubber)+e(30,-10,8,2,q.rubber)
    +e(-29,13,8,2,q.rubber)+e(30,13,8,2,q.rubber));
  }
  if(acting&&k>=2&&k<=4)art+=l('M151 88q15-17 30-20',q.accent,2);
 }
 return g('translate(0 176) scale(1 1.06) translate(0 -176)',art);
}

function crew(q,x,frame,operator){
 const step=frame>=2&&frame<10?[0,1,2,1,0,-1,-2,-1][frame-2]:0;
 const action=frame>=10?[0,-1,-3,-2,-1,0][frame-10]:0;
 const stride=frame>=2&&frame<10?[0,4,7,4,0,-4,-7,-4][frame-2]:0;
 let body=joint(`M-8 127L${-11+stride} 150 ${-13+stride} 169`,q.fabric,9)
  +joint(`M8 127L${12-stride} 150 ${13-stride} 169`,q.armorDark,9)
  +p(`M${-20+stride} 168h19l3 8h-23zM${5-stride} 168h20l3 8H${5-stride}z`,q.rubber)
  +p('M-21 84q9-11 22-10 17 1 23 13l-3 42q-18 13-39 1z',q.fabric)
  +p('M-17 87q15-7 32 0l2 31q-15 8-35 0z',q.armor)
  +l('M-14 93q14 5 27 0M-13 113q13 5 26 0',q.armorLight,2)
  +p('M-20 125q20 7 40 0l-3 10q-18 4-34-1z',q.armorDark)
  +p('M-13 42q11-10 24 0l5 12-3 14q-14 13-27-1-3-15 1-25z',q.skin)
  +p('M-17 45q1-23 18-24 17-1 22 23l-8 6q-14-5-31 1z',q.armorDark)
  +p('M-12 41q3-14 15-15 12 1 15 15l-7 4q-11-4-24 2z',q.armor)
  +l('M-13 45q15-6 29-1',q.armorLight,3)
  +c(12,56,1.8,ink,'none')+l('M14 65q-4 3-8 2',q.skinShade,1.5);
 if(operator){
  body+=joint('M17 90L34 100 49 105',q.fabric,8)+c(49,105,4,q.skin)
   +joint('M-18 91L-26 108 -17 122',q.armorDark,8)+c(-17,122,4,q.skin);
 }else{
  body+=joint('M-18 91L-30 106 -34 112',q.fabric,8)+c(-34,112,4,q.skin)
   +joint('M17 91L24 107 16 118',q.armorDark,8)+c(16,118,4,q.skin)
   +p('M-38 105l16-3 7 6-6 8-18-1z',q.ceramic)+p('M-22 102l7 6-6 8-7-1z',q.steel);
 }
 return g(`translate(${x} ${step+action})`,body);
}

function artillery(q,frame){
 const moving=frame>=2&&frame<10,acting=frame>=10,k=acting?frame-10:0;
 const roll=moving?(frame-2)*32:0,bob=moving?[0,-1,-2,-1,0,1,1,0][frame-2]:0;
 const recoil=acting?[0,-3,-11,-7,-2,0][k]:0;
 const wheel=x=>c(x,148,24,q.rubber)+c(x,148,18,q.steel)
  +g(`rotate(${roll} ${x} 148)`,l(`M${x-13} 148h26M${x} 135v26M${x-9} 139l18 18M${x-9} 157l18-18`,q.gun,3))
  +c(x,148,5,q.armorLight);
 let machine=p('M16 170l95-48 35 1 113 47h-37l-88-29-92 31z',q.armorDark)
  +p('M23 164l86-36 12 5-70 35H23zM156 129l98 36v6h-24l-83-32z',q.armorLight)
  +l('M20 173h54M202 173h62',q.steel,4)
  +p('M91 112l20-36 35-6 22 25-19 38-50-5z',q.armor)
  +p('M103 85l32-8 18 17-15 27-37-3z',q.ceramic)
  +c(121,105,10,q.gun)+c(121,105,5,q.steel)
  +p('M118 79h29v25h-29z',q.gun)
  +g(`translate(${recoil} 0)`,p('M133 78l79-30 12 11-77 41z',q.gun)
   +p('M143 78l66-25 6 5-65 34z',q.steel)
   +p('M211 46l13-5 10 15-4 14-14-4z',q.armorDark)
   +e(233,56,5,9,q.rubber));
 machine+=wheel(91)+wheel(195);
 let art=g(`translate(0 ${bob})`,machine);
 // The rear gunner grips the traverse wheel; the forward gunner looks toward the muzzle.
 art+=crew(q,51,frame,true)+crew(q,263,frame,false);
 art+=l('M77 113l23-8',q.steel,4)+c(101,105,7,q.gun)+c(101,105,3,q.accent);
 if(acting&&k===2)art+=p('M231 43l7-12-1 11 5-4-3 13 4 5-12-5z','#f4c778','none');
 if(acting&&k>=3&&k<=4)art+=e(218+(k-3)*6,24-(k-3)*5,9+(k-3)*4,6+(k-3)*2,q.smoke,'none');
 return art;
}

export function modernRig(role,enemy,frame){
 if(!modernRoles.includes(role)||!Number.isInteger(frame)||frame<0||frame>15)throw Error(`Invalid Modern frame: ${role}/${frame}`);
 const q=palette(enemy);
 return role==='siege'?artillery(q,frame):infantry(role,q,frame);
}
