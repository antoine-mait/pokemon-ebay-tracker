import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Only use base path for GitHub Pages build
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  
  return {
    plugins: [react()],
    base: isGitHubPages ? '/pokemon-ebay-tracker/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  }
})