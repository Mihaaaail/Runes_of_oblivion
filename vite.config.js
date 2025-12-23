import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Делает пути относительными
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
