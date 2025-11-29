// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pokemon-ebay-tracker/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})