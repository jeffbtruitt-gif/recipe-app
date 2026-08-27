import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages serves the app from /recipe-app/ — that's why `base` is set
// for production builds. Vite applies `base` to the dev server too unless
// told otherwise, so it's set conditionally here: `npm run dev` still runs
// at plain http://localhost:5174/, only `npm run build` gets the prefix.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/recipe-app/' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
}));
