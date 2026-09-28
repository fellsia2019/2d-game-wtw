/** Reproducible visual review sheets for the three revised roles. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {medievalRig} from './medieval-rig.mjs';
import {svg} from './unit-rig.mjs';
mkdirSync('output/medieval-rework',{recursive:true});
const names={raider:'Берсерк',medic:'Знахарь',banner:'Роговой трубач'};
for(const enemy of [false,true]) {
 for(const role of ['raider','medic','banner']) {
  const frames=role==='banner'?48:16,h=Math.ceil(frames/8)*208+32;
  let body=`<rect width="1792" height="${h}" fill="#203239"/><text x="14" y="22" fill="#eee0bc" font-family="sans-serif" font-size="18">${names[role]} · ${enemy?'противник':'союзник'}</text>`;
  for(let f=0;f<frames;f++){
   const x=f%8*224,y=32+Math.floor(f/8)*208;
   body+=`<text x="${x+10}" y="${y+15}" font-size="14" fill="#adbfb9">${f}</text><g transform="translate(${x+12} ${y+12})">${medievalRig(role,enemy,f)}</g>`;
  }
  writeFileSync(`output/medieval-rework/${enemy?'enemy':'ally'}-${role}.png`,new Resvg(svg(1792,h,body)).render().asPng());
 }
 let body='<rect width="1344" height="864" fill="#203239"/>';
 for(const [i,role] of ['raider','medic','banner'].entries())for(const [col,scale] of [1,.52,.34].entries())for(const [pose,frame] of [0,5,role==='banner'?32:13].entries()){
  const x=col*448+pose*146,y=i*288;
  body+=`<text x="${x+8}" y="${y+20}" fill="#ddd" font-size="13" font-family="sans-serif">${names[role]} / ${scale} / ${frame}</text><g transform="translate(${x+65} ${y+236}) scale(${scale}) translate(-96 -176)">${medievalRig(role,enemy,frame)}</g>`;
 }
 writeFileSync(`output/medieval-rework/${enemy?'enemy':'ally'}-scales.png`,new Resvg(svg(1344,864,body)).render().asPng());
}
console.log('Review sheets saved in output/medieval-rework.');
