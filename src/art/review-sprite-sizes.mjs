/** Review actual game PNGs at a shared scale; never normalise each silhouette. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
const manifest=JSON.parse(readFileSync('public/assets/sprite-manifest.json','utf8'));
const output='output/sprite-size-review';mkdirSync(output,{recursive:true});
const selectedEra=process.argv[2];
if(selectedEra && !manifest.eras.includes(selectedEra))throw Error(`Unknown era ${selectedEra}`);
const order=['shield','spear','archer','medic','raider','thrower','banner','siege','bulwark','boss'];
const names={stone:'Каменный век',bronze:'Бронзовый век',iron:'Железный век',antique:'Античность',medieval:'Раннее Средневековье','high-medieval':'Высокое Средневековье',renaissance:'Ренессанс и порох',industrial:'Индустриальная эпоха'};
const svg=(w,h,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${b}</svg>`;
const label=(x,y,s,size=14)=>`<text x="${x}" y="${y}" fill="#e9ddbd" font-size="${size}" font-family="sans-serif">${s}</text>`;
const metrics=[];
for(const era of manifest.eras.filter(era=>!selectedEra||era===selectedEra)){
 const roles=manifest.sheets.filter(s=>s.startsWith(`${era}-u-`)).map(s=>s.split('-u-')[1].replace('-sheet.png','')).sort((a,b)=>order.indexOf(a)-order.indexOf(b));
 const rows=[];
 for(const role of roles){
  const count=manifest.eraFrameCounts?.[era]?.[role]??(role==='banner'?48:16);
  const action=role==='banner'&&count===48?32:count===48?(era==='high-medieval'&&role==='siege'?26:23):13;
  const cells=[];
  for(const enemy of [false,true]){
   const file=`${enemy?'enemy-':''}${era}-u-${role}-sheet.png`;
   const data=readFileSync(`public/assets/${file}`).toString('base64');
   for(const [pose,f] of [['стойка',0],['шаг',5],['действие',action]]){
    const x=f%4*320,y=Math.floor(f/4)*192;
    const crop=new Resvg(svg(320,192,`<image href="data:image/png;base64,${data}" x="${-x}" y="${-y}" width="1280" height="${count/4*192}"/>`)).render();
    const pixels=crop.pixels;
    let minX=320,minY=192,maxX=-1,maxY=-1,area=0;
    for(let py=0;py<192;py++)for(let px=0;px<320;px++)if(pixels[(py*320+px)*4+3]>20){minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);area++;}
    metrics.push({era,role,enemy,pose,frame:f,width:maxX-minX+1,height:maxY-minY+1,area});
    cells.push({enemy,pose,frame:f,png:crop.asPng().toString('base64')});
   }
  }
  rows.push({role,cells});
 }
 for(const scale of [1,.52,.34]){
  const cw=scale===1?320:208,rh=scale===1?220:136,w=cw*6,h=48+rh*rows.length;
  let body=`<rect width="${w}" height="${h}" fill="#203239"/>`+label(16,30,`${names[era]} · ${Math.round(scale*100)}% · общий масштаб / PNG игры`,20);
  rows.forEach((row,i)=>{const y=48+i*rh;body+=label(8,y+19,row.role,16);row.cells.forEach((cell,j)=>{const x=j*cw,baseline=y+rh-10;body+=label(x+8,y+36,`${cell.enemy?'враг':'союзник'} · ${cell.pose} · ${cell.frame}`);body+=`<path d="M${x} ${baseline}h${cw}" stroke="#526e73"/><image href="data:image/png;base64,${cell.png}" x="${x+cw/2-160*scale}" y="${baseline-176*scale}" width="${320*scale}" height="${192*scale}"/>`;});});
  writeFileSync(`${output}/${era}-${Math.round(scale*100)}.png`,new Resvg(svg(w,h,body)).render().asPng());
 }
}
writeFileSync(`${output}/${selectedEra?`bounds-${selectedEra}`:'bounds'}.json`,JSON.stringify(metrics,null,2));
console.log(`Reviewed ${selectedEra??'all eras'}: ${metrics.length} representative poses. Sheets at 100/52/34%: ${output}`);
