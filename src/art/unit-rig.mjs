/** Shared, articulated vector art. Equipment is drawn in the gripping hand's coordinates. */
import { ironRig } from './iron-rig.mjs';
import { walkLeg, walkBodyOffset } from './walk-cycle.mjs';
import { slingerPose } from './slinger-pose.mjs';
import { bowPose } from './bow-pose.mjs';
const ink = '#242b30';
export const shape = (d, fill, stroke = ink, width = 2.5) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line = (d, color, width = 3) => shape(d, 'none', color, width);
const ellipse = (x,y,rx,ry,fill,stroke=ink,width=2.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const g = (t,s) => `<g transform="${t}">${s}</g>`;
const limb = (d,c,w=10) => line(d,ink,w+4)+line(d,c,w);
export const svg = (w,h,s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${s}</svg>`;

function face(era, role, c) {
 const stone=era==='stone', heavy=['shield','spear','bulwark','boss'].includes(role), sage=['medic','banner'].includes(role);
 let s=shape('M83 68v14h23V65',c.skinShade);
 s+=shape('M79 43Q86 31 102 35Q113 38 114 52l7 9-7 4-2 9q-9 8-23 0l-9-9z',c.skin);
 s+=shape('M91 69q9 5 19 0l-1 5q-10 6-19-1z',c.skinShade,'none');
 s+=ellipse(83,59,5,7,c.skin)+line('M82 56q4-2 4 3',c.skinShade,1.5);
 // A deliberate brow, one side-profile eye, nose and mouth. No random face dots.
 s+=line('M102 51l8 1',ink,2.5)+ellipse(108,56,1.8,2,ink,'none')+line('M108 68h5', '#784b3b',1.8);
 if(stone) {
  s+=shape('M77 56q-8-22 9-29 16-8 28 9l2 11-14-7-9 2-6 12-4-2-2 9z',c.hair);
  s+=line('M81 39q8-11 18-8',c.hairLight,3);
  if(sage)s+=line('M78 44l35-4',c.cloth,5);
  if(['bulwark','boss'].includes(role))s+=shape('M73 42q-3-25 23-28 23 1 25 27l-12-6-8 7-9-6-13 9z',c.hair)+shape('M76 28Q63 22 64 12q5 8 15 9M112 23q10-2 13-11 3 12-10 18',c.bone);
  if(role==='boss')s+=shape('M88 67l24 1-6 14-12 3-9-10z',c.hair);
 } else if(heavy) {
  s+=shape('M75 52q-4-26 22-29 24 0 25 27l-15-7-22 7-2 26-10-5z',c.metal);
  s+=shape('M78 47q21-14 41-2l3 6-16-5-22 8z',c.metalShade,'none');
  s+=line('M81 38q12-13 28-7',c.metalLight,3)+line('M78 56v11',c.metalLight,2);
  if(['shield','spear','boss'].includes(role))s+=shape('M84 25q8-20 29-10l6 11q-19-7-28 3z',c.cloth)+line('M93 18q12-4 18 2',c.light,2);
  if(role==='boss')s+=shape('M83 27l-1-12 9 7 8-15 7 14 12-6-4 17z',c.metal);
 } else if(sage) {
  s+=shape('M76 52l3-24q15-12 31 1l9 22-13-9-23 7z',c.linen)+line('M79 39l33-3',c.cloth,4);
 } else {
  s+=shape('M76 54q-8-29 15-30 21-2 27 23l-16-7-18 7-2 19z',c.cloth)+line('M80 38q10-9 20-6',c.light,3);
 }
 return s;
}

function equipment(era,role,c,angle,release,healPhase=null,supportPhase=null,slinger=null,bow=null) {
 const stone=era==='stone'; let s='';
 const shaft=(top,bottom)=>limb(`M0 ${bottom}V${top}`,c.wood,4);
 if(role==='spear') s=shaft(-72,48)+shape('M0-91l-7 19 7 8 7-8z',stone?c.flint:c.metal)+line('M0-70v10',c.linen,7)+line('M0-83v11',stone?c.flintLight:c.metalLight,2);
 if(['shield','bulwark','boss','raider'].includes(role)) {
  s=shaft(-24,9)+(stone?shape('M-7-46l14-4 9 9-4 18-17 1-8-9z',c.flint)+line('M-7-38l9-6',c.flintLight,3):shape('M-3-27l1-35 6-9 5 9-3 35z',c.metal)+line('M2-59v26',c.metalLight,2)+line('M-9-25h18',c.metalShade,5));
  s+=line('M-3-20v19',c.linen,3);
 }
 if(role==='medic') {
  // A shorter upright staff leaves headroom for an actual upward healing gesture.
  // A linen field-medicine pouch on a walking staff, with no ritual ornament.
  s=shaft(-53,51)+shape('M-9-64q9-5 18 0v13q-9 5-18 0z',c.linen)+line('M-6-62h12',c.cloth,3)+line('M0-51v7',c.linen,7);
 }
 if(role==='banner') {
  const flutter=supportPhase===null?0:3*Math.sin(supportPhase*Math.PI*2)*Math.sin(supportPhase*Math.PI)**2;
  s=shaft(-67,54)+g('translate(0 8)',shape(`M2-74q20 ${-6+flutter} 36 0l-6 15 7 14q-19 ${-5-flutter}-37 0z`,c.cloth)+line('M8-66h20M8-57h16',c.linen,3)+line('M0-63v7',c.linen,6));
 }
 if(role==='archer') {
  if(stone) {
   const pose=slinger??slingerPose(0),pull=pose.pull;
   s=limb('M0 12V-7L-12-25',c.woodLight,4)+limb('M0-7L11-25',c.woodLight,4)+line('M0 0v9',c.linen,4);
   s+=line(`M-12-25L${-pull}-25 11-25`,c.linen,2)+shape(`M${-pull-4}-28h8v6h-8z`,c.wood,ink,1);
   if(pose.loaded)s+=ellipse(-pull,-25,4,3,c.flint,c.flintLight,1);
   if(pose.shot) {
    const {x,y}=pose.shot;
    s+=`<g opacity=".65">${line(`M${x-19} ${y}h10M${x-13} ${y+4}h5`,c.linen,1.5)}</g>`+shape(`M${x-4} ${y-3}l5-1 4 3-2 4-6-1z`,c.flint,ink,1.5);
   }
  } else {
   const pose=bow??bowPose(0);
   const wood='M-15-39Q15 0-15 39';
   s=line(wood,ink,6)+line(wood,c.woodLight,3)+line('M0-4v9',c.linen,6);
   s+=line(`M-15-39L${-pose.pull}-6-15 39`,c.linen,1.5);
   if(pose.loaded)s+=line(`M${-pose.pull}-6H37`,c.woodLight,2)+shape('M34-10l8 4-8 4z',c.metal,ink,1);
  }
 }
 if(role==='thrower'&&!release)s=stone?shape('M-15-4l3-17 18-4 13 15-6 13-20 2z',c.flint)+line('M-9-15l12-4 7 6',c.flintLight,3):shape('M-6-19H6v7q15 6 10 20-3 12-16 11-14 0-16-11-4-15 10-20z',c.pottery)+line('M-4-19v-4h8',c.metal,3)+shape('M2-22q-5-12 3-17-1 9 7 11-3 7-10 6z','#e9ab54','none');
 return g(`rotate(${angle})`,s);
}

export function unitRig(era,role,enemy,frame) {
 if(era==='iron')return ironRig(role,enemy,frame);
 if(role==='banner'&&frame===1)frame=0;
 const stone=era==='stone', heavy=['bulwark','boss'].includes(role), sage=role==='medic', moving=frame>=2&&frame<10, attack=frame>=10;
 const step=frame-2, phase=step*Math.PI/4, wave=moving?Math.sin(phase):0, bounce=moving?walkBodyOffset(step,heavy):0, k=attack?frame-10:0;
 const c={cloth:enemy?'#a24b45':'#357c78',light:enemy?'#e99978':'#8fc6ad',dark:enemy?'#653b3e':'#254c51',trousers:enemy?'#80494b':'#354d54',skin:'#dfb18c',skinShade:'#b67f61',hair:'#45362f',hairLight:'#76604a',bone:'#e4d5ab',linen:'#eee0bc',wood:'#6e4c36',woodLight:'#b58b59',flint:'#77858a',flintLight:'#b9c3b8',metal:'#c5974c',metalShade:'#876037',metalLight:'#f1d28a',pottery:'#b96540'};
 if(role==='siege')return siegeRig(era,c,frame,wave);
 if(era==='bronze'&&role==='raider')return chariotRig(c,frame,wave);
 let s='';
 // Fixed-length segments and heel/toe roll, with alternating grounded and swinging feet.
 for(const back of [true,false]) {
  if(moving) {
   const {hip,knee,ankle,foot,pivot}=walkLeg(step,back,heavy);
   const color=stone?(back?c.skinShade:c.skin):back?c.dark:c.trousers;
   s+=limb(`M${hip.x} ${hip.y}L${knee.x} ${knee.y} ${ankle.x} ${ankle.y}`,color,heavy?14:10);
   s+=g(`translate(${foot.x} ${foot.y}) rotate(${foot.pitch} ${pivot} 0)`,shape('M-7-10h11l4 6 6 2v2H-7z',back?c.wood:c.woodLight)+line('M-6-1h19',c.wood,2));
   continue;
  }
  const w=back?-wave:wave, lift=moving?Math.max(0,Math.cos(phase+(back?Math.PI:0)))*6:0, x=(back?82:105)+w*12, y=176-lift;
  s+=limb(`M${back?85:102} ${123+bounce}L${(back?80:104)+w*3} ${148-lift*.5} ${x} ${y-8}`,stone?(back?c.skinShade:c.skin):back?c.dark:c.trousers,heavy?14:10);
  s+=shape(`M${x-6} ${y-12}l11 1 3 6 7 2v3H${x-8}z`,stone?c.wood:c.wood)+line(`M${x-6} ${y-2}h19`,c.woodLight,2);
 }
 let body='';
 if(role==='banner'||sage||role==='boss')body+=shape('M76 79q-12 29-17 65l22-10 8-49z',c.dark)+line('M73 95l-10 38',c.cloth,4);
 const shoulder=heavy?66:75, far=heavy?119:111;
 body+=shape(`M${shoulder} 83q18-12 ${far-shoulder} 0l9 42q-25 13-${far-shoulder+7} 0z`,stone?c.wood:c.cloth);
 if(stone)body+=shape(`M${shoulder} 84l10-6 13 11 12-10 11 6-5 19-10-4-9 9-10-8-10 6z`,c.hair)+line('M82 98l23 25',c.cloth,6)+line('M82 98l23 25',c.light,2);
 else body+=shape(`M${shoulder} 83l17 5 20-7 9 29-23 10-22-11z`,sage?c.linen:c.metal)+line('M80 92q12 6 25-1',sage?c.bone:c.metalLight,3)+line('M79 104l17 8 16-8',c.metalShade,2);
 body+=shape('M72 124h46l4 13-10-2-6 7-12-5-12 6-12-7z',sage?c.linen:stone?c.wood:c.dark)+line('M75 123h40',c.wood,6)+shape('M91 120h9v8h-9z',c.metal);
 if(sage)body+=shape('M76 109h34l11 51-17-3-9 4-15-4-11 3z',c.linen)+line('M74 150h39',c.cloth,5)+shape('M66 109h17v20H66z',c.wood)+line('M71 113h7',c.bone,2);
 body+=face(era,role,c);
 s+=g(`translate(0 ${bounce})`,body);
 // Rear arm is also attached, including the shield's gripping hand.
 const shield=['shield','bulwark','boss'].includes(role), drawingBow=role==='archer'&&!stone;
 const slinger=role==='archer'&&stone?slingerPose(frame):null;
 const bow=drawingBow?bowPose(frame):null;
 const rearHand=slinger?[slinger.rearX,slinger.rearY+bounce]:bow?[bow.rearX,bow.rearY+bounce]:[shield?69:88,shield?112+bounce:108+bounce];
 const armPath=arm=>`M${arm.shoulder.x} ${arm.shoulder.y+bounce}L${arm.elbow.x} ${arm.elbow.y+bounce} ${arm.hand.x} ${arm.hand.y+bounce}`;
 s+=limb(`M${heavy?70:78} ${86+bounce}L65 ${101+bounce} ${rearHand[0]} ${rearHand[1]}`,stone?c.skinShade:c.dark,10);
 if(drawingBow||slinger)s+=ellipse(rearHand[0],rearHand[1],4.5,4.5,c.skin);
 if(shield) {
  s+=g(`translate(${rearHand[0]} ${rearHand[1]}) rotate(${-8+wave*3})`,stone?shape('M-22-29q21-12 42 0l-2 45-19 16-21-16z',c.wood)+shape('M-16-25l7-3 1 50-9-9z',c.woodLight,'none')+line('M8-27v46',c.woodLight,3)+ellipse(0,0,7,8,c.bone):ellipse(0,0,heavy?31:26,heavy?35:30,c.metal)+ellipse(0,0,heavy?25:20,heavy?29:24,c.dark)+ellipse(0,0,17,20,c.cloth)+ellipse(0,0,8,9,c.metal)+line('M-14-21q10-8 23-1',c.metalLight,3));
 }
 const standard=role==='banner', raising=sage||standard;
 const supportPhase=standard&&attack?(frame>=16?(frame-16)/31:k/5):0;
 const lift=standard&&attack?Math.sin(Math.PI*supportPhase)**2:0;
 const angles=sage?[0,-3,-2,0,2,0]:role==='spear'?[10,-12,65,77,42,14]:role==='archer'?[0,-5,2,4,1,0]:[-8,-42,56,78,25,0];
 const angle=standard&&!moving?1.5*Math.sin(supportPhase*Math.PI*2)*lift:slinger||bow?0:attack?angles[k]:role==='spear'?14:frame===1?8:wave*3;
 const hx=standard&&!moving?124+6*lift:slinger?slinger.x:bow?bow.x:attack?(sage?[124,128,134,136,132,124]:[123,116,139,144,132,124])[k]:frame===1?126:124, hy=(standard&&!moving?111-22*lift:slinger?slinger.y:bow?bow.y:attack?(sage?[107,99,89,86,96,105]:[106,93,101,105,108,107])[k]:standard?111:frame===1?102:107)+bounce;
 s+=limb(slinger?armPath(slinger.gripArm):`M${heavy?116:109} ${86+bounce}L${raising&&attack&&!standard?120:(hx+108)/2} ${raising&&attack&&!standard?102:hy-5} ${hx} ${hy}`,stone?c.skin:c.cloth,10);
 s+=g(`translate(${hx} ${hy})`,equipment(era,role,c,angle,attack&&(k===2||k===3),sage&&attack?k:null,standard&&attack?supportPhase:null,slinger,bow))+ellipse(hx,hy,5.5,5,c.skin)+line(`M${hx-2} ${hy-2}l4 1`,c.skinShade,1.5);
 if(bow)s+=ellipse(rearHand[0],rearHand[1],4.5,4.5,c.skin);
 if(role==='boss')s+=ellipse(96,99+bounce,9,10,c.metal)+shape(`M92 ${99+bounce}l4-5 4 5-4 5z`,c.cloth,'none');
 return s;
}

function wheel(x,y,c,frame) {
 return ellipse(x,y,17,17,c.wood)+ellipse(x,y,13,13,c.woodLight)+g(`rotate(${frame>=2&&frame<10?(frame-2)*27:0} ${x} ${y})`,line(`M${x-11} ${y}h22M${x} ${y-11}v22`,c.wood,3))+ellipse(x,y,4,4,c.metal);
}
function siegeRig(era,c,frame,wave) {
 const attack=frame>=10, k=attack?frame-10:0, recoil=attack?[0,-5,12,16,6,1][k]:wave;
 // A standing operator uses the same anatomy as infantry, with feet on the shared ground.
 let crew='';
 for(const back of [true,false]) {
  if(frame>=2&&frame<10) {
   const {hip,knee,ankle,foot}=walkLeg(frame-2,back);
   crew+=limb(`M${hip.x} ${hip.y}L${knee.x} ${knee.y} ${ankle.x} ${ankle.y}`,back?c.dark:c.trousers,10)+line(`M${foot.x-6} ${foot.y}h17`,c.dark,6);
  } else crew+=limb(back?'M85 120L79 145 78 172':'M106 120L112 145 112 172',back?c.dark:c.trousers,10)+line(back?'M71 173h18':'M106 173h18',c.dark,6);
 }
 crew+=g(`translate(0 ${frame>=2&&frame<10?walkBodyOffset(frame-2):0})`,face(era,'spear',c)+shape('M76 79h34l12 41H67z',c.cloth)+limb('M79 88L90 104 139 102',c.dark,8)+limb('M109 88L126 100 148 100',c.skin,8)+ellipse(139,102,5,5,c.skin)+ellipse(148,100,5,5,c.skin));
 let machine=limb('M48 148l17-51M141 148l-18-51',c.wood,7)+shape('M33 137h118l8 14H27z',c.wood)+line('M38 140h107',c.woodLight,3);
 machine+=limb('M89 138V79',c.wood,4)+line('M83 79h12',c.metal,4);
 machine+=g(`translate(${recoil} 0)`,shape('M28 95h116l22 10-22 17H28z',c.wood)+line('M34 103h105',c.woodLight,4)+shape('M139 95l23 10-3 8-20 9z',era==='stone'?c.flint:c.metal)+line('M55 95v26M113 95v26',c.metalShade,7)+line('M56 97v22M114 97v22',c.metalLight,2));
 machine+=wheel(45,158,c,frame)+wheel(138,158,c,frame);
 return g('translate(-115 9) scale(.95)',crew)+g('translate(100 176) scale(1.3) translate(-100 -176)',machine);
}
function chariotRig(c,frame,wave) {
 const lean=frame>=10?[0,-4,8,12,5,1][frame-10]:wave;
 let s=limb(`M132 130L136 152 ${142+wave*5} 173M157 128L160 152 ${155-wave*5} 173`,c.hair,5);
 s+=limb(`M141 131L136 152 ${131-wave*5} 173M168 131L174 155 ${178+wave*5} 173`,c.wood,7);
 s+=shape('M128 114q15-8 30 0l6-18 0-12 6-7 7 7-1 6 10 7-3 8-10-1-7 24q-18 14-35 4-9-7-3-18z',c.woodLight)+shape('M166 86l-2-13 7 9 3-10 3 13z',c.woodLight)+shape('M164 85l-4 16-5 24 7 3 9-23 1-18z',c.hair)+line('M181 96l-3 8M174 93l-8 14',c.dark,3)+ellipse(176,91,1.5,2,ink,'none')+line('M124 119q-10 5-7 21',c.hair,5);
 s+=line(`M179 103Q145 100 ${106.4+lean} 89.8`,c.linen,2)+line('M100 142l61-6',c.wood,5);
 s+=line(`M${128-wave*5} 174h8M${175+wave*5} 174h8`,c.hair,3);
 s+=limb(`M${84+lean} 96L${81+lean} 113 92 120`,c.dark,7);
 const thrust=frame>=10?[30,20,70,80,55,30][frame-10]:30;
 // Reins stay below the spear hand. The short butt cannot sweep across the wrists.
 const spear=limb('M0 12V-59',c.wood,4)+shape('M0-76l-6 17 6 7 6-7z',c.metal)+line('M0-60v9',c.linen,6);
 s+=g(`translate(${8+lean} -3) scale(.8)`,
  shape('M77 79h34l8 48H72z',c.metal)+face('bronze','spear',c)
  +limb('M81 87L94 110 123 116',c.dark,8)+ellipse(123,116,5,5,c.skinShade)
  +limb('M109 88L124 96 138 85',c.cloth,9)
  +g(`translate(138 85) rotate(${thrust})`,spear)+ellipse(138,85,5,5,c.skin));
 s+=shape('M40 114h71l9 35H37z',c.cloth)+shape('M42 117h62l7 27H40z',c.metal)+line('M47 121h51',c.metalLight,3)+line('M35 151h90',c.wood,6);
 return s+wheel(49,158,c,frame)+wheel(106,158,c,frame);
}
