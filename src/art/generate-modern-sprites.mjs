/** Approved tenth-era art and game-manifest registration. */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { modernRig, modernRoles, modernNames, modernDescriptions } from './modern-rig.mjs';

const assets = 'public/assets', reviews = 'docs/qa/modern';
mkdirSync(assets, {recursive:true}); mkdirSync(reviews, {recursive:true});
const svg = (w,h,body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const shift = role => role === 'siege' ? 16 : role === 'archer' ? 49 : role === 'spear' ? 56 : 60;
const drawing = (role,enemy,frame) => `<g transform="translate(${shift(role)} 0)">${modernRig(role,enemy,frame)}</g>`;
const render = (w,h,body) => new Resvg(svg(w,h,body)).render().asPng();
const sheets=[];
for (const enemy of [false,true]) for (const role of modernRoles) {
 const basename = `${enemy?'enemy-':''}modern-u-${role}`;
 writeFileSync(`${assets}/${basename}.svg`,svg(320,192,drawing(role,enemy,0)));
 const frames=Array.from({length:16},(_,frame)=>`<svg x="${frame%4*320}" y="${Math.floor(frame/4)*192}" width="320" height="192">${drawing(role,enemy,frame)}</svg>`).join('');
 writeFileSync(`${assets}/${basename}-sheet.png`,render(1280,768,frames));
 sheets.push(`${basename}-sheet.png`);
 let body='<rect width="100%" height="100%" fill="#203239"/>';
 for(let frame=0;frame<16;frame++) {
  const x=frame%4*320,y=Math.floor(frame/4)*220;
  body+=`<text x="${x+7}" y="${y+18}" fill="#f2e2bd" font-family="sans-serif" font-size="14">${enemy?'враг':'союзник'} · ${role} · ${frame}</text><g transform="translate(${x} ${y+22})">${drawing(role,enemy,frame)}</g>`;
 }
 writeFileSync(`${reviews}/${enemy?'enemy':'ally'}-${role}-frames.png`,render(1280,880,body));
}
for(const scale of [1,.52,.34]) {
 const cellWidth=scale===1?320:240,rowHeight=scale===1?220:150,renderScale=scale===1?1:scale*1.15;
 let body='<rect width="100%" height="100%" fill="#203239"/>';
 const shortNames=['Щитовик','Противотанкист','Марксман','Медик','Разведчик','Гранатомётчик','Оператор дронов','Артиллерия'];
 modernRoles.forEach((role,index)=>{
  for(const enemy of [false,true]) for(const [poseIndex,[label,frame]] of [['стойка',0],['ходьба',5],['действие',13]].entries()) {
   const x=(Number(enemy)*3+poseIndex)*cellWidth,y=index*rowHeight,baseline=y+rowHeight-9;
   body+=`<text x="${x+6}" y="${y+18}" fill="#f2e2bd" font-family="sans-serif" font-size="${scale===1?13:11}">${shortNames[index]} · ${enemy?'враг':'союзник'} · ${label}</text><path d="M${x} ${baseline}h${cellWidth}" stroke="#798987"/><g transform="translate(${x+cellWidth/2-160*renderScale} ${baseline-176*renderScale}) scale(${renderScale})">${drawing(role,enemy,frame)}</g>`;
  }
 });
 writeFileSync(`${reviews}/all-${Math.round(scale*100)}.png`,render(cellWidth*6,rowHeight*8,body));
}
const models=modernRoles.map((role,index)=>({role,name:modernNames[index],description:modernDescriptions[index],frames:16,ally:{portrait:`modern-u-${role}.svg`,sheet:`modern-u-${role}-sheet.png`},enemy:{portrait:`enemy-modern-u-${role}.svg`,sheet:`enemy-modern-u-${role}-sheet.png`}}));
const skyline=[80,195,330,475,650,820,1040,1230,1430].map((x,i)=>`<path d="M${x} 315v-${90+(i%3)*34}h${70+(i%2)*24}v${90+(i%3)*34}z" fill="${i%2?'#566d78':'#61747c'}" stroke="#455d69" stroke-width="5"/><path d="M${x+12} 260h40m-40 18h40" stroke="#a1b4ad" stroke-width="4"/>`).join('');
const arena=`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#354d64"/><stop offset="1" stop-color="#d3ad8b"/></linearGradient></defs><rect width="1600" height="600" fill="url(#sky)"/><circle cx="1200" cy="118" r="60" fill="#e1c396"/>${skyline}<path d="M0 320q300-25 600 0t500-2 500 5v277H0z" fill="#7b8986"/><path d="M0 396h1600v204H0z" fill="#667070"/><path d="M0 465q370-25 740 6t860-2v131H0z" fill="#606c6e"/><path d="M0 575q430-27 800 0t800-4" fill="none" stroke="#a7a59a" stroke-width="12"/>`+[185,385,630,1000,1330].map(x=>`<path d="M${x} 410v-68h63v68z" fill="#59696e" stroke="#34454f" stroke-width="5"/><path d="M${x+8} 362h44v15h-44z" fill="#a8bdc0"/>`).join('')+`<path d="M0 440h1600" stroke="#394b52" stroke-width="8"/>`;
writeFileSync(`${assets}/arena-modern.svg`,svg(1600,600,arena));
const tower = enemy => {
 const edge='#2b3940', concrete='#707a76', light='#a3a89a', shade='#515f60';
 const accent=enemy?'#865c68':'#4e7b80', glass=enemy?'#51424e':'#394e56', glint=enemy?'#c6a4aa':'#a8c5bf';
 return svg(192,192,`
  <g stroke-linejoin="round" stroke-linecap="round">
   <path d="M20 153V105l18-16h116l18 16v48z" fill="${concrete}" stroke="${edge}" stroke-width="4"/>
   <path d="M29 104l12-9h110l12 9-8 12H37z" fill="${light}" stroke="${edge}" stroke-width="3"/>
   <path d="M39 91V68l14-11h86l14 11v23z" fill="${shade}" stroke="${edge}" stroke-width="4"/>
   <path d="M49 59l8-8h78l8 8" fill="none" stroke="${light}" stroke-width="4"/>
   <path d="M44 71h104v19H44z" fill="${glass}" stroke="${edge}" stroke-width="3"/>
   <path d="M58 73v15m26-15v15m26-15v15m25-15v15" stroke="${glint}" stroke-width="2"/>
   <path d="M47 72h96" stroke="${glint}" stroke-width="2"/>
   <path d="M35 110h122v12H35z" fill="${accent}" stroke="${edge}" stroke-width="3"/>
   <path d="M57 110v12m78-12v12" stroke="${light}" stroke-width="3"/>
   <path d="M20 149h152v27H20z" fill="${shade}" stroke="${edge}" stroke-width="4"/>
   <path d="M27 152l13-26h112l13 26z" fill="${concrete}" stroke="${edge}" stroke-width="4"/>
   <path d="M45 128l-9 22m32-22-4 22m60-22 4 22m21-22 9 22" stroke="${edge}" stroke-width="3"/>
   <path d="M78 177v-42q18-11 36 0v42z" fill="${edge}"/>
   <path d="M84 140q12-6 24 0v34H84z" fill="${glass}" stroke="${glint}" stroke-width="2"/>
   <circle cx="104" cy="158" r="2" fill="${glint}"/>
   <path d="M17 154h57v13H17zm101 0h57v13h-57z" fill="${light}" stroke="${edge}" stroke-width="3"/>
   <path d="M23 154q8-7 16 0 8-7 16 0 8-7 16 0m50 0q8-7 16 0 8-7 16 0 8-7 16 0" fill="none" stroke="${edge}" stroke-width="2"/>
   <path d="M27 167v8m21-8v8m112-8v8m-21-8v8" stroke="${edge}" stroke-width="2"/>
   <path d="M30 176h132" stroke="${accent}" stroke-width="3"/>
   <path d="M51 56V29m-6 6h12m-12 8h12" stroke="${edge}" stroke-width="3"/>
   <path d="M128 51V35m-18 0q18-14 36 0" fill="none" stroke="${edge}" stroke-width="3"/>
   <path d="M112 37q16-6 32 0" fill="none" stroke="${glint}" stroke-width="2"/>
   <circle cx="128" cy="35" r="3" fill="${accent}" stroke="${edge}" stroke-width="2"/>
  </g>`);
};
for(const enemy of [false,true]) {
 const side=enemy?'enemy':'ally', drawing=tower(enemy);
 writeFileSync(`${assets}/modern-tower-${side}.svg`,drawing);
 writeFileSync(`${reviews}/tower-${side}.png`,new Resvg(drawing,{fitTo:{mode:'width',value:576}}).render().asPng());
}
writeFileSync(`${assets}/modern-manifest.json`,JSON.stringify({era:'modern',name:'Современность',status:'approved',gameIntegrated:true,modelCount:8,totalUniqueModels:8,palettes:['ally','enemy'],frameWidth:320,frameHeight:192,origin:[160,176],gameScaleMultiplier:1.15,models,sheets,droneStrike:{role:'banner',effect:'enemyDamage',sequence:['launch','flyToEnemy','explode','reload'],allyBuff:false,implementation:'gameplay'},scenery:['arena-modern.svg','modern-tower-ally.svg','modern-tower-enemy.svg','era-cards/modern.png'],boss:{kind:'modernCommander',reusesRole:'shield',scale:1.5}},null,2)+'\n');
const gameManifest=JSON.parse(readFileSync(`${assets}/sprite-manifest.json`,'utf8'));
gameManifest.eras=[...new Set([...gameManifest.eras,'modern'])];
gameManifest.sheets=[...new Set([...gameManifest.sheets,...sheets])].sort();
gameManifest.eraFrameCounts={...gameManifest.eraFrameCounts,modern:Object.fromEntries(modernRoles.map(role=>[role,16]))};
writeFileSync(`${assets}/sprite-manifest.json`,JSON.stringify(gameManifest,null,2)+'\n');
console.log('Modernity: 8 models, 16 atlases, 256 frames; game manifest updated.');
