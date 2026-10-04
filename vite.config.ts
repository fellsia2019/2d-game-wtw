import { defineConfig } from 'vite';
import { readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
export default defineConfig(({ mode }) => ({
 base: './',
 build: { outDir: mode === 'yandex' ? 'dist-yandex' : 'dist',
   rollupOptions: { input: mode === 'yandex' ? { game: 'index.html' } : { game: 'index.html', sprites: 'sprite-lab.html' } } },
 plugins: mode === 'yandex' ? [{ name: 'exclude-preview-page', closeBundle() {
   rmSync(resolve('dist-yandex/sprite-preview.html'), { force: true });
   // Workshop contact sheets and draft manifests are not runtime game assets.
   for (const file of readdirSync(resolve('dist-yandex/assets'))) {
     if (/(?:contact|review|preview).*\.png$|manifest\.json$/.test(file)) rmSync(resolve('dist-yandex/assets', file));
   }
   rmSync(resolve('dist-yandex/assets/era-cards/world-wars.png'), { force: true });
   rmSync(resolve('dist-yandex/assets/era-cards/armored-arena.svg'), { force: true });
 } }] : []
}));
