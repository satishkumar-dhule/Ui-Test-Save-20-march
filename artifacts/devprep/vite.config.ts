import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'
import { VitePWA } from 'vite-plugin-pwa'
import 'dotenv/config'

function serveDatabase(): Plugin {
  const dbPath = path.resolve(import.meta.dirname, '../../data/devprep.db')
  return {
    name: 'serve-database',
    configureServer(server) {
      server.middlewares.use('/devprep.db', (_req, res, next) => {
        try {
          const data = fs.readFileSync(dbPath)
          res.setHeader('Content-Type', 'application/octet-stream')
          res.setHeader('Content-Length', String(data.length))
          res.setHeader('Cache-Control', 'no-cache')
          res.end(data)
        } catch {
          next()
        }
      })
    },
    generateBundle() {
      try {
        const data = fs.readFileSync(dbPath)
        this.emitFile({ type: 'asset', fileName: 'devprep.db', source: data })
      } catch {
        console.warn('[serve-database] data/devprep.db not found — skipping production asset')
      }
    },
  }
}

const rawPort = process.env.PORT || '5173'

const port = Number(rawPort)

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`)
}

const basePath = process.env.BASE_PATH || (process.env.GITHUB_PAGES === 'true' ? '/DevPrep/' : '/')

const isGitHubPages = basePath !== '/'

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    serveDatabase(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json'],
      manifest: false,
      devOptions: {
        enabled: process.env.ENABLE_PWA_DEV === 'true',
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then(m =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            })
          ),
          await import('@replit/vite-plugin-dev-banner').then(m => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
      '@workspace/shared': path.resolve(import.meta.dirname, '..', '..', 'lib/shared/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: isGitHubPages
      ? path.resolve(import.meta.dirname, 'dist')
      : path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  ...(isGitHubPages && {
    appType: 'mpa',
  }),
})
