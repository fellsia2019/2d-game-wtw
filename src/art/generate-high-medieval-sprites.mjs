import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {exportUnits} from './export-units.mjs';
import {highMedievalRig as rig,highMedievalRoles as roles,highMedievalNames as names,highMedievalFrameCounts as frameCounts} from './high-medieval-rig.mjs';
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;
const png=(path,w,h,body)=>writeFileSync(path,new Resvg(svg(w,h,body)).render().asPng());
exportUnits(['high-medieval'],{manifestPath:'public/assets/high-medieval-draft-manifest.json',manifestEras:['high-medieval'],customRig:rig,customRoles:roles,frameCounts});
const manifestPath='public/assets/high-medieval-draft-manifest.json';
writeFileSync(manifestPath,JSON.stringify({...JSON.parse(readFileSync(manifestPath,'utf8')),status:'approved',gameIntegrated:true,modelCount:8,names,frameCounts,actionCycles:{archer:{first:16,count:32,fps:8},siege:{first:16,count:32,fps:8},banner:{first:16,count:32,fps:16}}},null,2));
mkdirSync('docs/qa/high-medieval',{recursive:true});
for(const enemy of [false,true]) {
 const contact=roles.map((role,i)=>`<text x="${i%4*224+112}" y="${Math.floor(i/4)*224+23}" text-anchor="middle" fill="#eee0bc" font-family="Segoe UI" font-size="16">${names[i]}</text><g transform="translate(${i%4*224+16} ${Math.floor(i/4)*224+30})">${rig(role,enemy,0)}</g>`).join('');
 png(`public/assets/high-medieval${enemy?'-enemy':''}-contact.png`,896,448,'<rect width="896" height="448" fill="#203239"/>'+contact);
 for(const role of roles) {
  const count=frameCounts[role];
  const body=Array.from({length:count},(_,f)=>`<text x="${f%4*320+12}" y="${Math.floor(f/4)*208+18}" fill="#cad4da" font-family="Segoe UI" font-size="16">${f}</text><g transform="translate(${f%4*320+64} ${Math.floor(f/4)*208+18})">${rig(role,enemy,f)}</g>`).join('');
  png(`docs/qa/high-medieval/${enemy?'enemy':'ally'}-${role}.png`,1280,Math.ceil(count/4)*208,`<rect width="1280" height="${Math.ceil(count/4)*208}" fill="#203239"/>`+body);
 }
 const scales=roles.map((role,i)=>[.52,.34].map((scale,j)=>[0,5,13].map((frame,k)=>`<text x="${(j*3+k)*208+8}" y="${i*120+19}" fill="#b9cbd5" font-family="Segoe UI" font-size="16">${role} · ${Math.round(scale*100)}% · ${frame}</text><g transform="translate(${(j*3+k)*208+50} ${i*120+116}) scale(${scale}) translate(0 -176)">${rig(role,enemy,frame)}</g>`).join('')).join('')).join('');
 png(`docs/qa/high-medieval/${enemy?'enemy':'ally'}-scales.png`,1248,960,'<rect width="1248" height="960" fill="#203239"/>'+scales);
}
writeFileSync('public/assets/arena-high-medieval.svg',svg(1600,600,`<rect width="1600" height="600" fill="#b4c5d0"/><circle cx="1190" cy="95" r="43" fill="#f2dfac"/><path d="M0 320L220 153 390 282 680 112 970 292 1250 169 1600 328V600H0Z" fill="#81929d"/><path d="M0 388Q410 305 830 366T1600 349V600H0Z" fill="#788d72"/><g fill="#a4ada9" stroke="#626e74" stroke-width="5"><path d="M1120 349V186h180v163Z"/><path d="M1098 349V140h55v209ZM1270 349V140h55v209Z"/><path d="M1094 140V117h15v10h14v-10h15v10h18v13ZM1266 140V117h15v10h14v-10h15v10h18v13Z"/></g><path d="M1190 349v-76q20-32 42 0v76Z" fill="#4a5761"/><path d="M0 487Q400 455 800 482T1600 482V600H0Z" fill="#b7a281"/><path d="M0 510Q400 479 800 505T1600 505" fill="none" stroke="#d5c3a1" stroke-width="4"/>`));
console.log('Approved game era: 8 models, 16 atlases, review sheets and backdrop.');

for(const enemy of [false,true]) {
 const paint=enemy?'#ac4c45':'#4b73a2';
 const tower=`<g stroke="#35404b" stroke-width="3" stroke-linejoin="round"><path d="M24 176V60h144v116Z" fill="#98a2a7"/><path d="M18 176V42h40v134ZM134 176V42h40v134Z" fill="#b9bebc"/><path d="M15 43V24h12v9h10v-9h12v9h12v10ZM131 43V24h12v9h10v-9h12v9h12v10Z" fill="#d5d4c8"/><path d="M72 176v-59q24-36 48 0v59Z" fill="#4b423d"/><path d="M82 64h28v34l-14 13-14-13Z" fill="${paint}"/><path d="M96 71l10 12-10 15-10-15z" fill="none" stroke="#ead6a0"/><path d="M32 69h10v29H32ZM150 69h10v29h-10Z" fill="#43515a"/><path d="M26 126h27M140 126h27M60 111h15M118 111h15" stroke="#77838b"/></g>`;
 writeFileSync(`public/assets/high-medieval-tower-${enemy?'enemy':'ally'}.svg`,svg(192,192,tower));
}
mkdirSync('public/assets/era-cards',{recursive:true});
// The approved era-card WebP is generated with image_gen; sprite rebuilds preserve it.
const commonPath='public/assets/sprite-manifest.json';
const common=JSON.parse(readFileSync(commonPath,'utf8'));
const approved=JSON.parse(readFileSync(manifestPath,'utf8'));
common.eras=[...new Set([...common.eras,'high-medieval'])];
common.sheets=[...new Set([...common.sheets,...approved.sheets])].sort();
common.eraActionCycles={...common.eraActionCycles,'high-medieval':approved.actionCycles};
common.eraFrameCounts={...common.eraFrameCounts,'high-medieval':frameCounts};
writeFileSync(commonPath,JSON.stringify(common,null,2));
