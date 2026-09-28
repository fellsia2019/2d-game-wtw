/** Rebuild the accepted Iron assets and dedicated review page. */
import { pathToFileURL } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { ironRig } from './iron-rig.mjs';
import { writeFileSync } from 'node:fs';
import { exportUnits } from './export-units.mjs';
import { svg, shape } from './unit-rig.mjs';
export function exportIronScenery() {
for(const enemy of [false,true]) {
 const cloth=enemy?'#91473e':'#426879';
 const tower=shape('M19 176V79l14-20h126l14 20v97z','#666c69')+shape('M30 79V39h29v18h18V35h38v22h18V39h29v40z','#92958a')+shape('M65 176v-67q31-33 62 0v67z','#343d40')+shape('M74 176v-64q22-23 44 0v64z','#584334')+shape('M75 128h42v9H75z','#899ba5')+shape('M75 156h42v9H75z','#899ba5')+shape('M82 43h28v35L96 88 82 78z',cloth);
 writeFileSync(`public/assets/iron-tower-${enemy?'enemy':'ally'}.svg`,svg(192,192,tower));
}
let arena='<rect width="1600" height="600" fill="#afbfc1"/><circle cx="1200" cy="110" r="58" fill="#ede1ba"/>';
arena+=shape('M0 315l200-130 240 99 230-157 270 172 220-135 260 145 180-104v395H0z','#71868a','none');
arena+=shape('M0 384q260-69 540-4t540-12 520 20v212H0z','#788875','none');
for(const x of [200,400,1140,1370])arena+=shape(`M${x} 397V286h50v111zM${x-8} 291v-30h16v13h12v-13h15v13h15v-13h12v30z`,'#737b75')+shape(`M${x+17} 315h16v32h-16z`,'#35464c');
arena+=shape('M0 477q400-22 800 0t800 0v123H0z','#b2a081','none');
writeFileSync('public/assets/arena-iron.svg',svg(1600,600,arena));


// Dedicated comparison for the three previously indistinguishable defenders.
for(const enemy of [false,true]) {
 const labels=['Железный щитоносец','Воротный страж','Комендант цитадели'];
 const roles=['shield','bulwark','boss'];
 const cells=roles.map((role,i)=>`<text x="${i*320+160}" y="24" text-anchor="middle" fill="#eee0bc" font-family="sans-serif" font-size="18">${labels[i]}</text><g transform="translate(${i*320+40} 34) scale(1.25)">${ironRig(role,enemy,0)}</g>`).join('');
 writeFileSync(`public/assets/iron-defenders${enemy?'-enemy':''}-review.png`,new Resvg(svg(960,272,'<rect width="960" height="272" fill="#203239"/>'+cells)).render().asPng());
}

}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 exportUnits(['iron'], { manifestPath:'public/assets/iron-draft-manifest.json', manifestEras:['iron'] });
 exportIronScenery();
 console.log('Generated accepted Iron units, strongholds, arena and comparison sheets.');
}
