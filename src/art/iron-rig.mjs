/** Iron-age review art. Each role owns its silhouette; equipment never crosses the face. */
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';
const ink='#242b30';
const path=(d,fill,stroke=ink,w=2.5)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line=(d,c,w=3)=>path(d,'none',c,w);
const oval=(x,y,rx,ry,c,stroke=ink,w=2.5)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${stroke}" stroke-width="${w}"/>`;
const group=(t,s)=>`<g transform="${t}">${s}</g>`;
const limb=(d,c,w=9)=>line(d,ink,w+4)+line(d,c,w);
const palette=enemy=>({cloth:enemy?'#984b42':'#426e80',light:enemy?'#d99879':'#8ab9c7',dark:enemy?'#613f3c':'#304c58',skin:'#dfb18c',shade:'#b67f61',hair:'#48392f',hairLight:'#78604a',steel:'#91a4ad',edge:'#d6e2df',steelDark:'#526873',leather:'#785238',leatherLight:'#af8352',linen:'#eee0bc',wood:'#654936',woodLight:'#ad895a'});

function head(role,c,layer='full') {
 let s=path('M85 67v16h20V66',c.shade)+path('M79 44q7-13 24-9 12 3 12 18l7 9-7 3-2 8q-9 8-22 0l-10-9z',c.skin);
 s+=path('M91 70q10 4 20-1l-2 5q-9 5-18-1z',c.shade,'none');
 s+=oval(83,58,5,7,c.skin)+line('M82 55q4 0 4 4',c.shade,1.5);
 s+=line('M103 49l8 1',ink,2)+oval(109,55,1.8,2,ink,'none')+line('M110 68h4','#784b3b',1.7);
 const anatomyLength=s.length;
 // Helmets finish above the brow. Neck guards stay behind the ear.
 if(role==='boss') {
  // Bare-headed commander: swept hair and a narrow circlet, no infantry helmet.
  s+=path('M76 45q-13 9-12 30l10-5 8-23z',c.steelDark)+path('M77 55q-7-22 7-29 18-9 31 9l3 9-14-6-17 7-3 12-4-4-1 9z',c.steelDark)+line('M82 34q13-10 24-2',c.edge,3)+line('M80 43l31-3',c.linen,4);
  s+=path('M92 70l20-1-4 12-10 3-7-8z',c.steelDark);
 } else if(role==='bulwark') {
  // Broad, flat-topped gate guard helmet; cheek plates remain behind the eye.
  s+=path('M74 45l3-22h35l10 19-14-4-21 6-6 9z',c.steelDark)+path('M78 23h30l7 14-31 3z',c.steel)+line('M78 43l39-4',c.edge,3)+path('M75 45l9-3-2 27-9 3z',c.steelDark);
 } else if(['shield','spear'].includes(role)) {
  s+=path('M76 45Q75 23 97 22q21 0 23 21l-13-3-19 2-7 9z',c.steel);
  s+=path('M76 44l7-2-1 25-8 5z',c.steelDark)+line('M79 43q18-9 40 0',c.edge,2.5)+line('M82 34q11-12 24-5',c.edge,2.5);
  if(role==='spear')s+=path('M89 24l1-9 13-4 8 11z',c.dark)+line('M94 16l10-2',c.light,2);
 } else if(role==='medic') {
  s+=path('M76 48l3-20q19-11 33 4l5 13-15-7-19 10-2 18-7-4z',c.linen)+line('M79 40q17-9 34 2',c.light,4);
 } else {
  s+=path('M78 55q-9-18 3-27 16-11 30 2l6 14-13-5-14 3-5 13-3-3-1 9z',c.hair)+line('M82 35q10-9 21-3',c.hairLight,3);
  if(role==='banner')s+=line('M78 43l35-2',c.linen,5)+path('M78 44l-10 18 7-1 8-17z',c.linen);
  if(role==='raider')s+=path('M85 28q-5-11 5-14l11 5-4 9z',c.hair)+path('M89 69l20 1-7 11-10-3z',c.hair);
  if(role==='archer')s+=line('M79 44l28-4',c.cloth,4);
  if(role==='thrower')s+=path('M77 43q-4-18 12-21 18-2 23 13l-24 4-9 10z',c.leather)+line('M80 34l24-4',c.leatherLight,3);
 }
 return layer==='headgear'?s.slice(anatomyLength):s;
}
function legs(c,frame,heavy=false,role='') {
 let s='',moving=frame>=2&&frame<10,step=frame-2;
 for(const back of [true,false]) {
  const color=back?c.dark:c.cloth;
  if(moving) {
   const {hip,knee,ankle,foot,pivot}=walkLeg(step,back,heavy);
   s+=limb(`M${hip.x} ${hip.y}L${knee.x} ${knee.y} ${ankle.x} ${ankle.y}`,color,heavy?13:9);
   s+=group(`translate(${foot.x} ${foot.y}) rotate(${foot.pitch} ${pivot} 0)`,path('M-7-11h11l4 7 6 2v2H-7z',c.leather)+line('M-5-2h16',c.leatherLight,2));
  } else {
   const x=back?82:107;
   s+=limb(`M${back?87:100} 124L${back?81:107} 147 ${x} 167`,color,heavy?13:9);
   s+=path(`M${x-6} 161h10l3 10 8 2v3H${x-7}z`,c.leather)+line(`M${x-4} 173h15`,c.leatherLight,2);
  }
 }
 return s;
}
function torso(role,c) {
 const heavy=['bulwark','boss'].includes(role), x=heavy?67:76,w=heavy?49:35;
 let s='';
 if(role==='boss')s+=path('M73 79l-21 25-11 59 19-7 17 11 16-29 11 30 24-13-10-66-19-14z',c.dark)+line('M48 155l13-4 15 9M107 160l15-9',c.linen,4);
 if(role==='banner')s+=path('M77 79Q65 95 58 151l19-7 10 8 7-64z',c.dark)+line('M71 103l-7 35',c.cloth,4);
 if(role==='archer')s+=group('rotate(-16 76 98)',path('M63 83h17v47H63z',c.leather)+line('M67 84V57M73 86V54M78 86V59',c.woodLight,2)+path('M64 62l3-9 4 8M70 59l3-10 4 9M75 64l3-9 4 8',c.linen,ink,1.5));
 if(role==='thrower')s+=group('rotate(-19 73 103)',path('M58 91h21v43H58z',c.leather)+line('M63 105V46M72 104V42',c.woodLight,3)+path('M63 33l-4 14h8zM72 29l-4 14h8z',c.steel));
 s+=path(`M${x} 82q18-10 ${w} 0l7 44q-25 11-${w+9} 0z`,c.cloth);
 if(role==='bulwark') {
  s+=path('M65 83l22-9 29 6 8 46-18 15-35-7z',c.steelDark);
  for(const y of [91,103,115])s+=path(`M72 ${y}h40l-3 8-8 3-9-3-9 3-9-3z`,c.steel)+line(`M77 ${y+2}h29`,c.edge,1.5);
  s+=path('M61 82l19-8 9 18-19 9zM111 79l16 5 8 20-20-9z',c.steelDark)+line('M66 84l12-4M120 87l9 9',c.edge,3)+path('M71 130h42l8 17-25-4-23 4z',c.dark);
 } else if(role==='boss') {
  // One smooth cuirass and a diagonal command sash, distinct from infantry lamellar.
  s+=path('M74 84l16-7 20 5 10 33-25 10-21-13z',c.steel)+path('M79 85l12-5 12 5-9 28-15-6z',c.steelDark)+line('M104 88l7 18-15 8',c.edge,3)+line('M77 83l36 38',c.linen,7)+line('M78 84l34 36',c.leatherLight,3)+path('M70 82l13-6 10 13-14 7z',c.steel);
  s+=path('M78 127h35l10 25-25-5-20 8z',c.cloth)+line('M80 147l17-5 20 4',c.linen,3);
 } else if(['shield','spear'].includes(role)) {
  const y=role==='spear'?132:118;
  s+=path(`M${x+2} 83l15 3 18-5 8 ${y-81}-24 5-22-6z`,c.steel);
  for(let row=94;row<y;row+=9)s+=line(`M${x+5} ${row}h32`,c.steelDark,2)+line(`M${x+10} ${row-4}v4M${x+20} ${row-4}v4M${x+30} ${row-4}v4`,c.edge,1.5);
  if(heavy)s+=path('M65 82l16-6 6 15-17 7zM110 80l12 4 5 14-15-6z',c.steelDark)+line('M69 84l11-3M116 86l6 6',c.edge,2);
 } else if(role==='archer') {
  s+=path('M80 81l13 8 17-10 7 36-18 9-22-8z',c.leather)+line('M89 90l11 23',c.leatherLight,3)+line('M82 89l25 33',c.linen,3);
 } else if(role==='thrower') {
  s+=path('M77 85l13-5 9 11 11-10 5 40-17 9-22-10z',c.leather)+line('M79 93l30 22',c.linen,5)+path('M79 123h29l4 17-17-3-15 4z',c.leather);
 } else if(role==='raider') {
  s+=path('M76 84l10-7 9 10 15-7 4 12-15 7-13-9-9 7z',c.leather)+line('M83 98l25 23',c.steel,6)+line('M84 99l23 21',c.edge,2);
 } else if(role==='banner') {
  s+=path('M79 80l14 7 15-9 5 13-13 12-21-11z',c.linen)+path('M75 117h39l6 29-20-4-13 6-15-5z',c.cloth)+line('M77 139h34',c.light,3);
 } else if(role==='medic') {
  s+=path('M84 81l9 7 12-8 1 25 14 50-21 5-26-5 9-43z',c.linen)+line('M77 149h36',c.light,4);
 }
 s+=line('M76 122h38',c.leather,6)+path('M93 119h8v7h-8z',c.steel);
 if(role==='medic')s+=line('M81 86l24 43',c.leather,5)+path('M97 125h24v21H97z',c.leather)+path('M97 125h24l-3 9h-18z',c.leatherLight)+line('M109 129v7',c.linen,2);
 return s;
}
function shield(role,c,wave) {
 if(role!=='shield')return '';
 // The shield is the unit's main silhouette: shoulder height to just above the ground.
 const s=path('M-33-39q31-13 65 0l-2 74-30 17-31-17z',c.steelDark)+path('M-27-35q26-10 53 0l-2 66-24 14-25-14z',c.cloth)+line('M0-37v77',c.steel,7)+line('M-25-10h49M-25 22h48',c.steel,5)+oval(0,6,11,13,c.steel)+line('M-5 0l5-3',c.edge,3)+line('M-25-30v60M23-30v60',c.edge,2);
 return group(`translate(57 121) rotate(${-2+wave})`,s);
}
const maul=c=>limb('M0 42V-43',c.woodLight,6)+path('M-15-61h32l8 8-5 17h-35l-7-8z',c.steelDark)+path('M-15-60h28l5 7-5 10h-28z',c.steel)+line('M-11-56h22',c.edge,3)+line('M0 5v19',c.linen,7);
const sabre=c=>line('M0 14V-14',ink,7)+line('M0 12V-12',c.leatherLight,4)+path('M-4-18Q-1-44 12-62L16-70Q12-48 5-17z',c.steel)+line('M3-27Q7-49 13-62',c.edge,2)+path('M-10-14q11 9 22-2',c.linen,'none',4);
const sword=c=>line('M0 12V-12',ink,7)+line('M0 10V-11',c.leatherLight,4)+path('M-4-16l1-41 4-9 5 9-2 41z',c.steel)+line('M1-55v35',c.edge,2)+line('M-10-14h20',c.steelDark,5);
const spear=c=>limb('M0 48V-76',c.woodLight,3.5)+path('M0-93l-6 18 6 7 6-7z',c.steel)+line('M0-84v10',c.edge,2)+line('M0-70v9',c.linen,5);
const axe=c=>limb('M0 22V-52',c.woodLight,5)+path('M-3-51q17-12 29-8l-1 25q-16 3-28-7z',c.steel)+line('M22-56v18',c.edge,3)+line('M0 0v15',c.linen,6);
const dart=c=>limb('M0 25V-39',c.woodLight,3)+path('M0-53l-5 15 5 5 5-5z',c.steel)+line('M0-36v5',c.linen,5);

export function ironRig(role,enemy,frame,layer='full') {
 if(role==='banner'&&(frame===1||frame===16||frame===47))frame=0;
 const c=palette(enemy), moving=frame>=2&&frame<10, attack=frame>=10,step=frame-2,wave=moving?Math.sin(step*Math.PI/4):0,heavy=['bulwark','boss'].includes(role),bounce=moving?walkBodyOffset(step,heavy):0,k=attack?frame-10:0;
 if(role==='siege')return group('translate(100 176) scale(1.5) translate(-100 -176)',siege(c,frame,layer));
 if(layer==='face')return group(`translate(0 ${bounce})`,faceClearance());
 if(layer==='eyes')return group(`translate(0 ${bounce})`,eyeClearance());
 if(layer==='headgear')return group(`translate(0 ${bounce})`,head(role,c,'headgear'));
 let s=legs(c,frame,heavy,role),body=torso(role,c)+head(role,c);
 let hx=141,hy=111,angle=20,gear='',rearX=73,rearY=113;
 if(role==='spear'){hx=142;hy=110;angle=attack?[12,4,57,72,42,16][k]:12+wave*2;gear=spear(c);}
 if(role==='shield'){angle=attack?[25,8,52,91,61,30][k]:22+wave*3;hx=attack?[142,137,148,155,149,143][k]:141;hy=attack?[112,105,113,119,117,111][k]:111;gear=sword(c);}
 if(role==='bulwark'){hx=attack?[145,151,154,161,153,146][k]:145;hy=attack?[112,107,119,126,120,113][k]:112;angle=attack?[12,2,49,76,43,16][k]:10+wave*2;gear=maul(c);const a=angle*Math.PI/180;rearX=hx-18*Math.sin(a);rearY=hy+18*Math.cos(a);}
 if(role==='boss'){hx=attack?[145,142,155,163,154,146][k]:145;hy=attack?[113,106,117,124,118,113][k]:113;angle=attack?[25,9,51,78,48,27][k]:24+wave*2;gear=sabre(c);}
 if(role==='raider'){hx=attack?[141,140,149,158,148,143][k]:141;hy=attack?[113,101,111,118,116,113][k]:112;angle=attack?[20,5,54,87,48,24][k]:22+wave*4;gear=axe(c);}
 if(role==='thrower'){hx=attack?[143,137,161,166,146,141][k]:140;hy=attack?[104,89,96,99,106,110][k]:111;angle=attack?[31,8,82,90,38,26][k]:24+wave*2;gear=attack&&(k===2||k===3)?'':dart(c);}
 if(role==='medic'){const lift=attack?[1,9,17,20,13,3][k]:0;hx=140+lift*.3;hy=118-lift;angle=4;gear=limb('M0 46V-32',c.woodLight,4)+path('M-8-42q8-5 16 0v12q-8 5-16 0z',c.linen)+line('M-5-38h10',c.cloth,3)+line('M0-30v5',c.linen,6);}
 if(role==='banner'){
  const p=attack?(frame>=16?(frame-16)/31:k/5):0,lift=attack?Math.sin(p*Math.PI)**2:0,flutter=4*Math.sin(2*Math.PI*p)*lift;
  hx=139+4*lift;hy=116-17*lift;angle=moving?wave:0;
  gear=limb('M0 50V-78',c.woodLight,4)+path(`M2-76q17 ${-4+flutter} 35 0l-4 14 4 15q-18 ${-3-flutter}-35 0z`,c.cloth)+line('M8-69h20M8-50h20',c.linen,3)+path('M19-64l6 5-6 5-6-5z',c.linen,'none')+oval(0,-80,3,3,c.steel);
 }
 if(role==='archer') {
  const poses=[[147,108,22],[151,105,39],[151,105,12],[151,105,12],[144,111,18],[143,111,21]],pose=attack?poses[k]:frame===1?poses[0]:poses[5];
  [hx,hy]=pose; const pull=pose[2],loaded=!attack||![2,3].includes(k);angle=0;rearX=loaded?hx-pull:(k===2?110:106);rearY=loaded?hy-6:(k===2?97:102);
  gear=line('M-12-36Q13 0-12 36',ink,6)+line('M-12-36Q13 0-12 36',c.woodLight,3)+line(`M-12-36L${-pull}-6-12 36`,c.linen,1.5)+line('M0-3v9',c.linen,5);
  if(loaded)gear+=line(`M${-pull}-6h${pull+29}`,c.woodLight,2)+path('M27-10l8 4-8 4z',c.steel,ink,1);
 }
 if(layer==='shield')return group(`translate(0 ${bounce})`,shield(role,c,wave));
 if(layer==='equipment')return group(`translate(0 ${bounce})`,shield(role,c,wave)+group(`translate(${hx} ${hy}) rotate(${angle})`,gear));
 // Both arm chains start at a visible shoulder and end at their prop grip.
 body+=limb(`M78 87L${role==='bulwark'?110:68} ${role==='bulwark'?117:102} ${rearX} ${rearY}`,c.dark,9)+oval(rearX,rearY,5,5,c.skin);
 body+=shield(role,c,wave);
 const sleeve=role==='raider'?c.skin:role==='medic'?c.linen:c.cloth;
 body+=limb(`M110 87L${(110+hx)/2} ${Math.max(98,hy-5)} ${hx} ${hy}`,sleeve,9);
 body+=group(`translate(${hx} ${hy}) rotate(${angle})`,gear)+oval(hx,hy,5.5,5,c.skin)+line(`M${hx-2} ${hy-2}l4 1`,c.shade,1.5);
 if(role==='bulwark')body+=oval(rearX,rearY,5,5,c.skin);
 if(role==='archer')body+=oval(rearX,rearY,4.5,4.5,c.skin);
 if(role==='boss')body+=oval(103,91,5,6,c.leatherLight)+path('M103 87l3 4-3 4-3-4z',c.linen,'none');
 return s+group(`translate(0 ${bounce})`,body);
}
function wheel(x,y,c,phase) {
 return oval(x,y,17,17,c.wood)+oval(x,y,12,12,c.woodLight)+group(`rotate(${phase} ${x} ${y})`,line(`M${x-11} ${y}h22M${x} ${y-11}v22`,c.wood,3))+oval(x,y,4,4,c.steel);
}
function crew(c,frame,x,front=false,layer='full') {
 const moving=frame>=2&&frame<10,k=frame>=10?frame-10:0,reach=frame>=10?[0,-3,7,10,5,1][k]:0;
 if(layer!=='full'){
  const content=layer==='headgear'?head(front?'thrower':'archer',c,'headgear'):layer==='face'?faceClearance():eyeClearance();
  return group(`translate(${x} 61.6) scale(.65) translate(0 ${moving?walkBodyOffset(frame-2):0})`,content);
 }
 // Full anatomy, reduced as a unit: two heads, torsos, arms, knees and boots remain visible.
 let s=legs(c,frame,false),body=path('M76 83q18-10 35 0l8 43H73z',front?c.leather:c.cloth)+line('M79 87l26 33',c.linen,4)+line('M76 123h37',c.leather,5)+head(front?'thrower':'archer',c);
 body+=limb(`M79 88L87 111 ${122+reach} 108`,c.dark,8)+oval(122+reach,108,5,5,c.skin)+limb(`M109 87L120 104 ${143+reach} 108`,c.skin,8)+oval(143+reach,108,5,5,c.skin);
 s+=group(`translate(0 ${moving?walkBodyOffset(frame-2):0})`,body);
 return group(`translate(${x} 61.6) scale(.65)`,s);
}
function siege(c,frame,layer='full') {
 const moving=frame>=2&&frame<10,attack=frame>=10,k=attack?frame-10:0,roll=moving?(frame-2)*27:0,recoil=attack?[0,-3,7,10,5,1][k]:moving?Math.sin((frame-2)*Math.PI/4):0;
 if(['face','eyes','headgear'].includes(layer))return crew(c,frame,-38,false,layer)+crew(c,frame,21,true,layer);
 let s=limb('M63 151l12-31M165 151l-12-31',c.wood,7)+path('M49 141h124l8 12H43z',c.wood)+line('M56 145h114',c.woodLight,3);
 s+=group(`translate(${recoil} 0)`,path('M50 116h121l16 10-15 13H50z',c.wood)+line('M55 122h111',c.woodLight,4)+path('M162 116h10l15 10-15 13h-10z',c.steel)+line('M170 120l10 6-10 9',c.edge,3)+line('M77 117v20M143 117v20',c.steelDark,6));
 s+=wheel(68,158,c,roll)+wheel(165,158,c,roll);
 if(layer==='equipment')return s;
 s+=crew(c,frame,-38)+crew(c,frame,21,true);
 return s;
}

// Expanded visible face and eye masks used by check-iron; these move with the actual heads.
function faceClearance(){return path('M87 45Q101 39 117 46l3 10 8 6-9 6-4 11-23-1-6-11z','#fff','none');}
function eyeClearance(){return oval(109,55,6,5,'#fff','none');}
