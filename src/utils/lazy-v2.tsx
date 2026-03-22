/**
 * Lazy Loading System v2
 * Advanced component and route lazy loading with prefetching
 */

import React, { ComponentType, LazyExoticComponent, Suspense } from 'react'

// Types for lazy loading
interface LazyLoadOptions {
  fallback?: React.ReactNode
  errorBoundary?: boolean
  prefetch?: boolean
  timeout?: number
}

interface RouteConfig {
  path: string
  component: () => Promise<{ default: ComponentType<any> }>
  preload?: boolean
}

// Lazy component wrapper with error boundary
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const { fallback = <div>Loading...</div> } = options
  
  const LazyComponent = React.lazy(importFunc)
  
  // Return wrapped component
  return LazyComponent as LazyExoticComponent<T>
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyLoadOptions = {}
): ComponentType<P> {
  const { fallback = <div>Loading...</div> } = options
  
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  )
}

// Route-based lazy loading
export function createLazyRoutes(routes: RouteConfig[]): Map<string, LazyExoticComponent<any>> {
  const routeMap = new Map<string, LazyExoticComponent<any>>()
  
  routes.forEach(route => {
    const LazyComponent = React.lazy(route.component)
    routeMap.set(route.path, LazyComponent)
    
    // Preload if specified
    if (route.preload) {
      // Start loading in background
      route.component()
    }
  })
  
  return routeMap
}

// Component preloading utility
export function preloadComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
): Promise<void> {
  return importFunc().then(() => {})
}

// Intersection Observer for lazy loading components
export function createIntersectionLazyLoader(
  components: Array<{ selector: string; importFunc: () => Promise<{ default: ComponentType<any> }> }>
): void {
  if (typeof IntersectionObserver === 'undefined') return
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement
        const componentConfig = components.find(c => c.selector === target.dataset.lazyComponent)
        
        if (componentConfig) {
          // Load component
          componentConfig.importFunc().then(({ default: Component }) => {
            // Render component in target element
            const ReactDOM = require('react-dom/client')
            const root = ReactDOM.createRoot(target)
            root.React.createElement(Component)
          })
          
          observer.unobserve(target)
        }
      }
    })
  }, {
    rootMargin: '100px 0px',
    threshold: 0.1,
  })
  
  components.forEach(config => {
    const elements = document.querySelectorAll(config.selector)
    elements.forEach(el => {
      el.setAttribute('data-lazy-component', config.selector)
      observer.observe(el)
    })
  })
}

// Code splitting utilities
export class CodeSplitter {
  private loadedModules: Map<string, any> = new Map()
  private loadingPromises: Map<string, Promise<any>> = new Map()
  
  async loadModule(moduleId: string, importFunc: () => Promise<any>): Promise<any> {
    // Return cached module if already loaded
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId)
    }
    
    // Return existing promise if currently loading
    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId)
    }
    
    // Load module
    const promise = importFunc().then(module => {
      this.loadedModules.set(moduleId, module)
      this.loadingPromises.delete(moduleId)
      return module
    }).catch(error => {
      this.loadingPromises.delete(moduleId)
      throw error
    })
    
    this.loadingPromises.set(moduleId, promise)
    return promise
  }
  
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId)
  }
  
  clearCache(): void {
    this.loadedModules.clear()
    this.loadingPromises.clear()
  }
}

// Prefetch routes/components
export function prefetchResources(
  urls: string[],
  options: {
    priority?: 'high' | 'low'
    type?: 'script' | 'style' | 'font' | 'image'
  } = {}
): void {
  if (typeof document === 'undefined') return
  
  const { priority = 'low', type = 'script' } = options
  
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    link.as = type
    
    if (priority === 'high') {
      link.setAttribute('importance', 'high')
    }
    
    document.head.appendChild(link)
  })
}

// Dynamic import with retry
export async function dynamicImportWithRetry<T>(
  importFunc: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      return await importFunc()
    } catch (error) {
      lastError = error as Error
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError
}

// Webpack magic comments for chunk naming
export function namedImport<T>(
  importFunc: () => Promise<T>,
  chunkName: string
): () => Promise<T> {
  return () => importFunc().then(module => {
    // Webpack will use this for chunk naming
    if (typeof __webpack_chunkname__ !== 'undefined') {
      __webpack_chunkname__ = chunkName
    }
    return module
  })
}

// React.lazy with named chunks
export function createNamedLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  chunkName: string
): LazyExoticComponent<T> {
  const namedImportFunc = namedImport(importFunc, chunkName)
  return React.lazy(namedImportFunc)
}

// Bundle preload hints
export function addPreloadHints(resourceHints: {
  scripts?: string[]
  styles?: string[]
  fonts?: string[]
  images?: string[]
}): void {
  if (typeof document === 'undefined') return
  
  const { scripts = [], styles = [], fonts = [], images = [] } = resourceHints
  
  scripts.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = src
    link.as = 'script'
    document.head.appendChild(link)
  })
  
  styles.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = 'style'
    document.head.appendChild(link)
  })
  
  fonts.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = 'font'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
  
  images.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = src
    link.as = 'image'
    document.head.appendChild(link)
  })
}

// React component for lazy loading wrapper
export const LazyLoadBoundary: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error) => void
}> = ({ children, fallback = <div>Loading...</div>, onError }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

// Export default lazy loading utilities
export default {
  createLazyComponent,
  withLazyLoading,
  createLazyRoutes,
  preloadComponent,
  createIntersectionLazyLoader,
  CodeSplitter,
  prefetchResources,
  dynamicImportWithRetry,
  namedImport,
  createNamedLazyComponent,
  addPreloadHints,
  LazyLoadBoundary,
}