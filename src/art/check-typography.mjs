// Source-level guarantee, not computed browser style/layout verification.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import postcss from 'postcss';
const files = ['src/ui/game.css', 'src/ui/fullscreen.css', 'src/ui/results.css', 'src/ui/mobile-spacing.css', 'public/sprite-preview.html', 'index.html'];
let count = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const css = file.endsWith('.css') ? text : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  postcss.parse(css, { from: file }).walkDecls(decl => {
    if (!['font-size', 'font'].includes(decl.prop)) return;
    if (['inherit', 'unset'].includes(decl.value)) return;
    const size = decl.value.match(/(?:^|[\s(])([\d.]+)px/);
    assert(size, `${file}:${decl.source.start.line}: unverified font value ${decl.value}`);
    const compactRecruitment = file === 'src/ui/fullscreen.css'
      && decl.parent.parent?.type === 'atrule'
      && decl.parent.parent.name === 'media'
      && decl.parent.parent.params === '(orientation:landscape) and (max-width:1000px) and (max-height:500px)'
      && decl.parent.selector.split(',').every(selector => /^\.game-shell \.(card-copy h3|price|availability|wagon>(b|strong|span:not\(\.wagon-icon\)))$/.test(selector.trim()));
    assert(Number(size[1]) >= (compactRecruitment ? 13 : 16), `${file}:${decl.source.start.line}: font below allowed minimum: ${decl.value}`);
    count++;
  });
  assert(!/style=["'][^"']*font(?:-size)?\s*:/i.test(text), `${file}: inline font styling requires audit`);
}
const base = readFileSync('src/ui/game.css', 'utf8');
const full = readFileSync('src/ui/fullscreen.css', 'utf8');
assert(/:root\{[^}]*font-size:16px/.test(base), 'Inherited root size must be 16px');
assert(/small\{font-size:16px\}/.test(full), 'Browser small default must be explicitly overridden');
const generator = readFileSync('src/art/export-units.mjs', 'utf8');
for (const m of generator.matchAll(/font-size="([\d.]+)"/g)) assert(Number(m[1]) >= 16, 'Raster contact labels below 16px');
console.log(`${count} explicit font declarations checked: minimum 16px, with 13px allowed only for compact landscape recruitment.`);
console.log('Historical design-document.html / visual-concept.html excluded. Computed CSS and live layout still require browser QA.');
