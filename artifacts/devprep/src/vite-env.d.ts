/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BASE_PATH: string
  readonly VITE_APP_TITLE: string
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
  export interface UseSWEffectProps {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
  }
  export function useRegisterSW(props?: UseSWEffectProps): {
    needRefresh: boolean[]
    offlineReady: boolean[]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

interface EventTiming extends PerformanceEntry {
  processingStart: number
  processingEnd: number
  duration: number
  cancelable: boolean
  target: Node | null
}

interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
  sources: LayoutShiftAttribution[]
}

interface LayoutShiftAttribution {
  node: Node | null
  previousRect: DOMRectReadOnly | null
  currentRect: DOMRectReadOnly | null
}

interface LargestContentfulPaint extends PerformanceEntry {
  renderTime: number
  loadTime: number
  element: Element | null
  url: string | undefined
  size: number
}

interface PerformanceNavigationTiming extends PerformanceEntry {
  unloadEventStart: number
  unloadEventEnd: number
  domInteractive: number
  domContentLoadedEventStart: number
  domContentLoadedEventEnd: number
  domComplete: number
  loadEventStart: number
  loadEventEnd: number
  redirectCount: number
  navigationType: string
  initiatorType: string
  nextHopProtocol: string
  workerStart: number
  redirectStart: number
  redirectEnd: number
  fetchStart: number
  domainLookupStart: number
  domainLookupEnd: number
  connectStart: number
  connectEnd: number
  secureConnectionStart: number
  requestStart: number
  responseStart: number
  responseEnd: number
}

interface DOMNavigationEvent extends Event {
  destination: { url: string }
  navigationType: string
}
