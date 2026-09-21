import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Порт dev-сервера: по умолчанию 5173, но `PORT` его перекрывает. */
const DEFAULT_DEV_PORT = 5173;
const devPort = Number(process.env.PORT) || DEFAULT_DEV_PORT;

// https://vite.dev/config/
export default defineConfig({
  // Относительный base: сборку можно выложить в любой подкаталог (GitHub Pages, S3 и т.п.).
  base: './',
  plugins: [react()],
  // Сам Vite переменную PORT не читает: без этого запуск на свободном порту (когда 5173 занят
  // другим dev-сервером) всё равно уходил бы на 5173, и адрес превью не открывался.
  server: {
    port: devPort,
    // Windows иногда отдаёт EBUSY на watch отдельных JPEG в public/ — статику не следим,
    // она и так отдаётся как есть, без HMR.
    watch: {
      ignored: ['**/public/assets/**'],
    },
  },
});
