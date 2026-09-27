// Source-level guarantee, not computed browser style/layout verification.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import postcss from 'postcss';
const files = ['src/ui/game.css', 'src/ui/fullscreen.css', 'public/sprite-preview.html', 'index.html'];
let count = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const css = file.endsWith('.css') ? text : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  postcss.parse(css, { from: file }).walkDecls(decl => {
    if (!['font-size', 'font'].includes(decl.prop)) return;
    if (['inherit', 'unset'].includes(decl.value)) return;
    const size = decl.value.match(/(?:^|[\s(])([\d.]+)px/);
    assert(size, `${file}:${decl.source.start.line}: unverified font value ${decl.value}`);
    assert(Number(size[1]) >= 16, `${file}:${decl.source.start.line}: font below 16px: ${decl.value}`);
    count++;
  });
  assert(!/style=["'][^"']*font(?:-size)?\s*:/i.test(text), `${file}: inline font styling requires audit`);
}
const base = readFileSync('src/ui/game.css', 'utf8');
const full = readFileSync('src/ui/fullscreen.css', 'utf8');
assert(/:root\{[^}]*font-size:16px/.test(base), 'Inherited root size must be 16px');
assert(/small\{font-size:16px\}/.test(full), 'Browser small default must be explicitly overridden');
const generator = readFileSync('src/art/generate-sprites.mjs', 'utf8');
for (const m of generator.matchAll(/font-size="([\d.]+)"/g)) assert(Number(m[1]) >= 16, 'Raster contact labels below 16px');
console.log(`${count} explicit font declarations checked: minimum 16px, including media rules and preview.`);
console.log('Historical design-document.html / visual-concept.html excluded. Computed CSS and live layout still require browser QA.');
