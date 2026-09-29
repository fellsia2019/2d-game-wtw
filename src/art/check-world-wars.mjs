/** Structural verification; visual review is required separately. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { worldWarsRoles, worldWarsRig, worldWarsBossRig } from './world-wars-rig.mjs';

const draft = JSON.parse(readFileSync('public/assets/world-wars-manifest.json','utf8'));
const game = JSON.parse(readFileSync('public/assets/sprite-manifest.json','utf8'));
if (draft.status !== 'approved' || draft.gameIntegrated !== true || draft.modelCount !== 8 || draft.totalUniqueModels !== 9 || draft.models.length !== 8 || draft.sheets.length !== 17 || draft.models.map(m=>m.role).join() !== worldWarsRoles.join()) throw Error('Invalid World Wars approved manifest');
if (draft.bossPreview?.uniqueModel !== true || draft.bossPreview?.scale !== 1.5 || draft.bossPreview?.side !== 'enemy' || draft.bossPreview?.sheet !== 'enemy-world-wars-boss-sheet.png' || draft.bossPreview?.frames !== 16) throw Error('Unique boss preview missing');
if (!game.eras.includes('world-wars') || !draft.sheets.every(s=>game.sheets.includes(s)) || ![...worldWarsRoles,'boss'].every(role=>game.eraFrameCounts['world-wars']?.[role]===16)) throw Error('World Wars absent from playable manifest');
const shift = role => role === 'raider' ? 12 : role === 'siege' ? 40 : 64;
for (const role of worldWarsRoles) {
 const sideHashes = [];
 for (const enemy of [false,true]) {
  const hashes = [];
  for (let frame=0;frame<16;frame++) {
   const drawing = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192"><g transform="translate(${shift(role)} 0)">${worldWarsRig(role,enemy,frame)}</g></svg>`;
   const {pixels} = new Resvg(drawing).render();
   let top=192,bottom=-1,left=320,right=-1;
   for (let y=0;y<192;y++) for (let x=0;x<320;x++) if (pixels[(y*320+x)*4+3]>10) {top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
   if (top<2 || bottom>189 || left<2 || right>317 || bottom-top < (role==='siege'?95:role==='raider'?110:130)) throw Error(`${role} ${enemy?'enemy':'ally'} ${frame}: bounds ${left},${top}–${right},${bottom}`);
   hashes.push(createHash('sha1').update(pixels).digest('hex'));
  }
  if (new Set(hashes.slice(2,10)).size < 6 || new Set(hashes.slice(10,16)).size < 4) throw Error(`${role} ${enemy?'enemy':'ally'}: weak motion`);
  sideHashes.push(hashes[0]);
 }
 if (sideHashes[0]===sideHashes[1]) throw Error(`${role}: side palettes identical`);
 console.log(`${role}: 16 frames × both sides; distinct walk/action and palette`);
}
const bossHashes = [], siegeHashes = [];
for (let frame=0;frame<16;frame++) {
 const render = body => new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192"><g transform="translate(40 0)">${body}</g></svg>`).render().pixels;
 const pixels = render(worldWarsBossRig(frame));
 let top=192,bottom=-1,left=320,right=-1;
 for (let y=0;y<192;y++) for (let x=0;x<320;x++) if (pixels[(y*320+x)*4+3]>10) {top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
 if (top<2 || bottom>189 || left<2 || right>317 || bottom-top<95) throw Error(`boss ${frame}: bounds ${left},${top}–${right},${bottom}`);
 bossHashes.push(createHash('sha1').update(pixels).digest('hex'));
 siegeHashes.push(createHash('sha1').update(render(worldWarsRig('siege',true,frame))).digest('hex'));
}
if (new Set(bossHashes.slice(2,10)).size<6 || new Set(bossHashes.slice(10,16)).size<4 || bossHashes.some((hash,i)=>hash===siegeHashes[i])) throw Error('Boss motion or model is not distinct from siege');
console.log('boss: unique enemy light tank, 16 distinct frames, separate from siege car');
