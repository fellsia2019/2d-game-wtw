import { defineConfig } from 'vite';
export default defineConfig({
 base: './',
 build: { rollupOptions: { input: { game: 'index.html', sprites: 'sprite-lab.html', industrial: 'workshops/industrial.html' } } }
});
