const CRITICAL_ASSETS = ['/favicon.svg', '/icon-192.png']

const API_BASE =
  typeof window !== 'undefined' && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : '/api'

export function preloadAsset(
  href: string,
  as: string,
  options?: {
    type?: string
    crossOrigin?: string
    media?: string
  }
): void {
  if (typeof document === 'undefined') return

  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as

  if (options?.type) link.setAttribute('type', options.type)
  if (options?.crossOrigin) link.crossOrigin = options.crossOrigin
  if (options?.media) link.media = options.media

  document.head.appendChild(link)
}

export function preloadImage(src: string, options?: { as?: string }): void {
  preloadAsset(src, options?.as || 'image')
}

export function preloadScript(
  src: string,
  options?: {
    defer?: boolean
    async?: boolean
    module?: boolean
  }
): void {
  if (typeof document === 'undefined') return

  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing) return

  const script = document.createElement('script')
  script.src = src

  if (options?.defer) script.defer = true
  if (options?.async) script.async = true
  if (options?.module) {
    script.type = 'module'
  }

  document.head.appendChild(script)
}

export function preloadStyle(href: string, options?: { media?: string }): void {
  preloadAsset(href, 'style', { media: options?.media })
}

export function preloadWorker(
  src: string,
  options?: {
    type?: 'classic' | 'module'
  }
): void {
  if (typeof Worker === 'undefined') return

  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing) return

  const worker = new Worker(src, { type: options?.type || 'classic' })
  worker.terminate()
}

export function prefetchDns(hostname: string): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = `https://${hostname}`
  document.head.appendChild(link)
}

export function preconnectTo(
  url: string,
  options?: {
    crossOrigin?: boolean
  }
): void {
  if (typeof document === 'undefined') return

  const existing = document.querySelector(`link[href="${url}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = url

  if (options?.crossOrigin !== undefined) {
    link.crossOrigin = String(options.crossOrigin)
  }

  document.head.appendChild(link)
}

export function preloadCriticalAssets(): void {
  if (typeof document === 'undefined') return

  preconnectTo(API_BASE)

  prefetchDns('fonts.googleapis.com')
  prefetchDns('fonts.gstatic.com')
}

export function preloadFonts(fontFamilies: string[]): void {
  fontFamilies.forEach(font => {
    preloadStyle(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`,
      { media: 'print' }
    )
  })
}

interface PreloadManifest {
  images?: string[]
  scripts?: string[]
  styles?: string[]
  fonts?: string[]
}

export function preloadManifest(manifest: PreloadManifest): void {
  manifest.images?.forEach(src => preloadImage(src))
  manifest.scripts?.forEach(src => preloadScript(src, { defer: true }))
  manifest.styles?.forEach(href => preloadStyle(href))
  manifest.fonts?.forEach(font => preloadFonts([font]))
}

export function useCriticalAssetPreloader() {
  if (typeof window === 'undefined')
    return { observe: () => {}, unobserve: () => {}, disconnect: () => {} }

  const observer: IntersectionObserver | null =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement
                if (img.dataset.src) {
                  img.src = img.dataset.src
                  observer?.unobserve(img)
                }
              }
            })
          },
          { rootMargin: '100px' }
        )
      : null

  const observe = (element: HTMLElement) => {
    observer?.observe(element)
  }

  const unobserve = (element: HTMLElement) => {
    observer?.unobserve(element)
  }

  const disconnect = () => {
    observer?.disconnect()
  }

  return { observe, unobserve, disconnect }
}

export function createImageLinkRelay(
  src: string,
  options?: { width?: number; quality?: number; format?: 'webp' | 'jpeg' | 'png' }
): string {
  if (src.startsWith('http')) {
    return src
  }
  return src
}

export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}
): string {
  if (src.includes('unsplash.com') || src.includes('images.unsplash.com')) {
    const params = new URLSearchParams()
    if (options.width) params.set('w', String(options.width))
    if (options.height) params.set('h', String(options.height))
    if (options.quality) params.set('q', String(options.quality))
    if (options.format) params.set('fm', options.format)
    return `${src}${src.includes('?') ? '&' : '?'}${params.toString()}`
  }
  return src
}

export default {
  preloadAsset,
  preloadImage,
  preloadScript,
  preloadStyle,
  preloadWorker,
  prefetchDns,
  preconnectTo,
  preloadCriticalAssets,
  preloadFonts,
  preloadManifest,
  useCriticalAssetPreloader,
  createImageLinkRelay,
  getOptimizedImageUrl,
}
