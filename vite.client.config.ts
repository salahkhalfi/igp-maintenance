import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    // Output to dist/static/client so it can be served by Hono
    outDir: 'dist/static/client',
    emptyOutDir: true,
    manifest: true, // Useful for later
    rollupOptions: {
      input: 'src/client/main.tsx',
      output: {
        // Fixed name for easy inclusion in legacy HTML for now
        entryFileNames: 'main.js',
        assetFileNames: 'assets/[name].[ext]',
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})