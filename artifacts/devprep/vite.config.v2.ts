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
import { VitePWA } from 'vite-plugin-pwa'
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
          // Checkpoint WAL before serving so the browser's sql.js sees all rows
          checkpointDb(dbPath)
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

// V2-specific: Enhanced environment detection
const isProduction = process.env.NODE_ENV === 'production'
const isStaging = process.env.STAGING === 'true'
const isDevelopment = !isProduction && !isStaging

// V2-specific: Enhanced CDN configuration
const cdnUrl = process.env.CDN_URL || ''
const enableCdn = cdnUrl && isProduction

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    serveDatabase(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json'],
      manifest: {
        name: 'DevPrep V2 - Technical Interview Preparation',
        short_name: 'DevPrep V2',
        description: 'AI-powered technical interview preparation with real-time content generation',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: basePath,
        start_url: basePath,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
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
    sourcemap: isDevelopment, // Enable sourcemaps only in development
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction,
        drop_debugger: isProduction,
        pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-dom/')) {
              return 'vendor-react'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion'
            }
            if (id.includes('recharts') || id.includes('victory') || id.includes('recharts/lib')) {
              return 'vendor-charts'
            }
            if (id.includes('sql.js') || id.includes('better-sqlite3')) {
              return 'vendor-sql'
            }
            if (id.includes('@sentry')) {
              return 'vendor-sentry'
            }
            if (id.includes('wouter')) {
              return 'vendor-router'
            }
            if (id.includes('zustand')) {
              return 'vendor-state'
            }
            if (id.includes('web-vitals') || id.includes('workbox')) {
              return 'vendor-pwa'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('sonner') || id.includes('@sonner')) {
              return 'vendor-toast'
            }
            return 'vendor'
          }

          if (id.includes('/pages/')) {
            if (id.includes('QAPage')) return 'page-qa'
            if (id.includes('FlashcardsPage')) return 'page-flashcards'
            if (id.includes('MockExamPage')) return 'page-exam'
            if (id.includes('VoicePracticePage')) return 'page-voice'
            if (id.includes('CodingPage')) return 'page-coding'
            if (id.includes('RealtimeDashboard')) return 'page-realtime'
            if (id.includes('OnboardingPage')) return 'page-onboarding'
            return 'page-common'
          }

          if (id.includes('/components/')) {
            if (id.includes('/ui/')) {
              return 'components-ui'
            }
            if (id.includes('/animation/')) {
              return 'components-animation'
            }
            if (id.includes('/layout/')) {
              return 'components-layout'
            }
            if (id.includes('/app/')) {
              return 'components-app'
            }
            if (id.includes('/chart') || id.includes('RealtimeDashboard')) {
              return 'components-charts'
            }
            return 'components-common'
          }

          if (id.includes('/data/')) {
            return 'data-static'
          }
          if (id.includes('/hooks/')) {
            return 'hooks'
          }
          if (id.includes('/utils/')) {
            return 'utils'
          }
          if (id.includes('/stores/')) {
            return 'stores'
          }
          if (id.includes('/services/')) {
            return 'services'
          }
          if (id.includes('/lib/')) {
            return 'lib'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
  },
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:3001',
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
  // V2-specific: Enhanced environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_ENV__: JSON.stringify(
      isStaging ? 'staging' : isProduction ? 'production' : 'development'
    ),
    __CDN_URL__: JSON.stringify(cdnUrl),
    __ENABLE_CDN__: JSON.stringify(enableCdn),
  },
  ...(isGitHubPages && {
    appType: 'mpa',
  }),
})
