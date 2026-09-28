import { defineConfig } from 'vite';
export default defineConfig({
 base: './',
 build: { rollupOptions: { input: { game: 'index.html', sprites: 'sprite-lab.html', ironDraft: 'iron-era-lab.html', antiqueDraft: 'antique-era-lab.html' } } }
});
