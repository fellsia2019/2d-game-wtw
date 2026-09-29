/** Seventh-era workshop only. Eight shared models; no game registration. */
import {walkLeg,walkBodyOffset} from './walk-cycle.mjs';
const ink='#292c34';
const p=(d,c,s=ink,w=2)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const l=(d,c,w=3)=>p(d,'none',c,w);
const e=(x,y,rx,ry,c,s=ink,w=2)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${s}" stroke-width="${w}"/>`;
const g=(t,b)=>`<g transform="${t}">${b}</g>`;
const limb=(d,c,w=8)=>l(d,ink,w+3)+l(d,c,w);
const pal=enemy=>({cloth:enemy?'#a5484e':'#3c709f',dark:enemy?'#632d3c':'#243d62',light:enemy?'#ecb0a1':'#aed0df',skin:'#dfb08e',shadow:'#a6765d',steel:'#657684',metal:'#c7d5d9',gold:'#deb96c',linen:'#edddba',wood:'#80563b',leather:'#684631'});
export const renaissanceRoles=['shield','spear','archer','medic','raider','thrower','banner','siege'];
export const renaissanceNames=['Кирасир','Пикинёр караула','Мушкетёр','Военный хирург','Лёгкий драгун','Гренадер','Капитан роты','Полевая пушка'];
export const renaissanceFrameCounts=Object.fromEntries(renaissanceRoles.map(r=>[r,['archer','banner','siege'].includes(r)?48:16]));
const phase=f=>f>=16?f-16:f>=10?[0,7,11,17,24,29][f-10]:0;
const rot=(x,y,a,dx,dy)=>{const t=a*Math.PI/180;return {x:x+dx*Math.cos(t)-dy*Math.sin(t),y:y+dx*Math.sin(t)+dy*Math.cos(t)};};
function face(c){return p('M87 67v15h16V66',c.shadow)+p('M80 42q12-9 26 0l7 11 8 8-8 4-2 10-22-2-11-14z',c.skin)+e(82,57,4,5,c.skin)+l('M102 48h9',ink,2)+e(108,54,1.8,2,ink,'none')+l('M106 67h8','#82503a',1.5);}
function hat(role,c){
 if(['shield','spear'].includes(role))return p('M73 42q1-17 20-22l8-9 6 14q13 6 12 17z',c.steel)+p('M67 39l12-3q19 7 35-1l14-3-2 12q-26 7-58 1z',c.metal)+l('M97 23l3 12',c.gold,2)+p('M74 46l9-2-2 22-7 4z',c.steel);
 if(role==='thrower')return p('M77 43q-4-21 18-25 21 7 21 24z',c.dark)+p('M84 22l10-17 13 20-5 10-15-1z',c.cloth)+l('M88 25h13M94 18v13',c.gold,2)+l('M79 42h33',c.gold,3);
 const feather=['raider','banner'].includes(role)?p('M83 28q-9-23 6-23l3 17-6 10z',c.light)+l('M84 29l3-19',c.gold,1):'';
 return feather+p('M76 38l4-19 28-2 9 20z',role==='medic'?c.leather:c.dark)+p('M64 38q27-9 63-2l6 6q-34 7-68 4z',role==='medic'?c.leather:c.dark)+l('M79 32h33',c.gold,3);
}
function legs(c,f,armor=false){let body='';for(const far of [true,false]){const q=f>=2&&f<10?walkLeg(f-2,far,armor):{hip:{x:far?89:102,y:124},knee:{x:far?81:110,y:148},ankle:{x:far?80:112,y:168},foot:{x:far?80:112,y:176,pitch:0},pivot:0};const{hip:h,knee:k,ankle:a,foot:b,pivot}=q;body+=limb(`M${h.x} ${h.y}L${k.x} ${k.y}`,far?c.dark:c.cloth,13)+limb(`M${k.x} ${k.y}L${a.x} ${a.y}`,c.leather,9)+e(k.x,k.y,7,5,armor?c.metal:c.linen)+g(`translate(${b.x} ${b.y}) rotate(${b.pitch} ${pivot} 0)`,p('M-7-10h10l3 7 9 2v3H-7z',c.leather));}return body;}
function torso(role,c){const armor=['shield','spear','banner'].includes(role);let body=p('M74 81q21-10 38 0l7 44-22 9-26-8z',role==='medic'?c.linen:c.cloth)+p('M70 123h47l3 18-22 4-27-6z',c.cloth);if(armor)body+=p('M77 81l19-6 15 8 7 34-22 12-23-12z',c.steel)+p('M81 83l14-4 13 7 5 27-17 9-17-9z',c.metal)+l('M95 82v32',c.linen,2)+p('M75 121l19 6-2 17-21-7zM99 127l16-6 6 16-20 8z',c.steel);body+=p('M81 79l12 8 12-9 6 6-15 12-19-10z',c.linen)+l('M73 124h44',c.leather,5)+e(96,124,4,3,c.gold);if(['archer','thrower','raider'].includes(role)){body+=l('M77 82l35 38',c.leather,6);if(role==='archer')for(let i=0;i<5;i++)body+=g(`translate(${81+i*6} ${91+i*6}) rotate(-40)`,p('M-3-5h6v14h-6z',c.wood)+l('M-3-3h6',c.gold,2));body+=p('M58 114h22v25H58z',c.leather);}if(role==='medic')body+=p('M75 107h35l10 42-19 9-28-6z',c.linen)+p('M57 118h25v27H57z',c.leather)+l('M62 122h15',c.gold,2);return body;}
// Tang, solid guard and grip share the same axis and overlap: no hollow gap.
const sword=c=>p('M-3-8V-60l3-9 3 9v52z',c.metal)+l('M0-57v39',c.linen,1)+l('M0-9V11',c.leather,5)+p('M-10-12h20v5h-20z',c.gold)+l('M8-10Q15 2 5 10',c.gold,2)+e(0,12,3,3,c.gold);
const gun=c=>p('M-6-1h69v9H30l-14 8H-4z',c.wood)+l('M23-4h60',ink,7)+l('M23-5h60',c.steel,4)+e(27,2,3,3,c.gold)+l('M24 6q-5 9 5 9',c.gold,2)+l('M25-5l-3-8 7 2',c.gold,2)+l('M38 8h41',c.metal,1.5)+l('M43 6v3M70 6v3',c.steel,2);
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
export function musketPose(f){
 const q=phase(f),keys=[[0,89,117,-20],[4,94,93,-3],[6,94,93,-3],[7,90,94,-3],[9,94,93,-3],[14,126,166,-90],[27,126,166,-90],[31,89,117,-20]];
 let pose=keys[0];for(let i=1;i<keys.length;i++){if(q<=keys[i][0]){const prev=keys[i-1],next=keys[i],t=smooth((q-prev[0])/(next[0]-prev[0]));pose=[q,...[1,2,3].map(j=>mix(prev[j],next[j],t))];break;}}
 return {q,x:pose[1],y:pose[2],a:pose[3]};
}
function musketeer(c,f,layer){
 const moving=f>=2&&f<10,bounce=moving?walkBodyOffset(f-2):0,s=musketPose(f),{q,x,y,a}=s;
 const trigger=rot(x,y,a,22,10),fore=rot(x,y,a,55,8),stable=rot(x,y,a,18,10);
 const reload=smooth(Math.max(0,Math.min(1,(q-10)/4)))*(q<28?1:1-smooth((q-27)/4));
 let rear={x:mix(trigger.x,stable.x,reload),y:mix(trigger.y,stable.y,reload)};
 let front={x:fore.x,y:fore.y},tool='';
 if(q>=15&&q<=18){front={x:130,y:76+(q-15)*2};tool=g(`translate(${front.x} ${front.y})`,p('M-3 2l-4 9 4 9h10l3-9-6-8z',c.gold)+l('M-3 3l-3 7',c.leather,2));if(q===18)tool=e(123,81,3,3,c.steel);}
 if(q>=19&&q<=25){const stroke=Math.sin((q-19)/6*Math.PI*2-Math.PI/2)*9+9;front={x:122,y:65+stroke};tool=l(`M122 ${front.y-3}V${front.y+39}`,c.wood,2.5);}
 if(q===26){front={x:128,y:108};tool=l('M128 105l7 35',c.wood,2.5);}
 if(q===27)front={x:fore.x,y:fore.y};
 let weapon=g(`translate(${x} ${y}) rotate(${a})`,gun(c));
 if(q===7)weapon+=g(`translate(${x} ${y}) rotate(${a})`,p('M84-6l15-7-5 9 11 2-12 4 4 7-13-7z','#f3c272','none'));
 if(q>=8&&q<=10){const muzzle=rot(94,93,-3,83,-4);weapon+=e(muzzle.x+12+(q-8)*10,muzzle.y-(q-8)*5,8+(q-8)*5,5+(q-8)*3,'#bbc1bd','none');}
 if(layer==='equipment')return g(`translate(0 ${bounce})`,weapon+tool);
 if(layer!=='full')return masks('archer',c,layer,bounce);
 const backElbow={x:mix(90,96,reload),y:mix(113,133,reload)};
 const frontElbow=q>=15&&q<=26?{x:146,y:95}:{x:mix(134,141,reload),y:mix(124,120,reload)};
 const backArm=limb(`M77 89L${backElbow.x} ${backElbow.y} ${rear.x} ${rear.y}`,c.dark,7);
 const frontArm=limb(`M111 89L${frontElbow.x} ${frontElbow.y} ${front.x} ${front.y}`,c.cloth,7);
 // Arms behind equipment, palms/fingers over the exact stock and tool anchors.
 return legs(c,f)+g(`translate(0 ${bounce})`,torso('archer',c)+backArm+frontArm+face(c)+hat('archer',c)+weapon+tool+e(rear.x,rear.y,4.5,4.5,c.skin)+e(front.x,front.y,4.5,4.5,c.skin)+l(`M${rear.x-2} ${rear.y}l4 1`,c.shadow,1));
}
function infantry(role,c,f,layer){const moving=f>=2&&f<10,bounce=moving?walkBodyOffset(f-2):0,wave=moving?Math.sin((f-2)*Math.PI/4):0,k=f>=10?Math.min(5,f-10):0,attack=f>=10;let hx=141,hy=115,rx=73+wave*4,ry=133,a=18+wave*2,gear=sword(c),extra='',projectile='';
 if(role==='shield'){if(attack){a=[18,-10,45,75,48,22][k];hx=[141,143,155,159,149,142][k];hy=[115,103,110,119,116,114][k];}rx=56;ry=123;extra=g('translate(56 123)',e(0,0,24,30,c.steel)+e(0,0,19,24,c.cloth)+e(0,0,8,9,c.metal)+l('M-14-12l28 24M-14 12l28-24',c.gold,2));}
 if(role==='spear'){hx=143;hy=119;a=attack?[35,40,58,70,48,36][k]:35+wave;gear=l('M0 60V-97',c.wood,5)+l('M0-99v-10',c.steel,4)+p('M0-117l-5 15 5 7 5-7z',c.metal);const hand=rot(hx,hy,a,0,38);rx=hand.x;ry=hand.y;}
 if(role==='medic'){hx=attack?[128,136,144,150,141,131][k]:126+wave*3;hy=attack?[132,120,111,109,119,129][k]:132;a=0;gear=e(1,-6,9,5,c.linen)+l('M-5-6h13',c.gold,2);rx=64;ry=117;extra=p('M51 118h25v28H51z',c.leather)+l('M54 118v-6h19v6',c.gold,2);}
 if(role==='thrower'){hx=attack?[137,126,137,156,148,140][k]:139;hy=attack?[115,87,79,101,113,115][k]:115;a=0;gear=(attack&&k>=3)?'':e(0,-6,8,9,'#454a4c')+l('M0-14l4-10',c.linen,2)+e(4,-24,2,3,'#eeb562','none');if(attack&&k>=3)projectile=e(166+(k-3)*18,78+(k-3)*4,7,7,'#454a4c')+l(`M${166+(k-3)*18} ${71+(k-3)*4}l4-8`,c.linen,2);}
 if(role==='banner'){const q=phase(f),lift=Math.sin(Math.PI*q/31)**2;hx=140;hy=116-9*lift;a=8+lift*11;gear=l('M0 50V-85',c.wood,5)+p('M0-96l-5 10 5 7 5-7z',c.gold)+p(`M2-83q20 ${wave+lift*4} 43 0v39l-22-6-21 6z`,c.cloth)+l('M8-76l29 24M8-52l29-24',c.linen,5)+e(22,-64,5,5,c.gold);}
 const equipment=extra+g(`translate(${hx} ${hy}) rotate(${a})`,gear)+projectile;if(layer==='equipment')return g(`translate(0 ${bounce})`,equipment);if(layer!=='full')return masks(role,c,layer,bounce);
 return legs(c,f,role==='shield')+g(`translate(0 ${bounce})`,torso(role,c)+face(c)+hat(role,c)+limb(`M77 89L${role==='medic'?67:role==='thrower'?68:71} ${role==='medic'?105:111} ${rx} ${ry}`,c.dark)+extra+limb(`M111 89L${role==='medic'?122:126} ${role==='medic'?112:hy-6} ${hx} ${hy}`,c.cloth)+g(`translate(${hx} ${hy}) rotate(${a})`,gear)+e(hx,hy,5,5,c.skin)+e(rx,ry,5,5,c.skin)+projectile);
}
function masks(role,c,layer,bounce=0){return g(`translate(0 ${bounce})`,layer==='eyes'?e(108,54,4,3,'#fff','none'):layer==='face'?p('M92 47h23v26H92z','#fff','none'):layer==='headgear'?hat(role,c):'');}
function horse(c,f,layer){const move=f>=2&&f<10,t=move?(f-2)*Math.PI/4:0,b=move?Math.sin(t*2):0,k=f>=10?f-10:0,a=f>=10?[22,-5,44,75,49,25][k]:25;
 const rt=`translate(26 ${22+b}) scale(.65)`,hand={x:f>=10?[155,150,161,166,159,155][k]:155,y:f>=10?[104,80,69,66,80,104][k]:104};
 const blade=g(`translate(${hand.x} ${hand.y}) rotate(${a})`,sword(c));
 // Carbine hangs muzzle down in a saddle boot; it is not balanced on a shoulder.
 const carbine=g(`translate(58 ${111+b}) rotate(75) scale(.48)`,gun(c))+p(`M58 ${124+b}l10 30-6 4-10-32z`,c.leather)+l(`M75 ${106+b}L58 ${113+b}M72 ${111+b}l-11 11`,c.leather,3)+e(59,116+b,3,3,c.gold);
 if(layer!=='full')return layer==='equipment'?carbine+g(rt,blade):g(rt,masks('raider',c,layer));
 const leg=(front,far)=>{const x=front?132:56,phase=t+(front?Math.PI:0)+(far?Math.PI:0),dx=move?Math.sin(phase)*12:far?-5:5,up=move?Math.max(0,Math.cos(phase))*10:0;return limb(`M${x} 122L${x+dx*.4} ${147-up*.3} ${x+dx} ${174-up}`,far?'#62564f':'#95877a',8)+p(`M${x+dx-6} ${169-up}h10l3 5h-14z`,ink);};
 let body=l('M47 107Q23 112 22 141l-8 8','#423b35',8)+leg(false,true)+leg(true,true)+g(`translate(0 ${b})`,p('M44 106q27-13 65 0 15 1 26-27l9-15q10-5 17 9l17 7q9 7 0 13-8 4-19-4l-8 20q-10 27-30 29H65q-28-3-21-32z','#95877a')+p('M133 91l10-20 9-5 4 8-13 30z','#423b35')+p('M148 68l-2-14 9 2 2 13z','#95877a')+e(165,80,2,2,ink,'none')+l('M166 92h10',ink,1.5)+p('M50 108q35-7 72 8l-5 26-18-4-20 5-27-8z',c.cloth)+l('M57 132l22 4 20-4 15 4',c.gold,3)+p('M73 103q15-10 30-1l3 9H73z',c.leather)+l('M92 109v23',c.leather,4)+l('M154 76l6 16 16-3',c.leather,3));body+=leg(false,false)+leg(true,false);
 const rider=torso('raider',c)+face(c)+hat('raider',c)+limb('M91 122L113 141 101 164',c.cloth,9)+limb('M113 141L101 164',c.leather,9)+p('M95 159h12l7 8H93z',c.leather)+l('M91 162h22v8H91z',c.gold,2)+limb('M77 88L89 107 124 112',c.dark,7)+e(124,112,4,4,c.skin)+limb(`M110 87L135 ${hand.y-10} ${hand.x} ${hand.y}`,c.cloth,7)+blade+e(hand.x,hand.y,4,4,c.skin);
 return body+carbine+l(`M163 ${88+b}Q140 ${85+b} 106.6 ${94.8+b}`,c.leather,2)+g(rt,rider);
}
export function cannonPose(f){const q=phase(f);return {q,recoil:q===7?-10:q===8?-7:q===9?-4:0,flash:q===7,ram:q>=17&&q<25,load:q>=13&&q<17};}
function cannon(c,f,layer){const moving=f>=2&&f<10,q=phase(f),state=cannonPose(f);const crewX=[-37,160],crewScale=.52;
 if(['face','eyes','headgear'].includes(layer))return crewX.map(x=>g(`translate(${x} 84.5) scale(${crewScale})`,masks('siege',c,layer))).join('');
 const wheel=(x,y,far=false)=>e(x,y,18,18,c.wood)+e(x,y,13,13,far?c.dark:c.gold)+g(`rotate(${moving?(f-2)*21:state.recoil*3} ${x} ${y})`,[0,45,90,135].map(a=>g(`rotate(${a} ${x} ${y})`,l(`M${x-13} ${y}h26`,c.wood,3))).join(''))+e(x,y,4,4,c.steel);
 let machine=wheel(125,151,true)+p('M27 159l39-35h73l12 18-66-2-40 23z',c.wood)+p('M61 132l12-16h61l12 16z',c.cloth)+l('M74 140l-31 18',c.gold,3)+e(142,137,5,5,c.steel);
 machine+=g(`translate(0 0)`,p('M73 113q-6-10 4-15l73-9 10 5 1 17-11 7-69 8q-12 1-8-13z',c.steel)+l('M85 101l64-8',c.metal,3)+e(155,103,5,11,ink)+l('M89 99v25M134 94v27',c.gold,3)+e(110,116,5,5,c.gold))+wheel(89,154);machine=g(`translate(${state.recoil} 0)`,machine);
 if(state.flash)machine+=g(`translate(${state.recoil} 0)`,p('M165 94l19-10-6 14 19 2-18 7 7 13-21-11z','#efc070','none'));if(q>=8&&q<=11)machine+=e(184+(q-8)*7,103-(q-8)*6,13+(q-8)*3,6+(q-8),'#b8bdb9','none');
 if(layer==='equipment')return machine;
 const crew=crewX.map((x,i)=>{const walk=moving?f:0;let hx=(i?136:126)+(q===0||q===31?0:Math.sin(q*Math.PI/31)*3),hy=119;let gear='';if(moving&&!i){hx=124;hy=139;}if(i&&state.ram){hx=95+(q%4)*3;hy=24;gear='';}else if(i&&state.load){hx=70;hy=35;gear=e(hx-5,hy-3,6,6,ink);}else if(!i&&q>=5&&q<8){hx=130;hy=94;gear=l(`M${hx} ${hy}l17-17`,c.wood,3)+e(hx+17,hy-17,2,3,'#f0b666','none');}return g(`translate(${x} 84.5) scale(${crewScale})`,legs(c,walk)+torso('siege',c)+face(c)+hat('siege',c)+limb(`M77 89L82 112 ${hx-15} ${hy+3}`,c.dark)+limb(`M111 89L${i&&state.ram?130:127} ${i&&state.ram?45:102} ${hx} ${hy}`,c.cloth)+gear+e(hx,hy,5,5,c.skin)+e(hx-15,hy+3,5,5,c.skin));}).join('');
 // Rammer belongs to the right loader; extend it to the muzzle in world space.
 const rod=state.ram?l(`M${209.4+(q%4)*1.56} 96.98L${147+(q%4)*1.56} 104.8`,c.wood,3)+e(148+(q%4)*1.56,104.8,4,4,c.linen):'';
 return crew+machine+rod;
}
export function renaissanceRig(role,enemy,f,layer='full'){if(!renaissanceRoles.includes(role)||!Number.isInteger(f)||f<0||f>=renaissanceFrameCounts[role])throw Error(`Invalid Renaissance pose ${role}/${f}`);if(role==='banner'&&[1,16,47].includes(f))f=0;const c=pal(enemy);return role==='raider'?horse(c,f,layer):role==='siege'?cannon(c,f,layer):role==='archer'?musketeer(c,f,layer):infantry(role,c,f,layer);}
