/** Structural checks complement the required visual review in the shared sprite lab. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { industrialRig, industrialRoles } from './industrial-rig.mjs';

const manifest = JSON.parse(readFileSync('public/drafts/industrial/manifest.json', 'utf8'));
if (manifest.status !== 'draft-awaiting-approval' || manifest.gameIntegrated !== false || manifest.modelCount !== 8 || manifest.roles.join() !== industrialRoles.join() || manifest.sheets.length !== 16) throw Error('Industrial draft manifest is inconsistent');
for (const role of industrialRoles) {
 const sideHashes = [];
 for (const enemy of [false,true]) {
  const hashes = [], heights = [];
  for (let frame=0;frame<16;frame++) {
   const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192"><g transform="translate(64 0)">${industrialRig(role,enemy,frame)}</g></svg>`;
   const { pixels } = new Resvg(svg).render();
   let top=192,bottom=-1,left=320,right=-1;
   for(let y=0;y<192;y++)for(let x=0;x<320;x++)if(pixels[(y*320+x)*4+3]>10){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
   if(top<2||bottom>189||left<2||right>317||bottom-top<130)throw Error(`Industrial ${role} ${enemy?'enemy':'ally'} frame ${frame}: invalid bounds ${left},${top}–${right},${bottom}`);
   hashes.push(createHash('sha1').update(pixels).digest('hex')); heights.push(bottom-top+1);
  }
  if(new Set(hashes.slice(2,10)).size<6)throw Error(`Industrial ${role} ${enemy?'enemy':'ally'}: walk barely changes`);
  if(new Set(hashes.slice(10,16)).size<4)throw Error(`Industrial ${role} ${enemy?'enemy':'ally'}: action barely changes`);
  sideHashes.push(hashes[0]);
  console.log(`${role} ${enemy?'enemy':'ally'}: 16 frames, height ${Math.min(...heights)}–${Math.max(...heights)} px, walk ${new Set(hashes.slice(2,10)).size}/8, action ${new Set(hashes.slice(10,16)).size}/6`);
 }
 if(sideHashes[0]===sideHashes[1])throw Error(`Industrial ${role}: side palette is missing`);
}
