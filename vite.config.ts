import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from the repo subpath on GitHub Pages, root everywhere else.
  base: process.env.GITHUB_PAGES ? '/aef-reporting-dashboard/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
})
