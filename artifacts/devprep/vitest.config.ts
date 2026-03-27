import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'build', '.git', 'tests/**', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/main.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        '**/types.ts',
        '**/types/**',
        'src/__tests__/**',
        'tests/**',
        '**/*.stories.*',
        '**/*.story.*',
        '**/stories/**',
        '**/storybook/**',
        '**/.storybook/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.config.*',
        '!src/**/types.ts',
        '!src/**/types/**',
        '!src/**/index.ts',
      ],
    },
    fakeTimers: {
      toFake: ['setTimeout', 'setInterval', 'Date', 'requestAnimationFrame'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    retry: 0,
    bail: 0,
    logHeapUsage: false,
    watch: false,
    clearMocks: true,
    restoreMocks: true,
    isolate: true,
    passWithNoTests: true,
    updateSnapshot: false,
    dangerouslySetExperimentalOptions: {
      experimentalTestEnvironment: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@workspace/shared': path.resolve(__dirname, '../lib/shared/src/index.ts'),
      // Mock modules for testing
      wouter: path.resolve(__dirname, './src/__tests__/mocks/wouter.ts'),
      'react-router-dom': path.resolve(__dirname, './src/__tests__/mocks/react-router-dom.ts'),
    },
  },
  define: {
    'import.meta.env.VITEST': true,
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3001'),
  },
  esbuild: {
    target: 'esnext',
  },
})
