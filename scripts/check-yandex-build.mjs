import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('dist-yandex');
assert(existsSync(resolve(root, 'index.html')), 'index.html must be at the archive root');
const files = [];
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(root);
let bytes = 0;
for (const path of files) {
  const name = relative(root, path);
  assert(!/[\s\u0400-\u04ff]/u.test(name), `Invalid archive path: ${name}`);
  bytes += statSync(path).size;
  assert(!/sprite-(lab|preview)\.html$/.test(name), `Development page in release: ${name}`);
  if (name.endsWith('.js')) {
    const source = readFileSync(path, 'utf8');
    assert(!source.includes('sprite-lab.html') && !source.includes('class="debug-menu"'), `Debug interface in release: ${name}`);
  }
}
assert(bytes < 100_000_000, `Unpacked build exceeds 100 MB: ${bytes}`);
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|data:)/.test(url)) continue;
  assert(existsSync(resolve(root, url)), `Missing index asset: ${url}`);
}
console.log(`Yandex build checked: ${files.length} files, ${bytes} bytes (${(bytes / 1e6).toFixed(2)} MB).`);
