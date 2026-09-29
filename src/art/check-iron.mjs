/** Regression for the rejected Iron draft: every held prop and helmet must leave faces readable. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {ironRig} from './iron-rig.mjs';
const roles=['shield','spear','archer','medic','raider','thrower','banner','siege','bulwark','boss'];
const render=(body,w=320)=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="192"><g transform="translate(${w===320?64:0} 0)">${body}</g></svg>`,{font:{loadSystemFonts:false}}).render().pixels;
function overlap(a,b) {for(let i=3;i<a.length;i+=4)if(a[i]>8&&b[i]>8)return true;return false;}
let count=0;
const silhouettes=new Set();
const nonempty=pixels=>pixels.some((value,i)=>i%4===3&&value>8);
const alphaHash=pixels=>createHash('sha256').update(Buffer.from(pixels.filter((_,i)=>i%4===3))).digest('hex');
for(const enemy of [false,true])for(const role of roles){
 for(let f=0;f<(role==='banner'?48:16);f++) {
  if(['shield','bulwark','boss'].includes(role)) {
   const shieldPixels=render(ironRig(role,enemy,f,'shield'));
   const area=shieldPixels.filter((value,i)=>i%4===3&&value>8).length;
   assert(role==='shield'?area>4500:area===0,`${role}/${enemy}/${f}: only the shield-bearer should have the dominant shield silhouette`);
  }
  const layers=Object.fromEntries(['face','equipment','eyes','headgear'].map(layer=>[layer,render(ironRig(role,enemy,f,layer))]));
  const pixels=layer=>layers[layer];
  for(const layer of ['face','eyes','headgear'])assert(nonempty(pixels(layer)),`${role}/${enemy}/${f}: empty ${layer} mask`);
  if(!(role==='thrower'&&[12,13].includes(f)))assert(nonempty(pixels('equipment')),`${role}/${enemy}/${f}: empty equipment mask`);
  assert(!overlap(pixels('face'),pixels('equipment')),`${role}/${enemy}/${f}: equipment obscures face clearance zone`);
  assert(!overlap(pixels('eyes'),pixels('headgear')),`${role}/${enemy}/${f}: headwear obscures eye`);
  count++;
 }
 const portrait=new Resvg(readFileSync(`public/assets/${enemy?'enemy-':''}iron-u-${role}.svg`,'utf8'),{font:{loadSystemFonts:false}}).render().pixels;
 if(!enemy)silhouettes.add(alphaHash(portrait));
 for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(x<2||x>189||y<2||y>189)assert.equal(portrait[(y*192+x)*4+3],0,`${role}/${enemy}: portrait clips at ${x},${y}`);
}
assert.equal(silhouettes.size,10,'Iron roles must have ten different idle silhouettes');
console.log(`Iron readability: ${count} frames, equipment clear of expanded face masks, headwear clear of eyes; all 20 full portraits fit 192px.`);
