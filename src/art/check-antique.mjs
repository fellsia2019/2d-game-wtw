/** Antiquity readability: held props and helmets must leave faces visible. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {antiqueRig,antiqueRoles} from './antique-rig.mjs';
const roles=antiqueRoles;
const render=(body,w=320)=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="192"><g transform="translate(${w===320?64:0} 0)">${body}</g></svg>`,{font:{loadSystemFonts:false}}).render().pixels;
function overlap(a,b) {for(let i=3;i<a.length;i+=4)if(a[i]>8&&b[i]>8)return true;return false;}
// Broken beam/string endpoints used to produce detached opaque components.
function componentCount(pixels) {
 const width=320,height=192,seen=new Uint8Array(width*height); let count=0;
 for(let start=0;start<seen.length;start++) {
  if(seen[start]||pixels[start*4+3]<=8)continue;
  const stack=[start];seen[start]=1;let area=0;
  while(stack.length) {
   const i=stack.pop();area++;const x=i%width,y=Math.floor(i/width);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
    const nx=x+dx,ny=y+dy,j=ny*width+nx;
    if(nx<0||nx>=width||ny<0||ny>=height||seen[j]||pixels[j*4+3]<=8)continue;
    seen[j]=1;stack.push(j);
   }
  }
  if(area>4)count++;
 }
 return count;
}
const manifest=JSON.parse(readFileSync('public/assets/antique-draft-manifest.json','utf8'));
assert.deepEqual(manifest.roles,antiqueRoles,'the draft must contain exactly eight roles');
assert.equal(manifest.sheets.length,16,'eight models, two team palettes');
let count=0;
const silhouettes=new Set();
const nonempty=pixels=>pixels.some((value,i)=>i%4===3&&value>8);
const alphaHash=pixels=>createHash('sha256').update(Buffer.from(pixels.filter((_,i)=>i%4===3))).digest('hex');
for(const enemy of [false,true])for(const role of roles){
 for(let f=0;f<(role==='banner'?48:16);f++) {
  const shieldPixels=render(antiqueRig(role,enemy,f,'shield'));
  const area=shieldPixels.filter((value,i)=>i%4===3&&value>8).length;
  if(['shield','spear'].includes(role))assert(area>3500,`${role}/${f}: large shield required`);
  if(!['shield','spear','archer'].includes(role))assert.equal(area,0,`${role}/${f}: unexpected shield`);
  const layers=Object.fromEntries(['face','equipment','eyes','headgear'].map(layer=>[layer,render(antiqueRig(role,enemy,f,layer))]));
  const pixels=layer=>layers[layer];
  if(['thrower','siege'].includes(role))assert.equal(componentCount(pixels('equipment')),1,`${role}/${enemy}/${f}: disconnected engine part`);
  for(const layer of ['face','eyes','headgear'])assert(nonempty(pixels(layer)),`${role}/${enemy}/${f}: empty ${layer} mask`);
  if(!(['archer','raider'].includes(role)&&[12,13].includes(f)))assert(nonempty(pixels('equipment')),`${role}/${enemy}/${f}: empty equipment mask`);
  assert(!overlap(pixels('face'),pixels('equipment')),`${role}/${enemy}/${f}: equipment obscures face clearance zone`);
  assert(!overlap(pixels('eyes'),pixels('headgear')),`${role}/${enemy}/${f}: headwear obscures eye`);
  count++;
 }
 const portrait=render(antiqueRig(role,enemy,0),192);
 if(!enemy)silhouettes.add(alphaHash(portrait));
 for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(x<2||x>189||y<2||y>189)assert.equal(portrait[(y*192+x)*4+3],0,`${role}/${enemy}: portrait clips at ${x},${y}`);
}
assert.equal(silhouettes.size,8,'Antiquity roles must have eight different idle silhouettes');
console.log(`Antiquity readability: ${count} frames, equipment clear of expanded face masks, headwear clear of eyes; all 16 full portraits fit 192px.`);
