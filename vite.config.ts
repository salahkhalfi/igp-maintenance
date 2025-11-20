import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/*',
          dest: '.'
        }
      ]
    })
  ],
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    target: 'esnext', // Support top-level await for @block65/webcrypto-web-push
    rollupOptions: {
      input: {
        styles: 'src/styles.css'
      },
      output: {
        assetFileNames: 'static/[name][extname]'
      }
    }
  }
})
