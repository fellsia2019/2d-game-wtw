/** Approved sixth-era art. Eight models shared by the game and workshop. */
import {walkLeg, walkBodyOffset} from './walk-cycle.mjs';
const ink='#292f36';
const p=(d,c,s=ink,w=2.2)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const l=(d,c,w=3)=>p(d,'none',c,w);
const e=(x,y,rx,ry,c,s=ink,w=2)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${s}" stroke-width="${w}"/>`;
const g=(t,s)=>`<g transform="${t}">${s}</g>`;
const limb=(d,c,w=8)=>l(d,ink,w+3)+l(d,c,w);
const pal=enemy=>({cloth:enemy?'#a34548':'#396b98',light:enemy?'#efb394':'#9dcbea',dark:enemy?'#61313e':'#273c60',skin:'#dfb08d',shade:'#ad775d',metal:'#c7d4db',steel:'#70818f',linen:'#f0dfb5',wood:'#856043',woodLight:'#c09967',leather:'#604333',gold:'#deb76b',hair:'#574438'});
export const highMedievalRoles=['shield','spear','archer','medic','raider','thrower','banner','siege'];
export const highMedievalNames=['Рыцарь щита','Алебардист','Арбалетчик','Монах лекарь','Конный рейдер','Огнемётчик смолы','Герольд','Требушет'];
export const highMedievalFrameCounts=Object.fromEntries(highMedievalRoles.map(role=>[role,['archer','banner','siege'].includes(role)?48:16]));
function head(role,c,hatOnly=false) {
 const anatomy=p('M86 67v15h18V66',c.shade)+p('M79 44q7-13 24-8 12 3 13 17l8 9-9 4-2 10-23-1-10-14z',c.skin)+e(82,57,4,6,c.skin)+l('M103 48l9 1',ink,2)+e(109,54,1.8,2,ink,'none')+l('M110 68h5','#82503a',1.6);
 let hat='';
 if(['shield','raider'].includes(role))hat=p('M74 43Q74 24 95 20q21 2 25 20l-15-3-20 6-7 13z',c.metal)+p('M75 44l9-4-2 30-9 4z',c.steel)+l('M80 35q17-8 33 0',c.linen,3)+l('M95 23v12',c.gold,2)+p('M78 46l6-3-2 15-6 5z',c.metal);
 else if(['spear','archer','thrower','siege'].includes(role))hat=p('M76 40q0-17 20-19 19 2 21 17z',c.steel)+p('M67 39q25-9 58 0l-4 7q-22-7-50 2z',c.metal)+l('M81 31l29-1',c.linen,2);
 else if(role==='medic')hat=p('M75 48q-7-20 12-25 21-5 31 15l-17-4-16 10-5 18-7-4z',c.dark)+p('M86 28q9-5 17 1l-1 8-16 3z',c.hair);
 else hat=p('M75 45q-4-18 15-23 18-2 27 16l-14-2-18 7-6 13-6-3z',c.dark)+l('M76 36l36-5',c.gold,4)+p('M88 25q-3-15 7-17l5 12-7 10z',c.linen);
 return hatOnly?hat:anatomy+hat;
}
function legs(c,f,armored=false) {
 let s='';
 for(const back of [true,false]) {
  const q=f>=2&&f<10?walkLeg(f-2,back,armored):{hip:{x:back?89:101,y:123},knee:{x:back?81:108,y:148},ankle:{x:back?80:111,y:168},foot:{x:back?80:111,y:176,pitch:0},pivot:0};
  const {hip:h,knee:k,ankle:a,foot:b,pivot}=q;
  s+=limb(`M${h.x} ${h.y}L${k.x} ${k.y} ${a.x} ${a.y}`,back?c.dark:c.cloth,9);
  if(armored)s+=e(k.x,k.y,7,6,c.metal)+limb(`M${k.x} ${k.y+6}L${a.x} ${a.y-3}`,back?c.steel:c.metal,9);
  else s+=limb(`M${k.x} ${k.y+7}L${a.x} ${a.y}`,c.leather,9);
  s+=g(`translate(${b.x} ${b.y}) rotate(${b.pitch} ${pivot} 0)`,p('M-7-10h10l3 7 9 2v3H-7z',armored?c.steel:c.leather));
 }
 return s;
}
const emblem=c=>p('M-8-10h6v7h6v-7h6v20h-6V3h-6v7h-6z',c.gold,'none');
function torso(role,c) {
 let s=['shield','medic','banner'].includes(role)?p('M73 79L51 96l-5 57 22-9 18 13 29-16 8-51-18-13z',c.dark):'';
 s+=p('M75 81q19-10 36 0l8 43-24 14-26-13z',role==='medic'?c.dark:c.cloth);
 if(['shield','spear'].includes(role)) {
  s+=p('M77 83l17-8 18 8 7 35-24 12-23-13z',c.steel);
  for(const y of [91,99,107,115])for(let x=80;x<109;x+=8)s+=l(`M${x} ${y}q3 4 6 0`,c.metal,1.5);
  s+=p('M68 84l17-10 9 13-18 10zM107 77l15 8 3 13-17-7z',c.metal);
  if(role==='shield')s+=p('M83 89l13-8 14 10 4 24-20 10-14-10z',c.metal)+l('M94 88v25',c.linen,2);
 }
 if(role==='archer')s+=p('M76 82l14-5 22 7 5 36-39 6z',c.leather)+l('M80 89l27 25M80 101l26 1',c.woodLight,2)+p('M58 92h17v42H58z',c.leather)+l('M63 92V69M69 92V67',c.woodLight,3);
 if(role==='thrower')s+=p('M53 84h20v42H53z',c.wood)+p('M52 87h22v8H52zM52 115h22v7H52z',c.steel)+l('M66 81l37 43',c.leather,5)+p('M79 82l27 2 10 30-18 11-21-10z',c.leather)+l('M87 88l13 26',c.gold,2);
 s+=p(role==='medic'?'M73 113h41l9 51-29 6-24-5z':'M73 124h43l5 23-25-5-24 6z',role==='medic'?c.dark:c.cloth)+l('M72 123h44',c.leather,5)+e(96,123,4,4,c.gold);
 if(role==='medic')s+=p('M80 82l11 10 13-12 8 13-16 10-17-10z',c.linen)+l('M96 105v40',c.gold,2)+p('M103 128h24v25h-24z',c.leather)+l('M108 139h13M114 133v12',c.linen,3);
 if(role==='banner')s+=p('M75 84l16-7 19 8 7 32-41 1z',c.linen)+g('translate(96 101)',emblem(c))+p('M75 123h42v25l-21-6-21 6z',c.linen)+l('M81 141h30',c.gold,3);
 return s;
}
const sword=c=>l('M0 14V-8',c.leather,5)+l('M-9-10h18',c.gold,4)+p('M-4-14V-54l4-11 4 11v40z',c.metal)+l('M0-52v30',c.linen,1.5);
function infantry(role,c,f,layer) {
 const moving=f>=2&&f<10,attack=f>=10,k=Math.min(5,Math.max(0,f-10));
 const wave=moving?Math.sin((f-2)*Math.PI/4):0,bounce=moving?walkBodyOffset(f-2,role==='shield'):0;
 let hx=141,hy=115,rx=75,ry=114,angle=18+wave*2,gear=sword(c),extra='';
 if(role==='shield'&&attack){hx=[141,141,155,159,150,142][k];hy=[115,102,109,119,116,114][k];angle=[18,-2,48,78,45,23][k];}
 const shield=role==='shield'?g(`translate(55 124) rotate(${wave})`,p('M-27-32Q0-43 27-32v33Q18 24 0 42Q-18 24-27 1z',c.metal)+p('M-21-29Q0-35 21-29v28Q13 20 0 33Q-13 20-21-1z',c.cloth)+g('translate(0 -4) scale(1.5)',emblem(c))):'';
 if(role==='spear') {
  hx=140;hy=111;angle=attack?[16,7,45,68,42,20][k]:17+wave;
  gear=l('M0 65V-65',c.woodLight,5)+p('M0-96l-5 22 5 7 5-7z',c.metal)+p('M2-73Q23-86 26-57l-23 1z',c.metal)+l('M23-76Q26-67 25-60',c.linen,2)+p('M-2-70l-15 9 15 6z',c.steel)+l('M0-68v18',c.steel,5);
  const a=angle*Math.PI/180;rx=hx-Math.sin(a)*35;ry=hy+Math.cos(a)*35;
 }
 if(role==='archer') {
  hx=140;hy=111;angle=0;const pull=attack?[23,29,7,4,13,20][k]:21;
  rx=attack&&[2,3].includes(k)?109:hx-pull;ry=hy;
  gear=p('M-24 4l49-8 2 7-46 11z',c.wood)+l('M8-28Q25 0 8 28',ink,6)+l('M8-28Q25 0 8 28',c.steel,3)+l(`M8-28L${-pull} 0 8 28`,c.linen,1.5)+l('M-3 7l-2 11',c.steel,3);
  if(!attack||![2,3].includes(k))gear+=l('M-15 0h47',c.woodLight,2)+p('M30-3l7 3-7 3z',c.metal,ink,1);
 }
 if(role==='medic') {
  hx=attack?[122,129,139,147,140,125][k]:121+wave*1.5;hy=attack?[120,112,105,104,112,119][k]:120+(moving?Math.cos((f-2)*Math.PI/4):0);angle=0;rx=69;ry=111;
  extra=l('M67 80L69 169',c.woodLight,5)+p('M66 78q-9-8-5-14 10-3 12 8z',c.wood);
  gear=e(4,-5,9,6,c.linen)+e(10,-5,3,5,c.gold)+p('M-5-5l-9 8 6 3 7-7z',c.linen);
 }
 if(role==='thrower') {
  hx=144;hy=attack?[116,112,109,110,113,118][k]:117;rx=126;ry=hy+4;angle=0;
  gear=p('M-22-6h39l12 6-12 6h-39z',c.gold)+l('M-16-3h28',c.wood,2)+p('M-18 5h10v12h-10z',c.leather)+p('M17-7h6v14h-6z',c.steel);
  extra=l(`M61 120Q90 143 ${hx-17} ${hy+7}`,ink,7)+l(`M61 120Q90 143 ${hx-17} ${hy+7}`,c.leather,4);
  if(attack&&k>=1&&k<=4){const length=[0,13,24,29,16,0][k];gear+=p(`M29-2q${length*.45}-10 ${length}-2l-5 3 6 4q-${length*.4} 7-${length} 0z`,'#df8a3c')+l(`M30 0h${length*.6}`,'#f6d77d',2);}
 }
 if(role==='banner') {
  const t=f>=16?(f-16)/31:attack?k/5:0,lift=Math.sin(Math.PI*t)**2;
  hx=138;hy=116-12*lift;angle=7+lift*10;
  gear=l('M0 48V-87',c.woodLight,5)+p('M0-100l-6 10 6 8 6-8z',c.gold)+p(`M2-83l38 ${wave*2}v39l-19-8-19 8z`,c.cloth)+g('translate(21 -65)',emblem(c))+l('M4-80h32',c.gold,2);
 }
 const equipment=shield+extra+g(`translate(${hx} ${hy}) rotate(${angle})`,gear);
 if(layer==='equipment')return g(`translate(0 ${bounce})`,equipment);
 if(layer==='headgear')return g(`translate(0 ${bounce})`,head(role,c,true));
 if(layer==='face')return g(`translate(0 ${bounce})`,p('M91 46h24v27H91z','#fff','none'));
 if(layer==='eyes')return g(`translate(0 ${bounce})`,e(109,54,4,3,'#fff','none'));
 let body=torso(role,c)+head(role,c)+limb(`M77 89L80 109 ${rx} ${ry}`,c.dark,8)+e(rx,ry,5,5,c.skin)+shield+extra;
 body+=limb(`M111 89L125 ${hy-4} ${hx} ${hy}`,role==='shield'?c.steel:role==='medic'?c.dark:c.cloth,8)+g(`translate(${hx} ${hy}) rotate(${angle})`,gear)+e(hx,hy,5,5,c.skin);
 if(['spear','archer','thrower'].includes(role))body+=e(rx,ry,4.5,4.5,c.skin);
 return legs(c,f,role==='shield')+g(`translate(0 ${bounce})`,body);
}
function cavalry(c,f,layer) {
 const moving=f>=2&&f<10,attack=f>=10,k=Math.max(0,f-10),phase=moving?(f-2)*Math.PI/4:0,bounce=moving?Math.sin(phase*2):0;
 const rt=`translate(26 ${22+bounce}) scale(.65)`;
 const hx=attack?[145,142,155,165,154,146][k]:143,hy=attack?[111,101,109,117,114,112][k]:112,angle=attack?[18,-3,48,75,45,23][k]:22;
 const blade=g(`translate(${hx} ${hy}) rotate(${angle})`,sword(c));
 if(layer==='face')return g(rt,p('M91 46h24v27H91z','#fff','none'));
 if(layer==='eyes')return g(rt,e(109,54,4,3,'#fff','none'));
 if(layer==='headgear')return g(rt,head('raider',c,true));
 if(layer==='equipment')return g(rt,blade);
 function horseLeg(front,far) {
  const root={x:front?130:56,y:front?121:122},a=phase+(front?Math.PI:0)+(far?Math.PI:0),swing=moving?Math.sin(a)*12:far?-6:5,lift=moving?Math.max(0,Math.cos(a))*10:0;
  const knee={x:root.x+(front?-4:6)+swing*.4,y:146-lift*.35},foot={x:root.x+swing,y:174-lift};
  const color=far?'#66554e':'#988173';
  return limb(`M${root.x} ${root.y}L${knee.x} ${knee.y} ${foot.x} ${foot.y-3}`,color,8)+e(knee.x,knee.y,4,4,color)+p(`M${foot.x-6} ${foot.y-5}h10l3 5h-14z`,ink);
 }
 let horse=l('M46 106Q23 111 22 140l-8 10','#493b36',8)+horseLeg(false,true)+horseLeg(true,true);
 horse+=g(`translate(0 ${bounce})`,p('M44 105q24-12 64 1 18 0 26-26l9-15q9-6 18 7l16 7q10 5 2 14-8 5-20-4l-9 17q-6 29-28 31H66q-29-3-22-32z','#988173')+p('M132 92l9-20 9-7 4 10-14 29z','#493b36')+p('M148 68l-2-14 8 2 3 13z','#988173')+e(165,79,2,2,ink,'none')+e(178,85,1.5,1.5,ink,'none')+l('M166 91l10 1',ink,1.5)+p('M49 109q35-8 74 7l-6 27-18-5-20 5-26-8z',c.cloth)+l('M57 132l22 5 20-5 16 4',c.gold,3)+p('M73 103q13-10 29-1l4 9H73z',c.leather)+l('M92 109v23',c.leather,4)+l('M154 74l5 17 18-2',c.leather,3)+l('M163 87L111 96',c.leather,2));
 horse+=horseLeg(false,false)+horseLeg(true,false);
 let rider=p('M74 82l19-8 19 9 8 35-27 10-22-12z',c.steel)+p('M75 88h38v30l-19 9-19-9z',c.cloth)+g('translate(95 105)',emblem(c))+head('raider',c);
 rider+=limb('M91 117L112 141 100 165',c.steel,9)+e(112,141,6,5,c.metal)+p('M94 160h13l7 7H92z',c.steel)+l('M91 162h21v8H91z',c.gold,2)+limb('M78 88L91 108 131 107',c.steel,7)+e(131,107,4,4,c.skin)+limb(`M110 87L124 ${hy-7} ${hx} ${hy}`,c.metal,7)+blade+e(hx,hy,4,4,c.skin);
 return horse+g(rt,rider);
}
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const phaseOf=(f,previews)=>f>=16?f-16:f>=10?previews[f-10]:0;
const rotated=(x,y,angle,dx,dy)=>{const a=angle*Math.PI/180;return {x:x+dx*Math.cos(a)-dy*Math.sin(a),y:y+dx*Math.sin(a)+dy*Math.cos(a)};};
export function crossbowPose(f) {
 const q=phaseOf(f,[0,5,8,14,22,29]);
 let x=101,y=108,angle=0,pull=24,loaded=true,cocking=false;
 if(q<5){const t=smooth(q/4);y=mix(108,91,t);angle=-3*t;}
 else if(q<9){y=91;angle=-3;pull=q>=7?65:24;loaded=q<7;}
 else if(q<14){const t=smooth((q-9)/4);x=mix(101,126,t);y=mix(91,84,t);angle=mix(-3,90,t);pull=65;loaded=false;}
 else if(q<23){x=126;y=84;angle=90;pull=mix(65,24,smooth((q-14)/8));loaded=false;cocking=true;}
 else if(q<27){x=126;y=84;angle=90;loaded=q>=25;}
 else {const t=smooth((q-27)/4);x=mix(126,101,t);y=mix(84,108,t);angle=mix(90,0,t);}
 if(q===31){x=101;y=108;angle=0;}
 return {q,x,y,angle,pull,loaded,cocking};
}
function crossbowman(c,f,layer) {
 const moving=f>=2&&f<10,bounce=moving?walkBodyOffset(f-2):0;
 const pose=crossbowPose(f),{q,x,y,angle,pull,loaded,cocking}=pose;
 const rear=rotated(x,y,angle,17,10),front=rotated(x,y,angle,cocking?pull:51,cocking?-1:10);
 if(q>=23&&q<25){front.x=130;front.y=122;}
 let weapon=p('M0-3h77v8H28l-9 7-13-1z',c.wood)+l('M5-1h66',c.woodLight,2)+e(24,0,3,3,c.linen)+l('M18 6q-8 14 8 8',c.steel,2);
 // Bow is transverse to the tiller, in a shallow three-quarter projection.
 weapon+=l('M64-18Q81-12 76 0Q83 10 84 18',ink,6)+l('M64-18Q81-12 76 0Q83 10 84 18',c.woodLight,3)+l(`M64-18L${pull} -1 84 18`,c.linen,1.5)+l('M76 1h8v6h-8',c.leather,4)+p('M80-5h8v11h-8','none',c.steel,2);
 if(loaded)weapon+=l('M26-3h55',c.woodLight,2)+p('M79-6l7 3-7 3z',c.metal,ink,1);
 const equipment=g(`translate(${x} ${y+bounce}) rotate(${angle})`,weapon);
 if(layer==='equipment')return equipment;
 if(layer==='face')return g(`translate(0 ${bounce})`,p('M91 46h24v27H91z','#fff','none'));
 if(layer==='eyes')return g(`translate(0 ${bounce})`,e(109,54,4,3,'#fff','none'));
 if(layer==='headgear')return g(`translate(0 ${bounce})`,head('archer',c,true));
 let body=torso('archer',c)+head('archer',c)+limb(`M77 89L91 107 ${rear.x} ${rear.y}`,c.dark,8)+limb(`M111 89L129 111 ${front.x} ${front.y}`,c.cloth,8)+g(`translate(${x} ${y}) rotate(${angle})`,weapon)+e(rear.x,rear.y,4.5,4.5,c.skin)+e(front.x,front.y,4.5,4.5,c.skin);
 if(q>=23&&q<25)body+=l('M128 112v22',c.woodLight,2);
 const feet=q>=13&&q<=26?limb('M89 123L80 149 80 168',c.dark,9)+limb('M101 123L114 147 124 168',c.cloth,9)+p('M73 166h11l11 9H73zM118 166h10l11 9h-22z',c.leather):legs(c,f);
 return feet+g(`translate(0 ${bounce})`,body);
}
function crew(c,f,x,layer) {
 const bounce=f>=2&&f<10?walkBodyOffset(f-2):0,transform=`translate(${x} 91) scale(.48)`;
 if(layer==='face')return g(transform,g(`translate(0 ${bounce})`,p('M91 46h24v27H91z','#fff','none')));
 if(layer==='eyes')return g(transform,g(`translate(0 ${bounce})`,e(109,54,4,3,'#fff','none')));
 if(layer==='headgear')return g(transform,g(`translate(0 ${bounce})`,head('siege',c,true)));
 const q=phaseOf(f,[0,5,9,12,22,29]),winding=q>=16&&q<31,handY=winding?119+Math.sin(f*.8)*7:122;
 return g(transform,legs(c,f)+g(`translate(0 ${bounce})`,p('M76 82h36l7 42-44 9z',c.cloth)+head('siege',c)+limb(`M77 88L97 110 143 ${handY}`,c.dark,7)+limb(`M111 88L128 106 151 ${handY}`,c.cloth,7)+e(151,handY,4,4,c.skin)+e(143,handY,4,4,c.skin)));
}
export function trebuchetPose(f) {
 const q=phaseOf(f,[0,5,9,12,22,29]),moving=f>=2&&f<10;
 // Long end starts low behind the axle and sweeps up/forward clockwise.
 // Sling and hinged ballast have independent world-space orientations.
 const keys=[[0,140,116],[3,140,116],[5,160,112],[7,195,96],[9,228,62],[10,242,35],[12,272,-5],[14,286,45],[16,280,90],[27,160,70],[31,140,116]];
 let angle=140,slingAngle=116;
 for(let i=1;i<keys.length;i++)if(q<=keys[i][0]){const a=keys[i-1],b=keys[i],t=(q-a[0])/(b[0]-a[0]);angle=mix(a[1],b[1],q>=16?smooth(t):t);slingAngle=mix(a[2],b[2],t);break;}
 if(moving){angle=280;slingAngle=90+Math.sin((f-2)*Math.PI/4)*3;}
 const pivot={x:96,y:91},tip=rotated(pivot.x,pivot.y,angle,65,0),hinge=rotated(pivot.x,pivot.y,angle,-24,0);
 const a=slingAngle*Math.PI/180,pouch={x:tip.x+42*Math.cos(a),y:tip.y+42*Math.sin(a)};
 return {q,angle,slingAngle,pivot,tip,hinge,pouch,released:q>=10&&q<29,loaded:!moving&&(q<10||q>=29),winding:q>=16&&q<31};
}
function trebuchet(c,f,layer) {
 if(['face','eyes','headgear'].includes(layer))return [-40,95].map(x=>crew(c,f,x,layer)).join('');
 const moving=f>=2&&f<10,pose=trebuchetPose(f),{q,angle,pivot,tip,hinge,pouch,loaded,winding}=pose;
 let machine=p('M35 151h124v10H35z',c.wood)+p('M45 143h99v5H45z',c.woodLight)+l('M51 150L96 91 144 150',c.woodLight,9)+l('M66 150L96 91 128 150',c.wood,6)+l('M53 140h81',c.steel,2);
 machine+=p('M20 171h80v5H20z',c.wood)+l('M23 170h73',c.woodLight,2);
 machine+=g(`translate(${pivot.x} ${pivot.y}) rotate(${angle})`,p('M-29-4h96v8h-96z',c.woodLight)+l('M-24-1h87',c.wood,2)+l('M65-3l5 3-4 4',c.steel,2));
 // Ballast hangs from a hinge; it is never rotated as part of the beam.
 machine+=l(`M${hinge.x} ${hinge.y}v15`,c.steel,4)+p(`M${hinge.x-13} ${hinge.y+15}h26v24h-26z`,c.wood)+p(`M${hinge.x-9} ${hinge.y+19}h18v16h-18z`,'#8c969a')+l(`M${hinge.x-12} ${hinge.y+21}h24M${hinge.x-12} ${hinge.y+33}h24`,c.steel,3)+e(hinge.x,hinge.y,3,3,c.steel);
 machine+=l(`M${tip.x} ${tip.y}L${pouch.x-2} ${pouch.y}`,c.linen,1.7);
 if(q<10||q>=29||moving)machine+=l(`M${tip.x+2} ${tip.y+1}L${pouch.x+3} ${pouch.y}`,c.linen,1.7);
 else machine+=l(`M${pouch.x+3} ${pouch.y}Q${pouch.x+12} ${pouch.y+2} ${pouch.x+12} ${pouch.y-9}`,c.linen,1.7);
 machine+=p(`M${pouch.x-7} ${pouch.y-2}q7 9 14 0l-2-4h-10z`,c.leather);
 if(loaded)machine+=e(pouch.x,pouch.y-3,5,4,'#c0c5b8');
 if(q>=10&&q<=12){const release=trebuchetPose(26).pouch,t=q-10;machine+=e(release.x+27*t,release.y-3-22*t+2*t*t,5,4,'#c0c5b8');}
 if(winding){const tie=rotated(pivot.x,pivot.y,angle,52,0);machine+=l(`M44 143L${tie.x} ${tie.y}`,c.linen,1.8);}
 machine+=e(96,91,6,6,c.steel)+e(96,91,2.5,2.5,c.gold)+l('M37 148v-8h16M151 149v-9h15',c.woodLight,4);
 for(const x of [45,148])machine+=e(x,163,12,12,c.wood)+e(x,163,8,8,c.woodLight)+g(`rotate(${moving?(f-2)*27:0} ${x} 163)`,l(`M${x-7} 163h14M${x} 156v14`,c.wood,2))+e(x,163,2.5,2.5,c.steel);
 machine+=e(44,143,5,5,c.steel)+g(`rotate(${winding?q*35:0} 44 143)`,l('M44 143l-7-6',c.gold,3));
 if(layer==='equipment')return machine;
 return [-40,95].map(x=>crew(c,f,x,'full')).join('')+machine;
}
export function highMedievalRig(role,enemy,frame,layer='full') {
 if(!highMedievalRoles.includes(role))throw Error(`Unknown role ${role}`);
 if(!Number.isInteger(frame)||frame<0||frame>=highMedievalFrameCounts[role])throw Error(`Invalid frame ${frame}`);
 if(role==='banner'&&[1,16,47].includes(frame))frame=0;
 const c=pal(enemy);
 return role==='raider'?cavalry(c,frame,layer):role==='siege'?g('translate(8 0)',trebuchet(c,frame,layer)):role==='archer'?crossbowman(c,frame,layer):infantry(role,c,frame,layer);
}
