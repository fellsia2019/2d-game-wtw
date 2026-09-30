/** Export the approved ninth-era art and register it in the game manifest. */
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { worldWarsRig, worldWarsBossRig, worldWarsRoles, worldWarsNames, worldWarsDescriptions } from './world-wars-rig.mjs';

const assets = 'public/assets', reviews = 'docs/qa/world-wars';
mkdirSync(assets, {recursive:true}); mkdirSync(reviews, {recursive:true});
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const shift = role => role === 'raider' ? 12 : role === 'siege' ? 40 : 64;
const drawing = (role,enemy,frame) => `<g transform="translate(${shift(role)} 0)">${worldWarsRig(role,enemy,frame)}</g>`;
const bossDrawing = frame => `<g transform="translate(40 0)">${worldWarsBossRig(frame)}</g>`;
const sheets = [];
for (const enemy of [false,true]) for (const role of worldWarsRoles) {
 const basename = `${enemy?'enemy-':''}world-wars-u-${role}`;
 writeFileSync(`${assets}/${basename}.svg`,svg(320,192,drawing(role,enemy,0)));
 const frames = Array.from({length:16},(_,frame)=>`<svg x="${frame%4*320}" y="${Math.floor(frame/4)*192}" width="320" height="192">${drawing(role,enemy,frame)}</svg>`).join('');
 writeFileSync(`${assets}/${basename}-sheet.png`,new Resvg(svg(1280,768,frames)).render().asPng());
 sheets.push(`${basename}-sheet.png`);
}
writeFileSync(`${assets}/enemy-world-wars-boss.svg`,svg(320,192,bossDrawing(0)));
const bossFrames = Array.from({length:16},(_,frame)=>`<svg x="${frame%4*320}" y="${Math.floor(frame/4)*192}" width="320" height="192">${bossDrawing(frame)}</svg>`).join('');
writeFileSync(`${assets}/enemy-world-wars-boss-sheet.png`,new Resvg(svg(1280,768,bossFrames)).render().asPng());
sheets.push('enemy-world-wars-boss-sheet.png');
const models = worldWarsRoles.map((role,index)=>({role,name:worldWarsNames[index],description:worldWarsDescriptions[index],period:1.2,frames:16}));
const manifest = {era:'world-wars',name:'Эпоха бронемашин',status:'approved',gameIntegrated:true,modelCount:8,totalUniqueModels:9,palettes:['ally','enemy'],frameWidth:320,frameHeight:192,origin:[160,176],models,sheets,scenery:['arena-world-wars.svg','world-wars-tower-ally.svg','world-wars-tower-enemy.svg','era-cards/world-wars.png'],bossPreview:{name:'Командующий Броневого узла',uniqueModel:true,side:'enemy',scale:1.5,frames:16,portrait:'enemy-world-wars-boss.svg',sheet:'enemy-world-wars-boss-sheet.png',image:'world-wars-boss-preview.png'}};
writeFileSync(`${assets}/world-wars-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
rmSync(`${assets}/world-wars-draft-manifest.json`,{force:true});
const gameManifest = JSON.parse(readFileSync(`${assets}/sprite-manifest.json`,'utf8'));
gameManifest.eras = [...new Set([...gameManifest.eras,'world-wars'])];
gameManifest.sheets = [...new Set([...gameManifest.sheets,...sheets])].sort();
gameManifest.eraFrameCounts = {...gameManifest.eraFrameCounts,'world-wars':Object.fromEntries([...worldWarsRoles,'boss'].map(role=>[role,16]))};
writeFileSync(`${assets}/sprite-manifest.json`,JSON.stringify(gameManifest,null,2)+'\n');

for (const scale of [1,.52,.34]) {
 const cellWidth = scale === 1 ? 320 : 240, rowHeight = scale === 1 ? 220 : 132;
 let body = '<rect width="100%" height="100%" fill="#203239"/>';
 worldWarsRoles.forEach((role,index)=>{
  const reviewName = role === 'raider' ? 'Разведджип' : worldWarsNames[index];
  for (const enemy of [false,true]) for (const [poseIndex,[label,frame]] of [['стойка',0],['ходьба',5],['действие',13]].entries()) {
   const x = (Number(enemy)*3+poseIndex)*cellWidth, y = index*rowHeight, baseline = y+rowHeight-9;
   body += `<text x="${x+6}" y="${y+18}" fill="#f2e2bd" font-family="sans-serif" font-size="13">${reviewName} · ${enemy?'враг':'союзник'} · ${label}</text>`
    + `<path d="M${x} ${baseline}h${cellWidth}" stroke="#798987"/>`
    + `<g transform="translate(${x+cellWidth/2-160*scale} ${baseline-176*scale}) scale(${scale})">${drawing(role,enemy,frame)}</g>`;
  }
 });
 writeFileSync(`${reviews}/all-${Math.round(scale*100)}.png`,new Resvg(svg(cellWidth*6,rowHeight*8,body)).render().asPng());
}
for (const enemy of [false,true]) for (const role of worldWarsRoles) {
 let body = '<rect width="100%" height="100%" fill="#203239"/>';
 for (let frame=0;frame<16;frame++) {
  const x=frame%4*320,y=Math.floor(frame/4)*220;
  body += `<text x="${x+7}" y="${y+18}" fill="#f2e2bd" font-family="sans-serif" font-size="14">${enemy?'враг':'союзник'} · ${role} · ${frame}</text>`
   + `<g transform="translate(${x} ${y+22})">${drawing(role,enemy,frame)}</g>`;
 }
 writeFileSync(`${reviews}/${enemy?'enemy':'ally'}-${role}-frames.png`,new Resvg(svg(1280,880,body)).render().asPng());
}
{
 let body='<rect width="100%" height="100%" fill="#203239"/>';
 for (const enemy of [false,true]) for (const [column,[label,frame]] of [['стойка',0],['движение',5],['выстрел',12]].entries()) {
  const x=column*320,y=Number(enemy)*220;
  body += `<text x="${x+8}" y="${y+19}" fill="#f2e2bd" font-family="sans-serif" font-size="15">${enemy?'противник':'союзник'} · ${label}</text>`
   + `<path d="M${x} ${y+197}h320" stroke="#798987"/>`
   + `<g transform="translate(${x+shift('raider')} ${y+22})">${worldWarsRig('raider',enemy,frame)}</g>`;
 }
 writeFileSync(`${reviews}/raider-preview.png`,new Resvg(svg(960,440,body)).render().asPng());
}
{
 let body = '<rect width="100%" height="100%" fill="#203239"/>';
 for (let frame=0;frame<16;frame++) {
  const x=frame%4*320,y=Math.floor(frame/4)*220;
  body += `<text x="${x+7}" y="${y+18}" fill="#f2e2bd" font-family="sans-serif" font-size="14">босс · лёгкий танк · ${frame}</text>`
   + `<g transform="translate(${x} ${y+22})">${bossDrawing(frame)}</g>`;
 }
 writeFileSync(`${reviews}/boss-frames.png`,new Resvg(svg(1280,880,body)).render().asPng());
}
{
 const cellW=520,rowH=300;
 let body='<rect width="100%" height="100%" fill="#203239"/>';
 for(const [row,[label,scale]] of [['Осадная бронемашина',1],['Босс · лёгкий танк ×1,5',1.5]].entries())
  for(const [column,[pose,frame]] of [['стойка',0],['движение',5],['выстрел',12]].entries()) {
   const x=column*cellW,y=row*rowH,baseline=y+rowH-18;
   body+=`<text x="${x+15}" y="${y+28}" fill="#f2e2bd" font-family="sans-serif" font-size="21">${label} · ${pose}</text>`
    + `<path d="M${x} ${baseline}h${cellW}" stroke="#8a9b94" stroke-width="2"/>`
    + `<g transform="translate(${x+cellW/2-160*scale} ${baseline-176*scale}) scale(${scale})">${row===0?drawing('siege',true,frame):bossDrawing(frame)}</g>`;
  }
 const png=new Resvg(svg(cellW*3,rowH*2,body)).render().asPng();
 writeFileSync(`${assets}/world-wars-boss-preview.png`,png);
 writeFileSync(`${reviews}/boss-preview.png`,png);
}
const arena = `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#718c98"/><stop offset="1" stop-color="#c2aea0"/></linearGradient></defs>`
 + `<rect width="1600" height="600" fill="url(#sky)"/><circle cx="1230" cy="115" r="49" fill="#ddc8a7"/>`
 + `<path d="M0 315Q280 245 525 292T1060 279 1600 320V600H0" fill="#69777a"/>`
 + `<path d="M0 410q240-55 420-24t420-29 760 26v217H0z" fill="#6c6b62"/>`
 + [100,370,710,1130,1430].map((x,i)=>`<path d="M${x} 407v-${68+i%2*14}l32-15 46 17v66z" fill="#535e5b" stroke="#394a4a" stroke-width="5"/><path d="M${x+12} 364h43M${x+16} 377h12m15-2h12" stroke="#9f9b84" stroke-width="5"/>`).join('')
 + `<path d="M0 481q300-46 560 3t500-2 540 8v110H0z" fill="#786f5f"/><path d="M0 523q195 34 350 0t400 12 420-7 430 2" stroke="#a3997e" stroke-width="7" fill="none"/>`
 + `<path d="M0 456h1600M0 566h1600" stroke="#434d48" stroke-width="5"/>`;
writeFileSync(`${assets}/arena-world-wars.svg`,svg(1600,600,arena));
const bunker = enemy => {
 const accent = enemy ? '#915c50' : '#718b68', pale = enemy ? '#bb8b76' : '#a8bd94';
 return `<rect x="14" y="145" width="164" height="32" fill="#586564" stroke="#29363a" stroke-width="4"/>`
  + `<path d="M20 145V92l18-28h112l22 28v53z" fill="#747c76" stroke="#29363a" stroke-width="4"/>`
  + `<path d="M32 93l15-21h96l17 21z" fill="#a4a69a" stroke="#29363a" stroke-width="3"/>`
  + `<path d="M38 102h116v23H38z" fill="#344349" stroke="#29363a" stroke-width="3"/>`
  + `<path d="M46 105h41v7H46zM104 105h41v7h-41z" fill="#8c9a91"/>`
  + `<path d="M25 132h143v11H25z" fill="${accent}" stroke="#29363a" stroke-width="3"/>`
  + `<path d="M82 177v-39q14-12 28 0v39z" fill="#303d40"/>`
  + `<path d="M18 151l14-9 15 9-15 8zM42 155l14-8 16 8-16 8zM116 155l14-8 16 8-16 8zM143 150l14-9 17 9-16 8z" fill="#b0aa91" stroke="#655f52" stroke-width="2"/>`
  + `<path d="M22 171h151" stroke="${pale}" stroke-width="3"/>`
  + `<path d="M124 63v-23M117 42h14" stroke="#404b4a" stroke-width="4"/>`;
};
for (const enemy of [false,true]) writeFileSync(`${assets}/world-wars-tower-${enemy?'enemy':'ally'}.svg`,svg(192,192,bunker(enemy)));
writeFileSync(`${reviews}/forts.png`,new Resvg(svg(384,192,`<svg x="0" width="192" height="192">${bunker(false)}</svg><svg x="192" width="192" height="192">${bunker(true)}</svg>`)).render().asPng());
console.log(`World Wars approved: ${worldWarsRoles.length} role models, 1 unique boss, ${sheets.length} atlases, 272 frames; game manifest updated.`);
