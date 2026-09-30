import { defineConfig } from 'vite';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
export default defineConfig(({ mode }) => ({
 base: './',
 build: { outDir: mode === 'yandex' ? 'dist-yandex' : 'dist',
   rollupOptions: { input: mode === 'yandex' ? { game: 'index.html' } : { game: 'index.html', sprites: 'sprite-lab.html' } } },
 plugins: mode === 'yandex' ? [{ name: 'exclude-preview-page', closeBundle() {
   rmSync(resolve('dist-yandex/sprite-preview.html'), { force: true });
 } }] : []
}));
