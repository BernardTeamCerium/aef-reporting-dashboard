import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from the repo subpath; Vercel and local serve from root.
  base: process.env.GITHUB_PAGES ? '/aef-reporting-dashboard/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
})
