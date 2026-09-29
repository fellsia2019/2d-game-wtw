/** Rebuild era units and scenery. */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { exportUnits } from './export-units.mjs';
import { exportIronScenery } from './generate-iron-sprites.mjs';
exportUnits(['stone','bronze','iron','antique','medieval','high-medieval'], {manifestEras:['stone','bronze','iron','antique','medieval','high-medieval']});
await import('./generate-antique-sprites.mjs');
await import('./generate-medieval-sprites.mjs');
await import('./generate-high-medieval-sprites.mjs');
await import('./generate-renaissance-sprites.mjs');
exportIronScenery();
const ink='#25302b';
const path=(d,c,s=ink,w=3)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const line=(d,c,w=5)=>path(d,'none',c,w);
const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${ink}" stroke-width="3"/>`;
const svg=(w,h,a)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${a}</svg>`;
for(const era of ['stone','bronze']){

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
console.log('Generated 124 era sprite sheets and portraits, 14 strongholds and 7 arenas.');
