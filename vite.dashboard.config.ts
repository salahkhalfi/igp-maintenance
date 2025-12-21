/**
 * Vite Config - Dashboard V2
 * 
 * Build séparé pour le nouveau dashboard moderne.
 * Output: dist/static/dashboard-v2/
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/static/dashboard-v2',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: 'src/dashboard-v2/main.tsx',
      },
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@dashboard': path.resolve(__dirname, './src/dashboard-v2'),
    },
  },
})
