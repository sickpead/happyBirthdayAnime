import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // Относительный base: сборку можно выложить в любой подкаталог (GitHub Pages, S3 и т.п.).
  base: './',
  plugins: [react()],
});
