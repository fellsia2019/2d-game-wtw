/** Export the approved Industrial models, scenery, and game manifest. */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { industrialRig, industrialRoles, industrialNames } from './industrial-rig.mjs';

const directory = 'public/assets';
const reviews = 'output/industrial';
mkdirSync(directory, { recursive: true });
mkdirSync(reviews, { recursive: true });
const svg = (width, height, body, viewBox = `0 0 ${width} ${height}`) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">${body}</svg>`;
const poses = [['стойка',0],['шаг',5],['действие',13]];
const sources = {};
const sheets = [];
for (const enemy of [false,true]) for (const role of industrialRoles) {
 const name = `${enemy?'enemy-':''}industrial-u-${role}`;
 const rig = frame => industrialRig(role,enemy,frame);
 const portrait = svg(192,192,rig(0),'-64 0 320 192');
 writeFileSync(`${directory}/${name}.svg`,portrait);
 const frames = Array.from({length:16},(_,frame)=>`<svg x="${frame%4*320}" y="${Math.floor(frame/4)*192}" width="320" height="192"><g transform="translate(64 0)">${rig(frame)}</g></svg>`).join('');
 const rendered = new Resvg(svg(1280,768,frames)).render();
 const pixels = rendered.pixels;
 for(let y=0;y<768;y++)for(let x=0;x<1280;x++)if((x%320<2||x%320>317||y%192<2||y%192>189)&&pixels[(y*1280+x)*4+3]>10)throw Error(`Clipped ${name} at frame ${Math.floor(y/192)*4+Math.floor(x/320)} (${x%320},${y%192})`);
 writeFileSync(`${directory}/${name}-sheet.png`,rendered.asPng());
 sheets.push(`${name}-sheet.png`);
 sources[name] = rig;
}
const manifest = { era:'industrial', status:'approved', gameIntegrated:true, modelCount:8, roles:industrialRoles, names:industrialNames, palettes:['ally','enemy'], frameWidth:320, frameHeight:192, framesPerModel:16, origin:[160,176], sheets };
writeFileSync(`${directory}/industrial-manifest.json`,JSON.stringify(manifest,null,2));
const gameManifest = JSON.parse(readFileSync(`${directory}/sprite-manifest.json`,'utf8'));
gameManifest.eras = [...new Set([...gameManifest.eras,'industrial'])];
gameManifest.sheets = [...new Set([...gameManifest.sheets,...sheets])].sort();
gameManifest.eraFrameCounts = { ...gameManifest.eraFrameCounts, industrial: industrialFrames() };
writeFileSync(`${directory}/sprite-manifest.json`,JSON.stringify(gameManifest,null,2));
for(const scale of [1,.52,.34]) {
 const cellWidth=scale===1?320:300,rowHeight=scale===1?216:132;
 let body='<rect width="100%" height="100%" fill="#203239"/>';
 industrialRoles.forEach((role,index)=>{
  for(const enemy of [false,true])for(const [poseIndex,[label,frame]] of poses.entries()) {
   const x=(Number(enemy)*3+poseIndex)*cellWidth,y=index*rowHeight, baseline=y+rowHeight-8;
   body+=`<text x="${x+5}" y="${y+18}" fill="#e7dab8" font-family="sans-serif" font-size="12">${industrialNames[index]} · ${enemy?'враг':'союзник'} · ${label}</text><path d="M${x} ${baseline}h${cellWidth}" stroke="#67817e"/><g transform="translate(${x+cellWidth/2-96*scale} ${baseline-176*scale}) scale(${scale})">${sources[`${enemy?'enemy-':''}industrial-u-${role}`](frame)}</g>`;
  }
 });
 writeFileSync(`${reviews}/all-${Math.round(scale*100)}.png`,new Resvg(svg(cellWidth*6,rowHeight*8,body)).render().asPng());
}
for(const enemy of [false,true])for(const role of industrialRoles) {
 let body='<rect width="100%" height="100%" fill="#203239"/>';
 for(let frame=0;frame<16;frame++){
  const x=frame%4*320,y=Math.floor(frame/4)*220;
  body+=`<text x="${x+8}" y="${y+18}" fill="#e7dab8" font-family="sans-serif" font-size="14">${enemy?'враг':'союзник'} · ${role} · ${frame}</text><g transform="translate(${x+64} ${y+22})">${industrialRig(role,enemy,frame)}</g>`;
 }
 writeFileSync(`${reviews}/${enemy?'enemy':'ally'}-${role}-frames.png`,new Resvg(svg(1280,880,body)).render().asPng());
}
const ink='#26343a';
const tower=(enemy)=>svg(192,192,`<rect x="16" y="132" width="160" height="46" fill="#47585a" stroke="${ink}" stroke-width="4"/><path d="M22 132V84l22-16h103l23 16v48z" fill="#59696a" stroke="${ink}" stroke-width="4"/><path d="M42 70V39h18v31M132 70V26h19v44" fill="#6d5550" stroke="${ink}" stroke-width="4"/><path d="M34 91h124v20H34z" fill="${enemy?'#8b4f50':'#4b8581'}" stroke="${ink}" stroke-width="3"/><path d="M72 178v-43q24-21 48 0v43" fill="#28353a"/><path d="M82 100h28v20H82z" fill="#c8ae78"/><path d="M26 78h139" stroke="#c9b891" stroke-width="5"/><path d="M25 150h142M40 58h22M129 48h26" stroke="#26343a" stroke-width="4"/>`);
for(const enemy of [false,true])writeFileSync(`${directory}/industrial-tower-${enemy?'enemy':'ally'}.svg`,tower(enemy));
const scenery=`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#90a5a4"/><stop offset="1" stop-color="#d4bd92"/></linearGradient></defs><rect width="1600" height="600" fill="url(#sky)"/><circle cx="1180" cy="106" r="53" fill="#eed1a0"/><path d="M0 305Q260 217 510 290T1100 278 1600 302V600H0" fill="#71847f"/>`+
 [120,345,1080,1320].map((x,i)=>`<path d="M${x} 388V${211+i%2*24}h110v177z" fill="#6c6760"/><path d="M${x+7} ${211+i%2*24}l49-37 54 37" fill="#3e4b4c"/><path d="M${x+25} ${240+i%2*20}v33m26-33v33m26-33v33" stroke="#d9bb88" stroke-width="8"/>`).join('')+
 `<path d="M0 435q480-30 800-6t800-4v175H0z" fill="#887a68"/><path d="M0 475q500-22 800-4t800-5" stroke="#b6a386" stroke-width="6" fill="none"/><path d="M0 545h1600M0 565h1600" stroke="#414b4c" stroke-width="5"/>`;
writeFileSync(`${directory}/arena-industrial.svg`,svg(1600,600,scenery));
console.log(`Industrial approved: ${industrialRoles.length} models, ${sheets.length} side atlases, 256 reviewed frames; game manifest updated`);

function industrialFrames(){return Object.fromEntries(industrialRoles.map(role=>[role,16]));}
