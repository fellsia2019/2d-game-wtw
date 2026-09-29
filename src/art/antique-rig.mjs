/** Antiquity workshop: scutum, hoplon, light javelins, cavalry and torsion engines. */
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';
const ink='#302f29';
const p=(d,c,s=ink,w=2.5)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const l=(d,c,w=3)=>p(d,'none',c,w);
const e=(x,y,rx,ry,c,s=ink,w=2.5)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${s}" stroke-width="${w}"/>`;
const g=(t,s)=>`<g transform="${t}">${s}</g>`;
const limb=(d,c,w=8)=>l(d,ink,w+4)+l(d,c,w);
const pal=enemy=>({cloth:enemy?'#9d493f':'#3e7580',light:enemy?'#d69b76':'#91c2be',dark:enemy?'#623a36':'#2d515a',skin:'#ddb08a',shade:'#b6805f',hair:'#40322a',bronze:'#bd9457',gold:'#eed3a1',metal:'#aebcb8',darkMetal:'#657774',linen:'#eee1bd',leather:'#775039',wood:'#79573d',woodLight:'#bd955c'});
const faceMask=()=>p('M87 43Q103 37 119 44l2 10 7 8-9 7-4 8-23-1-7-12z','#fff','none');
const eyeMask=()=>e(110,53,6,5,'#fff','none');
function head(role,c,layer='full') {
 const skin=role==='raider'?'#ba825f':c.skin;
 let anatomy=p('M85 67v15h20V66',c.shade)+p('M78 43q8-13 24-8 12 3 13 17l8 9-8 4-2 9q-10 7-23-1l-9-10z',skin)+e(83,57,5,7,skin)+l('M104 47l8 1',ink,2)+e(110,53,1.8,2,ink,'none')+l('M111 67h4','#7a4c3b',1.5);
 let hat='';
 if(['shield','banner'].includes(role)) {
  hat=p('M74 42q-1-22 22-23 22 1 24 20l-11-2-24 5-6 9z',c.metal)+p('M75 44l8-4-2 28-8 4z',c.darkMetal)+l('M79 39q21-7 39 0',c.gold,3)+p('M75 39l-12 5v5h14l3-9z',c.metal);
  if(role==='banner') hat+=p('M61 21Q86-2 121 13l6 13-13-3Q91 10 70 30z',c.cloth)+l('M65 24Q90 7 119 21',c.gold,4)+l('M69 26l10-9M83 19l5-8M97 16l2-8M110 18l-1-8',c.light,2);
 } else if(role==='spear') {
  hat=p('M76 43q-1-24 20-24 22 0 24 21l-13-2-21 5-6 10z',c.bronze)+p('M76 43l8-2-2 28-8 4z',c.bronze)+p('M91 21Q95 5 109 6Q128 8 131 24l-13-1Q106 13 99 23z',c.cloth)+l('M96 18Q106 9 123 19',c.light,3)+l('M79 37q18-8 37 0',c.gold,2.5);
 } else if(role==='boss') {
  hat=p('M77 53q-7-22 8-28 16-6 28 9l4 9-13-7-15 5-5 17-5-5z',c.hair)+l('M80 38q17-8 34 0',c.bronze,4);
  for(const x of [83,92,102,111])hat+=p(`M${x} 36q-5-10-9-7l3 7 6 2z`,c.gold,ink,1);
 } else if(role==='medic') {
  hat=p('M76 42l4-19q16-10 32 3l5 13-15-3-17 6-7 16-4-5z',c.linen)+l('M82 33h26',c.light,3);
 } else if(role==='bulwark') {
  hat=p('M70 44q0-25 24-24 23 0 29 23l-15-5-21 5-6 16-7 9-6-4z',c.dark)+l('M77 35q13-10 29-5',c.light,3);
 } else {
  hat=p('M78 53q-7-23 10-28 18-5 27 12l2 9-13-7-14 4-7 18-6-5z',c.hair);
  if(role==='archer')hat+=l('M78 39l34-3',c.linen,5);
  if(role==='raider')hat+=p('M78 27q-5-11 4-14l9 9-5 6z',c.hair)+l('M78 41l31-4',c.cloth,4);
 }
 if(layer==='headgear')return hat;
 return anatomy+hat;
}
function legs(c,frame,heavy=false) {
 let s='';
 for(const back of [true,false]) {
  let h,k,a,f,pivot;
  if(frame>=2&&frame<10){const leg=walkLeg(frame-2,back,heavy);({hip:h,knee:k,ankle:a,foot:f,pivot}=leg);}
  else {h={x:back?89:101,y:123};k={x:back?80:108,y:148};a={x:back?80:109,y:167};f={x:a.x,y:176,pitch:0};pivot=0;}
  s+=limb(`M${h.x} ${h.y}L${k.x} ${k.y} ${a.x} ${a.y}`,back?c.shade:c.skin,heavy?11:8);
  s+=l(`M${k.x-4} ${k.y-7}l7 1M${a.x-4} ${a.y-9}l7 1`,c.leather,3);
  s+=g(`translate(${f.x} ${f.y}) rotate(${f.pitch} ${pivot} 0)`,p('M-7-9l9 1 5 6 8 1v2H-7z',c.leather)+l('M-4-7l8 5M-1-7l8 4',c.gold,2));
 }
 return s;
}
function torso(role,c) {
 let s='';
 if(['boss','banner'].includes(role))s+=p(role==='boss'?'M70 78L43 94l-4 63 17-8 24 12 14-26 22 27 20-13-13-65z':'M72 80L53 96l-5 53 20-6 21 10 16-58z',c.dark)+l('M44 151l12-5 20 10',c.gold,4);
 if(['archer','bulwark'].includes(role))s+=p('M60 89h19v47H60z',c.leather)+l('M65 96V60M72 96V57',c.woodLight,3);
 s+=p('M75 82q20-11 36-2l8 47-23 11-26-11z',role==='medic'?c.linen:c.cloth);
 if(['shield','banner'].includes(role)) {
  s+=p('M74 83l16-7 24 5 7 37-47 4z',c.metal);
  for(const y of [91,101,111])s+=l(`M77 ${y}h39`,c.darkMetal,4)+l(`M78 ${y-2}h36`,c.gold,1.5);
  s+=p('M72 80l11-7 10 14-16 8zM106 77l14 5 7 14-15-5z',c.metal);
 } else if(role==='spear') {
  s+=p('M77 84l13-6 18 3 9 35-22 11-20-10z',c.linen)+p('M76 82h17v13H76zM99 82h17v13H99z',c.bronze)+l('M79 108h32',c.bronze,6);
 } else if(role==='boss') {
  s+=p('M67 83l22-10 24 7 10 39-27 12-27-10z',c.bronze)+p('M80 87q17 18 28 0l3 20-18 10-15-12z',c.gold)+l('M81 92l5 10M104 92l-5 10',c.bronze,3)+p('M61 82l20-10 11 15-19 10zM108 75l15 9 7 18-18-9z',c.bronze);
 } else if(role==='bulwark')s+=p('M79 83l13 8 17-9 7 34-18 9-20-7z',c.leather)+l('M80 86l29 36',c.gold,4);
 else if(role==='medic')s+=p('M83 84l10 9 11-11 5 32 10 41-24 3-23-5 9-43z',c.linen)+l('M75 148h38',c.cloth,4)+l('M78 84l29 45',c.leather,5)+p('M99 122h24v24H99z',c.leather)+p('M99 123h24l-3 8h-18z',c.woodLight)+l('M111 129v8',c.linen,3);
 else s+=p('M78 81l15 8 16-10 6 16-16 11-22-13z',c.linen)+l('M81 97l25 29',c.leather,4);
 s+=l('M74 123h41',c.leather,6);
 if(['shield','banner','boss'].includes(role))for(let x=76;x<=109;x+=11)s+=p(`M${x} 126h8l4 21-12-1z`,c.leather)+l(`M${x+3} 130v11`,c.gold,2);
 else if(role!=='medic')s+=p('M74 127h40l7 23-24-5-23 4z',c.cloth)+l('M77 144h35',c.light,3);
 return s;
}
function shield(role,c,wave=0) {
 let s='';
 if(role==='shield')s=p('M-26-41q27-10 53 0v76q-27 11-53 0z',c.cloth)+l('M-21-35v65M21-35v65',c.gold,3)+l('M0-35v63',c.bronze,5)+p('M-19-24l14 9-7 9 12-3 16-15-3 14-17 16-3-9-13 2z',c.gold,'none')+e(0,0,10,11,c.metal);
 if(role==='spear')s=e(0,0,34,36,c.bronze)+e(0,0,28,30,c.cloth)+e(0,0,9,10,c.gold)+l('M-17-16l9-6M14 20l8-8',c.gold,4);
 if(role==='archer')s=p('M-27-22Q0 5 27-22l-5 42Q0 38-22 20z',c.leather)+l('M-24-16Q0 9 24-16M-19 19Q0 30 19 19',c.linen,2.5)+l('M-16 7h32M-17 16h34M-9 2v21M0 5v21M9 2v21',c.woodLight,1.4);
 return g(`translate(${role==='shield'?53:51} 124) rotate(${wave})`,s);
}
const gladius=c=>l('M0 12V-7',c.leather,6)+p('M-4-13V-48l4-12 5 12v35z',c.metal)+l('M1-46v30',c.gold,2)+l('M-9-10h19',c.bronze,5);
const dory=c=>limb('M0 52V-74',c.woodLight,3.5)+p('M0-91l-6 17 6 9 6-9z',c.bronze);
const javelin=c=>l('M0 25V-45',c.woodLight,4)+p('M0-57l-5 13 5 6 5-6z',c.metal);
function infantry(role,c,frame,layer) {
 const moving=frame>=2&&frame<10,k=frame>=10?frame-10:0,attack=frame>=10,bounce=moving?walkBodyOffset(frame-2,role==='boss'):0,wave=moving?Math.sin((frame-2)*Math.PI/4):0;
 const lift=role==='banner'&&attack?Math.sin(Math.PI*(frame>=16?(frame-16)/31:k/5))**2:0;
 let hx=143,hy=113,angle=22+wave*2,gear=gladius(c),rx=73,ry=114;
 if(['shield','boss'].includes(role)&&attack){hx=[143,139,153,161,152,145][k];hy=[113,105,116,121,117,114][k];angle=[24,5,55,83,51,27][k];}
 if(role==='spear'){gear=dory(c);angle=attack?[13,4,58,76,44,18][k]:12+wave;hy=110;}
 if(role==='archer'){gear=attack&&[2,3].includes(k)?'':javelin(c);hx=attack?[143,139,162,168,147,144][k]:141;hy=attack?[111,93,99,103,111,114][k]:113;angle=attack?[25,8,76,88,42,27][k]:22+wave;}
 if(role==='medic'){const lift=attack?[0,8,15,18,11,2][k]:0;hx=141+lift*.25;hy=118-lift;angle=0;gear=p('M-5-17h24v16H-5z',c.linen)+l('M0-12h15M0-6h15',c.light,2);}
 if(role==='banner'){hx=142+6*lift;hy=116-18*lift;angle=16+30*lift+(attack?Math.sin((frame-16)/31*Math.PI*2)*lift:wave);gear=limb('M0 40V-44',c.woodLight,4)+limb('M0-44Q1-60 8-61Q14-62 9-53',c.woodLight,4)+l('M0-12v24',c.linen,5);}
 if(role==='bulwark') {
  const poses=[[148,109,20],[152,106,36],[152,106,10],[152,106,10],[145,112,18],[144,113,21]],pose=attack?poses[k]:poses[5];[hx,hy]=pose;angle=0;const pull=pose[2],loaded=!attack||![2,3].includes(k);rx=loaded?hx-pull:(k===2?112:107);ry=loaded?hy-5:100;
  gear=l('M-12-36Q13 0-12 36',ink,6)+l('M-12-36Q13 0-12 36',c.woodLight,3)+l(`M-12-36L${-pull}-5-12 36`,c.linen,1.5);
  if(loaded)gear+=l(`M${-pull}-5h${pull+26}`,c.woodLight,2)+p('M24-9l8 4-8 4z',c.metal,ink,1);
 }
 if(layer==='face')return g(`translate(0 ${bounce})`,faceMask());
 if(layer==='eyes')return g(`translate(0 ${bounce})`,eyeMask());
 if(layer==='headgear')return g(`translate(0 ${bounce})`,head(role,c,'headgear'));
 if(layer==='shield')return g(`translate(0 ${bounce})`,shield(role,c,wave));
 const equipment=shield(role,c,wave)+g(`translate(${hx} ${hy}) rotate(${angle})`,gear);
 if(layer==='equipment')return g(`translate(0 ${bounce})`,equipment);
 let body=torso(role,c)+head(role,c)+limb(`M77 86L67 106 ${rx} ${ry}`,role==='medic'?c.linen:c.dark)+e(rx,ry,5,5,c.skin)+shield(role,c,wave);
 body+=limb(`M111 86L${(111+hx)/2} ${hy-7} ${hx} ${hy}`,role==='medic'?c.linen:c.skin)+g(`translate(${hx} ${hy}) rotate(${angle})`,gear)+e(hx,hy,5,5,c.skin);
 if(role==='bulwark')body+=e(rx,ry,4.5,4.5,c.skin);
 if(role==='boss')body+=p('M80 80l32 47',c.linen,'none',5)+e(101,89,6,7,c.gold);
 return legs(c,frame,role==='boss')+g(`translate(0 ${bounce})`,body);
}
// The horse uses curved anatomy and four jointed legs; the rider sits over the saddle.
function horse(c,frame,layer) {
 const moving=frame>=2&&frame<10,attack=frame>=10,k=attack?frame-10:0;
 const phase=moving?(frame-2)*Math.PI/4:0,bounce=moving?Math.sin(phase*2)*1.1:0;
 const rt=`translate(27 ${24+bounce}) scale(.63)`;
 const hx=attack?[141,143,166,175,151,142][k]:141,hy=attack?[107,94,100,111,114,108][k]:107;
 const angle=attack?[25,9,77,89,46,28][k]:25;
 const held=attack&&[2,3].includes(k)?'':g(`translate(${hx} ${hy}) rotate(${angle})`,javelin(c));
 if(['face','eyes','headgear'].includes(layer))return g(rt,layer==='face'?faceMask():layer==='eyes'?eyeMask():head('raider',c,'headgear'));
 if(layer==='equipment')return g(rt,held);
 if(layer==='shield')return '';
 const coat='#aa7750',light='#c49367',shade='#795239';
 function leg(front,far) {
  const root={x:front?128:57,y:front?120:122};
  const a=phase+(front?Math.PI:0)+(far?Math.PI:0),swing=moving?Math.sin(a)*11:far?-5:5;
  const lift=moving?Math.max(0,Math.cos(a))*9:0;
  const knee={x:root.x+(front?-3:6)+swing*.35,y:146-lift*.3};
  const foot={x:root.x+swing,y:174-lift};
  const color=far?shade:coat;
  return p(`M${root.x-6} ${root.y-3}Q${root.x+9} ${root.y} ${knee.x+4} ${knee.y}L${foot.x+3} ${foot.y-4}h-7L${knee.x-4} ${knee.y}Q${root.x-5} ${root.y+15} ${root.x-6} ${root.y-3}Z`,color)+e(knee.x,knee.y,4,4,color,ink,1.5)+p(`M${foot.x-5} ${foot.y-5}h9l3 5h-13z`,'#39332c',ink,1.5);
 }
 let back=p('M51 105C29 111 33 141 17 151q-6 1-4-5C27 133 20 105 47 99z',c.hair)+leg(false,true)+leg(true,true);
 const animal=p('M44 105C55 95 83 97 109 105Q125 104 132 83L140 68Q144 61 153 65L164 73Q169 77 176 79Q183 81 180 88L177 93Q169 98 158 91L153 101Q148 118 139 128Q132 141 116 139L69 136Q49 134 43 121Q39 113 44 105Z',coat)+p('M128 111Q136 88 142 73L150 67L152 78Q144 91 140 111Z',c.hair)+p('M147 67l1-13q8 3 8 13z',coat)+p('M157 70l5-13q6 8 2 16z',coat)+p('M49 107Q76 103 105 111L124 114Q123 123 114 128L69 127Q54 127 49 118Z',light,'none')+p('M158 78q7-4 11 1l-1 7-9-1z',light,'none')+e(163,79,1.8,1.8,ink,'none')+e(177,86,1.6,1.6,ink,'none')+l('M169 93l7-1',ink,1.5);
 const tack=p('M71 103Q90 99 110 107l3 21-39-3z',c.cloth)+l('M77 119l29 2',c.gold,3)+p('M76 101q13-8 28 1l1 7-29-1z',c.leather)+l('M91 111v24',c.leather,4)+l('M154 74l4 17 18-2',c.leather,2.5)+l('M160 87L112 98',c.leather,2);
 let rider=p('M76 80q18-11 33 0l8 37-26 7-22-13z',c.linen)+p('M75 80l18 11 15-12 5 11-21 16-19-15z',c.cloth)+head('raider',c)+limb('M80 87L91 113 132 143',c.shade,7)+limb('M94 118L111 143 99 166',c.skin,9)+p('M94 162h12l8 6H91z',c.leather)+l('M98 146l8 3M96 154l8 2',c.leather,2.5)+limb('M79 87L94 108 129 107',c.shade,7)+e(129,107,4,4,c.skin)+limb(`M111 87L127 ${hy-6} ${hx} ${hy}`,c.skin,7)+held+e(hx,hy,4.5,4.5,c.skin);
 return back+g(`translate(0 ${bounce})`,animal+tack)+leg(false,false)+leg(true,false)+g(rt,rider);
}
// Crew stand on the ground behind the engine; no independent, floating torso offset.
function crew(c,frame,x,layer,second=false) {
 const moving=frame>=2&&frame<10,attack=frame>=10,k=attack?frame-10:0;
 const bounce=moving?walkBodyOffset(frame-2)*.55:0;
 const t=`translate(${x} 54) scale(.68) translate(0 ${bounce})`;
 if(['face','eyes','headgear'].includes(layer))return g(t,layer==='face'?faceMask():layer==='eyes'?eyeMask():head('archer',c,'headgear'));
 const reach=attack?[0,-9,6,10,-3,1][k]:0,handX=second?128:137,handY=second?113:111;
 const body=p('M75 82q20-10 37 0l6 42-45 1z',c.linen)+l('M79 86l27 34',c.cloth,4)+p('M73 124h44l-1 23-22-3-20 3z',c.cloth)+l('M75 124h40',c.leather,4)+head('archer',c)+limb(`M78 88L89 107 ${handX-8+reach} ${handY+7}`,c.shade,7)+limb(`M111 88L124 103 ${handX+reach} ${handY}`,c.skin,7)+e(handX+reach,handY,4,4,c.skin);
 return g(`translate(${x} 54) scale(.68)`,legs(c,frame)+g(`translate(0 ${bounce})`,body));
}
function engine(role,c,frame,layer) {
 const large=role==='siege',moving=frame>=2&&frame<10,attack=frame>=10,k=attack?frame-10:0;
 const crewX=large?[-40,20]:[-38];
 if(['face','eyes','headgear'].includes(layer))return crewX.map((x,i)=>crew(c,frame,x,layer,i>0)).join('');
 if(layer==='shield')return '';
 const shot=attack&&[2,3].includes(k),pull=attack?[15,24,3,5,10,17][k]:15;
 const bowX=large?151:146,y=large?124:126,spread=large?23:16;
 const flex=attack?[0,-3,3,2,-1,-2][k]:0;
 const upper={x:bowX+17+flex,y:y-spread},lower={x:bowX+21+flex,y:y+spread};
 // Bed, torsion housings, limbs, string and bolt share one coordinate system.
 const bed=p(`M${large?60:64} ${y-5}H174l9 5-9 5H${large?60:64}Z`,c.wood)+l(`M${large?65:69} ${y-1}h103`,c.woodLight,2.5);
 const farBase=large?bowX-17:bowX-5;
 const farArm=p(`M${farBase} ${y-4}Q${bowX+1} ${y-18} ${upper.x} ${upper.y}l2 5Q${bowX+7} ${y-9} ${farBase+6} ${y+2}z`,c.woodLight,ink,2);
 const nearArm=p(`M${bowX-2} ${y+2}Q${bowX+6} ${y+17} ${lower.x} ${lower.y}l-2 5Q${bowX+1} ${y+19} ${bowX-8} ${y+4}z`,c.woodLight,ink,2);
 const farMount=large?p(`M${bowX-24} ${y-15}h12v27h-12z`,c.wood)+p(`M${bowX-22} ${y-13}h8v23h-8z`,c.linen,ink,1.5)+l(`M${bowX-22} ${y-8}h8M${bowX-22} ${y-2}h8M${bowX-22} ${y+4}h8`,c.bronze,1.5):'';
 const mounts=p(`M${bowX-9} ${y-12}h12v27h-12z`,c.wood)+p(`M${bowX-7} ${y-10}h8v23h-8z`,c.linen,ink,1.5)+l(`M${bowX-7} ${y-6}h8M${bowX-7} ${y-1}h8M${bowX-7} ${y+4}h8M${bowX-7} ${y+9}h8`,c.bronze,1.5);
 const string=l(`M${upper.x+1} ${upper.y+3}L${bowX-pull} ${y}L${lower.x-1} ${lower.y+3}`,c.linen,1.6);
 const bolt=shot?'':l(`M${bowX-pull-7} ${y}H179`,c.woodLight,2)+p(`M177 ${y-4}l9 4-9 4z`,c.metal,ink,1)+l(`M${bowX-pull-5} ${y-3}l6 3-6 3`,c.linen,1.2);
 let support;
 if(large) {
  support=p('M57 143h119v9H57z',c.wood)+p('M68 133h95v10H68z',c.woodLight)+p('M76 127h10v17H76zM143 128h10v16h-10z',c.wood)+l('M83 146l64-1',c.bronze,3);
  for(const x of [74,161]) {
   const roll=moving?(frame-2)*27:0;
   support+=e(x,158,17,17,c.wood,ink,2.5)+e(x,158,12,12,c.woodLight,ink,1.5)+g(`rotate(${roll} ${x} 158)`,l(`M${x-11} 158h22M${x} 147v22M${x-8} 150l16 16M${x-8} 166l16-16`,c.wood,2))+e(x,158,3.5,3.5,c.bronze,ink,1.5);
  }
 } else {
  support=p('M104 130h11v14h-11z',c.wood)+limb('M109 140L91 172M109 140L132 172',c.woodLight,6)+limb('M109 140L109 168',c.wood,5)+p('M83 170h17v6H83zM124 170h17v6h-17z',c.wood,ink,1.5)+l('M92 157h33',c.bronze,2.5);
 }
 const rearGrip=p(`M${large?53:55} ${y-2}h12v7h-12z`,c.leather,ink,1.5);
 const mechanism=farMount+farArm+bed+rearGrip+mounts+nearArm+string+bolt;
 const machine=support+mechanism;
 if(layer==='equipment')return machine;
 return crewX.map((x,i)=>crew(c,frame,x,'full',i>0)).join('')+machine;
}
export const antiqueRoles=['shield','spear','archer','medic','raider','thrower','banner','siege'];
export function antiqueRig(role,enemy,frame,layer='full') {
 if(!antiqueRoles.includes(role))throw new Error(`Unknown Antiquity role: ${role}`);
 if(role==='banner'&&[1,16,47].includes(frame))frame=0;
 const c=pal(enemy);
 if(role==='raider')return horse(c,frame,layer);
 if(['thrower','siege'].includes(role))return g('translate(100 176) scale(1.45) translate(-100 -176)',engine(role,c,frame,layer));
 return infantry(role,c,frame,layer);
}
