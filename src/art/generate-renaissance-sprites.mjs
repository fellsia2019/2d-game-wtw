import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {exportUnits} from './export-units.mjs';
import {renaissanceRig as rig,renaissanceRoles as roles,renaissanceNames as names,renaissanceFrameCounts as frameCounts} from './renaissance-rig.mjs';
import {renaissanceFort} from './renaissance-fort.mjs';
const svg=(w,h,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${b}</svg>`;
const png=(path,w,h,b)=>writeFileSync(path,new Resvg(svg(w,h,b)).render().asPng());
const manifestPath='public/assets/renaissance-draft-manifest.json';
exportUnits(['renaissance'],{manifestPath,manifestEras:['renaissance'],customRig:rig,customRoles:roles,frameCounts});
writeFileSync(manifestPath,JSON.stringify({...JSON.parse(readFileSync(manifestPath,'utf8')),status:'approved',gameIntegrated:true,modelCount:8,names,frameCounts,actionCycles:{archer:{first:16,count:32,fps:8},siege:{first:16,count:32,fps:8},banner:{first:16,count:32,fps:16}}},null,2));
mkdirSync('docs/qa/renaissance',{recursive:true});
for(const enemy of [false,true]){
 for(const r of roles)writeFileSync(`public/assets/${enemy?'enemy-':''}renaissance-u-${r}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="-64 0 320 192">${rig(r,enemy,0)}</svg>`);
 const contact=roles.map((r,i)=>`<text x="${i%4*320+160}" y="${Math.floor(i/4)*220+20}" text-anchor="middle" fill="#eee0bc" font-family="Segoe UI" font-size="16">${names[i]}</text><g transform="translate(${i%4*320+64} ${Math.floor(i/4)*220+28})">${rig(r,enemy,0)}</g>`).join('');
 png(`public/assets/renaissance${enemy?'-enemy':''}-contact.png`,1280,440,'<rect width="1280" height="440" fill="#203239"/>'+contact);
 for(const r of roles){const n=frameCounts[r],b=Array.from({length:n},(_,f)=>`<text x="${f%4*320+8}" y="${Math.floor(f/4)*208+16}" fill="#ddd" font-family="Segoe UI">${f}</text><g transform="translate(${f%4*320+64} ${Math.floor(f/4)*208+18})">${rig(r,enemy,f)}</g>`).join('');png(`docs/qa/renaissance/${enemy?'enemy':'ally'}-${r}.png`,1280,n/4*208,`<rect width="1280" height="${n/4*208}" fill="#203239"/>`+b);}
 const scales=roles.map((r,i)=>[.52,.34].map((s,j)=>[0,5,13].map((f,k)=>`<text x="${(j*3+k)*208+8}" y="${i*120+19}" fill="#bdced7" font-family="Segoe UI">${r} · ${s} · ${f}</text><g transform="translate(${(j*3+k)*208+50} ${i*120+116}) scale(${s}) translate(0 -176)">${rig(r,enemy,f)}</g>`).join('')).join('')).join('');
 png(`docs/qa/renaissance/${enemy?'enemy':'ally'}-scales.png`,1248,960,'<rect width="1248" height="960" fill="#203239"/>'+scales);
}
writeFileSync('public/assets/arena-renaissance.svg',svg(1600,600,`<rect width="1600" height="600" fill="#ada7bd"/><circle cx="1190" cy="110" r="48" fill="#edd0b0"/><path d="M0 307Q290 194 590 302T1600 262V600H0Z" fill="#797b98"/><g fill="#9e7869" stroke="#635469" stroke-width="4"><path d="M730 326V222h54v104ZM800 326V194h91v132ZM909 326V216h73v110ZM999 326V239h62v87Z"/><path d="M788 194l58-49 59 49ZM900 216l46-37 46 37Z" fill="#80515c"/><path d="M1091 326V190h56v136Z"/><path d="M1080 190q40-69 78 0Z" fill="#b49b88"/></g><path d="M425 391l158-98 148 37 125-49 158 39 159-23 234 108v69H425Z" fill="#6f726e"/><path d="M424 393l159-99 148 36 125-48 158 39 159-24 234 109-137 36-78-69-167 24-168-38-122 52-150-40-121 64Z" fill="#a78975" stroke="#64516b" stroke-width="6"/><path d="M0 473Q360 441 810 472T1600 472V600H0Z" fill="#b9a084"/><path d="M0 506Q450 467 860 499T1600 498" stroke="#dbc2a5" stroke-width="4" fill="none"/>`));
for(const enemy of [false,true]){
 writeFileSync(`public/assets/renaissance-tower-${enemy?'enemy':'ally'}.svg`,renaissanceFort(enemy));
}
const commonPath='public/assets/sprite-manifest.json',common=JSON.parse(readFileSync(commonPath,'utf8')),approved=JSON.parse(readFileSync(manifestPath,'utf8'));
common.eras=[...new Set([...common.eras,'renaissance'])];common.sheets=[...new Set([...common.sheets,...approved.sheets])].sort();
common.eraActionCycles={...common.eraActionCycles,renaissance:approved.actionCycles};common.eraFrameCounts={...common.eraFrameCounts,renaissance:frameCounts};
writeFileSync(commonPath,JSON.stringify(common,null,2));
console.log('Approved Renaissance era: 8 models / 16 atlases, scenery and game manifest.');
