import { defineConfig } from 'vite'

export default defineConfig({
  base: '/gotreframed/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: { port: 5173 }
})
