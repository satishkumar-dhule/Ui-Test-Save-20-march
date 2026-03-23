import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
// Runtime-agnostic SQLite: prefer bun:sqlite when available, fallback to better-sqlite3
let Database: any
try {
  Database = (await import('bun:sqlite')).Database
} catch {
  Database = (await import('better-sqlite3')).default
}
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression'
import 'dotenv/config'

function checkpointDb(dbPath: string): void {
  try {
    const db = new Database(dbPath)
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    db.close()
  } catch {
    // DB may not exist yet — skip
  }
}

function serveDatabase(): Plugin {
  const dbPath = path.resolve(import.meta.dirname, '../../data/devprep.db')
  return {
    name: 'serve-database',
    configureServer(server) {
      server.middlewares.use('/devprep.db', (_req, res, next) => {
        try {
          checkpointDb(dbPath)
          const data = fs.readFileSync(dbPath)
          res.setHeader('Content-Type', 'application/octet-stream')
          res.setHeader('Content-Length', String(data.length))
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Vary', 'Accept-Encoding')
          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.end(data)
        } catch {
          next()
        }
      })

      server.middlewares.use('/sql-wasm.wasm', (_req, res, next) => {
        try {
          const wasmPath = path.resolve(
            import.meta.dirname,
            'node_modules/sql.js/dist/sql-wasm.wasm'
          )
          if (fs.existsSync(wasmPath)) {
            const data = fs.readFileSync(wasmPath)
            res.setHeader('Content-Type', 'application/wasm')
            res.setHeader('Content-Length', String(data.length))
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            res.setHeader('Vary', 'Accept-Encoding')
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
            res.end(data)
            return
          }
        } catch {
          // Fall through to next handler
        }
        next()
      })
    },
    generateBundle() {
      try {
        checkpointDb(dbPath)
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
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', ext: '.br' }),
    runtimeErrorOverlay(),
    serveDatabase(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json'],
      manifest: {
        name: 'DevPrep',
        short_name: 'DevPrep',
        description: 'Technical interview preparation platform',
        theme_color: '#4F46E5',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        scope: basePath,
        start_url: basePath,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      devOptions: {
        enabled: process.env.ENABLE_PWA_DEV === 'true',
        type: 'module',
        navigateFallback: 'index.html',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api/, /^\/ws/, /^\/devprep\.db/],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
              backgroundSync: {
                name: 'api-sync',
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|gif|svg|ico|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:mp4|webm|ogg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:css|less|scss|sass)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-stylesheets',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:js|mjs)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-scripts',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
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
    sourcemap: false,
    minify: 'terser',
    cssCodeSplit: true,
    cssMinify: true,
    assetsInlineLimit: 4096,
    target: 'es2020',
    manifest: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 100,
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (!id.includes('node_modules')) {
            if (id.includes('/pages/')) {
              if (id.includes('QAPage')) return 'page-qa'
              if (id.includes('FlashcardsPage')) return 'page-flashcards'
              if (id.includes('MockExamPage')) return 'page-exam'
              if (id.includes('VoicePracticePage')) return 'page-voice'
              if (id.includes('CodingPage')) return 'page-coding'
              if (id.includes('RealtimeDashboard')) return 'page-realtime'
              if (id.includes('OnboardingPage')) return 'page-onboarding'
              if (id.includes('AIPage')) return 'page-ai'
              return 'page-common'
            }
            if (id.includes('/components/')) {
              if (id.includes('/ui/')) return 'components-ui'
              if (id.includes('/animation/')) return 'components-animation'
              if (id.includes('/layout/')) return 'components-layout'
              if (id.includes('/dashboard/')) return 'components-dashboard'
              if (id.includes('/app/')) return 'components-app'
              if (id.includes('/chart/')) return 'components-chart'
              return 'components-common'
            }
            if (id.includes('/hooks/')) return 'hooks'
            if (id.includes('/utils/')) return 'utils'
            if (id.includes('/stores/')) return 'stores'
            if (id.includes('/services/')) return 'services'
            if (id.includes('/lib/')) return 'lib'
            return null
          }

          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'vendor-react'
          }

          if (id.includes('recharts') || id.includes('victory') || id.includes('d3-')) {
            return 'vendor-charts'
          }

          if (id.includes('framer-motion')) {
            return 'vendor-motion'
          }

          if (
            id.includes('@tanstack/react-query') ||
            id.includes('query-core') ||
            id.includes('query-options')
          ) {
            return 'vendor-query'
          }

          if (id.includes('zustand')) {
            return 'vendor-state'
          }

          if (id.includes('wouter')) {
            return 'vendor-router'
          }

          if (id.includes('@radix-ui')) {
            return 'vendor-radix'
          }

          if (
            id.includes('sonner') ||
            id.includes('vaul') ||
            id.includes('cmdk') ||
            id.includes('input-otp')
          ) {
            return 'vendor-overlay'
          }

          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'vendor-validation'
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }

          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('unified')
          ) {
            return 'vendor-markdown'
          }

          if (id.includes('react-resizable-panels') || id.includes('embla-carousel')) {
            return 'vendor-interaction'
          }

          if (id.includes('sql.js') || id.includes('better-sqlite3') || id.includes('bun:')) {
            return 'vendor-sql'
          }

          if (id.includes('@sentry') || id.includes('web-vitals')) {
            return 'vendor-monitoring'
          }

          if (id.includes('workbox') || id.includes('workbox-')) {
            return 'vendor-pwa'
          }

          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'vendor-date'
          }

          if (
            id.includes('tailwindcss') ||
            id.includes('tailwind-merge') ||
            id.includes('clsx') ||
            id.includes('cva')
          ) {
            return 'vendor-tailwind'
          }

          return 'vendor-misc'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        arrows: true,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        dead_code: true,
        directives: true,
        evaluate: true,
        booleans: true,
        loops: true,
        unused: true,
        toplevel: true,
        properties: true,
        reduce_vars: true,
        ecma: 2020,
      },
      mangle: {
        safari10: true,
        properties: false,
      },
      format: {
        ecma: 2020,
        comments: false,
      },
    },
  },
  cacheDir: path.resolve(import.meta.dirname, 'node_modules/.vite'),
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query', 'zustand', 'wouter'],
    esbuildOptions: {
      treeShaking: true,
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
