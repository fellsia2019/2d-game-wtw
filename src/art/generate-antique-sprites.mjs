import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { exportUnits } from './export-units.mjs';
import { antiqueRig, antiqueRoles } from './antique-rig.mjs';
import { svg, shape } from './unit-rig.mjs';
exportUnits(['antique'], {manifestPath:'public/assets/antique-draft-manifest.json',manifestEras:['antique']});
for(const enemy of [false,true]) {
 const cloth=enemy?'#9d493f':'#3e7580';
 const tower=shape('M28 174V65h136v109z','#c0aa80')+shape('M19 66V41h22v12h18V38h24v15h26V38h24v15h19V41h21v25z','#e0cdaa')+shape('M69 174v-61q27-36 54 0v61z','#4a4639')+shape('M77 174v-57q19-23 38 0v57z','#7c5940')+shape('M53 66h86v15H53z','#9b8763')+shape('M80 55h32v36l-16 10-16-10z',cloth)+shape('M92 63h8v22h-8z','#e6c899');
 writeFileSync(`public/assets/antique-tower-${enemy?'enemy':'ally'}.svg`,svg(192,192,tower));
}
let arena='<rect width="1600" height="600" fill="#d9ceb0"/><circle cx="1200" cy="108" r="58" fill="#f2df9a"/>';
arena+=shape('M0 292l210-121 235 96 244-165 278 154 218-123 263 157 152-107v417H0z','#9eaa92','none')+shape('M0 371q290-69 555-2t575-18 470 22v227H0z','#a2a47d','none');
for(const x of [210,410,1110,1330])arena+=shape(`M${x} 404V239h29v165zM${x-8} 238v-19h45v19zM${x-8} 402h45v15h-45z`,'#e1d0a4')+shape(`M${x+10} 253h8v137h-8z`,'#b19e78');
arena+=shape('M188 219l139-58 139 58z','#d6c394')+shape('M0 481q400-26 800 0t800 0v119H0z','#cbb28b','none');
writeFileSync('public/assets/arena-antique.svg',svg(1600,600,arena));
const labels=['Нумидийский всадник','Скорпион','Баллиста'];
const bodies=['raider','thrower','siege'].map((role,i)=>`<text x="${i*240+120}" y="25" text-anchor="middle" fill="#eee0bc" font-family="sans-serif" font-size="18">${labels[i]}</text><g transform="translate(${i*240+24} 37)">${antiqueRig(role,false,0)}</g>`).join('');
writeFileSync('public/assets/antique-command-review.png',new Resvg(svg(720,240,'<rect width="720" height="240" fill="#203239"/>'+bodies)).render().asPng());
console.log('Antiquity draft: 16 atlases, portraits, scenery and cavalry/engine comparison.');

const rosterLabels=['Легионер','Гоплит','Пельтаст','Хирург лагеря','Нумидийский всадник','Скорпион','Центурион','Баллиста'];
const rosterRoles=antiqueRoles;
for (const enemy of [false,true]) {
 const contact=rosterRoles.map((role,i)=>`<text x="${i%4*192+96}" y="${Math.floor(i/4)*216+20}" text-anchor="middle" fill="#eee0bc" font-family="sans-serif" font-size="16">${rosterLabels[i]}</text><g transform="translate(${i%4*192} ${Math.floor(i/4)*216+24})">${antiqueRig(role,enemy,0)}</g>`).join('');
 writeFileSync(`public/assets/antique${enemy?'-enemy':''}-contact.png`,new Resvg(svg(768,456,'<rect width="768" height="456" fill="#203239"/>'+contact)).render().asPng());
}
