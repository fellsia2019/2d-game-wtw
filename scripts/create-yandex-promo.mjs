import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const out = 'docs/yandex/promo';
mkdirSync(out, { recursive: true });
const image = (name, x, y, width, height) => {
  const source = readFileSync(`public/assets/${name}.svg`).toString('base64');
  return `<image href="data:image/svg+xml;base64,${source}" x="${x}" y="${y}" width="${width}" height="${height}"/>`;
};
const background = (w, h) => `<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#14383b"/><stop offset=".5" stop-color="#284448"/><stop offset="1" stop-color="#101f2a"/></linearGradient><radialGradient id="glow"><stop stop-color="#efc783" stop-opacity=".5"/><stop offset="1" stop-color="#efc783" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="${w * .7}" cy="${h * .45}" r="${h * .6}" fill="url(#glow)"/><path d="M0 ${h * .77} Q${w * .3} ${h * .7} ${w * .55} ${h * .81} T${w} ${h * .77} V${h} H0Z" fill="#1b3338"/>`;
const svg = (w, h, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${background(w,h)}${content}</svg>`;
const save = (name, source) => {
  writeFileSync(`${out}/${name}.svg`, source);
  writeFileSync(`${out}/${name}.png`, new Resvg(source, { font: { loadSystemFonts: true, defaultFontFamily: 'Arial' } }).render().asPng());
};
// Original compositions from the game's vector models, without a captured UI,
// frames, rounded corners, real insignia, or claims absent from the game.
save('icon', svg(512,512, `<path d="M343 65V328M345 74L446 108 345 144Z" stroke="#f0c686" stroke-width="8" fill="#43a6a2"/>${image('stone-u-shield',-10,52,390,390)}${image('high-medieval-u-shield',183,116,290,290)}<path d="m390 354 16 24 29 4-21 21 5 28-29-13-26 13 4-28-21-21 28-4z" fill="#f0c686"/>`));
const armoredCard = svg(768,512, `<circle cx="617" cy="103" r="52" fill="#e9c58a" opacity=".75"/><path d="M0 301 120 261 250 286 372 253 546 291 768 257V512H0Z" fill="#55696b"/><path d="M0 385Q245 330 420 365T768 360V512H0Z" fill="#b99c71"/><path d="M31 376V275H144V376M48 276V253H126V276" fill="none" stroke="#677b7a" stroke-width="8"/><rect x="37" y="280" width="110" height="99" fill="#384f52"/><rect x="51" y="299" width="30" height="38" fill="#8caba3"/><rect x="104" y="299" width="30" height="38" fill="#8caba3"/>${image('world-wars-u-siege',195,155,415,300)}${image('world-wars-u-shield',49,225,190,220)}${image('world-wars-u-banner',555,238,170,200)}<path d="M168 418H603" stroke="#8d785b" stroke-width="6"/>`);
// Preserve the accepted historic illustration for ordinary builds. The Yandex
// menu uses this fictional composition without an identifiable historical tank,
// a ruined religious building or a scene of a real-world war.
writeFileSync('public/assets/era-cards/armored-arena.svg', armoredCard);
writeFileSync('public/assets/era-cards/armored-arena.png', new Resvg(armoredCard).render().asPng());
for (const lang of ['ru','en']) {
  const lines = lang === 'ru' ? ['ЗНАМЁНА','ЭПОХ'] : ['BANNERS','OF AGES'];
  const sub = lang === 'ru' ? 'ДЕСЯТЬ ЭПОХ · ОДНА ЛИНИЯ ФРОНТА' : 'TEN AGES · ONE BATTLE LINE';
  const title = `<g font-family="Arial" font-weight="700" fill="#fff0ca"><text x="48" y="128" font-size="58">${lines[0]}</text><text x="48" y="193" font-size="58">${lines[1]}</text><text x="50" y="237" font-size="15" letter-spacing="1.2" fill="#e9bc7a">${sub}</text></g><path d="M50 266H340" stroke="#e9bc7a" stroke-width="3"/>`;
  save(`cover-${lang}`, svg(800,470, `${title}<path d="M637 56V328M640 68L742 99 640 132Z" stroke="#f0c686" stroke-width="6" fill="#43a6a2"/>${image('stone-u-spear',350,155,205,255)}${image('high-medieval-u-shield',448,92,300,335)}${image('modern-u-archer',605,180,190,235)}<g fill="#adbeaf"><path d="M52 354h35v45H52zm12-12h12v12H64zm43 15h58v42h-58zm10-16h14v16h-14zm29 0h14v16h-14z"/></g>`));
  save(`showcase-${lang}`, svg(1560,520, `<g transform="translate(75 24) scale(1.1)">${title}</g>${image('stone-u-spear',720,175,240,290)}${image('high-medieval-u-shield',885,86,370,400)}${image('modern-u-archer',1185,190,265,300)}<path d="M1242 62V339M1245 78L1390 110 1245 146Z" stroke="#f0c686" stroke-width="7" fill="#43a6a2"/>`));
}
console.log(`Yandex promo images created in ${out}`);
