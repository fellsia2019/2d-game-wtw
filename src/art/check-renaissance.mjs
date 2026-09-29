import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {renaissanceRig as rig,renaissanceRoles as roles,renaissanceFrameCounts as counts,cannonPose,musketPose} from './renaissance-rig.mjs';
const render=b=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192"><g transform="translate(64 0)">${b}</g></svg>`,{font:{loadSystemFonts:false}}).render().pixels;
const overlaps=(a,b)=>a.some((v,i)=>i%4===3&&v>8&&b[i]>8);
function components(bytes){
 const seen=new Uint8Array(320*192);let n=0;
 for(let i=0;i<seen.length;i++){if(seen[i]||bytes[i*4+3]<16)continue;n++;const todo=[i];seen[i]=1;
  while(todo.length){const cell=todo.pop(),x=cell%320,y=Math.floor(cell/320);for(const next of [x>0?cell-1:-1,x<319?cell+1:-1,y>0?cell-320:-1,y<191?cell+320:-1])if(next>=0&&!seen[next]&&bytes[next*4+3]>=16){seen[next]=1;todo.push(next);}}
 }return n;
}
const m=JSON.parse(readFileSync('public/assets/renaissance-draft-manifest.json','utf8'));
assert.deepEqual(m.roles,roles);assert.equal(m.sheets.length,16);assert.equal(m.gameIntegrated,true);assert.equal(m.status,'approved');
const game=JSON.parse(readFileSync('public/assets/sprite-manifest.json','utf8'));
assert(game.eras.includes('renaissance'));assert.equal(game.sheets.filter(s=>s.includes('renaissance')).length,16);
let n=0;
for(const enemy of [false,true])for(const r of roles)for(let f=0;f<counts[r];f++){
 const eyes=render(rig(r,enemy,f,'eyes')),hat=render(rig(r,enemy,f,'headgear')),face=render(rig(r,enemy,f,'face')),gear=render(rig(r,enemy,f,'equipment'));
 assert(eyes.some((v,i)=>i%4===3&&v>8),`${r}/${f}: eyes missing`);
 assert(!overlaps(eyes,hat),`${r}/${f}: hat covers eyes`);
 assert(!overlaps(face,gear),`${r}/${f}: equipment across face`);n++;
}
assert(cannonPose(23).recoil<0);assert(cannonPose(23).flash);assert(cannonPose(35).ram);
for(const r of ['archer','siege'])for(const enemy of [false,true])for(const f of [16,47])assert.deepEqual(render(rig(r,enemy,f)),render(rig(r,enemy,0)),`${r}/${f}: cycle must return to rest`);
for(const enemy of [false,true])for(let f=0;f<16;f++)assert.equal(components(render(rig('shield',enemy,f,'equipment'))),2,`shield/${f}: shield and continuous sword must form exactly two silhouettes`);
for(let f=17;f<48;f++){const a=musketPose(f-1),b=musketPose(f);assert(Math.hypot(b.x-a.x,b.y-a.y)<25,`musket/${f}: position jump`);assert(Math.abs(b.a-a.a)<30,`musket/${f}: angle jump`);}
console.log(`Renaissance: ${n} frames; faces clear; exactly 8 approved game models.`);
