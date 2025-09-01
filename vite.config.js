import { defineConfig } from 'vite'

export default defineConfig({
  root: 'client',
  server: {
    port: 3010,
    proxy: {
      '/api': {
        target: 'http://localhost:3020',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../dist'
  }
})