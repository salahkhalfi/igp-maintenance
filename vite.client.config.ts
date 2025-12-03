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
      // Externalize React to use the global CDN version (avoids dual instance issues with legacy scripts)
      external: ['react', 'react-dom'],
      output: {
        // Fixed name for easy inclusion in legacy HTML for now
        entryFileNames: 'main.js',
        assetFileNames: 'assets/[name].[ext]',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})