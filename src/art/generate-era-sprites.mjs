/** Original era-specific vector rigs. node src/art/generate-era-sprites.mjs */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
const roles=['shield','spear','archer','medic','raider','thrower','banner','siege','bulwark','boss'];
const ink='#25302b';
const path=(d,c,s=ink,w=3)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line=(d,c,w=5)=>path(d,'none',c,w);
const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${ink}" stroke-width="3"/>`;
const group=(t,a)=>`<g transform="${t}">${a}</g>`;
const svg=(w,h,a)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${a}</svg>`;
function rig(era,kind,enemy,frame){
 const stone=era==='stone', move=frame>=2&&frame<10, attack=frame>=10, f=attack?frame-10:frame-2, wave=move?Math.sin(f*Math.PI/4):0, dy=move?-Math.abs(wave)*2:0;
 const cloth=enemy?'#b55d48':'#418f83', pale=enemy?'#f0b783':'#99d3b1', metal=stone?'#c4bca1':'#d6a052', shade=stone?'#857255':'#926432', skin='#d9aa7e', hair='#55402f';
 const swing=attack?[0,-25,65,85,35,3][f]:frame===1?8:wave*4;
 const heavy=kind==='bulwark'||kind==='boss', giant=kind==='boss';
 let a='';
 if(kind==='raider'&&!stone){
  a+=path('M46 131h91l18 23H42z',shade)+path('M111 94h38v48H94z',cloth)+line('M112 102v29h30',metal,5);
  for(const x of [53,135])a+=circle(x,156,19,shade)+group(`rotate(${move?f*23:0} ${x} 156)`,line(`M${x-13} 156h26M${x} 143v26`,metal,3));
 }
 if(kind!=='siege'&&!(kind==='raider'&&!stone))for(const back of [true,false]){
  const dx=wave*(back?-10:10),lift=move?Math.max(0,Math.cos(f*Math.PI/4+(back?Math.PI:0)))*7:0,x=(back?78:107)+dx,y=176-lift;
  a+=line(`M${back?81:103} 122L${back?77:106} 146 ${x} ${y-5}`,ink,heavy?21:15)+line(`M${back?81:103} 122L${back?77:106} 146 ${x} ${y-5}`,stone?skin:shade,heavy?15:10)+path(`M${x-7} ${y-8}h13l6 8h-23z`,stone?skin:hair);
 }
 if(kind==='siege'){
  a+=path('M35 123h115l9 19H27z',shade)+line('M45 124l20-42M140 125l-19-43',hair,8);
  a+=group(`translate(${attack?[-2,-7,17,23,9,0][f]:0} 0)`,path(stone?'M24 94l122-4 20 12-19 15H25z':'M22 90h124l23 13-22 17H22z',hair)+path('M138 89l26 9 5 11-27 10z',metal)+line('M49 97v16M112 94v20',shade,5));
  for(const x of [43,137])a+=circle(x,156,20,shade)+group(`rotate(${move?f*22.5:0} ${x} 156)`,line(`M${x-14} 156h28M${x} 142v28`,metal,3));
  a+=path(stone?'M57 79l20-12 23 13v12H53z':'M57 75h43v16H53z',cloth)+circle(79,58,17,skin)+path(stone?'M60 58l3-19 24-4 12 19-20-7z':'M61 57q0-31 31-18l10 19z',stone?hair:metal);
  return a;
 }
 let torso=path(heavy?'M56 78l28-10 38 8 14 58-75 3z':'M72 78l35-3 17 56-53 3z',stone?shade:cloth);
 torso+=stone?path('M71 78l18 14 21-18 8 31-12-4-10 12-13-8-12 8z',hair):path('M73 77l20 8 20-8 5 33-25 8-22-9z',metal);
 torso+=stone?line('M81 95l27 30',pale,4):path('M72 118h46l9 22-14-3-8 6-12-6-13 5-12-6z',shade);
 if(kind==='medic')torso+=path('M76 107h36l13 53H64z',stone?'#90714c':'#e1c898')+line('M77 139h35',cloth,5);
 if(kind==='banner')torso+=path('M73 78l-23 67 24-9 18-57z',cloth);
 if(heavy)torso+=path(stone?'M51 80l8-17 18 7 3 22-18 8z':'M51 74l19-11 19 16-9 19-27-3z',stone?hair:metal);
 a+=group(`translate(0 ${dy})`,torso);
 let head=circle(95,54,22,skin)+path('M110 53l12 10-11 3z',skin)+line('M105 55h7',ink,3);
 if(stone){
  head+=path('M71 50l-3-13 12-15 11 7 8-9 17 18-1 12-15-11-17 9z',hair);
  if(['medic','banner','boss'].includes(kind))head+=path('M76 31l-9-19 14 10 11-14 3 20 17-16-5 21z',metal)+line('M76 39l35-2',cloth,5);
  if(heavy)head+=path('M66 31l10-16 17-5 20 11 9 21-15-8-10 7-13-9-14 13z',shade)+path('M72 24L58 12l8 23M111 27l18-16-8 26',metal);
 }else{
  head+=path('M71 53q-3-35 25-34 26 2 27 34l-16-12-25 7-1 28-12-9z',metal)+line('M77 36q21-16 38 1',shade,4);
  if(['shield','spear','boss'].includes(kind))head+=path('M80 20q18-18 40-5l1 11-24-2-12 9z',cloth);
  if(kind==='medic')head+=path('M72 41l4-22h34l8 24-21-10z','#e8d6ae');
  if(giant)head+=path('M78 26l-2-13 13 8 9-12 8 14 14-7-6 18z',metal);
 }
 a+=group(`translate(0 ${dy})`,head);
 const handY=110+dy;
 a+=line(`M108 ${85+dy}L119 ${98+dy} 129 ${handY}`,ink,15)+line(`M108 ${85+dy}L119 ${98+dy} 129 ${handY}`,stone?skin:metal,10);
 let w='';
 if(kind==='shield'||heavy){
  w+=stone?path('M-23-28l13-9 27 7 9 44-16 19-32-9z',shade)+line('M-14-22L-9 22M2-27l5 54',hair,4):circle(0,0,heavy?31:26,metal)+circle(0,0,18,cloth)+circle(0,0,7,metal);
  a+=group(`translate(62 ${handY}) rotate(${swing})`,line('M0 15v-43',hair,8)+path(stone?'M-9-56l16-2 7 21-19 8z':'M-3-66l9 7-2 44h-8z',metal));
 }else if(kind==='spear')w=line('M0 46v-82',hair,6)+path(stone?'M0-98l-9 16 9 7 9-7z':'M0-101l-7 20 7 7 7-7z',metal);
 else if(kind==='archer')w=stone?line('M0 0q28-21 3-43M0 0q-27-25 3-43',hair,3)+circle(3,-43,7,metal):path('M0-40q37 40 0 80','none',shade,5)+line('M0-40L-12 0 0 40',pale,2)+line('M-12 0h47',metal,3);
 else if(kind==='medic')w=line('M0 46v-82',hair,6)+path(stone?'M-13-82l13-13 13 13-12 13z':'M-10-86h20v20h-20z',pale)+circle(0,-77,5,cloth);
 else if(kind==='raider')w=stone?line('M0 12v-35',hair,6)+path('M0-46l20 3-3 17-20-8z',metal):path('M-3 8v-48l19-18-3 24L4 8z',metal);
 else if(kind==='thrower')w=stone?path('M-16-9l5-14 19-3 12 15-7 15-21 3z',metal):path('M-8-22h15v9l9 8-3 19h-24l-4-20 7-8z',shade)+path('M-2-22q-11-12 0-20l7 13 8-4-4 11z','#ec9758');
 else if(kind==='banner')w=line('M0 48v-94',hair,7)+(stone?path('M-19-89l18-11 22 13-10 14 8 14-19 10-18-12 10-13z',metal)+circle(-4,-83,4,ink)+circle(9,-83,4,ink):path('M2-92h39l-8 20 8 16H2z',cloth)+circle(20,-75,8,metal));
 a+=group(`translate(129 ${handY}) rotate(${kind==='spear'?25+swing*.5:kind==='archer'?swing*.4:swing})`,w)+circle(129,handY,5,skin);
 if(giant)a+=circle(95,100,12,metal)+path('M87 100l8-6 8 6-8 8z',cloth);
 return giant?group('translate(-5 0) scale(1.01)',a):a;
}
for(const era of ['stone','bronze'])for(const enemy of [false,true])for(const kind of roles){
 const name=`${enemy?'enemy-':''}${era}-u-${kind}`;
 writeFileSync(`public/assets/${name}.svg`,svg(192,192,rig(era,kind,enemy,0)));
 const frames=Array.from({length:16},(_,i)=>`<svg x="${i%4*320}" y="${Math.floor(i/4)*192}" width="320" height="192" viewBox="0 0 320 192">${group('translate(64 0)',rig(era,kind,enemy,i))}</svg>`).join('');
 const rendered=new Resvg(svg(1280,768,frames)).render();
 const pixels=rendered.pixels;
 for(let y=0;y<768;y++)for(let x=0;x<1280;x++)if((x%320<2||x%320>317||y%192<2||y%192>189)&&pixels[(y*1280+x)*4+3]>0)throw new Error(`Clipped ${name} at ${x%320},${y%192}`);
 writeFileSync(`public/assets/${name}-sheet.png`,rendered.asPng());
}
for(const era of ['stone','bronze']){
 let sheet='';roles.forEach((kind,i)=>sheet+=`<svg x="${i%5*192}" y="${Math.floor(i/5)*192}" width="192" height="192">${rig(era,kind,false,0)}</svg>`);
 writeFileSync(`public/assets/${era}-contact.png`,new Resvg(svg(960,384,`<rect width="960" height="384" fill="#ecdec2"/>${sheet}`)).render().asPng());
 for(const enemy of [false,true]){
 const stone=era==='stone', paint=enemy?'#aa6049':'#4f9284';
 const tower=stone?path('M22 174L35 74 67 39 143 34 175 84 181 174z','#736e55')+path('M57 174V104q40-53 78 0v70z','#322f2a')+path('M34 89l28-24 28 8-8 23-47 7z','#a29a72')+path('M140 66l20 14 10 52-27-13z','#a29a72')+line('M43 145l17-37M144 112l17 37',paint,10):path('M25 174V59h38V34h71v25h39v115z','#b49261')+path('M18 60V38h17v12h17V34h18v31M128 60V34h18v16h17V38h17v22z','#d5b984')+path('M71 174v-61q29-40 59 0v61z','#524235')+line('M31 89h33M133 91h34M29 135h31M140 140h32','#806d50',3)+path('M83 46h34v43l-17 12-17-12z',paint);
 writeFileSync(`public/assets/${era}-tower-${enemy?'enemy':'ally'}.svg`,svg(192,192,tower));
 }
 const stone=era==='stone';
 const sky=stone?'#a3b4a0':'#d7be8b', ground=stone?'#7d8c62':'#a99563';
 let arena=`<rect width="1600" height="600" fill="${sky}"/>`+circle(1160,105,64,stone?'#ddd9ad':'#efda9e')+path('M0 290l210-150 240 128 220-162 250 173 220-131 260 147 200-136v441H0z',stone?'#71897c':'#aa9574','none')+path('M0 351q290-106 510-1t570-7 520 8v249H0z',ground,'none');
 if(stone)for(const x of [220,450,1020,1310])arena+=path(`M${x} 401l23-110 46-23 31 138z`,'#626e58')+path(`M${x+7} 325l58-46-15 61z`,'#8c9476');
 else for(const x of [190,380,1110,1360])arena+=path(`M${x} 387V230h26v157zM${x-7} 230v-15h40v15zM${x-7} 387h40v13h-40z`,'#c7af80')+line(`M${x+8} 245v127`,'#9c845e',3);
 arena+=path('M0 477q400-22 800 0t800 0v123H0z',stone?'#b8a57b':'#c6ac7a','none')+line('M0 492q400-22 800 0t800 0',stone?'#cfbf92':'#deca99',3);
 writeFileSync(`public/assets/arena-${era}.svg`,svg(1600,600,arena));
}
console.log('Generated 40 era sprite sheets and portraits, 4 strongholds and 2 arenas.');
