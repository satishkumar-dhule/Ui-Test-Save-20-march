/**
 * Main Entry Point V2
 * 
 * React 19 entry point for the V2 application.
 * - Uses createRoot for concurrent features
 * - Imports all V2 styles
 * - Initializes the application
 * 
 * @author INTEGRATION_MASTER (Jennifer Wong)
 * @version 2.0.0
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import AppV2 from './App-v2'

// Import all V2 styles
import './styles/new-index.css'
import './styles/new-themes.css'
import './styles/new-base.css'
import './styles/new-utilities.css'
import './styles/new-typography.css'
import './styles/new-spacing.css'
import './styles/new-responsive.css'
import './styles/new-animations.css'

// ============================================================================
// Root Element Validation
// ============================================================================

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Root element not found. Ensure you have a <div id="root"></div> in your HTML.'
  )
}

// ============================================================================
// React 19 Concurrent Features
// ============================================================================

// Create root with concurrent features
const root = createRoot(rootElement)

// ============================================================================
// Application Initialization
// ============================================================================

// Initialize application
function initializeApp() {
  // Log initialization
  console.log('[DevPrep V2] Initializing application...')

  // Set up global error handling
  window.addEventListener('error', (event) => {
    console.error('[DevPrep V2] Global error:', event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[DevPrep V2] Unhandled promise rejection:', event.reason)
  })

  // Apply initial theme before render to prevent flash
  const savedTheme = localStorage.getItem('devprep-theme-preference')
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const initialTheme = savedTheme || systemTheme

  document.documentElement.setAttribute('data-theme', initialTheme)
  
  if (initialTheme === 'dark' || initialTheme === 'high-contrast') {
    document.documentElement.classList.add('dark')
  }

  console.log('[DevPrep V2] Initialization complete')
}

// ============================================================================
// Render Application
// ============================================================================

function renderApp() {
  // Initialize app
  initializeApp()

  // Render with React 19 features
  root.render(
    <React.StrictMode>
      <AppV2 />
    </React.StrictMode>
  )

  console.log('[DevPrep V2] Application rendered')
}

// Start the application
renderApp()

// ============================================================================
// Hot Module Replacement (HMR) Support
// ============================================================================

if (import.meta.hot) {
  import.meta.hot.accept('./App-v2', (newModule) => {
    console.log('[DevPrep V2] HMR: App-v2 updated')
    // The app will automatically re-render due to React Fast Refresh
  })
}

// ============================================================================
// Performance Monitoring
// ============================================================================

// Log performance metrics after initial load
window.addEventListener('load', () => {
  setTimeout(() => {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      console.log('[DevPrep V2] Performance Metrics:')
      console.log(`  DOM Content Loaded: ${Math.round(perfData.domContentLoadedEventEnd)}ms`)
      console.log(`  Full Load: ${Math.round(perfData.loadEventEnd)}ms`)
      console.log(`  First Paint: ${Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)}ms`)
      
      // Report to analytics if available
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'load',
          value: Math.round(perfData.loadEventEnd),
          event_category: 'Performance'
        })
      }
    }
  }, 0)
})

// ============================================================================
// Service Worker Registration (Optional)
// ============================================================================

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[DevPrep V2] ServiceWorker registered:', registration.scope)
    } catch (error) {
      console.log('[DevPrep V2] ServiceWorker registration failed:', error)
    }
  }
}

// Register service worker in production
if (import.meta.env.PROD) {
  registerServiceWorker()
}

// ============================================================================
// Type Augmentations
// ============================================================================

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// Export for testing
export { root, renderApp, initializeApp }
export default AppV2