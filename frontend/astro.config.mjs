// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Todo prerenderizado (estático) salvo /s/[code] (server-rendered, hybrid).
  // Adaptador Vercel: estático a CDN + funciones para rutas SSR. Para self-host,
  // volver a @astrojs/node.
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
