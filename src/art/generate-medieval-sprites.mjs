import {writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {exportUnits} from './export-units.mjs';
import {medievalRig,medievalRoles} from './medieval-rig.mjs';
import {svg,shape} from './unit-rig.mjs';
exportUnits(['medieval'],{manifestPath:'public/assets/medieval-draft-manifest.json',manifestEras:['medieval'],customRig:medievalRig,customRoles:medievalRoles});
const names=['Дружинник','Пикинёр','Длиннолучник','Знахарь','Берсерк','Топорник','Роговой трубач','Стенобитчик'];
for(const enemy of [false,true]) {
 const cloth=enemy?'#a95345':'#497a8a';
 const tower=shape('M30 176V69h128v107z','#806044')+shape('M23 70V53h145v17z','#b49464')+shape('M21 54l30-34h88l31 34z','#485958')+shape('M66 176v-68q30-21 60 0v68z','#35403c')+shape('M72 176v-64q24-14 48 0v64z','#674937')+shape('M38 70h10v106H38zM142 70h10v106h-10z','#b49464')+shape('M81 60h29v33l-14 11-15-11z',cloth)+shape('M93 68h6v24h-6z','#d9bb78');
 writeFileSync(`public/assets/medieval-tower-${enemy?'enemy':'ally'}.svg`,svg(192,192,tower));
 const contact=medievalRoles.map((role,i)=>`<text x="${i%4*192+96}" y="${Math.floor(i/4)*216+20}" text-anchor="middle" fill="#eee0bc" font-family="sans-serif" font-size="16">${names[i]}</text><g transform="translate(${i%4*192} ${Math.floor(i/4)*216+24})">${medievalRig(role,enemy,0)}</g>`).join('');
 writeFileSync(`public/assets/medieval${enemy?'-enemy':''}-contact.png`,new Resvg(svg(768,456,'<rect width="768" height="456" fill="#203239"/>'+contact)).render().asPng());
}
let arena='<rect width="1600" height="600" fill="#a8bbbc"/><circle cx="1220" cy="102" r="43" fill="#efe1bd"/>';
arena+=shape('M0 308l189-152 227 125 267-189 260 190 262-136 250 156 145-80v378H0z','#788c86','none')+shape('M0 353q400-43 790-5t810-4v256H0z','#6d8370','none');
for(const x of [115,254,379,1227,1388,1490])arena+=shape(`M${x} 405V222h13v183z`,'#635747','none')+shape(`M${x-45} 277l50-135 51 135-26-5 33 74-63-15-57 16 29-75z`,'#435e53','none');
arena+=shape('M0 484q400-36 800-6t800 0v122H0z','#ac9676','none')+shape('M0 506q400-26 800-1t800 1','#c5b18d','none');
writeFileSync('public/assets/arena-medieval.svg',svg(1600,600,arena));
console.log('Medieval workshop: exactly eight models, 16 atlases, portraits and scenery.');

const revised=[['raider','Берсерк · новая модель',13],['medic','Знахарь · лечение',13],['banner','Трубач · сигнал у губ',32]];
const comparison=revised.map(([role,label,frame],i)=>`<text x="${i*288+144}" y="25" text-anchor="middle" fill="#eee0bc" font-family="sans-serif" font-size="18">${label}</text><g transform="translate(${i*288+36} 42)">${medievalRig(role,false,frame)}</g>`).join('');
writeFileSync('public/assets/medieval-rework-review.png',new Resvg(svg(864,240,'<rect width="864" height="240" fill="#203239"/>'+comparison)).render().asPng());
