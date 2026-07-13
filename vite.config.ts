import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: '/' works for Vercel/Netlify and any root-domain host. For GitHub
// Pages project sites, set base to '/<repo>/'.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    // pack.bin is a large binary already served from public/; nothing to inline
    assetsInlineLimit: 0,
  },
});
