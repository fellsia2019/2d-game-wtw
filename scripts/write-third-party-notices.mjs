import { readFileSync, writeFileSync } from 'node:fs';
const packages = [['phaser','LICENSE.md'],['swiper','LICENSE'],['eventemitter3','LICENSE']];
const sections = packages.map(([name,file]) => {
  const { version, license } = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
  return `${name} ${version} (${license})\n\n${readFileSync(`node_modules/${name}/${file}`, 'utf8').trim()}`;
});
writeFileSync('public/third-party-notices.txt', `Third-party software included in Banners of Ages / Znamyona Epoh\n\n${sections.join('\n\n' + '='.repeat(72) + '\n\n')}\n`);
