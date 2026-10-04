import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';

// Serve the unpacked upload archive, including nested-path asset checks. The
// platform owns /sdk.js; offline preview deliberately uses local persistence.
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const manifest = JSON.parse(readFileSync('artifacts/yandex-release.json', 'utf8').replace(/^\uFEFF/, ''));
const root = resolve(option('--root', `artifacts/${manifest.previewDirectory}`));
const port = Number(option('--port', '4174'));
const language = option('--lang', null);
if (language && !['ru', 'en'].includes(language)) throw new Error('--lang must be ru or en');
const prefix = '/game/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.wav': 'audio/wav' };
if (!existsSync(resolve(root, 'index.html'))) throw new Error('Missing unpacked index.html. Run npm run package:yandex first.');
createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/sdk.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    // Optional language-only mock lives on this localhost server, never in ZIP.
    // It deliberately cannot grant ad rewards or load cloud profiles.
    response.end(language ? `window.YaGames={init:async()=>({environment:{i18n:{lang:${JSON.stringify(language)}}},features:{LoadingAPI:{ready(){}},GameplayAPI:{start(){},stop(){}}},on(){},adv:{showFullscreenAdv({callbacks}){callbacks.onClose?.(false)},showRewardedVideo({callbacks}){callbacks.onError?.()}},getPlayer:async()=>{throw Error('Offline language preview')}})};` : '/* Offline preview: the real SDK is provided by Yandex Games. */');
    return;
  }
  if (pathname === '/') { response.writeHead(302, { Location: prefix }); response.end(); return; }
  let relative;
  try { relative = decodeURIComponent(pathname.slice(prefix.length)); } catch { response.writeHead(400); response.end(); return; }
  const file = resolve(root, relative || 'index.html');
  if (!pathname.startsWith(prefix) || !file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'Content-Type': `${types[extname(file)] ?? 'application/octet-stream'}${['.html', '.js', '.css', '.svg', '.json'].includes(extname(file)) ? '; charset=utf-8' : ''}`, 'Cache-Control': 'no-store' });
  response.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log(`Unpacked Yandex archive: http://127.0.0.1:${port}${prefix}`));
