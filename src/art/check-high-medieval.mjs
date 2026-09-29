import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {highMedievalRig as rig,highMedievalRoles as roles,highMedievalFrameCounts as frameCounts,trebuchetPose,crossbowPose} from './high-medieval-rig.mjs';
const render=body=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="192"><g transform="translate(64 0)">${body}</g></svg>`,{font:{loadSystemFonts:false}}).render().pixels;
const overlaps=(a,b)=>a.some((v,i)=>i%4===3&&v>8&&b[i]>8);
const manifest=JSON.parse(readFileSync('public/assets/high-medieval-draft-manifest.json','utf8'));
assert.deepEqual(manifest.roles,roles);assert.equal(manifest.sheets.length,16);
let count=0;
for(const enemy of [false,true])for(const role of roles)for(let f=0;f<frameCounts[role];f++){
 const eyes=render(rig(role,enemy,f,'eyes')),hat=render(rig(role,enemy,f,'headgear')),face=render(rig(role,enemy,f,'face')),equipment=render(rig(role,enemy,f,'equipment'));
 assert(eyes.some((v,i)=>i%4===3&&v>8),`${role}/${f}: empty eye mask`);
 assert(!overlaps(eyes,hat),`${role}/${enemy}/${f}: helmet covers eyes`);
 if(overlaps(face,equipment)) {const points=[];for(let i=3;i<face.length;i+=4)if(face[i]>8&&equipment[i]>8)points.push([(i-3)/4%320-64,Math.floor((i-3)/4/320)]);throw Error(`${role}/${enemy}/${f}: equipment crosses face: ${JSON.stringify(points.slice(0,12))}`);}
 count++;
}
console.log(`High Medieval draft: ${count} frames, eyes and faces clear on both sides; exactly 8 models / 16 atlases.`);
// Mechanical invariants supplement, but do not replace, visual inspection.
for(let f=0;f<48;f++) {const p=trebuchetPose(f);assert(Math.abs(Math.hypot(p.tip.x-p.pivot.x,p.tip.y-p.pivot.y)-65)<1e-8);assert(Math.abs(Math.hypot(p.pouch.x-p.tip.x,p.pouch.y-p.tip.y)-42)<1e-8);}
assert(trebuchetPose(26).hinge.y>trebuchetPose(16).hinge.y,'counterweight descends during launch');
assert(!trebuchetPose(27).loaded,'stone must not reappear just after release');
assert(crossbowPose(22).loaded&&!crossbowPose(23).loaded,'bolt leaves after trigger release');
assert(crossbowPose(37).pull<crossbowPose(30).pull,'spanning draws string back towards lock');
for(const role of ['archer','siege'])for(const enemy of [false,true])for(const f of [16,47])assert.deepEqual(render(rig(role,enemy,f)),render(rig(role,enemy,0)),`${role}/${f}: full cycle must return to the ready stance`);
