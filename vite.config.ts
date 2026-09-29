import { defineConfig } from 'vite';
export default defineConfig({
 base: './',
 build: { rollupOptions: { input: { game: 'index.html', sprites: 'sprite-lab.html', ironDraft: 'iron-era-lab.html', antiqueDraft: 'antique-era-lab.html', medievalDraft: 'medieval-era-lab.html', highMedievalDraft: 'high-medieval-era-lab.html', highMedievalPlaytest: 'high-medieval-playtest.html', renaissanceDraft: 'renaissance-era-lab.html', renaissancePlaytest: 'renaissance-playtest.html' } } }
});
