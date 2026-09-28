/** Eight workshop models. Shared palettes and walk joints; independent medieval silhouettes. */
import {walkLeg, walkBodyOffset} from './walk-cycle.mjs';
const ink='#2d302d';
const p=(d,c,s=ink,w=2.4)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const l=(d,c,w=3)=>p(d,'none',c,w);
const e=(x,y,rx,ry,c,s=ink,w=2.4)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${s}" stroke-width="${w}"/>`;
const g=(t,s)=>`<g transform="${t}">${s}</g>`;
const limb=(d,c,w=8)=>l(d,ink,w+3)+l(d,c,w);
const palette=enemy=>({cloth:enemy?'#a95345':'#497a8a',light:enemy?'#e0a178':'#99c6cc',dark:enemy?'#613d39':'#304c59',skin:'#dbac83',shade:'#b58060',hair:'#49382b',metal:'#b1bdb9',steel:'#6e8588',linen:'#e9dabb',wood:'#806044',woodLight:'#bb9660',leather:'#674937',gold:'#d9bb78',fur:'#b5a78d'});
const face=()=>p('M85 40Q102 34 117 44l1 11 7 7-10 7-2 8-25-2-6-13z','#fff','none');
const eyes=()=>e(109,53,6,4,'#fff','none');
function head(role,c,onlyHat=false) {
 const bald=role==='raider',beard=['shield','raider','banner'].includes(role);
 const anatomy=p('M86 67v15h18V65',c.shade)+p('M80 44q4-13 23-8 11 4 11 17l8 9-8 4-1 9q-11 6-24-2l-8-11z',c.skin)+e(83,57,4,6,c.skin)+l('M104 47l8 1',ink,2)+e(109,53,1.8,2,ink,'none')+l('M109 68h5','#80513b',1.5)+(beard?p('M85 65l9 8 18-2-1 10-9 6-12-8z',c.hair):'');
 let hat;
 if(['shield','spear'].includes(role)) {
  hat=p(role==='shield'?'M75 42Q78 24 95 15Q111 26 119 40l-15-3-20 5-6 12z':'M77 41Q79 27 94 23q20 1 23 16l-14-3-18 5-7 10z',c.metal)+l('M81 36q15-8 31 0',c.steel,3)+p('M75 43l8-2-2 28-7 2z',c.steel)+l('M96 20v14',c.gold,2);
 } else if(role==='medic')hat=p('M72 49Q70 22 91 20q26-1 29 22l-17-8-16 5-7 22-8-3z',c.dark)+l('M78 38q12-15 27-7',c.light,3);
 else if(role==='archer')hat=p('M75 46Q74 27 91 23q19-2 25 17l-16-5-15 8-4 15-8-3z',c.dark)+l('M80 36l21-6',c.light,2);
 else if(bald)hat=p('M76 45q-2-14 11-20l10 1-3 9-10 9-5 14-5-2z',c.hair)+p('M89 27q12-14 23-7l3 15-11-4-10 7z','#ad7046');
 else if(role==='banner')hat=p('M76 48q-5-21 12-24 20-4 27 14l-14-4-17 11-4 14-6-4z',c.hair)+l('M77 38l28-4',c.cloth,4);
 else hat=p('M76 46q0-20 18-21 18 0 22 14l-13-3-17 6-5 15-7-3z',c.leather)+l('M80 34l25-2',c.gold,3);
 return onlyHat?hat:anatomy+hat;
}
function legs(role,c,f) {
 let out='';const heavy=role==='shield';
 for(const back of [true,false]) {
  const leg=f>=2&&f<10?walkLeg(f-2,back,heavy):{hip:{x:back?89:101,y:123},knee:{x:back?80:109,y:148},ankle:{x:back?80:111,y:167},foot:{x:back?80:111,y:176,pitch:0},pivot:0};
  const {hip:h,knee:k,ankle:a,foot:b,pivot}=leg;
  out+=limb(`M${h.x} ${h.y}L${k.x} ${k.y} ${a.x} ${a.y}`,back?c.dark:c.cloth,role==='raider'?11:9)+limb(`M${k.x} ${k.y+3}L${a.x} ${a.y}`,c.leather,10)+l(`M${a.x-4} ${a.y-9}h8`,c.gold,2);
  out+=g(`translate(${b.x} ${b.y}) rotate(${b.pitch} ${pivot} 0)`,p('M-7-10h10l2 7 10 2v3H-7z',c.leather));
 }
 return out;
}
function torso(role,c) {
 let s='';
 if(['banner','archer','medic'].includes(role))s+=p(role==='medic'?'M74 80l-17 17-5 56 30 4 15-29 17 20 11-54-19-18z':'M76 80l-23 15-5 50 21-4 19 12 24-68z',c.dark)+l('M54 137l14-4',c.light,3);
 if(role==='archer')s+=p('M61 80h16v41H61z',c.leather)+l('M66 86V55M72 87V51',c.woodLight,3)+p('M64 55l-3-5M70 52l-3-5',c.linen,'none');
 const shape=role==='raider'?'M69 84q21-14 44-7l16 43-32 17-29-14z':'M75 82q19-11 36-2l9 46-24 12-26-12z';
 s+=p(shape,role==='medic'?c.linen:role==='thrower'?c.leather:c.cloth);
 if(['shield','spear'].includes(role)) {
  s+=p('M74 84l15-8 22 6 8 39-45 1z',c.steel);
  for(const y of [88,96,104,112])for(let x=80;x<113;x+=8)s+=l(`M${x} ${y}q3 4 6 0`,c.metal,1.6);
  s+=p('M72 82l13-7 7 13-16 7zM108 79l13 8 4 12-14-6z',c.metal)+p('M74 122h41l7 23-24-4-22 6z',c.cloth);
 } else if(role==='raider') {
  s+=p('M64 86l7-12 12 2 7 10-9 13-8-6-8 3zM106 75l13 5 11 15-13 4-12-8z',c.fur)+l('M72 83l6 5M116 83l4 8',c.linen,3)+l('M82 82l30 39',c.leather,6)+p('M70 125h45l4 21-18-5-25 7z',c.dark);
 } else if(role==='medic')s+=p('M78 106h32l12 48-26 4-25-5z',c.linen)+l('M75 148h37',c.light,3)+l('M79 84l29 42',c.leather,5)+p('M104 121h21v26h-21z',c.leather)+p('M104 121h21l-4 8h-13z',c.woodLight)+l('M114 133v8M110 137h8',c.linen,2);
 else {
  s+=p('M73 125h42l5 22-23-5-24 6z',c.cloth)+l('M77 139h33',c.light,3);
  if(role==='thrower')s+=l('M81 84l26 39',c.linen,5)+p('M67 108l-8 24 10 3 8-21z',c.wood)+p('M59 113l-10-5-7 12 16 6z',c.metal);
  if(role==='banner')s+=p('M83 79l5 22 14-19-1 27-20-6z',c.light)+e(83,85,4,4,c.gold);
 }
 return s+l('M73 124h42',c.leather,5)+p('M91 121h9v7h-9z',c.gold);
}
function kite(c,wave) {return g(`translate(55 122) rotate(${wave})`,p('M-26-32Q0-46 26-32l-2 42Q12 33 0 48Q-12 33-24 10z',c.cloth)+p('M-20-28Q0-38 20-28l-2 37Q10 28 0 41Q-10 28-18 9z',c.dark)+l('M0-33v65M-18-8h36',c.gold,4)+e(0,-9,9,9,c.metal));}
const sword=c=>l('M0 12V-6',c.leather,6)+l('M-8-9h16',c.gold,4)+p('M-4-12V-49l4-11 4 11v37z',c.metal)+l('M0-45v28',c.linen,1.5);
const axe=(c,large=false)=>l(`M0 19V${large?-45:-29}`,c.woodLight,large?6:4)+p(large?'M0-43Q20-47 24-29Q14-15 0-22l-3-10z':'M0-29Q14-31 17-20Q10-12 0-16l-2-7z',c.metal)+l(large?'M18-40l3 9-7 8':'M12-26l2 5-5 6',c.linen,2);
function infantry(role,c,f,layer) {
 const moving=f>=2&&f<10,attack=f>=10,k=attack?f-10:0;
 const bounce=moving?walkBodyOffset(f-2,role==='shield'):0,wave=moving?Math.sin((f-2)*Math.PI/4):0;
 let hx=143,hy=115,rx=73,ry=116,angle=14+wave*2,gear=sword(c),prop='';
 if(role==='shield'&&attack){hx=[143,145,153,159,150,142][k];hy=[115,109,116,121,116,115][k];angle=[12,0,52,78,43,19][k];}
 if(role==='spear') {
  hx=148;hy=111;angle=attack?[22,15,56,75,47,27][k]:24+wave;
  gear=l('M0 62V-80',c.woodLight,4)+p('M0-99l-5 20 5 6 5-6z',c.metal)+l('M0-74v13',c.leather,6);
  // The second hand sits on the same rotated shaft, below the leading hand.
  const a=angle*Math.PI/180;rx=hx-Math.sin(a)*39;ry=hy+Math.cos(a)*39;
 }
 if(role==='archer') {
  hx=147;hy=109;angle=0;const pull=attack?[16,26,7,5,10,14][k]:15;
  rx=attack&&[2,3].includes(k)?113:hx-pull;ry=hy;
  gear=l('M-8-43Q16 0-8 43',ink,6)+l('M-8-43Q16 0-8 43',c.woodLight,3)+l(`M-8-43L${-pull} 0-8 43`,c.linen,1.6);
  if(!attack||![2,3].includes(k))gear+=l(`M${-pull} 0H28`,c.woodLight,2)+p('M27-3l8 3-8 3z',c.metal,ink,1);
 }
 if(role==='medic') {hx=140;hy=attack?[119,113,105,102,109,117][k]:120;angle=0;gear=p('M-6-9h22v12H-6z',c.linen)+l('M-2-5h14M-2 0h14',c.light,2);rx=124;ry=hy+4;}
 if(role==='raider') {gear=axe(c,true);hx=146;hy=attack?[117,112,120,124,120,116][k]:117;angle=attack?[18,-6,58,82,51,22][k]:20+wave;const a=angle*Math.PI/180;rx=hx-Math.sin(a)*16;ry=hy+Math.cos(a)*16;}
 if(role==='thrower') {gear=attack&&[2,3].includes(k)?'':axe(c);hx=attack?[143,142,158,163,151,145][k]:143;hy=attack?[114,94,107,117,117,116][k]:116;angle=attack?[16,0,64,85,42,19][k]:17+wave;}
 if(role==='banner') {
  const signal=medievalHornPose(f),x=signal.x+wave*.3,y=signal.y;
  // Mouthpiece stays at the lips throughout the held note. The bell points forward.
  gear='';prop=g(`translate(${x} ${y}) rotate(${signal.angle})`,
   p('M0-1L10-1Q23 6 34 0Q41-3 40-11l9-2Q53 6 39 16Q23 25 8 5L0 3z',c.gold)+
   l('M12 5Q27 18 40 9',c.wood,2)+p('M39-12l12-2 2 8-13 3z',c.linen)+
   l('M41-9l8-1',c.wood,2));
  const a=signal.angle*Math.PI/180;
  hx=x+23*Math.cos(a)-12*Math.sin(a);hy=y+23*Math.sin(a)+12*Math.cos(a);
  rx=73;ry=118;
 }
 const sh=role==='shield'?kite(c,wave):'';
 const equipment=sh+g(`translate(${hx} ${hy}) rotate(${angle})`,gear)+prop;
 if(layer==='face')return g(`translate(0 ${bounce})`,face());
 if(layer==='eyes')return g(`translate(0 ${bounce})`,eyes());
 if(layer==='headgear')return g(`translate(0 ${bounce})`,head(role,c,true));
 if(layer==='shield')return g(`translate(0 ${bounce})`,sh);
 if(layer==='equipment')return g(`translate(0 ${bounce})`,equipment);
 let body=(role==='banner'?g(`translate(0 ${medievalHornPose(f).breath})`,torso(role,c)):torso(role,c))+head(role,c)+limb(`M77 87L${role==='spear'?91:69} 107 ${rx} ${ry}`,c.dark,role==='raider'?10:8)+e(rx,ry,5,5,c.skin)+sh;
 body+=limb(`M111 87L${(111+hx)/2} ${hy-8} ${hx} ${hy}`,role==='medic'?c.linen:c.cloth,role==='raider'?10:8)+g(`translate(${hx} ${hy}) rotate(${angle})`,gear)+prop+e(hx,hy,5,5,c.skin);
 // Drawing the rear grip last keeps two-handed weapons readable.
 if(['spear','raider','archer','medic'].includes(role))body+=e(rx,ry,4.5,4.5,c.skin);
 return legs(role,c,f)+g(`translate(0 ${bounce})`,body);
}
// Signal: ease up, hold a note at the lips, then ease down. No flag-style lift.
const smooth=t=>t*t*(3-2*t);
export function medievalHornPose(f) {
 const t=f>=16?(f-16)/31:f>=10?(f-10)/5:0;
 const lift=f>=16?(f<24?smooth((f-16)/7):f<=39?1:1-smooth((f-40)/7)):
  f>=10?[0,.65,1,1,.65,0][f-10]:0;
 const lowering=f>=40?Math.sin(Math.PI*(f-40)/7)*1.2:0;
 return {x:130-14*lift+lowering,y:110-42*lift,angle:18*(1-lift),
  breath:lift===1?Math.sin(t*Math.PI*5)*.45:0,lift};
}
function quietHealerStep(phase,back) {
 const q=walkLeg(phase,back,true),pitch=q.foot.pitch*.6,pivot=q.pivot;
 const foot={x:96+(q.foot.x-96)*.55,y:176-(176-q.foot.y)*.4,pitch};
 const radians=pitch*Math.PI/180;
 const ankle={x:foot.x+pivot-pivot*Math.cos(radians)+8*Math.sin(radians),y:foot.y-pivot*Math.sin(radians)-8*Math.cos(radians)};
 const hip=q.hip,dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
 const along=(24*24-25*25+d*d)/(2*d),bend=Math.sqrt(Math.max(0,24*24-along*along));
 const knee={x:hip.x+along*dx/d+bend*dy/d,y:hip.y+along*dy/d-bend*dx/d};
 return {hip,knee,ankle,foot,pivot};
}
function specialistLegs(c,f,{healer=false}={}) {
 let out='';
 for(const back of [true,false]) {
  const dx=back?-5:5;
  const q=f>=2&&f<10?(healer?quietHealerStep(f-2,back):walkLeg(f-2,back,true)):{hip:{x:back?90:99,y:123},knee:{x:back?84:109,y:148},ankle:{x:back?80:111,y:167},foot:{x:back?80:111,y:176,pitch:0},pivot:0};
  const {hip:h,knee:k,ankle:a,foot:b,pivot}=q;
  out+=limb(`M${h.x+dx} ${h.y}L${k.x+dx} ${k.y} ${a.x+dx} ${a.y}`,back?c.dark:c.leather,healer?8:12);
  out+=limb(`M${k.x+dx} ${k.y+5}L${a.x+dx} ${a.y}`,back?c.leather:c.wood,healer?9:12)+l(`M${a.x+dx-4} ${a.y-10}h8`,c.linen,2);
  out+=g(`translate(${b.x+dx} ${b.y}) rotate(${b.pitch} ${pivot} 0)`,p('M-7-10h10l2 7 9 2v3H-7z',c.leather));
 }
 return out;
}
function berserkerHead(c,hatOnly=false) {
 const hair=p('M75 58Q64 45 77 29Q88 19 105 25l12 13-14-2-19 9-4 22-8 9-4-9z',c.hair)+
  p('M72 44q-7 18-3 32l9-3 5-20z',c.hair)+l('M76 42q7-12 19-12',c.wood,2);
 if(hatOnly)return hair;
 return p('M84 68v17h21V67',c.shade)+p('M79 44q7-12 24-7 11 4 12 16l8 8-9 5-2 11-23-2-10-13z',c.skin)+
  e(82,56,5,7,c.skin)+hair+l('M103 47l9 2',ink,2.4)+e(108,54,1.9,2,ink,'none')+
  l('M97 59l2 7',c.cloth,3)+p('M84 66l12 8 15-3-1 12-12 10-13-11-5-13z',c.hair)+
  l('M91 78l6 7M101 78l-2 8',c.wood,1.5);
}
const battleAxe=c=>l('M0 29V-59',c.woodLight,6)+p('M-2-54Q14-61 25-71Q36-58 35-36Q20-38 2-30L-2-38z',c.metal)+
 l('M26-65Q34-50 30-39',c.linen,3)+p('M-4-54h8v18h-8z',c.steel)+l('M0-51v12',c.gold,2)+l('M0 2v19',c.leather,7);
function berserker(c,f,layer) {
 const moving=f>=2&&f<10,attack=f>=10,k=attack?f-10:0;
 const wave=moving?Math.sin((f-2)*Math.PI/4):0,bounce=moving?walkBodyOffset(f-2,true):0;
 const lean=attack?[0,-2,3,5,2,0][k]:0,tilt=attack?[0,-2,3,4,2,0][k]:0;
 const pose=`translate(${lean} ${bounce}) rotate(${tilt} 96 123)`;
 const hx=attack?[148,150,155,158,153,149][k]:139,hy=attack?[112,101,113,120,116,112][k]:113;
 const angle=attack?[15,-7,51,81,46,20][k]:18+wave*1.3;
 const a=angle*Math.PI/180,rx=hx-Math.sin(a)*24,ry=hy+Math.cos(a)*24;
 const equipment=g(`translate(${hx} ${hy}) rotate(${angle})`,battleAxe(c));
 if(layer==='face')return g(pose,face());
 if(layer==='eyes')return g(pose,eyes());
 if(layer==='headgear')return g(pose,berserkerHead(c,true));
 if(layer==='equipment')return g(pose,equipment);
 if(layer==='shield')return '';
 const backFur=p('M70 81q14-12 37-3l14 11-8 15-15-5-13 6-18-10z',c.fur)+l('M75 82l-2 9M84 80l-1 12M114 85l2 7',c.linen,3);
 let body=backFur+p('M70 90q18-14 39-7l14 37-27 13-25-10z',c.skin)+
  p('M73 86l12-5 4 36-14 7-5-25zM108 83l11 8 6 29-15 6-5-28z',c.leather)+
  l('M84 96l20 24',c.dark,5)+p('M73 122h48l-2 22-22-4-25 5z',c.dark)+
  p('M75 124h43v12H75z',c.cloth)+l('M74 121h46',c.leather,7)+p('M95 118h10v9H95z',c.gold)+berserkerHead(c);
 body+=limb(`M76 91L94 116 ${rx} ${ry}`,c.shade,11)+e(rx,ry,5.5,5.5,c.skin);
 body+=limb(`M115 91L132 ${hy+8} ${hx} ${hy}`,c.skin,12)+l(`M${hx-8} ${hy+4}l6-3`,c.leather,5)+equipment+e(hx,hy,5.5,5.5,c.skin)+e(rx,ry,5,5,c.skin);
 return specialistLegs(c,f)+g(pose,body);
}
function healerHead(c,hatOnly=false) {
 const hair=p('M76 47q-5-21 14-24 19-3 27 17l-14-3-19 7-4 15-6-3z','#b2b2a1')+
  l('M80 34q4-7 8-7M92 28q5 0 10 3',c.linen,1.5);
 if(hatOnly)return hair;
 return p('M85 68v15h19V65',c.shade)+p('M79 44q6-11 24-7 10 4 11 16l9 9-9 4-2 10-20 1-11-14z',c.skin)+
  e(82,57,4,6,c.skin)+hair+l('M102 48l10 1','#797d73',2.6)+e(108,54,1.7,2,ink,'none')+
  p('M88 68l10 6 14-3-3 10-12 3-8-6z','#b2b2a1')+l('M107 68h6','#795340',1.5);
}
function herbalist(c,f,layer) {
 const moving=f>=2&&f<10,attack=f>=10,k=attack?f-10:0;
 const wave=moving?Math.sin((f-2)*Math.PI/4):0,bounce=moving?walkBodyOffset(f-2,true)*.55:0;
 const lean=attack?[0,0,1,2,1,0][k]:0,pose=`translate(${lean} ${bounce})`;
 const hx=attack?[122,128,138,148,141,127][k]:121,hy=attack?[122,116,107,105,112,120][k]:122;
 const staff=l('M64 82Q60 97 62 111L66 171',c.woodLight,5)+l('M62 102v15',c.leather,6)+p('M62 79q-6-5-4-10 5-3 9 3l-3 9z',c.wood);
 // A rolled bandage is offered in the palm; herbs remain tied to the shoulder bag.
 const wrap=g(`translate(${hx} ${hy})`,e(5,-5,9,6,c.linen)+e(12,-5,3,5,c.light,ink,1.2)+
  (attack?p(`M-2-5q-8 ${[3,5,8,10,6,3][k]}-10 0l-2-3 6-1z`,c.linen):''));
 const equipment=staff+wrap;
 if(layer==='face')return g(pose,face());
 if(layer==='eyes')return g(pose,eyes());
 if(layer==='headgear')return g(pose,healerHead(c,true));
 if(layer==='equipment')return g(pose,equipment);
 if(layer==='shield')return '';
 let body=p('M73 81q-17 10-17 30l1 33 18 8 12-15 15 15 15-14-3-51-18-8z',c.dark)+
  p(`M77 83q17-9 31 0l8 40 5 ${29+wave*.6}-24 5-24-3 2-27z`,c.linen)+
  p('M76 81l14 10 17-10 9 10-13 16-20-3-13-14z',c.cloth)+
  l('M89 107v35',c.woodLight,2)+l('M76 126h40',c.leather,4)+e(95,126,3,3,c.gold)+
  l('M108 86l-33 47',c.leather,5)+p('M61 127h24v23H61z',c.leather)+p('M61 127h24l-4 9H65z',c.woodLight)+
  l('M76 128l2-15M73 127l-4-15',c.dark,2)+p('M78 116q-9-7-6-12 7 0 7 7q5-9 10-5-1 7-11 10z','#829466',ink,1.4)+healerHead(c);
 body+=limb('M77 91L70 109 62 113',c.dark,8)+staff+e(62,113,4.5,4.5,c.skin);
 body+=limb(`M110 92L117 ${hy+2} ${hx} ${hy}`,c.cloth,8)+e(hx,hy,4.5,4.5,c.skin)+wrap;
 return specialistLegs(c,f,{healer:true})+g(pose,body);
}
function crew(c,f,x,layer) {
 const moving=f>=2&&f<10,bounce=moving?walkBodyOffset(f-2):0;
 const transform=`translate(${x} 61) scale(.65)`;
 if(['face','eyes','headgear'].includes(layer))return g(transform,g(`translate(0 ${bounce})`,layer==='face'?face():layer==='eyes'?eyes():head('thrower',c,true)));
 let body=p('M75 82q17-10 36-2l8 44H72z',c.cloth)+head('thrower',c)+l('M80 87l25 35',c.leather,4)+p('M73 125h42l5 21-22-4-24 4z',c.dark)+limb('M77 88L95 110 137 113',c.shade,7)+limb('M109 88L124 103 148 110',c.skin,7)+e(148,110,4,4,c.skin)+e(137,113,4,4,c.skin);
 return g(transform,legs('thrower',c,f)+g(`translate(0 ${bounce})`,body));
}
function ram(c,f,layer) {
 const moving=f>=2&&f<10,attack=f>=10,k=attack?f-10:0;
 const shift=attack?[0,-6,8,13,5,1][k]:moving?Math.sin((f-2)*Math.PI/4)*1.2:0;
 const crewXs=[-42,11];
 if(['face','eyes','headgear'].includes(layer))return crewXs.map(x=>crew(c,f,x,layer)).join('');
 if(layer==='shield')return '';
 let machine=p('M46 145h119v10H46z',c.wood)+p('M61 115h10v33H61zM144 115h10v33h-10z',c.woodLight)+l('M68 125l18 20M149 126l-18 20',c.wood,6)+p('M55 117h103v8H55z',c.wood)+l('M65 124v14M149 124v14',c.steel,3);
 machine+=g(`translate(${shift} 0)`,p('M57 128h113l13 6-13 7H57z',c.woodLight)+l('M62 132h102',c.wood,3)+p('M164 124l17 2 7 8-7 11-17-2z',c.metal)+l('M175 128l5 6-5 7',c.steel,3)+p('M51 126h11v18H51z',c.leather));
 for(const x of [57,152])machine+=e(x,160,15,15,c.wood)+e(x,160,11,11,c.woodLight)+g(`rotate(${moving?(f-2)*25:0} ${x} 160)`,l(`M${x-10} 160h20M${x} 150v20M${x-7} 153l14 14`,c.wood,2))+e(x,160,3,3,c.metal);
 if(layer==='equipment')return machine;
 return crewXs.map(x=>crew(c,f,x,'full')).join('')+machine;
}
export const medievalRoles=['shield','spear','archer','medic','raider','thrower','banner','siege'];
export function medievalRig(role,enemy,frame,layer='full') {
 if(!medievalRoles.includes(role))throw Error(`Unknown medieval role ${role}`);
 if(!Number.isInteger(frame)||frame<0||frame>=(role==='banner'?48:16))throw Error(`Invalid ${role} frame ${frame}`);
 if(role==='banner'&&[1,16,47].includes(frame))frame=0;
 const c=palette(enemy);
 return role==='siege'?ram(c,frame,layer):role==='raider'?berserker(c,frame,layer):role==='medic'?herbalist(c,frame,layer):infantry(role,c,frame,layer);
}
