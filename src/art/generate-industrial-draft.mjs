/** Export only the unapproved industrial workshop. Never touches the game manifest. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { industrialRig, industrialRoles, industrialNames } from './industrial-rig.mjs';

const directory = 'public/drafts/industrial';
const reviews = 'output/industrial-draft';
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
const manifest = { era:'industrial', status:'draft-awaiting-approval', gameIntegrated:false, modelCount:8, roles:industrialRoles, names:industrialNames, palettes:['ally','enemy'], frameWidth:320, frameHeight:192, framesPerModel:16, origin:[160,176], sheets };
writeFileSync(`${directory}/manifest.json`,JSON.stringify(manifest,null,2));
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
console.log(`Industrial draft: ${industrialRoles.length} models, ${sheets.length} side atlases, 256 reviewed frames; separate manifest ${directory}/manifest.json`);
