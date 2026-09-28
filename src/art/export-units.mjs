import { Resvg } from '@resvg/resvg-js';
import { writeFileSync as writeBytes, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { svg, unitRig } from './unit-rig.mjs';
import { antiqueRig, antiqueRoles } from './antique-rig.mjs';
export const roles=['shield','spear','archer','medic','raider','thrower','banner','siege','bulwark','boss'];
function writeFileSync(path, content) {
 const bytes=Buffer.isBuffer(content)?content:Buffer.from(content);
 try { if(readFileSync(path).equals(bytes))return; } catch(error) { if(error.code!=='ENOENT')throw error; }
 // Vite/Windows may briefly hold a file while the watcher or HTTP server reads it.
 for(let attempt=0;attempt<6;attempt++) {
  try { writeBytes(path,bytes); return; } catch(error) {
   if(!['UNKNOWN','EBUSY','EPERM','EACCES'].includes(error.code)||attempt===5)throw error;
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,80*(attempt+1));
  }
 }
}
export function exportUnits(eras, { manifestPath = 'public/assets/sprite-manifest.json', manifestEras = ['stone','bronze','iron','antique'] } = {}) {
 let count=0;
 for(const era of eras) {
  const available=era==='antique'?antiqueRoles:roles;
  for(const enemy of [false,true]) {
   let contact='';
   for(const [r,role] of available.entries()) {
    const name=`${enemy?'enemy-':''}${era+'-'}u-${role}`;
    const rig=frame=>era==='antique'?antiqueRig(role,enemy,frame):unitRig(era,role,enemy,frame);
    writeFileSync(`public/assets/${name}.svg`,svg(192,192,rig(0)));
    const frameCount=role==='banner'?48:16, height=frameCount/4*192;
    const frames=Array.from({length:frameCount},(_,i)=>`<svg x="${i%4*320}" y="${Math.floor(i/4)*192}" width="320" height="192"><g transform="translate(64 0)">${rig(i)}</g></svg>`).join('');
    const rendered=new Resvg(svg(1280,height,frames)).render(), pixels=rendered.pixels;
    for(let y=0;y<height;y++)for(let x=0;x<1280;x++)if((x%320<2||x%320>317||y%192<2||y%192>189)&&pixels[(y*1280+x)*4+3])throw Error(`Clipped ${name} at ${x%320},${y%192}`);
    const hashes=Array.from({length:frameCount},(_,i)=>{
     const hash=createHash('sha256'), x=i%4*320,y=Math.floor(i/4)*192;
     for(let row=y;row<y+192;row++)hash.update(pixels.subarray((row*1280+x)*4,(row*1280+x+320)*4));
     return hash.digest('hex');
    });
    if(new Set(hashes.slice(2,10)).size!==8)throw Error(`Repeated walk frames: ${name}`);
    if(role==='banner'&&hashes[1]!==hashes[0])throw Error(`Standard ready pose must rest: ${name}`);
    if(role!=='banner'&&new Set(hashes.slice(10,16)).size!==6)throw Error(`Repeated action frames: ${name}`);
    if(role==='banner') {
     if(hashes[16]!==hashes[0]||hashes[47]!==hashes[0])throw Error(`Standard cycle must meet idle: ${name}`);
     if(new Set(hashes.slice(16,48)).size<16)throw Error(`Insufficient standard motion: ${name}`);
    }
    writeFileSync(`public/assets/${name}-sheet.png`,rendered.asPng());
    contact+=`<svg x="${r%5*192}" y="${Math.floor(r/5)*216+24}" width="192" height="192">${rig(0)}</svg><text x="${r%5*192+96}" y="${Math.floor(r/5)*216+20}" text-anchor="middle" fill="#eee0bc" font-family="Segoe UI" font-size="16">${role}</text>`;
    count++;
   }
   writeFileSync(`public/assets/${era}${enemy?'-enemy':''}-contact.png`,new Resvg(svg(960,456,'<rect width="960" height="456" fill="#203239"/>'+contact)).render().asPng());
  }
 }
 writeFileSync(manifestPath,JSON.stringify({frameWidth:320,frameHeight:192,columns:4,rows:4,originX:.5,originY:176/192,frames:{idle:0,ready:1,move:[2,3,4,5,6,7,8,9],attack:[10,11,12,13,14,15],standardLift:Array.from({length:32},(_,i)=>16+i)},moveFps:12,attackFps:15,roles:manifestEras.length===1&&manifestEras[0]==='antique'?antiqueRoles:roles,eras:manifestEras,standardFrames:{first:16,count:32,fps:40},artVersion:3,sheets:readdirSync('public/assets').filter(name=>manifestEras.some(era=>name.startsWith(`${era}-u-`)||name.startsWith(`enemy-${era}-u-`))&&name.endsWith('-sheet.png')&&(!name.includes('antique-u-')||antiqueRoles.some(role=>name.endsWith(`-u-${role}-sheet.png`)))).sort()},null,2));
 console.log(`${count} atlases: bounds, walk/action poses and smooth standard cycles verified.`);
}
