import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES 
    ? '/pokemon-ebay-tracker/'
    : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})