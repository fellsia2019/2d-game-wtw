import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { modernRig, modernRoles } from './modern-rig.mjs';

const draft=JSON.parse(readFileSync('public/assets/modern-manifest.json','utf8'));
const game=JSON.parse(readFileSync('public/assets/sprite-manifest.json','utf8'));
if(draft.status!=='approved'||draft.gameIntegrated!==true||draft.modelCount!==8||draft.totalUniqueModels!==8||draft.models.length!==8||draft.sheets.length!==16||!game.eras.includes('modern')||draft.sheets.some(sheet=>!game.sheets.includes(sheet))||draft.boss.reusesRole!=='shield'||draft.boss.scale!==1.5)throw Error('Modernity is not correctly integrated');
if(draft.droneStrike?.role!=='banner'||draft.droneStrike.effect!=='enemyDamage'||draft.droneStrike.allyBuff!==false||draft.droneStrike.sequence.join(',')!=='launch,flyToEnemy,explode,reload')throw Error('Drone strike design is incomplete');
if(draft.scenery.length!==4||draft.scenery.some(file=>!existsSync(`public/assets/${file}`)))throw Error('Modern scenery is incomplete');
for(const side of ['ally','enemy']){
 const file=`modern-tower-${side}.svg`;
 if(!draft.scenery.includes(file))throw Error(`${file} missing from modern scenery`);
 const image=readFileSync(`public/assets/${file}`,'utf8');
 if(!image.includes('viewBox="0 0 192 192"')||/<image\b|data:image|<foreignObject\b/.test(image))throw Error(`${file} must be native vector art`);
}
for(const role of modernRoles){
 const sides=[];
 for(const enemy of [false,true]){
  const hashes=[];
  for(let frame=0;frame<16;frame++){
   const shift=role==='siege'?16:role==='archer'?49:role==='spear'?56:60;
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192"><g transform="translate(${shift} 0)">${modernRig(role,enemy,frame)}</g></svg>`;
   const {pixels}=new Resvg(svg).render();
   let left=320,right=-1,top=192,bottom=-1;
   for(let y=0;y<192;y++)for(let x=0;x<320;x++)if(pixels[(y*320+x)*4+3]>10){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(left<2||right>317||top<2||bottom>189||bottom-top<90)throw Error(`${role}/${enemy?'enemy':'ally'}/${frame}: bounds ${left},${top}–${right},${bottom}`);
   hashes.push(createHash('sha1').update(pixels).digest('hex'));
  }
  if(new Set(hashes.slice(2,10)).size<6||new Set(hashes.slice(10,16)).size<4)throw Error(`${role}/${enemy?'enemy':'ally'}: animation lacks distinct frames`);
  sides.push(hashes[0]);
 }
 if(sides[0]===sides[1])throw Error(`${role}: missing side palette`);
}
console.log('Modernity: 8 roles, 2 palettes, 256 frames, bounds and motion valid; game manifest integrated.');
