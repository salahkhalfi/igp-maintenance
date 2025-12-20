import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({ jsxImportSource: 'react' })],
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  build: {
    // Output to dist/static/client so it can be served by Hono
    outDir: 'dist/static/client',
    emptyOutDir: true,
    manifest: true, // Useful for later
    rollupOptions: {
      input: {
        main: 'src/client/main.tsx',
      },
      // Bundle React internally for stability
      output: {
        // Smart naming: main.js for legacy app
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'main' ? 'main.js' : '[name]-[hash].js';
        },
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})