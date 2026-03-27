import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import PerformanceMonitor from './components/PerformanceMonitor'
import { useContentStore } from './stores/contentStore'

if (typeof window !== 'undefined') {
  ;(window as any).__ZUSTAND__ = useContentStore
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <PerformanceMonitor
      enabled={true}
      reportToConsole={import.meta.env.DEV}
      reportToAnalytics={import.meta.env.PROD}
    />
    <App />
  </StrictMode>
)
